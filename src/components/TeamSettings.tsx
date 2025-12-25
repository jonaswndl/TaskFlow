import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import type { Team } from '../types';

interface TeamSettingsProps {
  team: Team;
  onRenameTeam: (newTitle: string) => void;
  onDeleteTeam: () => void;
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({
  team,
  onRenameTeam,
  onDeleteTeam,
}) => {
  const [teamTitle, setTeamTitle] = useState(team.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveTitle = () => {
    if (teamTitle.trim() && teamTitle !== team.title) {
      onRenameTeam(teamTitle.trim());
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDeleteTeam();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Team-Einstellungen</h2>

      <div className="space-y-6">
        {/* Team Name Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team-Name</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name des Teams
              </label>
              <input
                type="text"
                value={teamTitle}
                onChange={(e) => setTeamTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle();
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setTeamTitle(team.title);
                    e.currentTarget.blur();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-sm text-gray-600">
              Änderungen werden automatisch gespeichert.
            </p>
          </div>
        </div>

        {/* Delete Team Section */}
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Gefahrenzone
          </h3>
          
          {!showDeleteConfirm ? (
            <div>
              <p className="text-gray-700 mb-4">
                Wenn Sie dieses Team löschen, werden alle zugehörigen Daten unwiderruflich entfernt.
              </p>
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} />
                Team löschen
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-3">
                Sind Sie sicher, dass Sie dieses Team löschen möchten?
              </p>
              <p className="text-red-700 mb-4 text-sm">
                Diese Aktion kann nicht rückgängig gemacht werden. Alle Mitglieder und Daten werden dauerhaft gelöscht.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  <Trash2 size={18} />
                  Ja, Team löschen
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Team Info Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team-Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Team-ID:</span>
              <span className="font-mono text-gray-800">{team.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Anzahl Mitglieder:</span>
              <span className="font-semibold text-gray-800">{team.members.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
