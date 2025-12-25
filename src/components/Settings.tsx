import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, X, Check, Tag as TagIcon, AlertTriangle, Users, ChevronDown } from 'lucide-react';
import type { Board, Tag, TeamMetadata } from '../types';
import { TAG_COLORS } from '../utils/tagColors';

interface SettingsProps {
  board: Board;
  onBoardRename: (newTitle: string) => void;
  onBoardDelete: () => void;
  onTagDelete: (tagLabel: string) => void;
  isLastBoard: boolean;
  teams?: TeamMetadata[];
  onBoardUpdate?: (board: Board) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  board,
  onBoardRename,
  onBoardDelete,
  onTagDelete,
  isLastBoard,
  teams = [],
  onBoardUpdate,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(board.title);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(board.teamIds || []);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setIsTeamDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== board.title) {
      onBoardRename(editedTitle.trim());
    } else {
      setEditedTitle(board.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(board.title);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Get tag usage count
  const getTagUsageCount = (tagLabel: string): number => {
    return Object.values(board.tasks).filter((task) =>
      task.tags.includes(tagLabel)
    ).length;
  };

  // Get all used tags sorted by usage count
  const getUsedTags = (): Array<{ tag: Tag; label: string; count: number }> => {
    return Object.entries(board.globalTags)
      .map(([label, tag]) => ({
        tag,
        label,
        count: getTagUsageCount(label),
      }))
      .sort((a, b) => b.count - a.count);
  };

  const handleDeleteTag = (tagLabel: string) => {
    const count = getTagUsageCount(tagLabel);
    if (count > 0) {
      const confirmed = window.confirm(
        `Dieser Tag wird in ${count} Aufgabe(n) verwendet. Möchten Sie ihn wirklich löschen? Er wird aus allen Aufgaben entfernt.`
      );
      if (!confirmed) return;
    }
    onTagDelete(tagLabel);
    setDeletingTag(null);
  };

  const handleTeamToggle = (teamId: string) => {
    const newTeamIds = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter(id => id !== teamId)
      : [...selectedTeamIds, teamId];
    
    setSelectedTeamIds(newTeamIds);
    
    // Update board with new team assignments
    if (onBoardUpdate) {
      const updatedBoard = { ...board, teamIds: newTeamIds };
      onBoardUpdate(updatedBoard);
    }
  };

  const usedTags = getUsedTags();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Board Settings Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Board-Einstellungen</h2>
          
          {/* Board Title */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Board-Name
              </label>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleTitleSave}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    title="Speichern"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={handleTitleCancel}
                    className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Abbrechen"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 px-4 py-2 bg-gray-50 rounded-lg text-gray-800 font-medium">
                    {board.title}
                  </span>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    title="Umbenennen"
                  >
                    <Edit2 size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Delete Board */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gefahrenzone
              </label>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Board löschen</h3>
                    <p className="text-sm text-red-700">
                      {isLastBoard 
                        ? 'Sie können nicht das letzte Board löschen.'
                        : 'Löscht dieses Board permanent. Diese Aktion kann nicht rückgängig gemacht werden.'}
                    </p>
                  </div>
                  <button
                    onClick={onBoardDelete}
                    disabled={isLastBoard}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isLastBoard
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <Trash2 size={18} />
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Assignment Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Team-Zuweisungen</h2>
            <div className="text-sm text-gray-600">
              {selectedTeamIds.length} {selectedTeamIds.length === 1 ? 'Team' : 'Teams'} zugewiesen
            </div>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Noch keine Teams erstellt</p>
              <p className="text-sm text-gray-400 mt-1">
                Erstellen Sie Teams im Team-Bereich, um sie diesem Board zuzuweisen
              </p>
            </div>
          ) : (
            <div className="relative" ref={teamDropdownRef}>
              {/* Dropdown Button */}
              <button
                onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-gray-600" />
                  <span className="font-medium text-gray-800">
                    {selectedTeamIds.length === 0
                      ? 'Teams auswählen...'
                      : `${selectedTeamIds.length} ${selectedTeamIds.length === 1 ? 'Team' : 'Teams'} ausgewählt`}
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-600 transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Content */}
              {isTeamDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {teams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    return (
                      <div
                        key={team.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTeamToggle(team.id);
                        }}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                          {team.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Users size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Team-Zuweisungen</p>
                <p className="text-blue-800">
                  Weisen Sie diesem Board Teams zu, um deren Mitglieder in den Aufgaben zuweisen zu können.
                  Sie können mehrere Teams gleichzeitig zuweisen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Management Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Tag-Verwaltung</h2>
            <div className="text-sm text-gray-600">
              {usedTags.length} {usedTags.length === 1 ? 'Tag' : 'Tags'} gesamt
            </div>
          </div>

          {usedTags.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Noch keine Tags in diesem Board erstellt</p>
              <p className="text-sm text-gray-400 mt-1">
                Tags werden automatisch erstellt, wenn Sie sie zu Aufgaben hinzufügen
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {usedTags.map(({ tag, label, count }) => {
                const colors = TAG_COLORS[tag.color];
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`px-4 py-2 rounded-full ${colors.bg} ${colors.text} border ${colors.border} font-medium`}
                      >
                        {label}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TagIcon size={16} />
                        <span>
                          {count} {count === 1 ? 'Verwendung' : 'Verwendungen'}
                        </span>
                      </div>
                    </div>

                    {deletingTag === label ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <AlertTriangle size={16} />
                          Wirklich löschen?
                        </span>
                        <button
                          onClick={() => handleDeleteTag(label)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Ja, löschen
                        </button>
                        <button
                          onClick={() => setDeletingTag(null)}
                          className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingTag(label)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Tag löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <TagIcon size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Hinweis zur Tag-Verwaltung</p>
                <p className="text-blue-800">
                  Wenn Sie einen Tag löschen, wird er automatisch aus allen Aufgaben entfernt, 
                  die ihn verwenden. Die Anzahl der Verwendungen hilft Ihnen zu entscheiden, 
                  ob ein Tag noch benötigt wird.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
