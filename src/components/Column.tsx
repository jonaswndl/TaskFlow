import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreVertical, X } from 'lucide-react';
import type { Column as ColumnType, Task, Tag } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  globalTags: Record<string, Tag>;
  onAddTask: (columnId: string, title: string) => void;
  onTaskClick: (task: Task) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
  isDropTarget?: boolean;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  globalTags,
  onAddTask,
  onTaskClick,
  onRenameColumn,
  onDeleteColumn,
  isDropTarget = false,
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(column.id, newTaskTitle);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setNewTaskTitle('');
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      onRenameColumn(column.id, editedTitle);
    } else {
      setEditedTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  const handleDeleteColumn = () => {
    if (confirm(`Möchtest du die Spalte "${column.title}" wirklich löschen?`)) {
      onDeleteColumn(column.id);
    }
    setShowMenu(false);
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-5 w-80 flex-shrink-0 flex flex-col max-h-full shadow-md border-2 transition-all duration-200 ${
      isDropTarget 
        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-300 ring-opacity-50' 
        : 'border-gray-100'
    }`}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="font-semibold text-gray-800 text-sm bg-white border-2 border-blue-500 rounded-xl px-3 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        ) : (
          <h3
            className="font-semibold text-gray-800 text-sm cursor-pointer hover:text-blue-600 transition-colors"
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {column.title}
          </h3>
        )}
        <div className="flex items-center ml-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full mr-2">
            {tasks.length}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 w-44 backdrop-blur-xl">
                  <button
                    onClick={() => {
                      setIsEditingTitle(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Umbenennen
                  </button>
                  <button
                    onClick={handleDeleteColumn}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto mb-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              globalTags={globalTags}
              onClick={() => onTaskClick(task)} 
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Task */}
      {isAddingTask ? (
        <div className="bg-white rounded-2xl shadow-sm p-3 border border-gray-200">
          <input
            ref={inputRef}
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTaskTitle.trim()) {
                setIsAddingTask(false);
              }
            }}
            placeholder="Aufgaben-Titel eingeben..."
            className="w-full text-sm border-none outline-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddTask}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              Hinzufügen
            </button>
            <button
              onClick={() => {
                setIsAddingTask(false);
                setNewTaskTitle('');
              }}
              className="text-gray-500 hover:text-gray-700 text-xs px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingTask(true)}
          className="text-left text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl px-4 py-3 transition-all"
        >
          + Aufgabe
        </button>
      )}
    </div>
  );
};
