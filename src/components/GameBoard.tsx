// src/components/GameBoard.tsx
import React from 'react';
import { GameState } from 'multimcts';

interface GameBoardProps {
  renderBoard: (state: GameState, onMove: (move: string) => void) => React.ReactNode;
  gameState: GameState;
  onMove: (move: string) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ renderBoard, gameState, onMove }) => {
  return (
    <div className="game-board">
      {renderBoard(gameState, onMove)}
    </div>
  );
};

export default GameBoard;
