// src/types/Game.ts
import { GameState } from 'multimcts';

export interface GameBoardProps {
  state: GameState;
  onMove: (move: string) => void;
}

export interface Game {
  id: string;
  name: string;
  createInitialState: () => GameState;
  serializeState: (state: GameState) => unknown;
  deserializeState: (serializedState: unknown) => GameState;
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
  serializeState: (state: TState) => unknown;
  deserializeState: (serializedState: unknown) => TState;
  encodeMove: (move: TMove, state: TState) => string;
  decodeMove: (encodedMove: string, state: TState) => TMove;
  Board: React.ComponentType<TypedGameBoardProps<TState, TMove>>;
}

export interface GameRegistryEntry {
  id: string;
  name: string;
  game: Game;
}
