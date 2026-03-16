import { GameState } from 'multimcts';

export const ROWS = 7;
export const COLS = 8;
export const TOTAL_CELLS = ROWS * COLS;
export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const COLOR_COUNT = COLORS.length;

export class FillerState extends GameState {
  board: Uint8Array;
  team: boolean;

  constructor(board?: Uint8Array, team = true) {
    super();
    this.board = board ?? FillerState.initializeBoard();
    this.team = team;
  }

  getCurrentTeam(): string {
    return this.team ? '1' : '2';
  }

  getLegalColorMoves(): number[] {
    const moves: number[] = [];
    const activeColors = [this.board[0], this.board[TOTAL_CELLS - 1]];
    const found = new Uint8Array(COLOR_COUNT);

    for(let i = 0; i < TOTAL_CELLS; i++) {
      const color = this.board[i];
      if(!found[color]) {
        found[color] = 1;
        if(color !== activeColors[0] && color !== activeColors[1]) {
          moves.push(color);
        }
      }
    }

    return moves;
  }

  getLegalMoves(): string[] {
    return this.getLegalColorMoves().map((move) => move.toString());
  }

  applyColorMove(newColor: number): FillerState {
    const oldColor = this.team ? this.board[0] : this.board[TOTAL_CELLS - 1];
    const newBoard = new Uint8Array(this.board);
    this.floodFill(newBoard, this.team ? 0 : TOTAL_CELLS - 1, oldColor, newColor);
    return new FillerState(newBoard, !this.team);
  }

  makeMove(move: string): FillerState {
    return this.applyColorMove(parseInt(move, 10));
  }

  isTerminal(): boolean {
    return new Set(this.board).size === 2;
  }

  getTerritory() {
    let player1 = 0;
    let player2 = 0;
    const color1 = this.board[0];
    const color2 = this.board[TOTAL_CELLS - 1];

    for(let i = 0; i < TOTAL_CELLS; i++) {
      if(this.board[i] === color1) player1++;
      else if(this.board[i] === color2) player2++;
    }

    return { player1, player2 };
  }

  getReward() {
    const rewards: Record<string, number> = { '1': 0, '2': 0 };
    const player1Color = this.board[0];

    for(let i = 0; i < TOTAL_CELLS; i++) {
      if(this.board[i] === player1Color) rewards['1']++;
      else rewards['2']++;
    }

    rewards['1'] /= TOTAL_CELLS;
    rewards['2'] /= TOTAL_CELLS;
    return rewards;
  }

  toString(): string {
    const board = Array.from(this.board).map((colorIndex, index) => {
      let cell = COLORS[colorIndex][0];
      if(index > 0 && index % COLS === 0) {
        cell = `/${cell}`;
      }

      return cell;
    }).join('');

    return `${this.getCurrentTeam()} ${board}`;
  }

  static initializeBoard(): Uint8Array {
    const board = new Uint8Array(TOTAL_CELLS);

    for(let i = 0; i < TOTAL_CELLS; i++) {
      board[i] = Math.floor(Math.random() * COLOR_COUNT);
    }

    if(board[0] === board[TOTAL_CELLS - 1]) {
      board[TOTAL_CELLS - 1] = (board[TOTAL_CELLS - 1] + 1) % COLOR_COUNT;
    }

    return board;
  }

  private floodFill(board: Uint8Array, index: number, oldColor: number, newColor: number) {
    if(oldColor === newColor || board[index] !== oldColor) return;

    const queue = new Uint32Array(TOTAL_CELLS);
    let head = 0;
    let tail = 0;
    queue[tail++] = index;
    board[index] = newColor;

    while(head < tail) {
      const current = queue[head++];
      const row = (current / COLS) | 0;
      const col = current % COLS;

      if(row > 0) {
        const up = current - COLS;
        if(board[up] === oldColor) {
          queue[tail++] = up;
          board[up] = newColor;
        }
      }

      if(row < ROWS - 1) {
        const down = current + COLS;
        if(board[down] === oldColor) {
          queue[tail++] = down;
          board[down] = newColor;
        }
      }

      if(col > 0) {
        const left = current - 1;
        if(board[left] === oldColor) {
          queue[tail++] = left;
          board[left] = newColor;
        }
      }

      if(col < COLS - 1) {
        const right = current + 1;
        if(board[right] === oldColor) {
          queue[tail++] = right;
          board[right] = newColor;
        }
      }
    }
  }
}
