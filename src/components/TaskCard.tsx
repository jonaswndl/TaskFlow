import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Tag, TeamMember } from '../types';
import { formatDate } from '../utils/helpers';
import { TAG_COLORS } from '../utils/tagColors';

interface TaskCardProps {
  task: Task;
  globalTags: Record<string, Tag>;
  onClick: () => void;
  assignableMembers?: TeamMember[];
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, globalTags, onClick, assignableMembers = [] }) => {
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const avatarRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
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

  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case 'Hoch':
        return { text: 'Hoch', color: 'text-red-600', bg: 'bg-red-50' };
      case 'Mittel':
        return { text: 'Mittel', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'Gering':
        return { text: 'Gering', color: 'text-green-600', bg: 'bg-green-50' };
      default:
        return null;
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);

  // Get assigned member details
  const assignedMemberDetails = (task.assignedMembers || [])
    .map(memberId => assignableMembers.find(m => m.id === memberId))
    .filter((m): m is TeamMember => m !== undefined);

  // Update tooltip position when hovering
  const handleMouseEnter = (memberId: string, element: HTMLDivElement) => {
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 65, // Position above the avatar with some margin
        left: rect.left + rect.width / 2, // Center horizontally
      });
    };
    updatePosition();
    setHoveredMember(memberId);
  };

  return (
    <>
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-move p-4 mb-3 border border-gray-100 hover:border-blue-300"
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-gray-800 flex-1 leading-relaxed">{task.title}</h4>
        {priorityConfig && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${priorityConfig.color} ${priorityConfig.bg} ml-2 flex-shrink-0`}>
            {priorityConfig.text}
          </span>
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
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${colors.bg} ${colors.text}`}
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

      {/* Assigned Members */}
      {assignedMemberDetails.length > 0 && (
        <div className="flex items-center gap-2 mt-3">
          <div className="flex -space-x-2">
            {assignedMemberDetails.slice(0, 3).map((member) => (
              <div
                key={member.id}
                ref={(el) => { avatarRefs.current[member.id] = el; }}
                className="relative"
                onMouseEnter={(e) => handleMouseEnter(member.id, e.currentTarget as HTMLDivElement)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                <div
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold shadow-sm cursor-pointer hover:scale-110 transition-transform"
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ))}
          </div>
          {assignedMemberDetails.length > 3 && (
            <span className="text-[10px] text-gray-500 font-medium">
              +{assignedMemberDetails.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
    {/* Tooltip Portal - Rendered outside card using React Portal */}
    {hoveredMember && assignedMemberDetails.find(m => m.id === hoveredMember) && ReactDOM.createPortal(
      <div 
        className="fixed pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translateX(-50%)',
          zIndex: 99999,
        }}
      >
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl min-w-max">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              {assignedMemberDetails.find(m => m.id === hoveredMember)!.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{assignedMemberDetails.find(m => m.id === hoveredMember)!.name}</p>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};
