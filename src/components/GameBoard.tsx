// src/components/GameBoard.tsx
import React from 'react';
import { GameState } from 'multimcts';

interface GameBoardProps {
  render: (state: GameState, onMove: (move: string) => void) => React.ReactNode;
  gameState: GameState;
  onMove: (move: string) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ render, gameState, onMove }) => {
  return (
    <div className="game-board">
      {render(gameState, onMove)}
    </div>
  );
};

export default GameBoard;
