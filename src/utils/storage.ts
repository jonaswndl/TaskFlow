import type { Board, BoardMetadata, Team, TeamMetadata, TeamMember } from '../types';

const STORAGE_KEY = 'taskflow_board';
const BOARDS_LIST_KEY = 'taskflow_boards_list';
const ACTIVE_BOARD_KEY = 'taskflow_active_board';
const TEAMS_LIST_KEY = 'taskflow_teams_list';
const ACTIVE_TEAM_KEY = 'taskflow_active_team';

export const saveBoard = (board: Board): void => {
  try {
    localStorage.setItem(`taskflow_board_${board.id}`, JSON.stringify(board));
    
    // Update board metadata
    const boards = loadBoardsList();
    const existingIndex = boards.findIndex(b => b.id === board.id);
    const metadata: BoardMetadata = {
      id: board.id,
      title: board.title,
      createdAt: existingIndex >= 0 ? boards[existingIndex].createdAt : new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      boards[existingIndex] = metadata;
    } else {
      boards.push(metadata);
    }
    
    localStorage.setItem(BOARDS_LIST_KEY, JSON.stringify(boards));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadBoard = (boardId: string): Board | null => {
  try {
    const stored = localStorage.getItem(`taskflow_board_${boardId}`);
    if (stored) {
      const board = JSON.parse(stored);
      
      // Initialize globalTags if not exists
      if (!board.globalTags) {
        board.globalTags = {};
      }
      
      // Migrate old tasks with Tag objects to tag labels
      if (board.tasks) {
        Object.keys(board.tasks).forEach((taskId) => {
          const task = board.tasks[taskId];
          
          // If tags don't exist, initialize as empty array
          if (!task.tags) {
            task.tags = [];
          }
          // If tags are objects (old format), migrate them
          else if (task.tags.length > 0 && typeof task.tags[0] === 'object') {
            const oldTags = task.tags as any[];
            oldTags.forEach((tag: any) => {
              if (tag.label && !board.globalTags[tag.label]) {
                board.globalTags[tag.label] = {
                  label: tag.label,
                  color: tag.color || 'blue',
                };
              }
            });
            // Convert to labels only
            task.tags = oldTags.map((tag: any) => tag.label);
          }
          
          // Initialize activityLog if not exists
          if (!task.activityLog) {
            task.activityLog = [];
          }

          // Initialize assignedMembers if not exists
          if (!task.assignedMembers) {
            task.assignedMembers = [];
          }
        });
      }

      // Initialize teamIds if not exists
      if (!board.teamIds) {
        board.teamIds = [];
      }
      
      return board;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
};

export const loadBoardsList = (): BoardMetadata[] => {
  try {
    const stored = localStorage.getItem(BOARDS_LIST_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading boards list:', error);
  }
  return [];
};

export const getActiveBoard = (): Board => {
  // Try to load active board ID
  const activeId = localStorage.getItem(ACTIVE_BOARD_KEY);
  if (activeId) {
    const board = loadBoard(activeId);
    if (board) {
      return board;
    }
  }

  // Try to load legacy board
  const legacyBoard = loadLegacyBoard();
  if (legacyBoard) {
    // Migrate legacy board
    saveBoard(legacyBoard);
    setActiveBoard(legacyBoard.id);
    return legacyBoard;
  }

  // Load first board from list
  const boards = loadBoardsList();
  if (boards.length > 0) {
    const board = loadBoard(boards[0].id);
    if (board) {
      setActiveBoard(board.id);
      return board;
    }
  }

  // Create default board
  const defaultBoard = createDefaultBoard();
  saveBoard(defaultBoard);
  setActiveBoard(defaultBoard.id);
  return defaultBoard;
};

export const setActiveBoard = (boardId: string): void => {
  localStorage.setItem(ACTIVE_BOARD_KEY, boardId);
};

export const createNewBoard = (title: string = 'Neues Board'): Board => {
  const now = new Date().toISOString();
  const newBoard: Board = {
    id: `board-${Date.now()}`,
    title,
    columns: [
      { id: 'col-1', title: 'Backlog', taskIds: [] },
      { id: 'col-2', title: 'To Do', taskIds: ['task-setup'] },
      { id: 'col-3', title: 'In Progress', taskIds: [] },
      { id: 'col-4', title: 'Review', taskIds: [] },
      { id: 'col-5', title: 'Done', taskIds: [] },
    ],
    tasks: {
      'task-setup': {
        id: 'task-setup',
        title: 'Neues Board einrichten',
        description: '',
        startDate: '',
        endDate: '',
        columnId: 'col-2',
        tags: [],
        priority: 'Hoch',
        assignedMembers: [],
        activityLog: [
          {
            id: `log-${Date.now()}`,
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
  
  saveBoard(newBoard);
  return newBoard;
};

export const deleteBoard = (boardId: string): void => {
  try {
    // Remove board data
    localStorage.removeItem(`taskflow_board_${boardId}`);
    
    // Remove from boards list
    const boards = loadBoardsList();
    const updatedBoards = boards.filter(b => b.id !== boardId);
    localStorage.setItem(BOARDS_LIST_KEY, JSON.stringify(updatedBoards));
    
    // If deleted board was active, switch to another board
    const activeId = localStorage.getItem(ACTIVE_BOARD_KEY);
    if (activeId === boardId) {
      if (updatedBoards.length > 0) {
        setActiveBoard(updatedBoards[0].id);
      } else {
        localStorage.removeItem(ACTIVE_BOARD_KEY);
      }
    }
  } catch (error) {
    console.error('Error deleting board:', error);
  }
};

export const renameBoard = (boardId: string, newTitle: string): void => {
  try {
    const board = loadBoard(boardId);
    if (board) {
      board.title = newTitle;
      saveBoard(board);
    }
  } catch (error) {
    console.error('Error renaming board:', error);
  }
};

const loadLegacyBoard = (): Board | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const board = JSON.parse(stored);
      
      // Initialize globalTags if not exists
      if (!board.globalTags) {
        board.globalTags = {};
      }
      
      // Migrate old tasks with Tag objects to tag labels
      if (board.tasks) {
        Object.keys(board.tasks).forEach((taskId) => {
          const task = board.tasks[taskId];
          
          // If tags don't exist, initialize as empty array
          if (!task.tags) {
            task.tags = [];
          }
          // If tags are objects (old format), migrate them
          else if (task.tags.length > 0 && typeof task.tags[0] === 'object') {
            const oldTags = task.tags as any[];
            oldTags.forEach((tag: any) => {
              if (tag.label && !board.globalTags[tag.label]) {
                board.globalTags[tag.label] = {
                  label: tag.label,
                  color: tag.color || 'blue',
                };
              }
            });
            // Convert to labels only
            task.tags = oldTags.map((tag: any) => tag.label);
          }
          
          // Initialize activityLog if not exists
          if (!task.activityLog) {
            task.activityLog = [];
          }

          // Initialize assignedMembers if not exists
          if (!task.assignedMembers) {
            task.assignedMembers = [];
          }
        });
      }

      // Initialize teamIds if not exists
      if (!board.teamIds) {
        board.teamIds = [];
      }
      
      return board;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
};

const createDefaultBoard = (): Board => {
  return {
    id: 'board-1',
    title: 'TaskFlow - Mein Projekt',
    columns: [
      { id: 'col-1', title: 'Backlog', taskIds: [] },
      { id: 'col-2', title: 'To Do', taskIds: [] },
      { id: 'col-3', title: 'In Progress', taskIds: [] },
      { id: 'col-4', title: 'Review', taskIds: [] },
      { id: 'col-5', title: 'Done', taskIds: [] },
    ],
    tasks: {},
    globalTags: {},
    teamIds: [],
  };
};

export const getInitialBoard = (): Board => {
  return getActiveBoard();
};

// ===== TEAM STORAGE FUNCTIONS =====

export const saveTeam = (team: Team): void => {
  try {
    localStorage.setItem(`taskflow_team_${team.id}`, JSON.stringify(team));
    
    // Update team metadata
    const teams = loadTeamsList();
    const existingIndex = teams.findIndex(t => t.id === team.id);
    const metadata: TeamMetadata = {
      id: team.id,
      title: team.title,
      createdAt: existingIndex >= 0 ? teams[existingIndex].createdAt : new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      teams[existingIndex] = metadata;
    } else {
      teams.push(metadata);
    }
    
    localStorage.setItem(TEAMS_LIST_KEY, JSON.stringify(teams));
  } catch (error) {
    console.error('Error saving team to localStorage:', error);
  }
};

export const loadTeam = (teamId: string): Team | null => {
  try {
    const stored = localStorage.getItem(`taskflow_team_${teamId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading team from localStorage:', error);
  }
  return null;
};

export const loadTeamsList = (): TeamMetadata[] => {
  try {
    const stored = localStorage.getItem(TEAMS_LIST_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading teams list:', error);
  }
  return [];
};

export const getActiveTeam = (): Team | null => {
  const activeId = localStorage.getItem(ACTIVE_TEAM_KEY);
  if (activeId) {
    return loadTeam(activeId);
  }
  
  // Load first team from list
  const teams = loadTeamsList();
  if (teams.length > 0) {
    const team = loadTeam(teams[0].id);
    if (team) {
      setActiveTeam(team.id);
      return team;
    }
  }
  
  return null;
};

export const setActiveTeam = (teamId: string | null): void => {
  if (teamId) {
    localStorage.setItem(ACTIVE_TEAM_KEY, teamId);
  } else {
    localStorage.removeItem(ACTIVE_TEAM_KEY);
  }
};

export const createNewTeam = (title: string = 'Neues Team'): Team => {
  const newTeam: Team = {
    id: `team-${Date.now()}`,
    title,
    members: [],
  };
  
  saveTeam(newTeam);
  return newTeam;
};

export const deleteTeam = (teamId: string): void => {
  try {
    // Remove team data
    localStorage.removeItem(`taskflow_team_${teamId}`);
    
    // Remove from teams list
    const teams = loadTeamsList();
    const updatedTeams = teams.filter(t => t.id !== teamId);
    localStorage.setItem(TEAMS_LIST_KEY, JSON.stringify(updatedTeams));
    
    // If deleted team was active, clear active team
    const activeId = localStorage.getItem(ACTIVE_TEAM_KEY);
    if (activeId === teamId) {
      if (updatedTeams.length > 0) {
        setActiveTeam(updatedTeams[0].id);
      } else {
        setActiveTeam(null);
      }
    }
  } catch (error) {
    console.error('Error deleting team:', error);
  }
};

export const renameTeam = (teamId: string, newTitle: string): void => {
  try {
    const team = loadTeam(teamId);
    if (team) {
      team.title = newTitle;
      saveTeam(team);
    }
  } catch (error) {
    console.error('Error renaming team:', error);
  }
};

export const addTeamMember = (teamId: string, member: Omit<TeamMember, 'id' | 'joinedAt'>): void => {
  try {
    const team = loadTeam(teamId);
    if (team) {
      const newMember: TeamMember = {
        ...member,
        id: `member-${Date.now()}`,
        joinedAt: new Date().toISOString(),
      };
      team.members.push(newMember);
      saveTeam(team);
    }
  } catch (error) {
    console.error('Error adding team member:', error);
  }
};

export const removeTeamMember = (teamId: string, memberId: string): void => {
  try {
    const team = loadTeam(teamId);
    if (team) {
      team.members = team.members.filter(m => m.id !== memberId);
      saveTeam(team);
    }
  } catch (error) {
    console.error('Error removing team member:', error);
  }
};

export const updateTeamMember = (teamId: string, memberId: string, updates: Partial<Pick<TeamMember, 'name' | 'email'>>): void => {
  try {
    const team = loadTeam(teamId);
    if (team) {
      const member = team.members.find(m => m.id === memberId);
      if (member) {
        Object.assign(member, updates);
        saveTeam(team);
      }
    }
  } catch (error) {
    console.error('Error updating team member:', error);
  }
};
