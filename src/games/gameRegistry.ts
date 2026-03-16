import React from 'react';
import { GameState } from 'multimcts';
import Filler from './Filler';
import Onitama from './Onitama';
import TicTacToe from './TicTacToe';
import UltimateTicTacToe from './UltimateTicTacToe';
import {
  Game,
  GameBoardProps,
  GameRegistryEntry,
  LegacyGameDefinition,
  TypedGameDefinition,
} from '../types/Game';

const createLegacyGameEntry = ({ id, game }: LegacyGameDefinition): GameRegistryEntry => ({
  id,
  name: game.name,
  game,
});

const createTypedGameEntry = <TState extends GameState, TMove>(
  definition: TypedGameDefinition<TState, TMove>,
): GameRegistryEntry => ({
  id: definition.id,
  name: definition.name,
  game: {
    name: definition.name,
    createInitialState: definition.createInitialState,
    Board: ({ state, onMove }: GameBoardProps) => {
      if(!definition.isState(state)) {
        throw new Error(`Invalid state type for ${definition.name}`);
      }

      return React.createElement(definition.Board, {
        state,
        onMove: (move: TMove) => onMove(definition.encodeMove(move, state)),
      });
    },
  },
});

export const gameEntries: GameRegistryEntry[] = [
  createLegacyGameEntry({ id: 'Filler', game: Filler }),
  createLegacyGameEntry({ id: 'Onitama', game: Onitama }),
  createTypedGameEntry(TicTacToe),
  createTypedGameEntry(UltimateTicTacToe),
];

export const games: Record<string, Game> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry.game]),
);

export const gameOptions: Record<string, string> = Object.fromEntries(
  gameEntries.map((entry) => [entry.id, entry.name]),
);
