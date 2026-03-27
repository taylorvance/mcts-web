import { TypedGameDefinition } from '../../types/Game';
import FillerBoard from './Board';
import { FillerState } from './state';

interface SerializedFillerState {
  board: number[];
  team: boolean;
}

const Filler: TypedGameDefinition<FillerState, number> = {
  id: 'Filler',
  name: 'Filler',
  createInitialState: () => new FillerState(),
  isState: (state): state is FillerState => state instanceof FillerState,
  serializeState: (state) => ({
    board: Array.from(state.board),
    team: state.team,
  }),
  deserializeState: (serializedState) => {
    const { board, team } = serializedState as SerializedFillerState;
    if(!Array.isArray(board) || typeof team !== 'boolean') {
      throw new Error('Invalid Filler state');
    }

    return new FillerState(Uint8Array.from(board), team);
  },
  serializeMove: (move) => move.toString(),
  deserializeMove: (serializedMove) => parseInt(serializedMove, 10),
  Board: FillerBoard,
};

export default Filler;
