import { GameState } from 'multimcts';

export const ROWS = 8;
export const COLS = 8;
export const TOTAL_CELLS = ROWS * COLS;

export type CellState = boolean | null;
export type OthelloMove = number | 'pass';

const DIRECTIONS: Array<[rowDelta: number, colDelta: number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export class OthelloState extends GameState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;

  constructor(
    board = OthelloState.initializeBoard(),
    team = true,
    lastMove: number | null = null,
  ) {
    super();
    this.board = [...board];
    this.team = team;
    this.lastMove = lastMove;
  }

  getCurrentTeam(): string {
    return this.team ? 'B' : 'W';
  }

  getLegalPlacementMoves(): number[] {
    return this.getLegalPlacementMovesForTeam(this.team);
  }

  getLegalMoves(): string[] {
    if(this.isTerminal()) {
      return [];
    }

    const moves = this.getLegalPlacementMoves();
    if(moves.length > 0) {
      return moves.map((move) => move.toString());
    }

    return ['pass'];
  }

  makeDiscMove(index: number): OthelloState {
    const flips = this.getFlips(index, this.team);
    if(flips.length === 0) {
      throw new Error(`Illegal Othello move: ${index}`);
    }

    const nextBoard = [...this.board];
    nextBoard[index] = this.team;

    for(const flipIndex of flips) {
      nextBoard[flipIndex] = this.team;
    }

    return new OthelloState(nextBoard, !this.team, index);
  }

  makePassMove(): OthelloState {
    if(this.isTerminal() || this.getLegalPlacementMoves().length > 0) {
      throw new Error('Illegal Othello pass');
    }

    return new OthelloState(this.board, !this.team, null);
  }

  makeTypedMove(move: OthelloMove): OthelloState {
    return move === 'pass' ? this.makePassMove() : this.makeDiscMove(move);
  }

  makeMove(move: string): OthelloState {
    if(move === 'pass') {
      return this.makePassMove();
    }

    const index = Number.parseInt(move, 10);
    if(!Number.isInteger(index)) {
      throw new Error(`Invalid Othello move: ${move}`);
    }

    return this.makeDiscMove(index);
  }

  isTerminal(): boolean {
    return this.board.every((cell) => cell !== null)
      || (
        this.getLegalPlacementMovesForTeam(true).length === 0
        && this.getLegalPlacementMovesForTeam(false).length === 0
      );
  }

  getReward() {
    const { black, white } = this.getScore();

    if(black === white) {
      return { B: 0.5, W: 0.5 };
    }

    return black > white
      ? { B: 1, W: 0 }
      : { B: 0, W: 1 };
  }

  getWinner(): boolean | null {
    const { black, white } = this.getScore();

    if(black === white) {
      return null;
    }

    return black > white;
  }

  getScore() {
    let black = 0;
    let white = 0;

    for(const cell of this.board) {
      if(cell === true) {
        black += 1;
      } else if(cell === false) {
        white += 1;
      }
    }

    return { black, white };
  }

  toString(): string {
    const rows: string[] = [];

    for(let row = 0; row < ROWS; row += 1) {
      let rowString = '';

      for(let col = 0; col < COLS; col += 1) {
        const cell = this.board[this.getIndex(row, col)];
        rowString += cell === null ? '.' : (cell ? 'B' : 'W');
      }

      rows.push(rowString);
    }

    return `${this.getCurrentTeam()}: ${rows.join('/')}`;
  }

  static initializeBoard(): CellState[] {
    const board = Array<CellState>(TOTAL_CELLS).fill(null);

    board[(3 * COLS) + 3] = false;
    board[(3 * COLS) + 4] = true;
    board[(4 * COLS) + 3] = true;
    board[(4 * COLS) + 4] = false;

    return board;
  }

  private getLegalPlacementMovesForTeam(team: boolean): number[] {
    const moves: number[] = [];

    for(let index = 0; index < TOTAL_CELLS; index += 1) {
      if(this.board[index] !== null) {
        continue;
      }

      if(this.getFlips(index, team).length > 0) {
        moves.push(index);
      }
    }

    return moves;
  }

  private getFlips(index: number, team: boolean): number[] {
    if(index < 0 || index >= TOTAL_CELLS || this.board[index] !== null) {
      return [];
    }

    const row = Math.floor(index / COLS);
    const col = index % COLS;
    const opponent = !team;
    const flips: number[] = [];

    for(const [rowDelta, colDelta] of DIRECTIONS) {
      const line: number[] = [];
      let nextRow = row + rowDelta;
      let nextCol = col + colDelta;

      while(nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) {
        const nextIndex = this.getIndex(nextRow, nextCol);
        const cell = this.board[nextIndex];

        if(cell === opponent) {
          line.push(nextIndex);
          nextRow += rowDelta;
          nextCol += colDelta;
          continue;
        }

        if(cell === team && line.length > 0) {
          flips.push(...line);
        }

        break;
      }
    }

    return flips;
  }

  private getIndex(row: number, col: number) {
    return (row * COLS) + col;
  }
}
