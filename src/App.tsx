import { useState, useEffect } from 'react';
import type { Board as BoardType, BoardMetadata, Team, TeamMetadata } from './types';
import { Board } from './components/Board';
import { Auth } from './components/Auth';
import { supabase } from './utils/supabase';

// Toggle between localStorage and Supabase
const USE_SUPABASE = true; // Set to false to use localStorage

import * as storageLocal from './utils/storage';
import * as storageSupabase from './utils/storageSupabase';

const storage = USE_SUPABASE ? storageSupabase : storageLocal;

import { DeleteBoardModal } from './components/DeleteBoardModal';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [boards, setBoards] = useState<BoardMetadata[]>([]);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamMetadata[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [activeView, setActiveView] = useState<'board' | 'team'>('board');

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (USE_SUPABASE) {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } else {
        // Skip auth for localStorage mode
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Load initial data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        console.log('Starting to load initial data...');
        
        // Clear old localStorage IDs that might conflict
        const oldActiveBoard = localStorage.getItem('taskflow_active_board');
        if (oldActiveBoard && (oldActiveBoard.startsWith('board-') || oldActiveBoard === 'board-1')) {
          console.log('Clearing old localStorage board ID:', oldActiveBoard);
          localStorage.removeItem('taskflow_active_board');
        }
        
        const oldActiveTeam = localStorage.getItem('taskflow_active_team');
        if (oldActiveTeam && oldActiveTeam.startsWith('team-')) {
          console.log('Clearing old localStorage team ID:', oldActiveTeam);
          localStorage.removeItem('taskflow_active_team');
        }
        
        const [initialBoard, boardsList, teamsList, activeTeam] = await Promise.all([
          storage.getInitialBoard(),
          storage.loadBoardsList(),
          storage.loadTeamsList(),
          storage.getActiveTeam(),
        ]);

        setBoard(initialBoard);
        setBoards(boardsList);
        setTeams(teamsList);
        setActiveTeamState(activeTeam);
        console.log('Initial data loaded successfully');
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated]);

  // Save board whenever it changes
  useEffect(() => {
    if (!board || !isAuthenticated) return;

    const saveBoardAsync = async () => {
      try {
        await storage.saveBoard(board);
        const updatedBoards = await storage.loadBoardsList();
        setBoards(updatedBoards);
      } catch (error) {
        console.error('Error saving board:', error);
      }
    };

    saveBoardAsync();
  }, [board, isAuthenticated]);

  const handleBoardSelect = async (boardId: string) => {
    try {
      const selectedBoard = await storage.loadBoard(boardId);
      if (selectedBoard) {
        setBoard(selectedBoard);
        storage.setActiveBoard(boardId);
        setActiveView('board');
      }
    } catch (error) {
      console.error('Error selecting board:', error);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const newBoard = await storage.createNewBoard('Neues Board');
      setBoard(newBoard);
      storage.setActiveBoard(newBoard.id);
      const updatedBoards = await storage.loadBoardsList();
      setBoards(updatedBoards);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const handleDeleteBoardRequest = (boardId: string) => {
    // Don't allow deleting the last board
    if (boards.length <= 1) {
      alert('Sie können nicht das letzte Board löschen.');
      return;
    }
    
    setDeletingBoardId(boardId);
  };

  const handleDeleteBoardConfirm = async () => {
    if (!deletingBoardId) return;

    try {
      await storage.deleteBoard(deletingBoardId);
      
      // If we deleted the active board, switch to another one
      if (board && deletingBoardId === board.id) {
        const remainingBoards = await storage.loadBoardsList();
        if (remainingBoards.length > 0) {
          await handleBoardSelect(remainingBoards[0].id);
        }
      }
      
      const updatedBoards = await storage.loadBoardsList();
      setBoards(updatedBoards);
      setDeletingBoardId(null);
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleDeleteBoardCancel = () => {
    setDeletingBoardId(null);
  };

  const handleRenameBoard = async (boardId: string, newTitle: string) => {
    try {
      await storage.renameBoard(boardId, newTitle);
      
      // If renaming the active board, update the current board state
      if (board && boardId === board.id) {
        setBoard({ ...board, title: newTitle });
      }
      
      const updatedBoards = await storage.loadBoardsList();
      setBoards(updatedBoards);
    } catch (error) {
      console.error('Error renaming board:', error);
    }
  };

  // Team handlers
  const handleTeamSelect = async (teamId: string) => {
    try {
      const selectedTeam = await storage.loadTeam(teamId);
      if (selectedTeam) {
        setActiveTeamState(selectedTeam);
        storage.setActiveTeam(teamId);
        setActiveView('team');
      }
    } catch (error) {
      console.error('Error selecting team:', error);
    }
  };

  const handleCreateTeam = async () => {
    try {
      const newTeam = await storage.createNewTeam('Neues Team');
      setActiveTeamState(newTeam);
      storage.setActiveTeam(newTeam.id);
      const updatedTeams = await storage.loadTeamsList();
      setTeams(updatedTeams);
      setActiveView('team');
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleDeleteTeamRequest = async (teamId: string) => {
    if (confirm('Möchten Sie dieses Team wirklich löschen?')) {
      try {
        await storage.deleteTeam(teamId);
        
        // If we deleted the active team, switch back to board view
        if (activeTeam && teamId === activeTeam.id) {
          setActiveTeamState(null);
          setActiveView('board');
        }
        
        const updatedTeams = await storage.loadTeamsList();
        setTeams(updatedTeams);
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  const handleRenameTeam = async (teamId: string, newTitle: string) => {
    try {
      await storage.renameTeam(teamId, newTitle);
      
      // If renaming the active team, update the current team state
      if (activeTeam && teamId === activeTeam.id) {
        setActiveTeamState({ ...activeTeam, title: newTitle });
      }
      
      const updatedTeams = await storage.loadTeamsList();
      setTeams(updatedTeams);
    } catch (error) {
      console.error('Error renaming team:', error);
    }
  };

  const handleTeamUpdate = async (updatedTeam: Team) => {
    try {
      await storage.saveTeam(updatedTeam);
      setActiveTeamState(updatedTeam);
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteActiveTeam = () => {
    if (activeTeam) {
      handleDeleteTeamRequest(activeTeam.id);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    if (USE_SUPABASE) {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setBoard(null);
      setBoards([]);
      setTeams([]);
      setActiveTeamState(null);
    }
  };

  // Show auth screen if using Supabase and not authenticated
  if (USE_SUPABASE && !isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  // Show loading screen
  if (isLoading || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade TaskFlow...</p>
        </div>
      </div>
    );
  }

  const deletingBoard = boards.find(b => b.id === deletingBoardId);

  return (
    <>
      <Board 
        board={board} 
        onBoardUpdate={setBoard}
        boards={boards}
        onBoardSelect={handleBoardSelect}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoardRequest}
        onRenameBoard={handleRenameBoard}
        teams={teams}
        activeTeam={activeTeam}
        activeView={activeView}
        onTeamSelect={handleTeamSelect}
        onCreateTeam={handleCreateTeam}
        onDeleteTeam={handleDeleteTeamRequest}
        onRenameTeam={handleRenameTeam}
        onTeamUpdate={handleTeamUpdate}
        onDeleteActiveTeam={handleDeleteActiveTeam}
        onSignOut={USE_SUPABASE ? handleSignOut : undefined}
      />
      
      <DeleteBoardModal
        isOpen={deletingBoardId !== null}
        boardTitle={deletingBoard?.title || ''}
        onConfirm={handleDeleteBoardConfirm}
        onCancel={handleDeleteBoardCancel}
      />
    </>
  );
}

export default App;
