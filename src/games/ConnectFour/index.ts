import { TypedGameDefinition } from '../../types/Game';
import ConnectFourBoard from './Board';
import { CellState, ConnectFourState, TOTAL_CELLS } from './state';

interface SerializedConnectFourState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;
}

const ConnectFour: TypedGameDefinition<ConnectFourState, number> = {
  id: 'ConnectFour',
  name: 'Connect Four',
  createInitialState: () => new ConnectFourState(),
  isState: (state): state is ConnectFourState => state instanceof ConnectFourState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    lastMove: state.lastMove,
  }),
  deserializeState: (serializedState) => {
    const { board, team, lastMove } = serializedState as SerializedConnectFourState;

    if(
      !Array.isArray(board)
      || board.length !== TOTAL_CELLS
      || board.some((cell) => cell !== null && typeof cell !== 'boolean')
      || typeof team !== 'boolean'
      || (lastMove !== null && !Number.isInteger(lastMove))
    ) {
      throw new Error('Invalid Connect Four state');
    }

    return new ConnectFourState([...board], team, lastMove);
  },
  encodeMove: (move) => move.toString(),
  decodeMove: (encodedMove) => Number.parseInt(encodedMove, 10),
  Board: ConnectFourBoard,
};

export default ConnectFour;
