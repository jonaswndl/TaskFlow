import { useState, useEffect } from 'react';
import type { Board as BoardType } from './types';
import { Board } from './components/Board';
import { getInitialBoard, saveBoard } from './utils/storage';
import './index.css';

function App() {
  const [board, setBoard] = useState<BoardType>(getInitialBoard());

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  return <Board board={board} onBoardUpdate={setBoard} />;
}

export default App;
