import {
  ConnectFourCell,
  ConnectFourState,
} from 'multimcts/connect-four';

export const ROWS = 6;
export const COLS = 7;
export const TOTAL_CELLS = ROWS * COLS;
const WIN_LENGTH = 4;

export { ConnectFourState } from 'multimcts/connect-four';
export type CellState = ConnectFourCell;

const DIRECTIONS: Array<[rowDelta: number, colDelta: number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

const getIndex = (row: number, col: number) => (row * COLS) + col;

const collectLine = (
  board: readonly CellState[],
  startRow: number,
  startCol: number,
  rowDelta: number,
  colDelta: number,
) => {
  const indexes = [getIndex(startRow, startCol)];
  const firstCell = board[indexes[0]];

  for(let step = 1; step < WIN_LENGTH; step += 1) {
    const row = startRow + (rowDelta * step);
    const col = startCol + (colDelta * step);
    if(row < 0 || row >= ROWS || col < 0 || col >= COLS) {
      return null;
    }

    const index = getIndex(row, col);
    if(board[index] !== firstCell) {
      return null;
    }

    indexes.push(index);
  }

  return indexes;
};

export const getLegalColumns = (state: ConnectFourState) => (
  state.getLegalMoves().map((move) => Number.parseInt(move, 10))
);

export const getWinningLine = (state: ConnectFourState) => {
  for(let row = 0; row < ROWS; row += 1) {
    for(let col = 0; col < COLS; col += 1) {
      const startIndex = getIndex(row, col);
      const cell = state.board[startIndex];
      if(cell === null) {
        continue;
      }

      for(const [rowDelta, colDelta] of DIRECTIONS) {
        const line = collectLine(state.board, row, col, rowDelta, colDelta);
        if(line) {
          return line;
        }
      }
    }
  }

  return null;
};

export const getWinner = (state: ConnectFourState) => {
  const winningLine = getWinningLine(state);
  return winningLine ? state.board[winningLine[0]] : null;
};
