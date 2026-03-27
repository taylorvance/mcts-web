import { GameState } from 'multimcts';

export type CellState = boolean | undefined;
export type BoardState = boolean | null | undefined;

export class UltimateTicTacToeState extends GameState<number, 'X' | 'O', UltimateTicTacToeState> {
  board: CellState[];
  team: boolean;
  prevMove?: number;
  boardStates: BoardState[];

  constructor(
    board = Array(81).fill(undefined),
    team = true,
    prevMove?: number,
    boardStates = Array(9).fill(undefined),
  ) {
    super();
    this.board = board;
    this.team = team;
    this.prevMove = prevMove;
    this.boardStates = boardStates;
  }

  getCurrentTeam(): 'X' | 'O' {
    return this.team ? 'X' : 'O';
  }

  private isOpenBoard(boardIdx: number): boolean {
    return this.boardStates[boardIdx] === undefined;
  }

  private canPlayInBoard(boardIdx: number): boolean {
    if(!this.isOpenBoard(boardIdx)) {
      return false;
    }

    if(this.prevMove === undefined) {
      return true;
    }

    const requiredBoardIdx = this.prevMove % 9;
    return this.isOpenBoard(requiredBoardIdx)
      ? boardIdx === requiredBoardIdx
      : true;
  }

  getLegalMoves(): number[] {
    const moves: number[] = [];

    if(this.prevMove === undefined) {
      for(let i = 0; i < 81; i++) {
        moves.push(i);
      }
      return moves;
    }

    const addMovesForBoard = (boardIdx: number) => {
      if(!this.canPlayInBoard(boardIdx)) {
        return;
      }

      const minIdx = 9 * boardIdx;
      const maxIdx = minIdx + 9;
      for(let i = minIdx; i < maxIdx; i++) {
        if(this.board[i] === undefined) {
          moves.push(i);
        }
      }
    };
    const nextBoardIdx = this.prevMove % 9;

    if(this.boardStates[nextBoardIdx] !== undefined) {
      for(let boardIdx = 0; boardIdx < 9; boardIdx++) {
        if(this.boardStates[boardIdx] !== undefined) continue;
        addMovesForBoard(boardIdx);
      }
      return moves;
    }

    addMovesForBoard(nextBoardIdx);
    return moves;
  }

  makeMove(move: number): UltimateTicTacToeState {
    const moveIdx = move;
    const newBoard = [...this.board];
    newBoard[moveIdx] = this.team;

    const newBoardStates = [...this.boardStates];
    const boardIdx = Math.floor(moveIdx / 9);
    const minIdx = 9 * boardIdx;
    newBoardStates[boardIdx] = UltimateTicTacToeState.calcBoardState(newBoard.slice(minIdx, minIdx + 9));

    return new UltimateTicTacToeState(newBoard, !this.team, moveIdx, newBoardStates);
  }

  isTerminal(): boolean {
    return !this.hasOpenBoards() || this.hasWinner();
  }

  getReward(team?: string): number {
    void team;
    return this.hasWinner() ? 1 : 0;
  }

  toString(): string {
    let str = `${this.getCurrentTeam()}: `;
    for(let i = 0; i < this.board.length; i++) {
      str += this.board[i] === undefined ? '.' : (this.board[i] ? 'X' : 'O');
      if(i % 27 === 26) {
        str += '-';
      } else if(i % 9 === 8) {
        str += '|';
      } else if(i % 3 === 2) {
        str += '/';
      }
    }
    return str;
  }

  hasOpenBoards(): boolean {
    return this.boardStates.some((boardState) => boardState === undefined);
  }

  hasWinner(): boolean {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for(const [a, b, c] of lines) {
      if(typeof this.boardStates[a] === 'boolean' && this.boardStates[a] === this.boardStates[b] && this.boardStates[a] === this.boardStates[c]) {
        return true;
      }
    }
    return false;
  }

  static calcBoardState(board: CellState[]): BoardState {
    let xCells = 0;
    let oCells = 0;
    for(const cell of board) {
      if(cell === true) xCells++;
      else if(cell === false) oCells++;
    }
    if(xCells < 3 && oCells < 3) return undefined;

    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for(const [a, b, c] of lines) {
      if(board[a] !== undefined && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if(board.every((cell) => cell !== undefined)) {
      return null;
    }

    return undefined;
  }
}
