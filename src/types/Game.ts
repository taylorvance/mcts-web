// src/types/Game.ts
import { GameState } from 'multimcts';

export interface GameBoardProps {
  state: GameState;
  onMove: (move: string) => void;
}

export interface Game {
  name: string;
  createInitialState: () => GameState;
  Board: React.ComponentType<GameBoardProps>;
}
