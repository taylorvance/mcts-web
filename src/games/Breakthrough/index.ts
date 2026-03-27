import { TypedGameDefinition } from '../../types/Game';
import BreakthroughBoard from './Board';
import {
  BreakthroughMove,
  BreakthroughState,
  BreakthroughTeam,
  CellState,
  parseBreakthroughMove,
  TOTAL_CELLS,
} from './state';

interface SerializedBreakthroughState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;
  whiteCount: number;
  blackCount: number;
  winner: BreakthroughTeam | null;
}

const isValidCellState = (cell: unknown): cell is CellState =>
  cell === null || cell === 'W' || cell === 'B';

const Breakthrough: TypedGameDefinition<BreakthroughState, BreakthroughMove, BreakthroughTeam> = {
  id: 'Breakthrough',
  name: 'Breakthrough',
  createInitialState: () => new BreakthroughState(),
  isState: (state): state is BreakthroughState => state instanceof BreakthroughState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    lastMove: state.lastMove,
    whiteCount: state.whiteCount,
    blackCount: state.blackCount,
    winner: state.winner,
  }),
  deserializeState: (serializedState) => {
    const {
      board,
      team,
      lastMove,
      whiteCount,
      blackCount,
      winner,
    } = serializedState as SerializedBreakthroughState;

    if(
      !Array.isArray(board)
      || board.length !== TOTAL_CELLS
      || board.some((cell) => !isValidCellState(cell))
      || typeof team !== 'boolean'
      || !Number.isInteger(whiteCount)
      || !Number.isInteger(blackCount)
      || whiteCount < 0
      || blackCount < 0
      || whiteCount > 16
      || blackCount > 16
      || (lastMove !== null && (!Number.isInteger(lastMove) || lastMove < 0 || lastMove >= TOTAL_CELLS))
      || (winner !== null && winner !== 'W' && winner !== 'B')
    ) {
      throw new Error('Invalid Breakthrough state');
    }

    return new BreakthroughState([...board], team, lastMove, whiteCount, blackCount, winner);
  },
  serializeMove: (move) => move,
  deserializeMove: (serializedMove) => {
    const { from, to } = parseBreakthroughMove(serializedMove);
    return `${from}:${to}`;
  },
  Board: BreakthroughBoard,
};

export default Breakthrough;
