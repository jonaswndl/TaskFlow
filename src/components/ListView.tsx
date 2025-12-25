import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import type { Task, Column as ColumnType, Tag, ListViewState } from '../types';
import { formatDate } from '../utils/helpers';
import { TAG_COLORS } from '../utils/tagColors';

interface ListViewProps {
  columns: ColumnType[];
  tasks: Record<string, Task>;
  globalTags: Record<string, Tag>;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  filterTags: string[];
  boardId: string; // Add boardId to identify which board we're viewing
}

const LISTVIEW_STORAGE_KEY = 'taskflow_listview_states';

// Helper functions to manage ListView states in localStorage
const loadListViewState = (boardId: string): string[] => {
  try {
    const stored = localStorage.getItem(LISTVIEW_STORAGE_KEY);
    if (stored) {
      const states: ListViewState[] = JSON.parse(stored);
      const state = states.find(s => s.boardId === boardId);
      return state?.expandedColumns || [];
    }
  } catch (error) {
    console.error('Error loading ListView state:', error);
  }
  return [];
};

const saveListViewState = (boardId: string, expandedColumns: string[]): void => {
  try {
    const stored = localStorage.getItem(LISTVIEW_STORAGE_KEY);
    let states: ListViewState[] = stored ? JSON.parse(stored) : [];
    
    // Remove old state for this board if exists
    states = states.filter(s => s.boardId !== boardId);
    
    // Add new state
    states.push({ boardId, expandedColumns });
    
    localStorage.setItem(LISTVIEW_STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.error('Error saving ListView state:', error);
  }
};

export const ListView: React.FC<ListViewProps> = ({
  columns,
  tasks,
  globalTags,
  onTaskClick,
  onAddTask,
  filterTags,
  boardId,
}) => {
  // Load initial state from localStorage, or expand all columns by default
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(() => {
    const savedExpanded = loadListViewState(boardId);
    if (savedExpanded.length > 0) {
      return new Set(savedExpanded);
    }
    // Default: all columns expanded
    return new Set(columns.map((col) => col.id));
  });
  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingTaskColumnId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingTaskColumnId]);

  const toggleColumn = (columnId: string) => {
    const newExpanded = new Set(expandedColumns);
    if (newExpanded.has(columnId)) {
      newExpanded.delete(columnId);
    } else {
      newExpanded.add(columnId);
    }
    setExpandedColumns(newExpanded);
    
    // Save to localStorage
    saveListViewState(boardId, Array.from(newExpanded));
  };

  const handleAddTaskClick = (e: React.MouseEvent, columnId: string) => {
    e.stopPropagation();
    
    // Ensure the column is expanded when adding a task
    if (!expandedColumns.has(columnId)) {
      const newExpanded = new Set(expandedColumns);
      newExpanded.add(columnId);
      setExpandedColumns(newExpanded);
    }
    
    setAddingTaskColumnId(columnId);
    setNewTaskTitle('');
  };

  const handleAddTask = (columnId: string) => {
    if (newTaskTitle.trim()) {
      onAddTask(columnId, newTaskTitle);
      setNewTaskTitle('');
      setAddingTaskColumnId(null);
    }
  };

  const handleCancelAddTask = () => {
    setAddingTaskColumnId(null);
    setNewTaskTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, columnId: string) => {
    if (e.key === 'Enter') {
      handleAddTask(columnId);
    } else if (e.key === 'Escape') {
      handleCancelAddTask();
    }
  };

  const getColumnTasks = (column: ColumnType): Task[] => {
    const columnTasks = column.taskIds
      .map((id) => tasks[id])
      .filter((task) => task !== undefined);

    // Apply tag filter
    if (filterTags.length > 0) {
      return columnTasks.filter((task) =>
        filterTags.some((filterTag) => task.tags.includes(filterTag))
      );
    }

    return columnTasks;
  };

  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case 'Hoch':
        return { text: 'Hoch', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'Mittel':
        return { text: 'Mittel', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'Gering':
        return { text: 'Gering', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {columns.map((column) => {
          const columnTasks = getColumnTasks(column);
          const isExpanded = expandedColumns.has(column.id);

          return (
            <div
              key={column.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleColumn(column.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="transition-transform group-hover:scale-110">
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-gray-600" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {column.title}
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {columnTasks.length} {columnTasks.length === 1 ? 'Aufgabe' : 'Aufgaben'}
                  </span>
                </div>
                
                <button
                  onClick={(e) => handleAddTaskClick(e, column.id)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl px-4 py-2 transition-all"
                >
                  + Aufgabe
                </button>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Add Task Input */}
                  {addingTaskColumnId === column.id && (
                    <div className="px-6 py-4 border-b border-gray-100">
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <input
                          ref={inputRef}
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, column.id)}
                          onBlur={() => {
                            if (!newTaskTitle.trim()) {
                              handleCancelAddTask();
                            }
                          }}
                          placeholder="Aufgaben-Titel eingeben..."
                          className="w-full text-sm border-none outline-none bg-transparent font-medium text-gray-800"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAddTask(column.id)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                          >
                            Hinzufügen
                          </button>
                          <button
                            onClick={handleCancelAddTask}
                            className="text-gray-600 hover:text-gray-800 text-xs font-medium px-4 py-2 rounded-xl hover:bg-gray-200 transition-all"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {columnTasks.length === 0 && addingTaskColumnId !== column.id ? (
                    <div className="px-6 py-12 text-center">
                      <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-400">Keine Aufgaben in dieser Spalte</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {columnTasks.map((task) => {
                        const priorityConfig = getPriorityConfig(task.priority);

                        return (
                          <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-gray-800 mb-2 line-clamp-1">
                                  {task.title}
                                </h4>
                                
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3">
                                  {/* Priority Badge */}
                                  {priorityConfig && (
                                    <span
                                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border}`}
                                    >
                                      {priorityConfig.text}
                                    </span>
                                  )}

                                  {/* Date Range */}
                                  {(task.startDate || task.endDate) && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                      {task.startDate && formatDate(task.startDate)}
                                      {task.startDate && task.endDate && ' - '}
                                      {task.endDate && formatDate(task.endDate)}
                                    </span>
                                  )}

                                  {/* Tags */}
                                  {task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {task.tags.map((tagLabel) => {
                                        const tag = globalTags[tagLabel];
                                        if (!tag) return null;

                                        const colorClasses = TAG_COLORS[tag.color];

                                        return (
                                          <span
                                            key={tagLabel}
                                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorClasses.bg} ${colorClasses.text}`}
                                          >
                                            {tag.label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {columns.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">
              Keine Spalten vorhanden. Füge eine Spalte hinzu, um zu beginnen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
