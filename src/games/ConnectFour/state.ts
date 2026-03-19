import { GameState } from 'multimcts';

export const ROWS = 6;
export const COLS = 7;
export const TOTAL_CELLS = ROWS * COLS;
const WIN_LENGTH = 4;

export type CellState = boolean | null;

const DIRECTIONS: Array<[rowDelta: number, colDelta: number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export class ConnectFourState extends GameState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;

  constructor(
    board = Array<CellState>(TOTAL_CELLS).fill(null),
    team = true,
    lastMove: number | null = null,
  ) {
    super();
    this.board = board;
    this.team = team;
    this.lastMove = lastMove;
  }

  getCurrentTeam(): string {
    return this.team ? 'R' : 'Y';
  }

  getLegalColumns(): number[] {
    const columns: number[] = [];

    for(let col = 0; col < COLS; col += 1) {
      if(this.board[this.getIndex(0, col)] === null) {
        columns.push(col);
      }
    }

    return columns;
  }

  getLegalMoves(): string[] {
    return this.getLegalColumns().map((column) => column.toString());
  }

  getDropRow(column: number): number | null {
    if(column < 0 || column >= COLS) {
      return null;
    }

    for(let row = ROWS - 1; row >= 0; row -= 1) {
      if(this.board[this.getIndex(row, column)] === null) {
        return row;
      }
    }

    return null;
  }

  makeColumnMove(column: number): ConnectFourState {
    const row = this.getDropRow(column);
    if(row === null) {
      throw new Error(`Illegal Connect Four move: ${column}`);
    }

    const nextBoard = [...this.board];
    const index = this.getIndex(row, column);
    nextBoard[index] = this.team;
    return new ConnectFourState(nextBoard, !this.team, index);
  }

  makeMove(move: string): ConnectFourState {
    const column = Number.parseInt(move, 10);
    if(!Number.isInteger(column)) {
      throw new Error(`Invalid Connect Four move: ${move}`);
    }

    return this.makeColumnMove(column);
  }

  isTerminal(): boolean {
    return this.getWinningLine() !== null || this.board.every((cell) => cell !== null);
  }

  getReward(team?: string): number {
    void team;
    return this.getWinningLine() ? 1 : 0;
  }

  getWinner(): boolean | null {
    const winningLine = this.getWinningLine();
    if(!winningLine) {
      return null;
    }

    return this.board[winningLine[0]];
  }

  getWinningLine(): number[] | null {
    for(let row = 0; row < ROWS; row += 1) {
      for(let col = 0; col < COLS; col += 1) {
        const startIndex = this.getIndex(row, col);
        const cell = this.board[startIndex];
        if(cell === null) {
          continue;
        }

        for(const [rowDelta, colDelta] of DIRECTIONS) {
          const line = this.collectLine(row, col, rowDelta, colDelta);
          if(line) {
            return line;
          }
        }
      }
    }

    return null;
  }

  toString(): string {
    const rows: string[] = [];

    for(let row = 0; row < ROWS; row += 1) {
      let rowString = '';
      for(let col = 0; col < COLS; col += 1) {
        const cell = this.board[this.getIndex(row, col)];
        rowString += cell === null ? '.' : (cell ? 'R' : 'Y');
      }
      rows.push(rowString);
    }

    return `${this.getCurrentTeam()}: ${rows.join('/')}`;
  }

  private collectLine(
    startRow: number,
    startCol: number,
    rowDelta: number,
    colDelta: number,
  ): number[] | null {
    const indexes = [this.getIndex(startRow, startCol)];
    const firstCell = this.board[indexes[0]];

    for(let step = 1; step < WIN_LENGTH; step += 1) {
      const row = startRow + (rowDelta * step);
      const col = startCol + (colDelta * step);
      if(row < 0 || row >= ROWS || col < 0 || col >= COLS) {
        return null;
      }

      const index = this.getIndex(row, col);
      if(this.board[index] !== firstCell) {
        return null;
      }

      indexes.push(index);
    }

    return indexes;
  }

  private getIndex(row: number, col: number) {
    return (row * COLS) + col;
  }
}
