import { TypedGameDefinition } from '../../types/Game';
import HexBoard from './Board';
import { CellState, HexMove, HexState, HexTeam } from './state';

interface SerializedHexState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;
  size: number;
  moveCount: number;
  winner: HexTeam | null;
}

const isValidCellState = (cell: unknown): cell is CellState =>
  cell === null || cell === 'B' || cell === 'W';

const Hex: TypedGameDefinition<HexState, HexMove, HexTeam> = {
  id: 'Hex',
  name: 'Hex',
  createInitialState: () => new HexState(),
  isState: (state): state is HexState => state instanceof HexState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    lastMove: state.lastMove,
    size: state.size,
    moveCount: state.moveCount,
    winner: state.winner,
  }),
  deserializeState: (serializedState) => {
    const {
      board,
      team,
      lastMove,
      size,
      moveCount,
      winner,
    } = serializedState as SerializedHexState;

    if(
      !Array.isArray(board)
      || !Number.isInteger(size)
      || size <= 0
      || board.length !== size * size
      || board.some((cell) => !isValidCellState(cell))
      || typeof team !== 'boolean'
      || !Number.isInteger(moveCount)
      || moveCount < 0
      || moveCount > board.length
      || (lastMove !== null && (!Number.isInteger(lastMove) || lastMove < 0 || lastMove >= board.length))
      || (winner !== null && winner !== 'B' && winner !== 'W')
    ) {
      throw new Error('Invalid Hex state');
    }

    return new HexState([...board], team, lastMove, size, moveCount, winner);
  },
  serializeMove: (move) => move.toString(),
  deserializeMove: (serializedMove, state) => {
    const move = Number.parseInt(serializedMove, 10);
    if(!Number.isInteger(move) || move < 0 || move >= state.board.length) {
      throw new Error(`Invalid Hex move: ${serializedMove}`);
    }

    return move;
  },
  Board: HexBoard,
};

export default Hex;
