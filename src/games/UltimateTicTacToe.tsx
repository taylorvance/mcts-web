// src/games/UltimateTicTacToe.tsx
import { Game } from '../types/Game';
import { GameState } from 'multimcts';
import { FaX, FaO, FaCat } from "react-icons/fa6";

// Type guard to check if state is UltimateTicTacToeState
const isUltimateTicTacToeState = (state: GameState): state is UltimateTicTacToeState => {
  return (state as UltimateTicTacToeState).board !== undefined;
};

const render = (state:GameState, onMove:(move:string) => void) => {
  if (!isUltimateTicTacToeState(state)) {
    throw new Error("Invalid state type");
  }

  const X_FG="text-red-600", X_BG="bg-red-200";
  const O_FG="text-blue-600", O_BG="bg-blue-200";

  const boards = [];
  for (let i=0; i<9; i++) {
    const minIdx = i * 9;
    boards.push(state.board.slice(minIdx, minIdx+9));
  }

  const boardStates = state.boardStates;
  const prevCellIdx = state.prevMove;
  const isTerminal = state.isTerminal();
  const legalMoves = isTerminal ? [] : state.getLegalMoves();

  return (
    <div className="grid grid-cols-3 gap-3 text-2xl font-bold select-none cursor-default">
      {boards.map((board, boardIdx) => {
        const boardState:BoardState = boardStates[boardIdx];
        const isOpen = boardState === undefined;

        return (
          <div key={boardIdx} className="relative">
            <div key={boardIdx} className="grid grid-cols-3 gap-0.5">
              {board.map((cell, j) => {
                const cellIdx = 9*boardIdx + j;
                const isPlayable = !isTerminal && isOpen && legalMoves.includes(cellIdx.toString());

                let cellClass = "w-9 h-9 flex items-center justify-center border border-gray-700";
                if (isPlayable) {
                  cellClass += " cursor-pointer border-2 " + (state.team ? X_BG : O_BG);
                } else {
                  cellClass += " bg-gray-200";
                }
                if (cell !== undefined) cellClass += " " + (cell ? X_FG : O_FG);
                if (cellIdx === prevCellIdx) cellClass += " border-4 border-gray-800";

                return (
                  <div key={j} className={cellClass} onClick={() => isPlayable && onMove(cellIdx.toString())}>
                    {cell!==undefined && (cell ? <FaX /> : <FaO />)}
                  </div>
                );
              })}
            </div>

            {!isOpen && (
              <div className="absolute inset-0 flex items-center justify-center opacity-50">
                {boardState===null
                  ? <FaCat style={{fontSize:'5em'}} />
                  : (boardState
                    ? <FaX style={{fontSize:'5em'}} className={X_FG} />
                    : <FaO style={{fontSize:'5em'}} className={O_FG} />
                  )
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

type CellState = boolean | undefined; // true: X; false: O; undefined: empty
type BoardState = boolean | null | undefined; // true: X wins; false: O wins: null: draw; undefined: still playable

class UltimateTicTacToeState extends GameState {
  board: CellState[]; // 3x3 grid of 3x3 grids
  team: boolean;
  prevMove?: number; // this tells the player which grid to play in
  boardStates: BoardState[]; // (cached for performance)

  constructor(board=Array(81).fill(undefined), team=true, prevMove?:number, boardStates=Array(9).fill(undefined)) {
    super();
    this.board = board; 
    this.team = team;
    this.prevMove = prevMove;
    this.boardStates = boardStates;
  }

  getCurrentTeam(): string { return this.team ? 'X' : 'O'; }

  getLegalMoves(): string[] {
    const moves:string[] = [];

    if (this.prevMove === undefined) {
      // First move, empty board. Free move.
      for (let i=0; i<81; i++) {
        moves.push(i.toString());
      }
      return moves;
    }

    const addMovesForBoard = (boardIdx:number) => { // helper function for DRY
      const minIdx = 9 * boardIdx;
      const maxIdx = minIdx + 9;
      for (let i=minIdx; i<maxIdx; i++) {
        if (this.board[i] === undefined) {
          moves.push(i.toString());
        }
      }
    };
    const nextBoardIdx = this.prevMove % 9;

    if(this.boardStates[nextBoardIdx] !== undefined) {
      // Destination board is closed. Free move.
      for (let boardIdx=0; boardIdx<9; boardIdx++) {
        if (this.boardStates[boardIdx] !== undefined) continue;
        addMovesForBoard(boardIdx);
      }
      return moves;
    }

    // Play on the destination board.
    addMovesForBoard(nextBoardIdx);
    return moves;
  }

  makeMove(move:string): UltimateTicTacToeState {
    const moveIdx = parseInt(move);

    // Update the big board.
    const newBoard = [...this.board];
    newBoard[moveIdx] = this.team;

    // Update the board state cache.
    const newBoardStates = [...this.boardStates];
    const boardIdx = Math.floor(moveIdx / 9);
    const minIdx = 9 * boardIdx;
    newBoardStates[boardIdx] = UltimateTicTacToeState._calcBoardState(newBoard.slice(minIdx, minIdx+9));

    return new UltimateTicTacToeState(newBoard, !this.team, moveIdx, newBoardStates);
  }

  isTerminal(): boolean { return !this._hasOpenBoards() || this._hasWinner(); }

  getReward(_:string): number { return this._hasWinner() ? 1 : 0; }

  toString(): string {
    let str = this.getCurrentTeam() + ": ";
    for (let i=0; i<this.board.length; i++) {
      str += this.board[i]===undefined ? '.' : (this.board[i] ? 'X' : 'O');
      if (i % 27 === 26) {
        str += '-'; // separate rows of sub-boards
      } else if (i % 9 === 8) {
        str += '|'; // separate horizontally adjacent sub-boards
      } else if (i % 3 === 2) {
        str += '/'; // separate rows within a sub-board
      }
    }
    return str;
  }

  _toString2(): string {
    const lines:string[] = [];

    for(let bigRow=0; bigRow<3; bigRow++) {
      for(let row=0; row<3; row++) {
        const line: string[] = [];

        for(let bigCol=0; bigCol<3; bigCol++) {
          const subBoardIndex = bigRow * 3 + bigCol;
          const start = subBoardIndex * 9 + row * 3;

          const segment = this.board.slice(start, start+3).map(val => val===true? 'X' : (val===false ? 'O' : '.'));
          line.push(segment.join(''));
        }

        lines.push(line.join('|'));
      }

      if(bigRow < 2) lines.push('---+---+---');
    }

    return lines.join('\n');
  }


  _hasOpenBoards(): boolean {
    return this.boardStates.some((boardState) => boardState===undefined);
  }

  _hasWinner(): boolean {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8], // rows
      [0,3,6], [1,4,7], [2,5,8], // columns
      [0,4,8], [2,4,6], // diagonals
    ];
    for (const [a,b,c] of lines) {
      if (typeof this.boardStates[a] === 'boolean' && this.boardStates[a]===this.boardStates[b] && this.boardStates[a]===this.boardStates[c]) {
        return true; // has winner
      }
    }
    return false; // no winner
  }

  static _calcBoardState(board:CellState[]): BoardState {
    // Early exit if there aren't enough cells for a win.
    let xCells=0, oCells=0;
    for (const cell of board) {
      if (cell === true) xCells++;
      else if (cell === false) oCells++;
    }
    if (xCells<3 && oCells<3) return undefined; // board is still playable

    // Check for win.
    const lines = [
      [0,1,2], [3,4,5], [6,7,8], // rows
      [0,3,6], [1,4,7], [2,5,8], // columns
      [0,4,8], [2,4,6], // diagonals
    ];
    for (const [a,b,c] of lines) {
      if (board[a]!==undefined && board[a]===board[b] && board[a]===board[c]) {
        return board[a]; // has winner
      }
    }

    // Check for draw.
    if (board.every((cell) => cell!==undefined)) { // if every cell is filled
      return null; // draw
    }

    return undefined; // board is still playable
  }
}

const UltimateTicTacToe: Game = {
  name: "UltimateTicTacToe",
  createInitialState: () => new UltimateTicTacToeState(),
  render,
};

export default UltimateTicTacToe;
