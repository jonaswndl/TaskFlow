import { useState, useEffect } from 'react';
import type { Board as BoardType, BoardMetadata, Team, TeamMetadata } from './types';
import { Board } from './components/Board';
import { 
  getInitialBoard, 
  saveBoard, 
  loadBoardsList, 
  createNewBoard, 
  deleteBoard as deleteBoardFromStorage, 
  renameBoard as renameBoardInStorage, 
  setActiveBoard, 
  loadBoard,
  loadTeamsList,
  createNewTeam,
  deleteTeam as deleteTeamFromStorage,
  renameTeam as renameTeamInStorage,
  setActiveTeam,
  loadTeam,
  saveTeam,
  getActiveTeam,
} from './utils/storage';
import { DeleteBoardModal } from './components/DeleteBoardModal';
import './index.css';

function App() {
  const [board, setBoard] = useState<BoardType>(getInitialBoard());
  const [boards, setBoards] = useState<BoardMetadata[]>(loadBoardsList());
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamMetadata[]>(loadTeamsList());
  const [activeTeam, setActiveTeamState] = useState<Team | null>(getActiveTeam());
  const [activeView, setActiveView] = useState<'board' | 'team'>('board');

  useEffect(() => {
    saveBoard(board);
    // Refresh boards list to keep it in sync
    setBoards(loadBoardsList());
  }, [board]);

  const handleBoardSelect = (boardId: string) => {
    const selectedBoard = loadBoard(boardId);
    if (selectedBoard) {
      setBoard(selectedBoard);
      setActiveBoard(boardId);
      setActiveView('board');
    }
  };

  const handleCreateBoard = () => {
    const newBoard = createNewBoard('Neues Board');
    setBoard(newBoard);
    setActiveBoard(newBoard.id);
    setBoards(loadBoardsList());
  };

  const handleDeleteBoardRequest = (boardId: string) => {
    // Don't allow deleting the last board
    if (boards.length <= 1) {
      alert('Sie können nicht das letzte Board löschen.');
      return;
    }
    
    setDeletingBoardId(boardId);
  };

  const handleDeleteBoardConfirm = () => {
    if (!deletingBoardId) return;

    deleteBoardFromStorage(deletingBoardId);
    
    // If we deleted the active board, switch to another one
    if (deletingBoardId === board.id) {
      const remainingBoards = loadBoardsList();
      if (remainingBoards.length > 0) {
        handleBoardSelect(remainingBoards[0].id);
      }
    }
    
    setBoards(loadBoardsList());
    setDeletingBoardId(null);
  };

  const handleDeleteBoardCancel = () => {
    setDeletingBoardId(null);
  };

  const handleRenameBoard = (boardId: string, newTitle: string) => {
    renameBoardInStorage(boardId, newTitle);
    
    // If renaming the active board, update the current board state
    if (boardId === board.id) {
      setBoard({ ...board, title: newTitle });
    }
    
    setBoards(loadBoardsList());
  };

  // Team handlers
  const handleTeamSelect = (teamId: string) => {
    const selectedTeam = loadTeam(teamId);
    if (selectedTeam) {
      setActiveTeamState(selectedTeam);
      setActiveTeam(teamId);
      setActiveView('team');
    }
  };

  const handleCreateTeam = () => {
    const newTeam = createNewTeam('Neues Team');
    setActiveTeamState(newTeam);
    setActiveTeam(newTeam.id);
    setTeams(loadTeamsList());
    setActiveView('team');
  };

  const handleDeleteTeamRequest = (teamId: string) => {
    if (confirm('Möchten Sie dieses Team wirklich löschen?')) {
      deleteTeamFromStorage(teamId);
      
      // If we deleted the active team, switch back to board view
      if (activeTeam && teamId === activeTeam.id) {
        setActiveTeamState(null);
        setActiveView('board');
      }
      
      setTeams(loadTeamsList());
    }
  };

  const handleRenameTeam = (teamId: string, newTitle: string) => {
    renameTeamInStorage(teamId, newTitle);
    
    // If renaming the active team, update the current team state
    if (activeTeam && teamId === activeTeam.id) {
      setActiveTeamState({ ...activeTeam, title: newTitle });
    }
    
    setTeams(loadTeamsList());
  };

  const handleTeamUpdate = (updatedTeam: Team) => {
    saveTeam(updatedTeam);
    setActiveTeamState(updatedTeam);
  };

  const handleDeleteActiveTeam = () => {
    if (activeTeam) {
      handleDeleteTeamRequest(activeTeam.id);
    }
  };

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
