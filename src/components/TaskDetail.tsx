import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import type { Task, Column, Tag, TeamMember } from '../types';
import { TagInput } from './TagInput';
import { formatDate } from '../utils/helpers';
import { TAG_COLORS } from '../utils/tagColors';

type TabType = 'details' | 'history';
type AccordionSection = 'description' | 'dates' | 'tags' | 'priority' | 'status' | 'assignees';

interface TaskDetailProps {
  task: Task;
  columns: Column[];
  globalTags: Record<string, Tag>;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onGlobalTagUpdate: (label: string, tag: Tag) => void;
  assignableMembers?: TeamMember[]; // Members from assigned teams
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  columns,
  globalTags,
  onClose,
  onUpdate,
  onDelete,
  onGlobalTagUpdate,
  assignableMembers = [],
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [startDate, setStartDate] = useState(task.startDate);
  const [endDate, setEndDate] = useState(task.endDate);
  const [columnId, setColumnId] = useState(task.columnId);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [priority, setPriority] = useState<'Hoch' | 'Mittel' | 'Gering' | ''>(task.priority || '');
  const [assignedMembers, setAssignedMembers] = useState<string[]>(task.assignedMembers || []);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  const membersDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [openSections, setOpenSections] = useState<Set<AccordionSection>>(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem('taskflow_accordion_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      } catch (e) {
        // If parsing fails, return default open state
        return new Set(['description', 'dates', 'tags', 'priority', 'status', 'assignees']);
      }
    }
    // Default: all sections open
    return new Set(['description', 'dates', 'tags', 'priority', 'status', 'assignees']);
  });

  const toggleSection = (section: AccordionSection) => {
    const newSections = new Set(openSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setOpenSections(newSections);
    
    // Save to localStorage
    localStorage.setItem('taskflow_accordion_state', JSON.stringify(Array.from(newSections)));
  };

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setStartDate(task.startDate);
    setEndDate(task.endDate);
    setColumnId(task.columnId);
    setTags(task.tags || []);
    setPriority(task.priority || '');
    setColumnId(task.columnId);
    setAssignedMembers(task.assignedMembers || []);
  }, [task]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (membersDropdownRef.current && !membersDropdownRef.current.contains(event.target as Node)) {
        setIsMembersDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position when it opens
  useEffect(() => {
    if (isMembersDropdownOpen && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isMembersDropdownOpen]);

  const handleSave = () => {
    onUpdate(task.id, {
      title,
      description,
      startDate,
      endDate,
      columnId,
      tags,
      priority: priority || undefined,
      assignedMembers,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Möchtest du diese Aufgabe wirklich löschen?')) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop - jetzt transparent/unsichtbar */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Offcanvas */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto rounded-l-3xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold text-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500 rounded-xl px-3 py-2 flex-1 bg-gray-50 hover:bg-gray-100 transition-colors"
              placeholder="Aufgaben-Titel"
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-4 p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="border-b border-gray-200 mb-6"></div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-semibold text-sm transition-all ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Aufgabendetails
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-semibold text-sm transition-all ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📜 Historie
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <div className="space-y-3">
              {/* Beschreibung Accordion */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => toggleSection('description')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">📋 Beschreibung</span>
                    {!openSections.has('description') && description && (
                      <span className="text-xs text-gray-400 truncate ml-2">
                        {description.substring(0, 50)}{description.length > 50 ? '...' : ''}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      openSections.has('description') ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.has('description') && (
                  <div className={`px-4 pb-4 ${isDescriptionExpanded ? 'absolute inset-0 bg-white z-50 rounded-3xl shadow-2xl flex flex-col p-6' : ''}`}>
                    {isDescriptionExpanded && (
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-gray-700">📋 Beschreibung</span>
                      </div>
                    )}
                    <div className={`relative ${isDescriptionExpanded ? 'flex-1 flex flex-col' : ''}`}>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 hover:bg-white transition-colors ${
                          isDescriptionExpanded ? 'flex-1 text-base pb-12' : 'pb-10'
                        }`}
                        rows={isDescriptionExpanded ? undefined : 3}
                        placeholder="Füge eine detaillierte Beschreibung hinzu..."
                      />
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="absolute bottom-3 right-3 text-xs text-gray-500 hover:text-gray-700 bg-white/90 hover:bg-white px-2 py-1 rounded-lg transition-colors shadow-sm"
                      >
                        {isDescriptionExpanded ? '↙ Reduzieren' : '↗ Erweitern'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Zeitraum Accordion */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => toggleSection('dates')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">📅 Zeitraum</span>
                    {!openSections.has('dates') && (startDate || endDate) && (
                      <span className="text-xs text-gray-400">
                        {startDate ? formatDate(startDate) : '---'} → {endDate ? formatDate(endDate) : '---'}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      openSections.has('dates') ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.has('dates') && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Startdatum</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Enddatum</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags Accordion */}
              <div className="border border-gray-200 rounded-xl bg-white">
                <button
                  onClick={() => toggleSection('tags')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">🏷️ Tags</span>
                    {!openSections.has('tags') && tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                        {tags.slice(0, 3).map((label) => {
                          const tag = globalTags[label];
                          if (!tag) return null;
                          const colors = TAG_COLORS[tag.color];
                          return (
                            <span
                              key={label}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text} flex-shrink-0`}
                            >
                              {tag.label}
                            </span>
                          );
                        })}
                        {tags.length > 3 && (
                          <span className="text-xs text-gray-400 flex-shrink-0">+{tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform flex-shrink-0 ${
                      openSections.has('tags') ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.has('tags') && (
                  <div className="px-4 pb-4">
                    <TagInput 
                      tagLabels={tags} 
                      globalTags={globalTags} 
                      onTagsChange={setTags}
                      onGlobalTagUpdate={onGlobalTagUpdate}
                      hideLabel={true}
                    />
                  </div>
                )}
              </div>

              {/* Priorität Accordion */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => toggleSection('priority')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">⚡ Priorität</span>
                    {!openSections.has('priority') && priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        priority === 'Hoch' ? 'bg-red-50 text-red-600' :
                        priority === 'Mittel' ? 'bg-yellow-50 text-yellow-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {priority}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      openSections.has('priority') ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.has('priority') && (
                  <div className="px-4 pb-4">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'Hoch' | 'Mittel' | 'Gering' | '')}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors font-medium"
                    >
                      <option value="">Keine Priorität</option>
                      <option value="Hoch">🔴 Hoch</option>
                      <option value="Mittel">🟡 Mittel</option>
                      <option value="Gering">🟢 Gering</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Status Accordion */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => toggleSection('status')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">📋 Status</span>
                    {!openSections.has('status') && (
                      <span className="text-xs text-gray-400">
                        {columns.find((col) => col.id === columnId)?.title}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      openSections.has('status') ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.has('status') && (
                  <div className="px-4 pb-4">
                    <select
                      value={columnId}
                      onChange={(e) => setColumnId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors font-medium"
                    >
                      {columns.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Assignees Accordion */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => toggleSection('assignees')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">👥 Zugewiesene Mitarbeiter</span>
                    {!openSections.has('assignees') && assignedMembers.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {assignedMembers.length} {assignedMembers.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      openSections.has('assignees') ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.has('assignees') && (
                  <div className="px-4 pb-4">
                    {assignableMembers.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <p className="text-sm">Keine Team-Mitglieder verfügbar</p>
                        <p className="text-xs mt-1">Weisen Sie dem Board zuerst Teams in den Einstellungen zu</p>
                      </div>
                    ) : (
                      <div ref={membersDropdownRef}>
                        {/* Dropdown Button */}
                        <button
                          ref={dropdownButtonRef}
                          onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              {assignedMembers.length === 0
                                ? 'Mitarbeiter auswählen...'
                                : `${assignedMembers.length} ${assignedMembers.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} ausgewählt`}
                            </span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`text-gray-600 transition-transform ${isMembersDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Dropdown Content - Portal to body */}
                        {isMembersDropdownOpen && (
                          <div 
                            className="fixed z-[9999] bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                            style={{
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`,
                              width: `${dropdownPosition.width}px`,
                            }}
                          >
                            {assignableMembers.map((member) => {
                              const isAssigned = assignedMembers.includes(member.id);
                              return (
                                <div
                                  key={member.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isAssigned) {
                                      setAssignedMembers(assignedMembers.filter(id => id !== member.id));
                                    } else {
                                      setAssignedMembers([...assignedMembers, member.id]);
                                    }
                                  }}
                                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                                    isAssigned ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                      isAssigned
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-gray-300 bg-white'
                                    }`}
                                  >
                                    {isAssigned && <Check size={14} className="text-white" />}
                                  </div>
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                                      isAssigned
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-300 text-gray-700'
                                    }`}
                                  >
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isAssigned ? 'text-blue-900' : 'text-gray-800'}`}>
                                      {member.name}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  Speichern
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 font-semibold py-3 px-6 rounded-xl transition-all flex items-center hover:bg-red-50"
                >
                  <span className="mr-2">Löschen</span>
                  <span>🗑️</span>
                </button>
              </div>
            </div>
          ) : (
            // History Tab
            <div className="space-y-3">
              {task.activityLog && task.activityLog.length > 0 ? (
                [...task.activityLog].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {entry.action === 'created' && '✨'}
                        {entry.action === 'title_changed' && '📝'}
                        {entry.action === 'description_changed' && '📄'}
                        {entry.action === 'dates_changed' && '📅'}
                        {entry.action === 'column_changed' && '↔️'}
                        {entry.action === 'tags_changed' && '🏷️'}
                        {entry.action === 'priority_changed' && '⚡'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium mb-1">
                          {entry.details}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-2">📜</p>
                  <p className="text-sm">Noch keine Änderungen protokolliert</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
