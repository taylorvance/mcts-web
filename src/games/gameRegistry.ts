import React from 'react';
import { MCTS } from 'multimcts';
import type { GameState } from 'multimcts';
import ConnectFour from './ConnectFour';
import DobutsuShogi from './DobutsuShogi';
import Filler from './Filler';
import Onitama from './Onitama';
import Othello from './Othello';
import TicTacToe from './TicTacToe';
import UltimateTicTacToe from './UltimateTicTacToe';
import type {
  Game,
  GameBoardProps,
  GameRegistryEntry,
  SearchTreeLike,
  TypedGameDefinition,
} from '../types/Game';

const createTypedGameEntry = <
  TState extends GameState<TMove, TTeam, TState>,
  TMove,
  TTeam = string,
>(
  definition: TypedGameDefinition<TState, TMove, TTeam>,
): GameRegistryEntry => ({
  id: definition.id,
  name: definition.name,
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

      const { maxIterations, maxTime } = limits;
      if (maxIterations === null && maxTime === null) {
        throw new Error('At least one search limit is required.');
      }

      const result = (search as unknown as MCTS<TState, TMove, TTeam>).search(
        state,
        {
          ...(maxIterations !== null ? { maxIterations } : {}),
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

export const gameEntries: GameRegistryEntry[] = [
  createTypedGameEntry(ConnectFour),
  createTypedGameEntry(DobutsuShogi),
  createTypedGameEntry(Filler),
  createTypedGameEntry(Onitama),
  createTypedGameEntry(Othello),
  createTypedGameEntry(TicTacToe),
  createTypedGameEntry(UltimateTicTacToe),
];

export const games: Record<string, Game> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry.game]),
);

export const gameOptions: Record<string, string> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry.name]),
);
