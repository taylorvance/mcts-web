import type { TypedGameDefinition } from '../../types/Game';
import OnitamaBoard from './Board';
import { decodeOnitamaMove, encodeOnitamaMove, OnitamaState } from './state';
import type { OnitamaCards, OnitamaMove, OnitamaPiece } from './state';

interface SerializedOnitamaState {
  board: OnitamaPiece[];
  team: boolean;
  cards: OnitamaCards;
  nmoves: number;
}

const Onitama: TypedGameDefinition<OnitamaState, OnitamaMove> = {
  id: 'Onitama',
  name: 'Onitama',
  help: {
    overview:
      'Each player has two movement cards and shares a fifth card in the center. On your turn, play one of your cards to move a piece, then swap that card with the center card.',
    sections: [
      {
        title: 'How To Play',
        items: [
          'Choose one of your two cards, click one of your pieces, then pick a legal destination.',
          'Card patterns are mirrored for the two sides, so the same card points in opposite directions depending on whose turn it is.',
          'If none of your pieces can use a card, the game allows a pass with that card.',
        ],
      },
      {
        title: 'Win Conditions',
        items: [
          'Way of the Stone: capture the opposing master.',
          'Way of the Stream: move your master onto the opposing temple square.',
        ],
      },
    ],
  },
  createInitialState: () => new OnitamaState(),
  isState: (state): state is OnitamaState => state instanceof OnitamaState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    cards: {
      r: [...state.cards.r],
      b: [...state.cards.b],
      n: state.cards.n,
    },
    nmoves: state.nmoves,
  }),
  deserializeState: (serializedState) => {
    const { board, team, cards, nmoves } =
      serializedState as SerializedOnitamaState;
    if (
      !Array.isArray(board) ||
      typeof team !== 'boolean' ||
      !cards ||
      typeof nmoves !== 'number'
    ) {
      throw new Error('Invalid Onitama state');
    }

    return new OnitamaState(
      [...board],
      team,
      {
        r: [...cards.r],
        b: [...cards.b],
        n: cards.n,
      },
      nmoves,
    );
  },
  serializeMove: (move) => encodeOnitamaMove(move),
  deserializeMove: (serializedMove) => decodeOnitamaMove(serializedMove),
  Board: OnitamaBoard,
};

export default Onitama;
