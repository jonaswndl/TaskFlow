import React, { useState } from 'react';
import { Plus, Mail, User, Trash2, Edit2, X, Check } from 'lucide-react';
import type { TeamMember } from '../types';

interface TeamMembersProps {
  members: TeamMember[];
  onAddMember: (member: { name: string; email: string }) => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateMember: (memberId: string, updates: { name?: string; email?: string }) => void;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({
  members,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const handleAddMember = () => {
    if (newMemberName.trim() && newMemberEmail.trim()) {
      onAddMember({
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
      });
      setNewMemberName('');
      setNewMemberEmail('');
      setIsAddingMember(false);
    }
  };

  const handleStartEdit = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setEditName(member.name);
    setEditEmail(member.email);
  };

  const handleSaveEdit = (memberId: string) => {
    if (editName.trim() && editEmail.trim()) {
      onUpdateMember(memberId, {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      setEditingMemberId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditName('');
    setEditEmail('');
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team-Mitglieder</h2>
          <p className="text-gray-600 mt-1">Verwalten Sie die Mitglieder Ihres Teams</p>
        </div>
        <button
          onClick={() => setIsAddingMember(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Mitglied hinzufügen
        </button>
      </div>

      {/* Add Member Form */}
      {isAddingMember && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3">Neues Mitglied hinzufügen</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddMember();
                    } else if (e.key === 'Escape') {
                      setIsAddingMember(false);
                      setNewMemberName('');
                      setNewMemberEmail('');
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="z.B. max@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddMember();
                    } else if (e.key === 'Escape') {
                      setIsAddingMember(false);
                      setNewMemberName('');
                      setNewMemberEmail('');
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsAddingMember(false);
                  setNewMemberName('');
                  setNewMemberEmail('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <User size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">Keine Mitglieder vorhanden</p>
            <p className="text-gray-500 text-sm mt-1">Fügen Sie Ihr erstes Team-Mitglied hinzu</p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {editingMemberId === member.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(member.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(member.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={16} />
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleSaveEdit(member.id)}
                      disabled={!editName.trim() || !editEmail.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Check size={16} />
                      Speichern
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{member.name}</h3>
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Mail size={14} />
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 ml-13">
                      Beigetreten am {new Date(member.joinedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(member)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Möchten Sie ${member.name} wirklich aus dem Team entfernen?`)) {
                          onRemoveMember(member.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Entfernen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
