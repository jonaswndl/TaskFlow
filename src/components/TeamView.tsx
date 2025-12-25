import React, { useState } from 'react';
import { Users, Settings as SettingsIcon, Edit2, Menu } from 'lucide-react';
import type { Team } from '../types';
import { TeamMembers } from './TeamMembers';
import { TeamSettings } from './TeamSettings';

interface TeamViewProps {
  team: Team;
  onTeamUpdate: (team: Team) => void;
  onRenameTeam: (newTitle: string) => void;
  onDeleteTeam: () => void;
  onOpenSidebar: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  team,
  onTeamUpdate,
  onRenameTeam,
  onDeleteTeam,
  onOpenSidebar,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(team.title);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditTitle(team.title);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== team.title) {
      onRenameTeam(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(team.title);
    setIsEditingTitle(false);
  };

  const handleAddMember = (member: { name: string; email: string }) => {
    const updatedTeam = { ...team };
    const newMember = {
      ...member,
      id: `member-${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };
    updatedTeam.members = [...updatedTeam.members, newMember];
    onTeamUpdate(updatedTeam);
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedTeam = { ...team };
    updatedTeam.members = updatedTeam.members.filter(m => m.id !== memberId);
    onTeamUpdate(updatedTeam);
  };

  const handleUpdateMember = (memberId: string, updates: { name?: string; email?: string }) => {
    const updatedTeam = { ...team };
    const member = updatedTeam.members.find(m => m.id === memberId);
    if (member) {
      Object.assign(member, updates);
      onTeamUpdate(updatedTeam);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSidebar}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu size={24} className="text-gray-600" />
            </button>

            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleSave();
                  } else if (e.key === 'Escape') {
                    handleTitleCancel();
                  }
                }}
                autoFocus
                className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none px-2"
              />
            ) : (
              <button
                onClick={handleTitleClick}
                className="group flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              >
                <h1 className="text-2xl font-bold text-gray-800">{team.title}</h1>
                <Edit2 size={18} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} />
            <span>{team.members.length} Mitglied{team.members.length !== 1 ? 'er' : ''}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Users size={18} />
            Mitglieder
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <SettingsIcon size={18} />
            Einstellungen
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'members' && (
          <TeamMembers
            members={team.members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onUpdateMember={handleUpdateMember}
          />
        )}
        {activeTab === 'settings' && (
          <TeamSettings
            team={team}
            onRenameTeam={onRenameTeam}
            onDeleteTeam={onDeleteTeam}
          />
        )}
      </main>
    </div>
  );
};
