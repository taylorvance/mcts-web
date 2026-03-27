// src/components/GameBoard.tsx
import React from 'react';
import { AppGameState, GameBoardProps as GameRendererProps } from '../types/Game';

interface GameBoardContainerProps {
  Board: React.ComponentType<GameRendererProps>;
  gameState: AppGameState;
  onMove: (move: unknown) => void;
}

const GameBoard: React.FC<GameBoardContainerProps> = ({ Board, gameState, onMove }) => {
  return (
    <div className="game-board">
      <Board state={gameState} onMove={onMove} />
    </div>
  );
};

export default GameBoard;
