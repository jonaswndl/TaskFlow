import type { Board } from '../types';

const STORAGE_KEY = 'taskflow_board';

export const saveBoard = (board: Board): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadBoard = (): Board | null => {
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
        });
      }
      
      return board;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
};

export const getInitialBoard = (): Board => {
  const stored = loadBoard();
  if (stored) {
    return stored;
  }

  // Default board structure
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
  };
};
