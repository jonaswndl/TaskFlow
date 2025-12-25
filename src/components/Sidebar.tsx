import React, { useState } from 'react';
import { X, Home, Settings, LayoutDashboard, Plus, MoreVertical, ChevronDown, ChevronRight, Edit2, Trash2, Users } from 'lucide-react';
import type { BoardMetadata, TeamMetadata } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  boards: BoardMetadata[];
  activeBoardId: string;
  onBoardSelect: (boardId: string) => void;
  onCreateBoard: () => void;
  onDeleteBoard: (boardId: string) => void;
  onRenameBoard: (boardId: string, newTitle: string) => void;
  teams: TeamMetadata[];
  activeTeamId: string | null;
  onTeamSelect: (teamId: string) => void;
  onCreateTeam: () => void;
  onDeleteTeam: (teamId: string) => void;
  onRenameTeam: (teamId: string, newTitle: string) => void;
  activeView: 'board' | 'team';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  boards, 
  activeBoardId, 
  onBoardSelect,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
  teams,
  activeTeamId,
  onTeamSelect,
  onCreateTeam,
  onDeleteTeam,
  onRenameTeam,
  activeView,
}) => {
  const [isBoardsExpanded, setIsBoardsExpanded] = useState(true);
  const [isTeamsExpanded, setIsTeamsExpanded] = useState(true);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleRenameStart = (board: BoardMetadata) => {
    setEditingBoardId(board.id);
    setEditingTitle(board.title);
    setOpenMenuId(null);
  };

  const handleTeamRenameStart = (team: TeamMetadata) => {
    setEditingTeamId(team.id);
    setEditingTitle(team.title);
    setOpenMenuId(null);
  };

  const handleRenameSubmit = (boardId: string) => {
    if (editingTitle.trim()) {
      onRenameBoard(boardId, editingTitle.trim());
    }
    setEditingBoardId(null);
    setEditingTitle('');
  };

  const handleTeamRenameSubmit = (teamId: string) => {
    if (editingTitle.trim()) {
      onRenameTeam(teamId, editingTitle.trim());
    }
    setEditingTeamId(null);
    setEditingTitle('');
  };

  const handleRenameCancel = () => {
    setEditingBoardId(null);
    setEditingTeamId(null);
    setEditingTitle('');
  };

  const handleDeleteClick = (boardId: string) => {
    setOpenMenuId(null);
    onDeleteBoard(boardId);
  };

  const handleTeamDeleteClick = (teamId: string) => {
    setOpenMenuId(null);
    onDeleteTeam(teamId);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } rounded-r-3xl`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <button className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all hover:scale-[1.02]">
                  <Home size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium">Dashboard</span>
                </button>
              </li>

              {/* Boards Section */}
              <li>
                <button 
                  onClick={() => setIsBoardsExpanded(!isBoardsExpanded)}
                  className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all hover:scale-[1.02]"
                >
                  <LayoutDashboard size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium flex-1 text-left">Boards</span>
                  {isBoardsExpanded ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </button>

                {/* Boards List */}
                {isBoardsExpanded && (
                  <div className="mt-2 ml-4 space-y-1">
                    {/* New Board Button */}
                    <button
                      onClick={onCreateBoard}
                      className="w-full flex items-center px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-sm font-medium group"
                    >
                      <Plus size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                      <span>Neues Board hinzufügen</span>
                    </button>

                    {/* Board List Items */}
                    {boards.map((board) => (
                      <div
                        key={board.id}
                        className={`group relative flex items-center rounded-lg transition-all ${
                          board.id === activeBoardId && activeView === 'board'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {editingBoardId === board.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRenameSubmit(board.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameSubmit(board.id);
                              } else if (e.key === 'Escape') {
                                handleRenameCancel();
                              }
                            }}
                            autoFocus
                            className="flex-1 px-4 py-2.5 text-sm bg-white border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => onBoardSelect(board.id)}
                              className={`flex-1 text-left px-4 py-2.5 text-sm font-medium truncate ${
                                board.id === activeBoardId && activeView === 'board'
                                  ? ''
                                  : ''
                              }`}
                            >
                              {board.title}
                            </button>

                            {/* Three Dots Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === board.id ? null : board.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-lg transition-all"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {/* Dropdown Menu */}
                              {openMenuId === board.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                    <button
                                      onClick={() => handleRenameStart(board)}
                                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Edit2 size={16} className="mr-2 text-blue-600" />
                                      Umbenennen
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(board.id)}
                                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 size={16} className="mr-2" />
                                      Board löschen
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>

              {/* Teams Section */}
              <li>
                <button 
                  onClick={() => setIsTeamsExpanded(!isTeamsExpanded)}
                  className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all hover:scale-[1.02]"
                >
                  <Users size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium flex-1 text-left">Teams</span>
                  {isTeamsExpanded ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </button>

                {/* Teams List */}
                {isTeamsExpanded && (
                  <div className="mt-2 ml-4 space-y-1">
                    {/* New Team Button */}
                    <button
                      onClick={onCreateTeam}
                      className="w-full flex items-center px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-sm font-medium group"
                    >
                      <Plus size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                      <span>Neues Team hinzufügen</span>
                    </button>

                    {/* Team List Items */}
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className={`group relative flex items-center rounded-lg transition-all ${
                          team.id === activeTeamId && activeView === 'team'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {editingTeamId === team.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleTeamRenameSubmit(team.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleTeamRenameSubmit(team.id);
                              } else if (e.key === 'Escape') {
                                handleRenameCancel();
                              }
                            }}
                            autoFocus
                            className="flex-1 px-4 py-2.5 text-sm bg-white border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => onTeamSelect(team.id)}
                              className="flex-1 text-left px-4 py-2.5 text-sm font-medium truncate"
                            >
                              {team.title}
                            </button>

                            {/* Three Dots Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === team.id ? null : team.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-lg transition-all"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {/* Dropdown Menu */}
                              {openMenuId === team.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                    <button
                                      onClick={() => handleTeamRenameStart(team)}
                                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Edit2 size={16} className="mr-2 text-blue-600" />
                                      Umbenennen
                                    </button>
                                    <button
                                      onClick={() => handleTeamDeleteClick(team.id)}
                                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 size={16} className="mr-2" />
                                      Team löschen
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>

              <li>
                <button className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all hover:scale-[1.02]">
                  <Settings size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium">Einstellungen</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              TaskFlow v1.0 MVP
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
