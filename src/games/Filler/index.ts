import { TypedGameDefinition } from '../../types/Game';
import FillerBoard from './Board';
import { COLOR_COUNT, FillerState } from './state';

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
  deserializeMove: (serializedMove) => {
    const move = Number.parseInt(serializedMove, 10);
    if(!Number.isInteger(move) || move < 0 || move >= COLOR_COUNT) {
      throw new Error(`Invalid Filler move: ${serializedMove}`);
    }

    return move;
  },
  Board: FillerBoard,
};

export default Filler;
