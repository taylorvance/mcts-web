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

export interface TypedGameBoardProps<TState extends GameState, TMove> {
  state: TState;
  onMove: (move: TMove) => void;
}

export interface TypedGameDefinition<TState extends GameState, TMove> {
  id: string;
  name: string;
  createInitialState: () => TState;
  isState: (state: GameState) => state is TState;
  encodeMove: (move: TMove, state: TState) => string;
  decodeMove: (encodedMove: string, state: TState) => TMove;
  Board: React.ComponentType<TypedGameBoardProps<TState, TMove>>;
}

export interface LegacyGameDefinition {
  id: string;
  game: Game;
}

export interface GameRegistryEntry {
  id: string;
  name: string;
  game: Game;
}
