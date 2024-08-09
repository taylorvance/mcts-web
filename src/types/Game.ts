// src/types/Game.ts
import { GameState } from 'multimcts';

export interface Game {
  name: string;
  createInitialState: () => GameState;
  render: (state: GameState, onMove: (move: string) => void) => React.ReactNode;
}
