import React from 'react';
import { MCTS } from 'multimcts';
import type { GameState } from 'multimcts';
import ConnectFour from './ConnectFour';
import DobutsuShogi from './DobutsuShogi';
import Filler from './Filler';
import GoroGoroDobutsuShogi from './GoroGoroDobutsuShogi';
import Onitama from './Onitama';
import Othello from './Othello';
import TicTacToe from './TicTacToe';
import UltimateTicTacToe from './UltimateTicTacToe';
import type {
  Game,
  GameFamilyEntry,
  GameBoardProps,
  GameRegistryEntry,
  SearchTreeLike,
  TypedGameDefinition,
} from '../types/Game';

interface GameEntryMetadata {
  familyId?: string;
  familyName?: string;
  variantName?: string;
}

const createTypedGameEntry = <
  TState extends GameState<TMove, TTeam, TState>,
  TMove,
  TTeam = string,
>(
  definition: TypedGameDefinition<TState, TMove, TTeam>,
  metadata: GameEntryMetadata = {},
): GameRegistryEntry => ({
  id: definition.id,
  name: definition.name,
  familyId: metadata.familyId ?? definition.id,
  familyName: metadata.familyName ?? definition.name,
  variantName: metadata.variantName,
  game: {
    id: definition.id,
    name: definition.name,
    help: definition.help,
    createInitialState: definition.createInitialState,
    serializeState: (state) => {
      if (!definition.isState(state)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      return definition.serializeState(state);
    },
    deserializeState: (serializedState) =>
      definition.deserializeState(serializedState),
    serializeMove: (move, state) => {
      if (!definition.isState(state)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      return definition.serializeMove(move as TMove, state);
    },
    deserializeMove: (serializedMove, state) => {
      if (!definition.isState(state)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      return definition.deserializeMove(serializedMove, state);
    },
    applyMove: (state, move) => {
      if (!definition.isState(state)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      return state.makeMove(move as TMove);
    },
    createSearch: (explorationBias) =>
      new MCTS<TState, TMove, TTeam>({
        explorationBias,
      }) as unknown as SearchTreeLike,
    search: (search, state, limits) => {
      if (!definition.isState(state)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      const { maxIterations, maxRetainedNodes, maxTime } = limits;
      if (
        maxIterations === null
        && maxRetainedNodes === null
        && maxTime === null
      ) {
        throw new Error('At least one search limit is required.');
      }

      const result = (search as unknown as MCTS<TState, TMove, TTeam>).searchWithDiagnostics(
        state,
        {
          ...(maxIterations !== null ? { maxIterations } : {}),
          ...(maxRetainedNodes !== null ? { maxRetainedNodes } : {}),
          ...(maxTime !== null ? { maxTimeMs: maxTime * 1000 } : {}),
        },
      );

      if (result.bestMove === null) {
        throw new Error('MCTS search did not produce a legal move.');
      }

      return {
        metrics: {
          elapsedMs: result.elapsedMs,
          iterations: result.iterations,
          retainedNodeCount: result.diagnostics?.retainedNodeCount ?? 0,
        },
        move: result.bestMove,
      };
    },
    advanceSearchTree: (search, move, nextState) => {
      if (!definition.isState(nextState)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      return Boolean(
        (search as unknown as MCTS<TState, TMove, TTeam>).advanceToChild(
          move as TMove,
          nextState,
        ),
      );
    },
    resetSearchTree: (search) => {
      (search as unknown as MCTS<TState, TMove, TTeam>).reset();
    },
    Board: ({ state, onMove }: GameBoardProps) => {
      if (!definition.isState(state)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      return React.createElement(definition.Board, {
        state,
        onMove: (move: TMove) => onMove(move),
      });
    },
  },
});

export const buildGameFamilies = (
  entries: GameRegistryEntry[],
): GameFamilyEntry[] => {
  const families = new Map<string, GameFamilyEntry>();

  for (const entry of entries) {
    const existingFamily = families.get(entry.familyId);
    if (existingFamily) {
      if (existingFamily.name !== entry.familyName) {
        throw new Error(
          `Conflicting family names for ${entry.familyId}: ${existingFamily.name} vs ${entry.familyName}`,
        );
      }

      existingFamily.gameIds.push(entry.id);
      continue;
    }

    families.set(entry.familyId, {
      id: entry.familyId,
      name: entry.familyName,
      defaultGameId: entry.id,
      gameIds: [entry.id],
    });
  }

  return [...families.values()];
};

export const gameEntries: GameRegistryEntry[] = [
  createTypedGameEntry(ConnectFour),
  createTypedGameEntry(DobutsuShogi, {
    familyId: 'Shogi',
    familyName: 'Shogi',
    variantName: 'Dobutsu',
  }),
  createTypedGameEntry(GoroGoroDobutsuShogi, {
    familyId: 'Shogi',
    familyName: 'Shogi',
    variantName: 'Goro-Goro Dobutsu',
  }),
  createTypedGameEntry(Filler),
  createTypedGameEntry(Onitama),
  createTypedGameEntry(Othello),
  createTypedGameEntry(TicTacToe),
  createTypedGameEntry(UltimateTicTacToe),
];

export const games: Record<string, Game> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry.game]),
);

export const gameEntriesById: Record<string, GameRegistryEntry> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry]),
);

export const gameFamilies: Record<string, GameFamilyEntry> = Object.fromEntries(
  buildGameFamilies(gameEntries).map((family) => [family.id, family]),
);

export const gameIdToFamilyId: Record<string, string> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry.familyId]),
);

export const gameFamilyOptions: Record<string, string> = Object.fromEntries(
  Object.values(gameFamilies)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((family) => [family.id, family.name]),
);

export const gameOptions: Record<string, string> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry.name]),
);
