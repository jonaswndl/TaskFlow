import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, Column, Tag } from '../types';
import { TagInput } from './TagInput';

interface TaskDetailProps {
  task: Task;
  columns: Column[];
  globalTags: Record<string, Tag>;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onGlobalTagUpdate: (label: string, tag: Tag) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  columns,
  globalTags,
  onClose,
  onUpdate,
  onDelete,
  onGlobalTagUpdate,
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [startDate, setStartDate] = useState(task.startDate);
  const [endDate, setEndDate] = useState(task.endDate);
  const [columnId, setColumnId] = useState(task.columnId);
  const [tags, setTags] = useState<string[]>(task.tags || []);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setStartDate(task.startDate);
    setEndDate(task.endDate);
    setColumnId(task.columnId);
    setTags(task.tags || []);
    setColumnId(task.columnId);
  }, [task]);

  const handleSave = () => {
    onUpdate(task.id, {
      title,
      description,
      startDate,
      endDate,
      columnId,
      tags,
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

          {/* Beschreibung */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📋 Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 hover:bg-white transition-colors"
              rows={5}
              placeholder="Füge eine detaillierte Beschreibung hinzu..."
            />
          </div>

          {/* Zeitraum */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📅 Zeitraum
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Startdatum
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Enddatum
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <TagInput 
            tagLabels={tags} 
            globalTags={globalTags} 
            onTagsChange={setTags}
            onGlobalTagUpdate={onGlobalTagUpdate}
          />

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📋 Status
            </label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors font-medium"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
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
      </div>
    </>
  );
};
