import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Menu } from 'lucide-react';
import type { Board as BoardType, Task, Column as ColumnType, Tag, BoardMetadata, Team, TeamMetadata, TeamMember } from '../types';
import { Column } from './Column';
import { TaskDetail } from './TaskDetail';
import { TaskCard } from './TaskCard';
import { Sidebar } from './Sidebar';
import { FilterBar } from './FilterBar';
import { ListView } from './ListView';
import { CalendarView } from './CalendarView';
import { Settings } from './Settings';
import { TeamView } from './TeamView';
import { generateId } from '../utils/helpers';
import { loadTeam } from '../utils/storage';

interface BoardProps {
  board: BoardType;
  onBoardUpdate: (board: BoardType) => void;
  boards: BoardMetadata[];
  onBoardSelect: (boardId: string) => void;
  onCreateBoard: () => void;
  onDeleteBoard: (boardId: string) => void;
  onRenameBoard: (boardId: string, newTitle: string) => void;
  teams: TeamMetadata[];
  activeTeam: Team | null;
  activeView: 'board' | 'team';
  onTeamSelect: (teamId: string) => void;
  onCreateTeam: () => void;
  onDeleteTeam: (teamId: string) => void;
  onRenameTeam: (teamId: string, newTitle: string) => void;
  onTeamUpdate: (team: Team) => void;
  onDeleteActiveTeam: () => void;
  onSignOut?: () => void;
}

export const Board: React.FC<BoardProps> = ({ 
  board, 
  onBoardUpdate,
  boards,
  onBoardSelect,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
  teams,
  activeTeam,
  activeView: appActiveView,
  onTeamSelect,
  onCreateTeam,
  onDeleteTeam,
  onRenameTeam,
  onTeamUpdate,
  onDeleteActiveTeam,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'board' | 'list' | 'calendar' | 'settings'>('board');
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null);

  // Calculate assignable members from board's assigned teams
  const assignableMembers = useMemo(() => {
    if (!board.teamIds || board.teamIds.length === 0) {
      return [];
    }
    
    const members: TeamMember[] = [];
    const memberIds = new Set<string>();
    
    board.teamIds.forEach(teamId => {
      const team = loadTeam(teamId);
      if (team) {
        team.members.forEach(member => {
          // Avoid duplicates
          if (!memberIds.has(member.id)) {
            memberIds.add(member.id);
            members.push(member);
          }
        });
      }
    });
    
    return members;
  }, [board.teamIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = board.tasks[active.id as string];
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const overId = over.id as string;
      // Check if hovering over a column
      const column = board.columns.find((col) => col.id === overId);
      if (column) {
        setActiveColumnId(column.id);
      } else {
        // Check if hovering over a task
        const task = board.tasks[overId];
        if (task) {
          setActiveColumnId(task.columnId);
        }
      }
    } else {
      setActiveColumnId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumnId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = board.tasks[activeId];
    if (!activeTask) return;

    // Check if dropped on a column
    const targetColumn = board.columns.find((col) => col.id === overId);
    
    if (targetColumn) {
      // Moving to a different column (dropped on column itself)
      const sourceColumn = board.columns.find((col) => col.id === activeTask.columnId);
      
      if (sourceColumn && sourceColumn.id !== targetColumn.id) {
        const newColumns = board.columns.map((col) => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              taskIds: col.taskIds.filter((id) => id !== activeId),
            };
          }
          if (col.id === targetColumn.id) {
            return {
              ...col,
              taskIds: [...col.taskIds, activeId],
            };
          }
          return col;
        });

        const newTasks = {
          ...board.tasks,
          [activeId]: {
            ...activeTask,
            columnId: targetColumn.id,
          },
        };

        onBoardUpdate({
          ...board,
          columns: newColumns,
          tasks: newTasks,
        });
      }
    } else {
      // Dropped on a task
      const overTask = board.tasks[overId];
      if (overTask) {
        const sourceColumn = board.columns.find((col) => col.id === activeTask.columnId);
        const targetColumn = board.columns.find((col) => col.id === overTask.columnId);
        
        if (!sourceColumn || !targetColumn) return;
        
        if (activeTask.columnId === overTask.columnId) {
          // Reordering within the same column
          const oldIndex = sourceColumn.taskIds.indexOf(activeId);
          const newIndex = sourceColumn.taskIds.indexOf(overId);
          
          const newTaskIds = arrayMove(sourceColumn.taskIds, oldIndex, newIndex);
          
          const newColumns = board.columns.map((col) =>
            col.id === sourceColumn.id ? { ...col, taskIds: newTaskIds } : col
          );

          onBoardUpdate({
            ...board,
            columns: newColumns,
          });
        } else {
          // Moving to a different column (dropped on a task in another column)
          const newIndex = targetColumn.taskIds.indexOf(overId);
          
          // Remove from source column
          const sourceTaskIds = sourceColumn.taskIds.filter((id) => id !== activeId);
          
          // Add to target column at the position of the task we dropped on
          const targetTaskIds = [...targetColumn.taskIds];
          targetTaskIds.splice(newIndex, 0, activeId);
          
          const newColumns = board.columns.map((col) => {
            if (col.id === sourceColumn.id) {
              return { ...col, taskIds: sourceTaskIds };
            }
            if (col.id === targetColumn.id) {
              return { ...col, taskIds: targetTaskIds };
            }
            return col;
          });

          const newTasks = {
            ...board.tasks,
            [activeId]: {
              ...activeTask,
              columnId: targetColumn.id,
            },
          };

          onBoardUpdate({
            ...board,
            columns: newColumns,
            tasks: newTasks,
          });
        }
      }
    }
  };

  const handleAddTask = (columnId: string, title: string) => {
    const timestamp = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      title,
      description: '',
      startDate: '',
      endDate: '',
      columnId,
      tags: [],
      activityLog: [
        {
          id: generateId(),
          timestamp,
          action: 'created',
          details: 'Aufgabe wurde erstellt',
        },
      ],
    };

    const newColumns = board.columns.map((col) =>
      col.id === columnId
        ? { ...col, taskIds: [...col.taskIds, newTask.id] }
        : col
    );

    onBoardUpdate({
      ...board,
      columns: newColumns,
      tasks: {
        ...board.tasks,
        [newTask.id]: newTask,
      },
    });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const task = board.tasks[taskId];
    
    // Check if this is a new task being created (temporary ID)
    if (taskId.startsWith('temp-')) {
      // This is a new task, so we need to create it with a real ID
      if (updates.title && updates.title.trim()) {
        const timestamp = new Date().toISOString();
        const realId = generateId();
        const newTask: Task = {
          ...task,
          ...updates,
          id: realId,
          activityLog: [
            {
              id: generateId(),
              timestamp,
              action: 'created',
              details: 'Aufgabe wurde erstellt',
            },
          ],
        };

        const columnId = newTaskColumnId || task.columnId;
        const newColumns = board.columns.map((col) =>
          col.id === columnId
            ? { ...col, taskIds: [...col.taskIds, realId] }
            : col
        );

        onBoardUpdate({
          ...board,
          columns: newColumns,
          tasks: {
            ...board.tasks,
            [realId]: newTask,
          },
        });

        // Update the selected task to the real task
        setSelectedTask(newTask);
        setNewTaskColumnId(null);
      }
      return;
    }
    
    if (!task) return;

    const timestamp = new Date().toISOString();
    const newLogEntries = [];

    // Track title changes
    if (updates.title !== undefined && updates.title !== task.title) {
      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'title_changed' as const,
        oldValue: task.title,
        newValue: updates.title,
        details: `Titel wurde von "${task.title}" zu "${updates.title}" geändert`,
      });
    }

    // Track description changes
    if (updates.description !== undefined && updates.description !== task.description) {
      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'description_changed' as const,
        oldValue: task.description,
        newValue: updates.description,
        details: task.description 
          ? `Beschreibung wurde geändert`
          : `Beschreibung wurde hinzugefügt`,
      });
    }

    // Track date changes
    if (updates.startDate !== undefined && updates.startDate !== task.startDate) {
      const formatDate = (date: string) => {
        if (!date) return 'kein Datum';
        const d = new Date(date);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'dates_changed' as const,
        oldValue: task.startDate,
        newValue: updates.startDate,
        details: `Startdatum wurde von "${formatDate(task.startDate)}" zu "${formatDate(updates.startDate)}" geändert`,
      });
    }

    if (updates.endDate !== undefined && updates.endDate !== task.endDate) {
      const formatDate = (date: string) => {
        if (!date) return 'kein Datum';
        const d = new Date(date);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'dates_changed' as const,
        oldValue: task.endDate,
        newValue: updates.endDate,
        details: `Enddatum wurde von "${formatDate(task.endDate)}" zu "${formatDate(updates.endDate)}" geändert`,
      });
    }

    // Track column changes
    if (updates.columnId !== undefined && updates.columnId !== task.columnId) {
      const oldColumn = board.columns.find((c) => c.id === task.columnId);
      const newColumn = board.columns.find((c) => c.id === updates.columnId);
      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'column_changed' as const,
        oldValue: oldColumn?.title,
        newValue: newColumn?.title,
        details: `Status wurde von "${oldColumn?.title}" zu "${newColumn?.title}" geändert`,
      });
    }

    // Track tag changes
    if (updates.tags !== undefined && JSON.stringify(updates.tags) !== JSON.stringify(task.tags)) {
      const added = updates.tags.filter((t) => !task.tags.includes(t));
      const removed = task.tags.filter((t) => updates.tags && !updates.tags.includes(t));
      
      let details = '';
      if (added.length > 0 && removed.length > 0) {
        details = `Tags geändert: ${added.join(', ')} hinzugefügt, ${removed.join(', ')} entfernt`;
      } else if (added.length > 0) {
        details = `Tags hinzugefügt: ${added.join(', ')}`;
      } else if (removed.length > 0) {
        details = `Tags entfernt: ${removed.join(', ')}`;
      }

      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'tags_changed' as const,
        oldValue: task.tags,
        newValue: updates.tags,
        details,
      });
    }

    // Track priority changes
    if (updates.priority !== undefined && updates.priority !== task.priority) {
      const oldPriority = task.priority || 'Keine';
      const newPriority = updates.priority || 'Keine';
      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'priority_changed' as const,
        oldValue: task.priority,
        newValue: updates.priority,
        details: `Priorität wurde von "${oldPriority}" zu "${newPriority}" geändert`,
      });
    }

    // Track assigned members changes
    if (updates.assignedMembers !== undefined && JSON.stringify(updates.assignedMembers) !== JSON.stringify(task.assignedMembers || [])) {
      const oldMembers = task.assignedMembers || [];
      const newMembers = updates.assignedMembers;
      const added = newMembers.filter((m) => !oldMembers.includes(m));
      const removed = oldMembers.filter((m) => !newMembers.includes(m));
      
      // Get member names for better readability
      const getMemberNames = (memberIds: string[]) => {
        return memberIds
          .map(id => assignableMembers.find(m => m.id === id)?.name || id)
          .join(', ');
      };

      let details = '';
      if (added.length > 0 && removed.length > 0) {
        details = `Mitarbeiter geändert: ${getMemberNames(added)} hinzugefügt, ${getMemberNames(removed)} entfernt`;
      } else if (added.length > 0) {
        details = `Mitarbeiter hinzugefügt: ${getMemberNames(added)}`;
      } else if (removed.length > 0) {
        details = `Mitarbeiter entfernt: ${getMemberNames(removed)}`;
      }

      newLogEntries.push({
        id: generateId(),
        timestamp,
        action: 'tags_changed' as const, // Reuse tags_changed since it's similar
        oldValue: oldMembers,
        newValue: newMembers,
        details,
      });
    }

    let newColumns = board.columns;
    let updatedTask = { 
      ...task, 
      ...updates,
      activityLog: [...(task.activityLog || []), ...newLogEntries],
    };

    // If column changed, move task
    if (updates.columnId && updates.columnId !== task.columnId) {
      newColumns = board.columns.map((col) => {
        if (col.id === task.columnId) {
          return {
            ...col,
            taskIds: col.taskIds.filter((id) => id !== taskId),
          };
        }
        if (col.id === updates.columnId) {
          return {
            ...col,
            taskIds: [...col.taskIds, taskId],
          };
        }
        return col;
      });
    }

    onBoardUpdate({
      ...board,
      columns: newColumns,
      tasks: {
        ...board.tasks,
        [taskId]: updatedTask,
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    // If deleting a temporary task, just close it
    if (taskId.startsWith('temp-')) {
      setSelectedTask(null);
      setNewTaskColumnId(null);
      return;
    }
    
    const task = board.tasks[taskId];
    if (!task) return;

    const newColumns = board.columns.map((col) =>
      col.id === task.columnId
        ? { ...col, taskIds: col.taskIds.filter((id) => id !== taskId) }
        : col
    );

    const newTasks = { ...board.tasks };
    delete newTasks[taskId];

    onBoardUpdate({
      ...board,
      columns: newColumns,
      tasks: newTasks,
    });
  };

  const handleRenameColumn = (columnId: string, newTitle: string) => {
    const newColumns = board.columns.map((col) =>
      col.id === columnId ? { ...col, title: newTitle } : col
    );

    onBoardUpdate({
      ...board,
      columns: newColumns,
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = board.columns.find((col) => col.id === columnId);
    if (!column) return;

    // Delete all tasks in this column
    const newTasks = { ...board.tasks };
    column.taskIds.forEach((taskId) => {
      delete newTasks[taskId];
    });

    const newColumns = board.columns.filter((col) => col.id !== columnId);

    onBoardUpdate({
      ...board,
      columns: newColumns,
      tasks: newTasks,
    });
  };

  const handleAddColumn = () => {
    const newColumn: ColumnType = {
      id: generateId(),
      title: 'Neue Spalte',
      taskIds: [],
    };

    onBoardUpdate({
      ...board,
      columns: [...board.columns, newColumn],
    });
  };

  const handleSaveBoardTitle = () => {
    if (boardTitle.trim() && boardTitle.trim() !== board.title) {
      onRenameBoard(board.id, boardTitle.trim());
      onBoardUpdate({
        ...board,
        title: boardTitle.trim(),
      });
    } else {
      setBoardTitle(board.title);
    }
    setIsEditingTitle(false);
  };

  const handleGlobalTagUpdate = (label: string, tag: Tag) => {
    onBoardUpdate({
      ...board,
      globalTags: {
        ...board.globalTags,
        [label]: tag,
      },
    });
  };

  const handleDeleteTag = (tagLabel: string) => {
    // Remove tag from all tasks
    const updatedTasks = { ...board.tasks };
    Object.keys(updatedTasks).forEach((taskId) => {
      const task = updatedTasks[taskId];
      if (task.tags.includes(tagLabel)) {
        updatedTasks[taskId] = {
          ...task,
          tags: task.tags.filter((t) => t !== tagLabel),
        };
      }
    });

    // Remove tag from global tags
    const updatedGlobalTags = { ...board.globalTags };
    delete updatedGlobalTags[tagLabel];

    onBoardUpdate({
      ...board,
      tasks: updatedTasks,
      globalTags: updatedGlobalTags,
    });
  };

  const handleBoardRename = (newTitle: string) => {
    onRenameBoard(board.id, newTitle);
    setBoardTitle(newTitle);
  };

  const handleBoardDeleteFromSettings = () => {
    onDeleteBoard(board.id);
  };

  const getColumnTasks = (column: ColumnType): Task[] => {
    const tasks = column.taskIds
      .map((id) => board.tasks[id])
      .filter((task) => task !== undefined);
    
    // Apply tag filter
    if (filterTags.length > 0) {
      return tasks.filter((task) =>
        filterTags.some((filterTag) => task.tags.includes(filterTag))
      );
    }
    
    return tasks;
  };

  return (
    <>
      {/* Sidebar - Always rendered */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        boards={boards}
        activeBoardId={board.id}
        onBoardSelect={onBoardSelect}
        onCreateBoard={onCreateBoard}
        onDeleteBoard={onDeleteBoard}
        onRenameBoard={onRenameBoard}
        teams={teams}
        activeTeamId={activeTeam?.id || null}
        onTeamSelect={onTeamSelect}
        onCreateTeam={onCreateTeam}
        onDeleteTeam={onDeleteTeam}
        onRenameTeam={onRenameTeam}
        activeView={appActiveView}
      />

      {appActiveView === 'team' && activeTeam ? (
        <TeamView
          team={activeTeam}
          onTeamUpdate={onTeamUpdate}
          onRenameTeam={(newTitle) => onRenameTeam(activeTeam.id, newTitle)}
          onDeleteTeam={onDeleteActiveTeam}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      ) : (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-100">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-xl shadow-sm px-6 py-4 flex items-center justify-between border-b border-gray-200/50">
            <div className="flex items-center gap-4">
              <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">T</span>
            </div>
            <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TaskFlow
            </h1>
          </div>
          <div className="h-8 w-px bg-gray-300 mx-2"></div>
          {isEditingTitle ? (
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleSaveBoardTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveBoardTitle();
                if (e.key === 'Escape') {
                  setBoardTitle(board.title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-lg font-semibold border-2 border-blue-500 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          ) : (
            <span
              className="text-lg font-semibold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
              onClick={() => setIsEditingTitle(true)}
            >
              {board.title}
            </span>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView('board')}
            className={`px-6 py-3.5 font-semibold transition-all relative ${
              activeView === 'board'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            Board
            {activeView === 'board' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`px-6 py-3.5 font-semibold transition-all relative ${
              activeView === 'list'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            Liste
            {activeView === 'list' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-6 py-3.5 font-semibold transition-all relative ${
              activeView === 'calendar'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            Kalender
            {activeView === 'calendar' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`px-6 py-3.5 font-semibold transition-all relative ${
              activeView === 'settings'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            Einstellungen
            {activeView === 'settings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Filter Bar - Only show on board, list, and calendar views */}
      {(activeView === 'board' || activeView === 'list' || activeView === 'calendar') && (
        <FilterBar
          globalTags={board.globalTags}
          selectedTags={filterTags}
          onTagsChange={setFilterTags}
        />
      )}

      {/* Board View */}
      {activeView === 'board' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {board.columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={getColumnTasks(column)}
                globalTags={board.globalTags}
                onAddTask={handleAddTask}
                onTaskClick={setSelectedTask}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                isDropTarget={activeColumnId === column.id}
                assignableMembers={assignableMembers}
              />
            ))}

            {/* Add Column Button */}
            <button
              onClick={handleAddColumn}
              className="bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-3xl p-6 w-80 flex-shrink-0 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all border-2 border-dashed border-gray-300 hover:border-blue-400 hover:scale-[1.02] shadow-sm hover:shadow-md"
            >
              <Plus size={20} className="mr-2" />
              <span className="font-semibold">Neue Spalte</span>
            </button>
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="cursor-grabbing scale-105 rotate-2">
                <TaskCard 
                  task={activeTask} 
                  globalTags={board.globalTags} 
                  onClick={() => {}}
                  assignableMembers={assignableMembers}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <ListView
          columns={board.columns}
          tasks={board.tasks}
          globalTags={board.globalTags}
          onTaskClick={setSelectedTask}
          onAddTask={handleAddTask}
          filterTags={filterTags}
          boardId={board.id}
        />
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <CalendarView
          tasks={board.tasks}
          globalTags={board.globalTags}
          onTaskClick={setSelectedTask}
          filterTags={filterTags}
        />
      )}

      {/* Settings View */}
      {activeView === 'settings' && (
        <Settings
          board={board}
          onBoardRename={handleBoardRename}
          onBoardDelete={handleBoardDeleteFromSettings}
          onTagDelete={handleDeleteTag}
          isLastBoard={boards.length <= 1}
          teams={teams}
          onBoardUpdate={onBoardUpdate}
        />
      )}

      {/* Task Detail Offcanvas */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          columns={board.columns}
          globalTags={board.globalTags}
          onClose={() => {
            // If closing a temporary task, discard it
            if (selectedTask.id.startsWith('temp-')) {
              setNewTaskColumnId(null);
            }
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onGlobalTagUpdate={handleGlobalTagUpdate}
          assignableMembers={assignableMembers}
        />
      )}
        </div>
      )}
    </>
  );
};
