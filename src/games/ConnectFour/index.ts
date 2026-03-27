import { TypedGameDefinition } from '../../types/Game';
import ConnectFourBoard from './Board';
import { CellState, ConnectFourState, TOTAL_CELLS } from './state';

interface SerializedConnectFourState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;
}

const isValidCellState = (cell: unknown): cell is CellState =>
  cell === null || cell === 'R' || cell === 'Y';

const ConnectFour: TypedGameDefinition<ConnectFourState, string, 'R' | 'Y'> = {
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
      || board.some((cell) => !isValidCellState(cell))
      || typeof team !== 'boolean'
      || (lastMove !== null && !Number.isInteger(lastMove))
    ) {
      throw new Error('Invalid Connect Four state');
    }

    return new ConnectFourState([...board], team, lastMove);
  },
  serializeMove: (move) => move,
  deserializeMove: (serializedMove) => serializedMove,
  Board: ConnectFourBoard,
};

export default ConnectFour;
