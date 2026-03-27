import { TypedGameDefinition } from '../../types/Game';
import UltimateTicTacToeBoard from './Board';
import { BoardState, CellState, UltimateTicTacToeState } from './state';

interface SerializedUltimateTicTacToeState {
  board: CellState[];
  team: boolean;
  prevMove?: number;
  boardStates: BoardState[];
}

const isValidCellState = (value: unknown): value is CellState =>
  value === undefined || typeof value === 'boolean';

const isValidBoardState = (value: unknown): value is BoardState =>
  value === undefined || value === null || typeof value === 'boolean';

const deserializeMove = (serializedMove: string) => {
  const move = Number.parseInt(serializedMove, 10);
  if(!Number.isInteger(move) || move < 0 || move >= 81) {
    throw new Error(`Invalid Ultimate Tic-Tac-Toe move: ${serializedMove}`);
  }

  return move;
};

const UltimateTicTacToe: TypedGameDefinition<UltimateTicTacToeState, number> = {
  id: 'UltimateTicTacToe',
  name: 'UltimateTicTacToe',
  createInitialState: () => new UltimateTicTacToeState(),
  isState: (state): state is UltimateTicTacToeState => state instanceof UltimateTicTacToeState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    prevMove: state.prevMove,
    boardStates: [...state.boardStates],
  }),
  deserializeState: (serializedState) => {
    const { board, team, prevMove, boardStates } = serializedState as SerializedUltimateTicTacToeState;
    if(
      !Array.isArray(board)
      || board.length !== 81
      || board.some((cell) => !isValidCellState(cell))
      || typeof team !== 'boolean'
      || (prevMove !== undefined && (!Number.isInteger(prevMove) || prevMove < 0 || prevMove >= 81))
      || !Array.isArray(boardStates)
      || boardStates.length !== 9
      || boardStates.some((boardState) => !isValidBoardState(boardState))
    ) {
      throw new Error('Invalid Ultimate Tic-Tac-Toe state');
    }

    return new UltimateTicTacToeState([...board], team, prevMove, [...boardStates]);
  },
  serializeMove: (move) => move.toString(),
  deserializeMove,
  Board: UltimateTicTacToeBoard,
};

export default UltimateTicTacToe;
