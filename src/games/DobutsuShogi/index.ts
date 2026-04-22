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
