import { TypedGameDefinition } from '../../types/Game';
import OnitamaBoard from './Board';
import {
  decodeOnitamaMove,
  encodeOnitamaMove,
  OnitamaCards,
  OnitamaMove,
  OnitamaPiece,
  OnitamaState,
} from './state';

interface SerializedOnitamaState {
  board: OnitamaPiece[];
  team: boolean;
  cards: OnitamaCards;
  nmoves: number;
}

const Onitama: TypedGameDefinition<OnitamaState, OnitamaMove> = {
  id: 'Onitama',
  name: 'Onitama',
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
    const { board, team, cards, nmoves } = serializedState as SerializedOnitamaState;
    if(!Array.isArray(board) || typeof team !== 'boolean' || !cards || typeof nmoves !== 'number') {
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
