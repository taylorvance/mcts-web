import type { TypedGameDefinition } from '../../types/Game';
import DobutsuBoard from './Board';
import {
  decodeDobutsuMove,
  DobutsuShogiState,
  encodeDobutsuMove,
  isDobutsuBoard,
  isDobutsuHands,
} from './state';
import type { DobutsuHands, DobutsuMove } from './state';

interface SerializedDobutsuShogiState {
  board: unknown;
  team: boolean;
  hands: unknown;
  repetitionCounts: unknown;
}

const isValidRepetitionCounts = (value: unknown): value is Array<[string, number]> => (
  Array.isArray(value)
  && value.every((entry) => (
    Array.isArray(entry)
    && entry.length === 2
    && typeof entry[0] === 'string'
    && Number.isInteger(entry[1])
    && entry[1] > 0
  ))
);

const DobutsuShogi: TypedGameDefinition<DobutsuShogiState, DobutsuMove> = {
  id: 'DobutsuShogi',
  name: 'Dobutsu Shogi',
  help: {
    overview: 'Dobutsu Shogi is a compact animal-chess variant on a 3x4 board. Capture the opposing lion, reach the far rank with your lion to score a try, or win when your opponent has no legal move.',
    sections: [
      {
        title: 'How To Play',
        items: [
          'Select one of your pieces, then choose a highlighted destination to move it.',
          'Captured chick, elephant, and giraffe pieces go to your hand and can later be dropped back onto an empty square.',
          'A promoted chick becomes a hen, and captured hens return to hand as chicks.',
        ],
      },
      {
        title: 'Win Conditions',
        items: [
          'Capture the opposing lion.',
          'Move your lion safely onto the far rank for a try.',
          'Repeated positions are scored as a draw in this implementation.',
        ],
      },
    ],
  },
  createInitialState: () => new DobutsuShogiState(),
  isState: (state): state is DobutsuShogiState => state instanceof DobutsuShogiState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    hands: {
      s: { ...state.hands.s },
      n: { ...state.hands.n },
    } satisfies DobutsuHands,
    repetitionCounts: [...state.repetitionCounts.entries()],
  }),
  deserializeState: (serializedState) => {
    const { board, team, hands, repetitionCounts } = serializedState as SerializedDobutsuShogiState;

    if(
      !isDobutsuBoard(board)
      || typeof team !== 'boolean'
      || !isDobutsuHands(hands)
      || !isValidRepetitionCounts(repetitionCounts)
    ) {
      throw new Error('Invalid Dobutsu Shogi state');
    }

    return new DobutsuShogiState(
      [...board],
      team,
      {
        s: { ...hands.s },
        n: { ...hands.n },
      },
      repetitionCounts,
    );
  },
  serializeMove: (move) => encodeDobutsuMove(move),
  deserializeMove: (serializedMove) => decodeDobutsuMove(serializedMove),
  Board: DobutsuBoard,
};

export default DobutsuShogi;
