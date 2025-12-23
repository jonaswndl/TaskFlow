import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Tag } from '../types';
import { getDeadlineStatus, getDeadlineColor, formatDate } from '../utils/helpers';
import { TAG_COLORS } from '../utils/tagColors';

interface TaskCardProps {
  task: Task;
  globalTags: Record<string, Tag>;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, globalTags, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const deadlineStatus = getDeadlineStatus(task.endDate);
  const deadlineColor = getDeadlineColor(deadlineStatus);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow cursor-move p-4 mb-3 border border-gray-100 hover:border-blue-300"
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-gray-800 flex-1 leading-relaxed">{task.title}</h4>
        {task.endDate && deadlineStatus !== 'none' && (
          <span className={`w-2.5 h-2.5 rounded-full ${deadlineColor} ml-2 mt-1 flex-shrink-0 shadow-sm`}></span>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {task.tags.map((label) => {
            const tag = globalTags[label];
            if (!tag) return null; // Skip if tag doesn't exist
            
            const colors = TAG_COLORS[tag.color];
            return (
              <span
                key={label}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                {tag.label}
              </span>
            );
          })}
        </div>
      )}

      {task.endDate && (
        <div className="flex items-center mt-3 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg w-fit">
          <span>📅 {formatDate(task.endDate)}</span>
        </div>
      )}
    </div>
  );
};
