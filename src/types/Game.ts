// src/types/Game.ts
import type { ComponentType } from 'react';
import type { GameState, SearchMetrics } from 'multimcts';

export interface AppGameState {
  isTerminal(): boolean;
  toString(): string;
}

export interface SearchTreeNodeView {
  averageValue: number;
  children: ReadonlyMap<unknown, SearchTreeNodeView>;
  move: unknown | null;
  parent: SearchTreeNodeView | null;
  state: {
    getStateKey(): string;
    toString(): string;
  };
  team: unknown;
  utilitySums: ReadonlyMap<unknown, number>;
  visits: number;
}

export interface SearchTreeLike {
  explorationBias: number;
  executeRound: (root?: SearchTreeNodeView | null) => void;
  getBestMove: (node?: SearchTreeNodeView | null) => unknown | null;
  root: SearchTreeNodeView | null;
}

export interface SearchResult {
  metrics: SearchMetrics;
  move: unknown;
}

export interface HelpSection {
  title: string;
  items: string[];
}

export interface HelpContent {
  overview: string;
  sections: HelpSection[];
}

export interface GameBoardProps {
  state: AppGameState;
  onMove: (move: unknown) => void;
}

export interface Game {
  id: string;
  name: string;
  createInitialState: () => AppGameState;
  serializeState: (state: AppGameState) => unknown;
  deserializeState: (serializedState: unknown) => AppGameState;
  serializeMove: (move: unknown, state: AppGameState) => string;
  deserializeMove: (serializedMove: string, state: AppGameState) => unknown;
  applyMove: (state: AppGameState, move: unknown) => AppGameState;
  createSearch: (explorationBias: number) => SearchTreeLike;
  search: (
    search: SearchTreeLike,
    state: AppGameState,
    limits: { maxIterations: number | null; maxTime: number | null },
  ) => SearchResult;
  advanceSearchTree: (
    search: SearchTreeLike,
    move: unknown,
    nextState: AppGameState,
  ) => boolean;
  resetSearchTree: (search: SearchTreeLike) => void;
  Board: ComponentType<GameBoardProps>;
  help?: HelpContent;
}

export interface TypedGameBoardProps<TState extends AppGameState, TMove> {
  state: TState;
  onMove: (move: TMove) => void;
}

export interface TypedGameDefinition<
  TState extends GameState<TMove, TTeam, TState>,
  TMove,
  TTeam = string,
> {
  id: string;
  name: string;
  createInitialState: () => TState;
  isState: (state: AppGameState) => state is TState;
  serializeState: (state: TState) => unknown;
  deserializeState: (serializedState: unknown) => TState;
  serializeMove: (move: TMove, state: TState) => string;
  deserializeMove: (serializedMove: string, state: TState) => TMove;
  Board: ComponentType<TypedGameBoardProps<TState, TMove>>;
  help?: HelpContent;
}

export interface GameRegistryEntry {
  id: string;
  name: string;
  familyId: string;
  familyName: string;
  variantName?: string;
  game: Game;
}

export interface GameFamilyEntry {
  id: string;
  name: string;
  defaultGameId: string;
  gameIds: string[];
}
