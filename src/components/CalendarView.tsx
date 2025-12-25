import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Tag as TagIcon, Settings } from 'lucide-react';
import type { Task, Tag } from '../types';
import { TAG_COLORS } from '../utils/tagColors';

interface CalendarViewProps {
  tasks: Record<string, Task>;
  globalTags: Record<string, Tag>;
  onTaskClick: (task: Task) => void;
  filterTags: string[];
}

interface TaskPopup {
  task: Task;
  x: number;
  y: number;
}

// Generate distinct colors for tasks
const TASK_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-slate-500',
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  globalTags,
  onTaskClick,
  filterTags,
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [hoveredTask, setHoveredTask] = React.useState<TaskPopup | null>(null);
  const [expandedDays, setExpandedDays] = React.useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = React.useState<'month' | 'week'>(() => {
    const saved = localStorage.getItem('calendarViewMode');
    return (saved as 'month' | 'week') || 'month';
  });
  const [showWeekends, setShowWeekends] = React.useState(() => {
    const saved = localStorage.getItem('calendarShowWeekends');
    return saved !== null ? saved === 'true' : true;
  });
  const [showSettingsDropdown, setShowSettingsDropdown] = React.useState(false);
  const settingsRef = React.useRef<HTMLDivElement>(null);

  // Save settings to localStorage
  React.useEffect(() => {
    localStorage.setItem('calendarViewMode', viewMode);
  }, [viewMode]);

  React.useEffect(() => {
    localStorage.setItem('calendarShowWeekends', String(showWeekends));
  }, [showWeekends]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { year, month, daysInMonth, startingDayOfWeek };
  };

  const getWeekData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    
    // Get the current week's Monday
    const current = new Date(year, month, date);
    const day = current.getDay();
    const diff = current.getDate() - (day === 0 ? 6 : day - 1); // Adjust when day is Sunday
    const monday = new Date(current.setDate(diff));
    
    return { monday };
  };

  const { year, month, daysInMonth, startingDayOfWeek } = getMonthData();

  const goToPreviousMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      // Go to previous week
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
    setExpandedDays(new Set());
  };

  const goToNextMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      // Go to next week
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
    setExpandedDays(new Set());
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleDayExpansion = (day: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const allDayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const weekdayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
  
  const activeDayNames = showWeekends ? allDayNames : weekdayNames;

  // Filter tasks based on selected tags
  const filteredTasks = Object.values(tasks).filter((task) => {
    if (filterTags.length === 0) return true;
    return task.tags.some((tag) => filterTags.includes(tag));
  });

  // Get all tasks visible in current month or week
  const getVisibleTasks = () => {
    const visibleTaskIds = new Set<string>();
    
    if (viewMode === 'week') {
      const { monday } = getWeekData();
      const daysToShow = showWeekends ? 7 : 5;
      
      for (let i = 0; i < daysToShow; i++) {
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
        
        const dayDate = new Date(currentDay);
        dayDate.setHours(0, 0, 0, 0);
        
        filteredTasks.forEach((task) => {
          if (!task.startDate || !task.endDate) return;
          
          const startDate = new Date(task.startDate);
          const endDate = new Date(task.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          
          if (dayDate >= startDate && dayDate <= endDate) {
            visibleTaskIds.add(task.id);
          }
        });
      }
    } else {
      const { daysInMonth } = getMonthData();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayTasks = getTasksForDay(day);
        dayTasks.forEach(task => visibleTaskIds.add(task.id));
      }
    }
    
    return filteredTasks.filter(task => visibleTaskIds.has(task.id));
  };

  // Assign unique colors to tasks
  const getTaskColor = (taskId: string) => {
    const visibleTasks = getVisibleTasks();
    const taskIndex = visibleTasks.findIndex(t => t.id === taskId);
    return TASK_COLORS[taskIndex % TASK_COLORS.length];
  };

  // Get tasks for a specific day
  const getTasksForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    
    return filteredTasks.filter((task) => {
      if (!task.startDate || !task.endDate) return false;
      
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      
      // Normalize to midnight for comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      dayDate.setHours(0, 0, 0, 0);
      
      return dayDate >= startDate && dayDate <= endDate;
    });
  };

  // Calculate task position in a day (for overlapping tasks)
  const getTaskPosition = (task: Task, dayTasks: Task[]) => {
    const sortedTasks = [...dayTasks].sort((a, b) => {
      // Sort by start date, then by task id for consistency
      const dateCompare = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      return dateCompare !== 0 ? dateCompare : a.id.localeCompare(b.id);
    });
    
    return sortedTasks.indexOf(task);
  };

  // Check if this is the first day of the task in the current view
  const isTaskStart = (task: Task, day: number, taskYear?: number, taskMonth?: number) => {
    const useYear = taskYear !== undefined ? taskYear : year;
    const useMonth = taskMonth !== undefined ? taskMonth : month;
    
    const startDate = new Date(task.startDate);
    const dayDate = new Date(useYear, useMonth, day);
    
    startDate.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    // Check if it's the actual start date
    if (startDate.getTime() === dayDate.getTime()) {
      return true;
    }
    
    // For week view or if it's the first day being shown
    if (viewMode === 'week') {
      return startDate < dayDate;
    }
    
    // If it's the first day of the month, check if task started before this month
    if (day === 1) {
      const monthStart = new Date(useYear, useMonth, 1);
      monthStart.setHours(0, 0, 0, 0);
      return startDate < monthStart;
    }
    
    return false;
  };

  // Check if this is the last day of the task in the current view
  const isTaskEnd = (task: Task, day: number, taskYear?: number, taskMonth?: number) => {
    const useYear = taskYear !== undefined ? taskYear : year;
    const useMonth = taskMonth !== undefined ? taskMonth : month;
    
    const endDate = new Date(task.endDate);
    const dayDate = new Date(useYear, useMonth, day);
    
    endDate.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    // Check if it's the actual end date
    if (endDate.getTime() === dayDate.getTime()) {
      return true;
    }
    
    // For week view, check if this is the last visible day
    if (viewMode === 'week') {
      return endDate > dayDate;
    }
    
    // If it's the last day of the month, check if task ends after this month
    const lastDayOfMonth = new Date(useYear, useMonth + 1, 0).getDate();
    if (day === lastDayOfMonth) {
      const monthEnd = new Date(useYear, useMonth, lastDayOfMonth);
      monthEnd.setHours(0, 0, 0, 0);
      return endDate > monthEnd;
    }
    
    return false;
  };

  const renderCalendarDays = () => {
    const days = [];
    
    if (viewMode === 'week') {
      // Week view
      const { monday } = getWeekData();
      const daysToShow = showWeekends ? 7 : 5;
      
      for (let i = 0; i < daysToShow; i++) {
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
        
        const day = currentDay.getDate();
        const currentMonth = currentDay.getMonth();
        const currentYear = currentDay.getFullYear();
        
        // Get tasks for this specific date
        const dayDate = new Date(currentYear, currentMonth, day);
        const dayTasks = filteredTasks.filter((task) => {
          if (!task.startDate || !task.endDate) return false;
          
          const startDate = new Date(task.startDate);
          const endDate = new Date(task.endDate);
          
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          dayDate.setHours(0, 0, 0, 0);
          
          return dayDate >= startDate && dayDate <= endDate;
        });
        
        const isToday = new Date().getDate() === day && 
                       new Date().getMonth() === currentMonth && 
                       new Date().getFullYear() === currentYear;
        const isExpanded = expandedDays.has(day);
        const maxVisibleTasks = isExpanded ? dayTasks.length : 3;
        const visibleTasks = dayTasks.slice(0, maxVisibleTasks);
        const hiddenTasksCount = dayTasks.length - maxVisibleTasks;
        
        days.push(
          <div
            key={`${currentYear}-${currentMonth}-${day}`}
            className={`bg-white border border-gray-200/50 min-h-32 p-2 overflow-hidden relative ${
              isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
            }`}
          >
            <div className={`text-sm font-semibold mb-2 ${
              isToday ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {day}.{currentMonth + 1}
            </div>
            
            <div className="space-y-1">
              {visibleTasks.map((task) => {
                const position = getTaskPosition(task, dayTasks);
                const isStart = isTaskStart(task, day, currentYear, currentMonth);
                const isEnd = isTaskEnd(task, day, currentYear, currentMonth);
                const taskColor = getTaskColor(task.id);
                const isHovered = hoveredTask?.task.id === task.id;
                const isAnyHovered = hoveredTask !== null;
                const shouldGrayOut = isAnyHovered && !isHovered;
                
                return (
                  <div
                    key={task.id}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredTask({
                        task,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredTask(null)}
                    onClick={() => {
                      onTaskClick(task);
                      setHoveredTask(null);
                    }}
                    className={`text-xs px-2 py-1 cursor-pointer transition-all truncate ${
                      shouldGrayOut 
                        ? 'bg-gray-300 text-gray-500' 
                        : `${taskColor} text-white`
                    } ${
                      isStart ? 'rounded-l-md' : ''
                    } ${
                      isEnd ? 'rounded-r-md' : ''
                    }`}
                    style={{
                      marginTop: position > 0 ? '2px' : '0',
                    }}
                    title={task.title}
                  >
                    {isStart ? task.title : ''}
                  </div>
                );
              })}
            </div>
            
            {hiddenTasksCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDayExpansion(day);
                }}
                className="absolute bottom-1 right-2 text-xs text-gray-600 font-semibold bg-white/90 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded border border-gray-300 hover:border-blue-400 transition-all cursor-pointer"
                title={`${hiddenTasksCount} weitere Aufgabe${hiddenTasksCount > 1 ? 'n' : ''} anzeigen`}
              >
                +{hiddenTasksCount}
              </button>
            )}
          </div>
        );
      }
    } else {
      // Month view
      // Add empty cells for days before the month starts
      const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Convert Sunday=0 to Monday=0
      for (let i = 0; i < adjustedStartDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-gray-50/50 border border-gray-200/50 min-h-32"></div>
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayOfWeek = new Date(year, month, day).getDay();
      const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6; // Sunday or Saturday
      
      // Skip weekends if showWeekends is false
      if (!showWeekends && isWeekend) {
        continue;
      }
      
      const dayTasks = getTasksForDay(day);
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === month && 
                     new Date().getFullYear() === year;
      const isExpanded = expandedDays.has(day);
      const maxVisibleTasks = isExpanded ? dayTasks.length : 3;
      const visibleTasks = dayTasks.slice(0, maxVisibleTasks);
      const hiddenTasksCount = dayTasks.length - maxVisibleTasks;
      
      days.push(
        <div
          key={day}
          className={`bg-white border border-gray-200/50 min-h-32 p-2 overflow-hidden relative ${
            isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
          }`}
        >
          <div className={`text-sm font-semibold mb-2 ${
            isToday ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
          
          <div className="space-y-1">
            {visibleTasks.map((task) => {
              const position = getTaskPosition(task, dayTasks);
              const isStart = isTaskStart(task, day);
              const isEnd = isTaskEnd(task, day);
              const taskColor = getTaskColor(task.id);
              const isHovered = hoveredTask?.task.id === task.id;
              const isAnyHovered = hoveredTask !== null;
              const shouldGrayOut = isAnyHovered && !isHovered;
              
              return (
                <div
                  key={task.id}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredTask({
                      task,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredTask(null)}
                  onClick={() => {
                    onTaskClick(task);
                    setHoveredTask(null);
                  }}
                  className={`text-xs px-2 py-1 cursor-pointer transition-all truncate ${
                    shouldGrayOut 
                      ? 'bg-gray-300 text-gray-500' 
                      : `${taskColor} text-white`
                  } ${
                    isStart ? 'rounded-l-md' : ''
                  } ${
                    isEnd ? 'rounded-r-md' : ''
                  }`}
                  style={{
                    marginTop: position > 0 ? '2px' : '0',
                  }}
                  title={task.title}
                >
                  {isStart ? task.title : ''}
                </div>
              );
            })}
          </div>
          
          {hiddenTasksCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDayExpansion(day);
              }}
              className="absolute bottom-1 right-2 text-xs text-gray-600 font-semibold bg-white/90 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded border border-gray-300 hover:border-blue-400 transition-all cursor-pointer"
              title={`${hiddenTasksCount} weitere Aufgabe${hiddenTasksCount > 1 ? 'n' : ''} anzeigen`}
            >
              +{hiddenTasksCount}
            </button>
          )}
        </div>
      );
    }
    }
    
    return days;
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Calendar Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-4 mb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {viewMode === 'month' ? `${monthNames[month]} ${year}` : `Woche ${getWeekData().monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
              </h2>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors"
              >
                Heute
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* Settings Dropdown */}
              <div className="relative z-[10000]" ref={settingsRef}>
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Einstellungen"
                >
                  <Settings size={20} className="text-gray-600" />
                </button>
                
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Kalendereinstellungen</span>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Ansicht</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setViewMode('month');
                            setCurrentDate(new Date(year, month, 1));
                          }}
                          className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            viewMode === 'month'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Monat
                        </button>
                        <button
                          onClick={() => setViewMode('week')}
                          className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            viewMode === 'week'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Woche
                        </button>
                      </div>
                    </div>
                    
                    {/* Weekend Toggle */}
                    <div className="px-4 py-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Wochenende anzeigen</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={showWeekends}
                            onChange={(e) => setShowWeekends(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                            showWeekends ? 'bg-blue-500' : 'bg-gray-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              showWeekends ? 'translate-x-6' : 'translate-x-0.5'
                            }`}></div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'month' ? 'Vorheriger Monat' : 'Vorherige Woche'}
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'month' ? 'Nächster Monat' : 'Nächste Woche'}
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          {/* Day names header */}
          <div className={`grid ${viewMode === 'week' ? (showWeekends ? 'grid-cols-7' : 'grid-cols-5') : (showWeekends ? 'grid-cols-7' : 'grid-cols-5')} bg-gray-50/80 border-b border-gray-200/50`}>
            {activeDayNames.map((dayName) => (
              <div
                key={dayName}
                className="py-3 text-center font-semibold text-gray-600 text-sm"
              >
                {dayName}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className={`grid ${viewMode === 'week' ? (showWeekends ? 'grid-cols-7' : 'grid-cols-5') : (showWeekends ? 'grid-cols-7' : 'grid-cols-5')} auto-rows-fr`}>
            {renderCalendarDays()}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Sichtbare Aufgaben</h3>
          <div className="flex flex-wrap gap-3">
            {getVisibleTasks().map((task) => (
              <div 
                key={task.id} 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                onClick={() => onTaskClick(task)}
              >
                <div className={`w-4 h-4 rounded ${getTaskColor(task.id)}`}></div>
                <span className="text-sm text-gray-700 font-medium">{task.title}</span>
              </div>
            ))}
            {getVisibleTasks().length === 0 && (
              <span className="text-sm text-gray-500 italic">Keine Aufgaben in diesem Monat</span>
            )}
          </div>
        </div>

        {/* Task Hover Popup */}
        {hoveredTask && (
          <div
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-80 pointer-events-none"
            style={{
              left: `${hoveredTask.x}px`,
              top: `${hoveredTask.y - 10}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {/* Color indicator bar at top */}
            <div className={`h-2 ${getTaskColor(hoveredTask.task.id)}`}></div>
            
            <div className="p-4 space-y-3">
              {/* Title with color dot */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getTaskColor(hoveredTask.task.id)}`}></div>
                <h3 className="font-bold text-gray-900 text-base flex-1">{hoveredTask.task.title}</h3>
              </div>
              
              {/* Description Preview */}
              {hoveredTask.task.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {hoveredTask.task.description}
                </p>
              )}
              
              {/* Date Range */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} />
                <span>
                  {new Date(hoveredTask.task.startDate).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                  {' - '}
                  {new Date(hoveredTask.task.endDate).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {/* Tags */}
              {hoveredTask.task.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <TagIcon size={14} className="text-gray-400" />
                  {hoveredTask.task.tags.map((tagLabel) => {
                    const tag = globalTags[tagLabel];
                    if (!tag) return null;
                    const colors = TAG_COLORS[tag.color];
                    return (
                      <span
                        key={tagLabel}
                        className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
                      >
                        {tagLabel}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
