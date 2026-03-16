import { TypedGameDefinition } from '../../types/Game';
import OnitamaBoard from './Board';
import {
  decodeOnitamaMove,
  encodeOnitamaMove,
  OnitamaMove,
  OnitamaState,
} from './state';

const Onitama: TypedGameDefinition<OnitamaState, OnitamaMove> = {
  id: 'Onitama',
  name: 'Onitama',
  createInitialState: () => new OnitamaState(),
  isState: (state): state is OnitamaState => state instanceof OnitamaState,
  encodeMove: (move) => encodeOnitamaMove(move),
  decodeMove: (encodedMove) => decodeOnitamaMove(encodedMove),
  Board: OnitamaBoard,
};

export default Onitama;
