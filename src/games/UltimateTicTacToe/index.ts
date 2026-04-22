import type { TypedGameDefinition } from '../../types/Game';
import UltimateTicTacToeBoard from './Board';
import { UltimateTicTacToeState } from './state';
import type { BoardState, CellState } from './state';

type SerializedCellState = 'X' | 'O' | '';
type SerializedBoardState = 'X' | 'O' | 'T' | '';

interface SerializedUltimateTicTacToeState {
  board: Array<SerializedCellState | CellState | null>;
  team: boolean;
  prevMove?: number;
  boardStates: Array<SerializedBoardState | BoardState | null>;
}

const serializeCellState = (value: CellState): SerializedCellState => {
  if (value === undefined) {
    return '';
  }

  return value ? 'X' : 'O';
};

const serializeBoardState = (value: BoardState): SerializedBoardState => {
  if (value === undefined) {
    return '';
  }

  if (value === null) {
    return 'T';
  }

  return value ? 'X' : 'O';
};

const isValidCellState = (
  value: unknown,
): value is SerializedCellState | CellState | null =>
  value === undefined ||
  value === null ||
  typeof value === 'boolean' ||
  value === '' ||
  value === 'X' ||
  value === 'O';

const isValidBoardState = (
  value: unknown,
): value is SerializedBoardState | BoardState | null =>
  value === undefined ||
  value === null ||
  typeof value === 'boolean' ||
  value === '' ||
  value === 'X' ||
  value === 'O' ||
  value === 'T';

const normalizeCellState = (value: unknown): CellState => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (value === 'X') {
    return true;
  }

  if (value === 'O') {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  throw new Error('Invalid Ultimate Tic-Tac-Toe cell');
};

const normalizeBoardState = (value: unknown): BoardState => {
  if (value === '' || value === undefined) {
    return undefined;
  }

  if (value === 'T' || value === null) {
    return null;
  }

  if (value === 'X') {
    return true;
  }

  if (value === 'O') {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  throw new Error('Invalid Ultimate Tic-Tac-Toe board state');
};

const deserializeMove = (serializedMove: string) => {
  const move = Number.parseInt(serializedMove, 10);
  if (!Number.isInteger(move) || move < 0 || move >= 81) {
    throw new Error(`Invalid Ultimate Tic-Tac-Toe move: ${serializedMove}`);
  }

  return move;
};

const UltimateTicTacToe: TypedGameDefinition<UltimateTicTacToeState, number> = {
  id: 'UltimateTicTacToe',
  name: 'UltimateTicTacToe',
  help: {
    overview:
      'Ultimate Tic-Tac-Toe is a 3x3 grid of local Tic-Tac-Toe boards. Winning a local board claims that board on the macro grid, and three claimed boards in a row wins the game.',
    sections: [
      {
        title: 'How To Play',
        items: [
          'Your move sends your opponent to the local board matching the square you played.',
          'If that destination board is already won or tied, the opponent may play in any still-open board.',
          'Local boards can end in wins or ties, and only won boards count toward the macro victory line.',
        ],
      },
      {
        title: 'Strategy Notes',
        items: [
          'Strong local moves are not always strong global moves because they decide the next required board.',
          'Sending your opponent into a constrained or dead board can be as valuable as making your own threat.',
        ],
      },
    ],
  },
  createInitialState: () => new UltimateTicTacToeState(),
  isState: (state): state is UltimateTicTacToeState =>
    state instanceof UltimateTicTacToeState,
  serializeState: (state) => ({
    board: state.board.map(serializeCellState),
    team: state.team,
    prevMove: state.prevMove,
    boardStates: state.boardStates.map(serializeBoardState),
  }),
  deserializeState: (serializedState) => {
    const { board, team, prevMove, boardStates } =
      serializedState as SerializedUltimateTicTacToeState;
    if (
      !Array.isArray(board) ||
      board.length !== 81 ||
      board.some((cell) => !isValidCellState(cell)) ||
      typeof team !== 'boolean' ||
      (prevMove !== undefined &&
        (!Number.isInteger(prevMove) || prevMove < 0 || prevMove >= 81)) ||
      !Array.isArray(boardStates) ||
      boardStates.length !== 9 ||
      boardStates.some((boardState) => !isValidBoardState(boardState))
    ) {
      throw new Error('Invalid Ultimate Tic-Tac-Toe state');
    }

    return new UltimateTicTacToeState(
      board.map(normalizeCellState),
      team,
      prevMove,
      boardStates.map(normalizeBoardState),
    );
  },
  serializeMove: (move) => move.toString(),
  deserializeMove,
  Board: UltimateTicTacToeBoard,
};

export default UltimateTicTacToe;
