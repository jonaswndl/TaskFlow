import type { Board, BoardMetadata, Team, TeamMetadata, TeamMember, Task, Column, Tag, ActivityLogEntry } from '../types';
import { supabase } from './supabase';

// ===== HELPER FUNCTIONS =====

const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Generate a proper UUID v4
const generateUUID = (): string => {
  return crypto.randomUUID();
};

// ===== BOARD FUNCTIONS =====

export const saveBoard = async (board: Board): Promise<void> => {
  try {
    console.log('💾 Saving board:', board.title);
    
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('❌ User not authenticated');
      return;
    }

    console.log('👤 User ID:', userId);

    // Upsert board
    console.log('📝 Upserting board...');
    const { error: boardError } = await supabase
      .from('boards')
      .upsert({
        id: board.id,
        title: board.title,
        user_id: userId,
        last_modified: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (boardError) {
      console.error('❌ Error upserting board:', boardError);
      throw boardError;
    }
    console.log('✅ Board upserted');

    // Save columns
    console.log('📝 Saving columns...');
    await saveColumns(board.id, board.columns);
    console.log('✅ Columns saved');

    // Save tasks
    console.log('📝 Saving tasks...');
    await saveTasks(board.id, board.tasks);
    console.log('✅ Tasks saved');

    // Save global tags
    console.log('📝 Saving tags...');
    await saveTags(board.id, board.globalTags);
    console.log('✅ Tags saved');

    // Save board-team relationships
    if (board.teamIds && board.teamIds.length > 0) {
      console.log('📝 Saving board-team relationships...');
      await saveBoardTeams(board.id, board.teamIds);
      console.log('✅ Board-team relationships saved');
    }

    console.log('🎉 Board saved successfully!');
  } catch (error) {
    console.error('❌ Error saving board:', error);
    throw error;
  }
};

const saveColumns = async (boardId: string, columns: Column[]): Promise<void> => {
  try {
    // Delete existing columns
    await supabase.from('columns').delete().eq('board_id', boardId);

    // Insert new columns with proper UUIDs
    const columnsData = columns.map((col, index) => ({
      id: col.id.startsWith('col-') ? generateUUID() : col.id, // Convert old IDs to UUIDs
      board_id: boardId,
      title: col.title,
      position: index,
    }));

    if (columnsData.length > 0) {
      const { error } = await supabase.from('columns').insert(columnsData);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving columns:', error);
    throw error;
  }
};

const saveTasks = async (boardId: string, tasks: Record<string, Task>): Promise<void> => {
  try {
    const tasksArray = Object.values(tasks);

    for (const task of tasksArray) {
      // Upsert task
      const { error: taskError } = await supabase
        .from('tasks')
        .upsert({
          id: task.id,
          board_id: boardId,
          column_id: task.columnId,
          title: task.title,
          description: task.description,
          start_date: task.startDate,
          end_date: task.endDate,
          priority: task.priority,
          position: 0, // Position within column - will be updated based on taskIds order
        }, { onConflict: 'id' });

      if (taskError) throw taskError;

      // Save activity log
      await saveActivityLog(task.id, task.activityLog);

      // Save task-tag relationships
      if (task.tags && task.tags.length > 0) {
        await saveTaskTags(task.id, boardId, task.tags);
      }

      // Save task assignments
      if (task.assignedMembers && task.assignedMembers.length > 0) {
        await saveTaskAssignments(task.id, task.assignedMembers);
      }
    }
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
};

const saveActivityLog = async (taskId: string, activityLog: ActivityLogEntry[]): Promise<void> => {
  try {
    // Delete existing activity log entries for this task
    await supabase.from('activity_log').delete().eq('task_id', taskId);

    // Insert new activity log entries
    const logData = activityLog.map(entry => ({
      id: entry.id,
      task_id: taskId,
      timestamp: entry.timestamp,
      action: entry.action,
      old_value: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      new_value: entry.newValue ? JSON.stringify(entry.newValue) : null,
      details: entry.details,
    }));

    if (logData.length > 0) {
      const { error } = await supabase.from('activity_log').insert(logData);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving activity log:', error);
    throw error;
  }
};

const saveTags = async (boardId: string, globalTags: Record<string, Tag>): Promise<void> => {
  try {
    const tagsArray = Object.values(globalTags);

    for (const tag of tagsArray) {
      const { error } = await supabase
        .from('tags')
        .upsert({
          board_id: boardId,
          label: tag.label,
          color: tag.color,
        }, { onConflict: 'board_id,label' });

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving tags:', error);
    throw error;
  }
};

const saveTaskTags = async (taskId: string, boardId: string, tagLabels: string[]): Promise<void> => {
  try {
    // Delete existing task-tag relationships
    await supabase.from('task_tags').delete().eq('task_id', taskId);

    // Get tag IDs from labels
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('id, label')
      .eq('board_id', boardId)
      .in('label', tagLabels);

    if (tagsError) throw tagsError;

    if (tags && tags.length > 0) {
      const taskTagsData = tags.map(tag => ({
        task_id: taskId,
        tag_id: tag.id,
      }));

      const { error } = await supabase.from('task_tags').insert(taskTagsData);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving task tags:', error);
    throw error;
  }
};

const saveTaskAssignments = async (taskId: string, memberIds: string[]): Promise<void> => {
  try {
    // Delete existing task assignments
    await supabase.from('task_assignments').delete().eq('task_id', taskId);

    // Insert new task assignments
    const assignmentsData = memberIds.map(memberId => ({
      task_id: taskId,
      member_id: memberId,
    }));

    if (assignmentsData.length > 0) {
      const { error } = await supabase.from('task_assignments').insert(assignmentsData);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving task assignments:', error);
    throw error;
  }
};

const saveBoardTeams = async (boardId: string, teamIds: string[]): Promise<void> => {
  try {
    // Delete existing board-team relationships
    await supabase.from('board_teams').delete().eq('board_id', boardId);

    // Insert new board-team relationships
    const boardTeamsData = teamIds.map(teamId => ({
      board_id: boardId,
      team_id: teamId,
    }));

    if (boardTeamsData.length > 0) {
      const { error } = await supabase.from('board_teams').insert(boardTeamsData);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving board teams:', error);
    throw error;
  }
};

export const loadBoard = async (boardId: string): Promise<Board | null> => {
  try {
    console.log('📖 Loading board:', boardId);
    
    // Load board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (boardError) {
      console.error('❌ Error loading board:', boardError);
      throw boardError;
    }
    if (!board) {
      console.warn('⚠️ Board not found:', boardId);
      return null;
    }

    console.log('✅ Board loaded:', board.title);

    // Load columns
    console.log('📖 Loading columns...');
    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (columnsError) {
      console.error('❌ Error loading columns:', columnsError);
      throw columnsError;
    }
    console.log(`✅ Loaded ${columns?.length || 0} columns`);

    // Load tasks
    console.log('📖 Loading tasks...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', boardId);

    if (tasksError) {
      console.error('❌ Error loading tasks:', tasksError);
      throw tasksError;
    }
    console.log(`✅ Loaded ${tasks?.length || 0} tasks`);

    // Load global tags
    console.log('📖 Loading tags...');
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('board_id', boardId);

    if (tagsError) {
      console.error('❌ Error loading tags:', tagsError);
      throw tagsError;
    }
    console.log(`✅ Loaded ${tags?.length || 0} tags`);

    // Load board-team relationships
    console.log('📖 Loading board teams...');
    const { data: boardTeams, error: boardTeamsError } = await supabase
      .from('board_teams')
      .select('team_id')
      .eq('board_id', boardId);

    if (boardTeamsError) {
      console.error('❌ Error loading board teams:', boardTeamsError);
      throw boardTeamsError;
    }
    console.log(`✅ Loaded ${boardTeams?.length || 0} team relationships`);

    // Build columns with task IDs
    const columnsWithTasks: Column[] = (columns || []).map(col => ({
      id: col.id,
      title: col.title,
      taskIds: (tasks || [])
        .filter(t => t.column_id === col.id)
        .map(t => t.id),
    }));

    // Build tasks object with activity log and tags
    const tasksObject: Record<string, Task> = {};
    
    console.log('🔄 Processing tasks with activity logs and tags...');
    for (const task of tasks || []) {
      // Load activity log for this task
      const { data: activityLog, error: activityLogError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', task.id)
        .order('timestamp', { ascending: true });

      if (activityLogError) {
        console.error('❌ Error loading activity log for task:', task.id, activityLogError);
      }

      // Load task tags
      const { data: taskTags, error: taskTagsError } = await supabase
        .from('task_tags')
        .select('tag_id, tags(label)')
        .eq('task_id', task.id);

      if (taskTagsError) {
        console.error('❌ Error loading task tags for task:', task.id, taskTagsError);
      }

      // Load task assignments
      const { data: taskAssignments, error: taskAssignmentsError } = await supabase
        .from('task_assignments')
        .select('member_id')
        .eq('task_id', task.id);

      if (taskAssignmentsError) {
        console.error('❌ Error loading task assignments for task:', task.id, taskAssignmentsError);
      }

      tasksObject[task.id] = {
        id: task.id,
        title: task.title,
        description: task.description || '',
        startDate: task.start_date || '',
        endDate: task.end_date || '',
        columnId: task.column_id,
        tags: (taskTags || []).map((tt: any) => tt.tags?.label).filter(Boolean),
        priority: task.priority as 'Hoch' | 'Mittel' | 'Gering' | undefined,
        activityLog: (activityLog || []).map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          action: log.action as any,
          oldValue: log.old_value ? JSON.parse(log.old_value) : undefined,
          newValue: log.new_value ? JSON.parse(log.new_value) : undefined,
          details: log.details || undefined,
        })),
        assignedMembers: (taskAssignments || []).map((ta: any) => ta.member_id),
      };
    }

    // Build global tags object
    const globalTags: Record<string, Tag> = {};
    (tags || []).forEach(tag => {
      globalTags[tag.label] = {
        label: tag.label,
        color: tag.color as any,
      };
    });

    console.log('✅ Board fully loaded with all data');

    return {
      id: board.id,
      title: board.title,
      columns: columnsWithTasks,
      tasks: tasksObject,
      globalTags,
      teamIds: (boardTeams || []).map((bt: any) => bt.team_id),
    };
  } catch (error) {
    console.error('❌ Fatal error loading board:', error);
    return null;
  }
};

export const loadBoardsList = async (): Promise<BoardMetadata[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('boards')
      .select('id, title, created_at, last_modified')
      .eq('user_id', userId)
      .order('last_modified', { ascending: false });

    if (error) throw error;

    return (data || []).map(board => ({
      id: board.id,
      title: board.title,
      createdAt: board.created_at,
      lastModified: board.last_modified,
    }));
  } catch (error) {
    console.error('Error loading boards list:', error);
    return [];
  }
};

export const getActiveBoard = async (): Promise<Board> => {
  try {
    console.log('🔍 Getting active board...');
    
    // Try to load active board ID from localStorage
    const activeId = localStorage.getItem('taskflow_active_board');
    console.log('📌 Active board ID from localStorage:', activeId);
    
    if (activeId) {
      console.log('⏳ Loading board:', activeId);
      const board = await loadBoard(activeId);
      if (board) {
        console.log('✅ Board loaded successfully');
        return board;
      }
    }

    // Load first board from list
    console.log('📋 Loading boards list...');
    const boards = await loadBoardsList();
    console.log('📊 Found boards:', boards.length);
    
    if (boards.length > 0) {
      console.log('⏳ Loading first board:', boards[0].id);
      const board = await loadBoard(boards[0].id);
      if (board) {
        setActiveBoard(board.id);
        console.log('✅ First board loaded successfully');
        return board;
      }
    }

    // Create default board
    console.log('🆕 Creating default board...');
    const defaultBoard = await createDefaultBoard();
    console.log('✅ Default board created');
    return defaultBoard;
  } catch (error) {
    console.error('❌ Error getting active board:', error);
    console.log('🔄 Attempting to create default board as fallback...');
    return await createDefaultBoard();
  }
};

export const setActiveBoard = (boardId: string): void => {
  localStorage.setItem('taskflow_active_board', boardId);
};

export const createNewBoard = async (title: string = 'Neues Board'): Promise<Board> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const now = new Date().toISOString();
    const boardId = generateUUID(); // Use proper UUID
    
    const col1Id = generateUUID();
    const col2Id = generateUUID();
    const col3Id = generateUUID();
    const col4Id = generateUUID();
    const col5Id = generateUUID();
    const taskId = generateUUID();
    
    const newBoard: Board = {
      id: boardId,
      title,
      columns: [
        { id: col1Id, title: 'Backlog', taskIds: [] },
        { id: col2Id, title: 'To Do', taskIds: [taskId] },
        { id: col3Id, title: 'In Progress', taskIds: [] },
        { id: col4Id, title: 'Review', taskIds: [] },
        { id: col5Id, title: 'Done', taskIds: [] },
      ],
      tasks: {
        [taskId]: {
          id: taskId,
          title: 'Neues Board einrichten',
          description: '',
          startDate: '',
          endDate: '',
          columnId: col2Id,
          tags: [],
          priority: 'Hoch',
          assignedMembers: [],
          activityLog: [
            {
              id: generateUUID(),
              timestamp: now,
              action: 'created',
              details: 'Aufgabe erstellt',
            },
          ],
        },
      },
      globalTags: {},
      teamIds: [],
    };
    
    await saveBoard(newBoard);
    return newBoard;
  } catch (error) {
    console.error('Error creating new board:', error);
    throw error;
  }
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId);

    if (error) throw error;

    // If deleted board was active, switch to another board
    const activeId = localStorage.getItem('taskflow_active_board');
    if (activeId === boardId) {
      const boards = await loadBoardsList();
      if (boards.length > 0) {
        setActiveBoard(boards[0].id);
      } else {
        localStorage.removeItem('taskflow_active_board');
      }
    }
  } catch (error) {
    console.error('Error deleting board:', error);
    throw error;
  }
};

export const renameBoard = async (boardId: string, newTitle: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('boards')
      .update({ title: newTitle, last_modified: new Date().toISOString() })
      .eq('id', boardId);

    if (error) throw error;
  } catch (error) {
    console.error('Error renaming board:', error);
    throw error;
  }
};

const createDefaultBoard = async (): Promise<Board> => {
  try {
    console.log('🔨 Creating default board object...');
    
    const col1Id = generateUUID();
    const col2Id = generateUUID();
    const col3Id = generateUUID();
    const col4Id = generateUUID();
    const col5Id = generateUUID();
    
    const defaultBoard: Board = {
      id: generateUUID(),
      title: 'TaskFlow - Mein Projekt',
      columns: [
        { id: col1Id, title: 'Backlog', taskIds: [] },
        { id: col2Id, title: 'To Do', taskIds: [] },
        { id: col3Id, title: 'In Progress', taskIds: [] },
        { id: col4Id, title: 'Review', taskIds: [] },
        { id: col5Id, title: 'Done', taskIds: [] },
      ],
      tasks: {},
      globalTags: {},
      teamIds: [],
    };
    
    console.log('💾 Saving default board to Supabase...');
    await saveBoard(defaultBoard);
    setActiveBoard(defaultBoard.id);
    console.log('✅ Default board saved successfully with ID:', defaultBoard.id);
    return defaultBoard;
  } catch (error) {
    console.error('❌ Error creating default board:', error);
    throw error;
  }
};

export const getInitialBoard = async (): Promise<Board> => {
  return await getActiveBoard();
};

// ===== TEAM STORAGE FUNCTIONS =====

export const saveTeam = async (team: Team): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    // Upsert team
    const { error: teamError } = await supabase
      .from('teams')
      .upsert({
        id: team.id,
        title: team.title,
        user_id: userId,
        last_modified: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (teamError) throw teamError;

    // Save team members
    await saveTeamMembers(team.id, team.members);
  } catch (error) {
    console.error('Error saving team:', error);
    throw error;
  }
};

const saveTeamMembers = async (teamId: string, members: TeamMember[]): Promise<void> => {
  try {
    // Delete existing members
    await supabase.from('team_members').delete().eq('team_id', teamId);

    // Insert new members
    const membersData = members.map(member => ({
      id: member.id,
      team_id: teamId,
      name: member.name,
      email: member.email,
      joined_at: member.joinedAt,
    }));

    if (membersData.length > 0) {
      const { error } = await supabase.from('team_members').insert(membersData);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving team members:', error);
    throw error;
  }
};

export const loadTeam = async (teamId: string): Promise<Team | null> => {
  try {
    // Load team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;
    if (!team) return null;

    // Load team members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    return {
      id: team.id,
      title: team.title,
      members: (members || []).map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        joinedAt: member.joined_at,
      })),
    };
  } catch (error) {
    console.error('Error loading team:', error);
    return null;
  }
};

export const loadTeamsList = async (): Promise<TeamMetadata[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('teams')
      .select('id, title, created_at, last_modified')
      .eq('user_id', userId)
      .order('last_modified', { ascending: false });

    if (error) throw error;

    return (data || []).map(team => ({
      id: team.id,
      title: team.title,
      createdAt: team.created_at,
      lastModified: team.last_modified,
    }));
  } catch (error) {
    console.error('Error loading teams list:', error);
    return [];
  }
};

export const getActiveTeam = async (): Promise<Team | null> => {
  try {
    const activeId = localStorage.getItem('taskflow_active_team');
    if (activeId) {
      return await loadTeam(activeId);
    }
    
    // Load first team from list
    const teams = await loadTeamsList();
    if (teams.length > 0) {
      const team = await loadTeam(teams[0].id);
      if (team) {
        setActiveTeam(team.id);
        return team;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting active team:', error);
    return null;
  }
};

export const setActiveTeam = (teamId: string | null): void => {
  if (teamId) {
    localStorage.setItem('taskflow_active_team', teamId);
  } else {
    localStorage.removeItem('taskflow_active_team');
  }
};

export const createNewTeam = async (title: string = 'Neues Team'): Promise<Team> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const newTeam: Team = {
      id: generateUUID(), // Use proper UUID
      title,
      members: [],
    };
    
    await saveTeam(newTeam);
    return newTeam;
  } catch (error) {
    console.error('Error creating new team:', error);
    throw error;
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;

    // If deleted team was active, clear active team
    const activeId = localStorage.getItem('taskflow_active_team');
    if (activeId === teamId) {
      const teams = await loadTeamsList();
      if (teams.length > 0) {
        setActiveTeam(teams[0].id);
      } else {
        setActiveTeam(null);
      }
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

export const renameTeam = async (teamId: string, newTitle: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ title: newTitle, last_modified: new Date().toISOString() })
      .eq('id', teamId);

    if (error) throw error;
  } catch (error) {
    console.error('Error renaming team:', error);
    throw error;
  }
};

export const addTeamMember = async (teamId: string, member: Omit<TeamMember, 'id' | 'joinedAt'>): Promise<void> => {
  try {
    const team = await loadTeam(teamId);
    if (team) {
      const newMember: TeamMember = {
        ...member,
        id: generateUUID(), // Use proper UUID
        joinedAt: new Date().toISOString(),
      };
      team.members.push(newMember);
      await saveTeam(team);
    }
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
};

export const removeTeamMember = async (teamId: string, memberId: string): Promise<void> => {
  try {
    const team = await loadTeam(teamId);
    if (team) {
      team.members = team.members.filter(m => m.id !== memberId);
      await saveTeam(team);
    }
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
};

export const updateTeamMember = async (teamId: string, memberId: string, updates: Partial<Pick<TeamMember, 'name' | 'email'>>): Promise<void> => {
  try {
    const team = await loadTeam(teamId);
    if (team) {
      const member = team.members.find(m => m.id === memberId);
      if (member) {
        Object.assign(member, updates);
        await saveTeam(team);
      }
    }
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
};
