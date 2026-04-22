import type { TypedGameDefinition } from '../../types/Game';
import GoroGoroDobutsuBoard from './Board';
import {
  decodeGoroGoroMove,
  GoroGoroDobutsuShogiState,
  encodeGoroGoroMove,
  isGoroGoroBoard,
  isGoroGoroHands,
} from './state';
import type { GoroGoroHands, GoroGoroMove } from './state';

interface SerializedGoroGoroDobutsuState {
  board: unknown;
  team: boolean;
  hands: unknown;
  repetitionCounts: unknown;
}

const isValidRepetitionCounts = (
  value: unknown,
): value is Array<[string, number]> => (
  Array.isArray(value)
  && value.every((entry) => (
    Array.isArray(entry)
    && entry.length === 2
    && typeof entry[0] === 'string'
    && Number.isInteger(entry[1])
    && entry[1] > 0
  ))
);

const GoroGoroDobutsuShogi: TypedGameDefinition<
  GoroGoroDobutsuShogiState,
  GoroGoroMove
> = {
  id: 'GoroGoroDobutsuShogi',
  name: 'Goro-Goro Dobutsu Shogi',
  help: {
    overview:
      'Goro-Goro Dobutsu Shogi is a 5x6 animal-shogi variant that introduces check, optional promotion, and standard shogi pawn-drop rules while keeping the compact animal theme.',
    sections: [
      {
        title: 'How To Play',
        items: [
          'Select a piece, then choose a highlighted destination. Some moves offer a promotion choice.',
          'Captured chicks, cats, and dogs go to your hand and can later be dropped back onto empty squares.',
          'Chicks and cats can promote inside the far two ranks. A chick that reaches the last rank must promote.',
        ],
      },
      {
        title: 'Rules To Watch',
        items: [
          'You may not leave your lion in check.',
          'A dropped chick cannot go on the last rank, cannot create two unpromoted chicks in one file, and cannot be dropped for immediate checkmate.',
          'Fourfold repetition is scored as a draw in this implementation.',
        ],
      },
    ],
  },
  createInitialState: () => new GoroGoroDobutsuShogiState(),
  isState: (state): state is GoroGoroDobutsuShogiState => (
    state instanceof GoroGoroDobutsuShogiState
  ),
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    hands: {
      s: { ...state.hands.s },
      n: { ...state.hands.n },
    } satisfies GoroGoroHands,
    repetitionCounts: [...state.repetitionCounts.entries()],
  }),
  deserializeState: (serializedState) => {
    const { board, team, hands, repetitionCounts } =
      serializedState as SerializedGoroGoroDobutsuState;

    if (
      !isGoroGoroBoard(board)
      || typeof team !== 'boolean'
      || !isGoroGoroHands(hands)
      || !isValidRepetitionCounts(repetitionCounts)
    ) {
      throw new Error('Invalid Goro-Goro Dobutsu Shogi state');
    }

    return new GoroGoroDobutsuShogiState(
      [...board],
      team,
      {
        s: { ...hands.s },
        n: { ...hands.n },
      },
      repetitionCounts,
    );
  },
  serializeMove: (move) => encodeGoroGoroMove(move),
  deserializeMove: (serializedMove) => decodeGoroGoroMove(serializedMove),
  Board: GoroGoroDobutsuBoard,
};

export default GoroGoroDobutsuShogi;
