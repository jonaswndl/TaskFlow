import React, { useState } from 'react';
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
import type { Board as BoardType, Task, Column as ColumnType, Tag } from '../types';
import { Column } from './Column';
import { TaskDetail } from './TaskDetail';
import { TaskCard } from './TaskCard';
import { Sidebar } from './Sidebar';
import { generateId } from '../utils/helpers';

interface BoardProps {
  board: BoardType;
  onBoardUpdate: (board: BoardType) => void;
}

export const Board: React.FC<BoardProps> = ({ board, onBoardUpdate }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

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
      // Moving to a different column
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
      // Reordering within the same column
      const overTask = board.tasks[overId];
      if (overTask && activeTask.columnId === overTask.columnId) {
        const column = board.columns.find((col) => col.id === activeTask.columnId);
        if (column) {
          const oldIndex = column.taskIds.indexOf(activeId);
          const newIndex = column.taskIds.indexOf(overId);
          
          const newTaskIds = arrayMove(column.taskIds, oldIndex, newIndex);
          
          const newColumns = board.columns.map((col) =>
            col.id === column.id ? { ...col, taskIds: newTaskIds } : col
          );

          onBoardUpdate({
            ...board,
            columns: newColumns,
          });
        }
      }
    }
  };

  const handleAddTask = (columnId: string, title: string) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description: '',
      startDate: '',
      endDate: '',
      columnId,
      tags: [],
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
    if (!task) return;

    let newColumns = board.columns;
    let updatedTask = { ...task, ...updates };

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
    if (boardTitle.trim()) {
      onBoardUpdate({
        ...board,
        title: boardTitle,
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

  const getColumnTasks = (column: ColumnType): Task[] => {
    return column.taskIds
      .map((id) => board.tasks[id])
      .filter((task) => task !== undefined);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

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
              onDoubleClick={() => setIsEditingTitle(true)}
            >
              {board.title}
            </span>
          )}
        </div>
      </header>

      {/* Board */}
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
                <TaskCard task={activeTask} globalTags={board.globalTags} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Offcanvas */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          columns={board.columns}
          globalTags={board.globalTags}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onGlobalTagUpdate={handleGlobalTagUpdate}
        />
      )}
    </div>
  );
};
