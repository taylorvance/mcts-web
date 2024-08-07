// src/types/Game.ts
import { GameState } from 'multimcts';

export interface Game {
  name: string;
  createInitialState: () => GameState;
  renderBoard: (state: GameState, onMove: (move: string) => void) => React.ReactNode;
}
