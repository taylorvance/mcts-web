import { TypedGameDefinition } from '../../types/Game';
import FillerBoard from './Board';
import { FillerState } from './state';

const Filler: TypedGameDefinition<FillerState, number> = {
  id: 'Filler',
  name: 'Filler',
  createInitialState: () => new FillerState(),
  isState: (state): state is FillerState => state instanceof FillerState,
  encodeMove: (move) => move.toString(),
  decodeMove: (encodedMove) => parseInt(encodedMove, 10),
  Board: FillerBoard,
};

export default Filler;
