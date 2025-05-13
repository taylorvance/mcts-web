// src/games/Filler.tsx
import { Game } from '../types/Game';
import { GameState } from 'multimcts';

const ROWS = 7;
const COLS = 8;
const TOTAL_CELLS = ROWS * COLS;
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const COLOR_COUNT = COLORS.length;

const isFillerState = (state:GameState): state is FillerState => {
  return state instanceof FillerState;
};

const render = (state:GameState, onMove:(move:string) => void) => {
  if(!isFillerState(state)) {
    throw new Error("Invalid state type");
  }

  let score1 = 0;
  let score2 = 0;
  const color1 = state.board[0];
  const color2 = state.board[TOTAL_CELLS-1];
  for(let i = 0; i < TOTAL_CELLS; i++) {
    if(state.board[i] === color1) score1++;
    else if(state.board[i] === color2) score2++;
  }

  return (
    <div className="flex flex-col items-center gap-4 text-xl font-bold font-mono">
      <div className="w-full flex flex-row border-4 border-black">
        <div className="text-start ps-2" style={{ width: `${(score1 / TOTAL_CELLS) * 100}%`, backgroundColor: COLORS[state.board[0]] }}>{score1}</div>
        <div className="text-center bg-white" style={{ width: `${((TOTAL_CELLS - score1 - score2) / TOTAL_CELLS) * 100}%` }} />
        <div className="text-end pe-2" style={{ width: `${(score2 / TOTAL_CELLS) * 100}%`, backgroundColor: COLORS[state.board[TOTAL_CELLS-1]] }}>{score2}</div>
      </div>

      <div className="grid gap-1" style={{gridTemplateColumns:`repeat(${COLS},minmax(0,1fr))`}}>
        {Array.from(state.board).map((colorIndex, index) => (
          <div key={index} className={`w-8 h-8 ${[0,TOTAL_CELLS-1].includes(index) ? 'border-black border-4' : ''}`} style={{ backgroundColor: COLORS[colorIndex] }} />
        ))}
      </div>

      <div className="flex flex-col items-center">
        Player {state.getCurrentTeam()}
        <div className="flex flex-row gap-2">
          {state.getLegalMoves().map((move:string) => (
            <button key={move} className="w-16 h-16" style={{ backgroundColor: COLORS[parseInt(move)] }} onClick={() => onMove(move)} />
          ))}
        </div>
      </div>
    </div>
  );
};

class FillerState extends GameState {
  board: Uint8Array;
  team: boolean;

  constructor(board?:Uint8Array, team?:boolean) {
    super();
    this.board = board || new Uint8Array(TOTAL_CELLS);
    this.team = team ?? true;
    if(!board) this.board = FillerState._initializeBoard();
  }

  getCurrentTeam(): string { return this.team ? '1' : '2'; }

  getLegalMoves(): string[] {
    const moves = [];
    const activeColors = new Set([this.board[0], this.board[TOTAL_CELLS-1]]);
    const uniqueColors = new Set(this.board);
    for(let i = 0; i < COLOR_COUNT; i++) {
      if(!activeColors.has(i) && uniqueColors.has(i)) moves.push(i.toString());
    }
    return moves;
  }

  makeMove(move:string): GameState {
    const newColor = parseInt(move);
    const oldColor = this.team ? this.board[0] : this.board[TOTAL_CELLS-1];
    const newBoard = new Uint8Array(this.board);
    this._floodFill(newBoard, (this.team?0:TOTAL_CELLS-1), oldColor, newColor);
    return new FillerState(newBoard, !this.team);
  }

  isTerminal(): boolean { return new Set(this.board).size === 2; }

  getReward() {
    const rewards = {'1':0, '2':0};
    const p1 = this.board[0];
    for(let i = 0; i < TOTAL_CELLS; i++) {
      if(this.board[i] === p1) rewards['1']++;
      else rewards['2']++;
    }
    if(1) {
      // return their actual scores
      if(1) {
        // (normalized)
        rewards['1'] /= TOTAL_CELLS;
        rewards['2'] /= TOTAL_CELLS;
      }
      return rewards;
    } else {
      // 1 for win, -1 for loss
      if(!this.team && rewards['1'] > rewards['2']) return 1;
      if(this.team && rewards['2'] > rewards['1']) return 1;
      if(rewards['1'] === rewards['2']) return 0;
      return -1;
    }
  }

  toString(): string {
    let board = Array.from(this.board).map((colorIndex, index) => {
      let cell = COLORS[colorIndex][0];
      //if(index===0 || index===TOTAL_CELLS-1) cell = cell.toUpperCase();
      if(index>0 && index%COLS===0) cell = '/' + cell;
      return cell;
    }).join('');
    return this.getCurrentTeam() + ' ' + board;
  }

  static _initializeBoard() {
    const board = new Uint8Array(TOTAL_CELLS);
    for(let i = 0; i < TOTAL_CELLS; i++) {
      board[i] = Math.floor(Math.random() * COLOR_COUNT);
    }
    if(board[0] === board[TOTAL_CELLS-1]) {
      board[TOTAL_CELLS-1] = (board[TOTAL_CELLS-1]+1) % COLOR_COUNT;
    }
    return board;
  }

  _floodFill(board: Uint8Array, index: number, oldColor: number, newColor: number) {
    if (oldColor === newColor || board[index] !== oldColor) return;

    const board1 = new Uint8Array(board);
    const board2 = new Uint8Array(board);
    const board3 = new Uint8Array(board);

    // Recursive
    const t1 = performance.now();
    const recurse = (b, i) => {
      if (i < 0 || i >= TOTAL_CELLS || b[i] !== oldColor) return;
      b[i] = newColor;
      const row = (i / COLS) | 0;
      const col = i % COLS;
      if (row > 0) recurse(b, i - COLS);
      if (row < ROWS - 1) recurse(b, i + COLS);
      if (col > 0) recurse(b, i - 1);
      if (col < COLS - 1) recurse(b, i + 1);
    };
    recurse(board1, index);
    const t2 = performance.now();

    // Iterative DFS
    const stack = [index];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current < 0 || current >= TOTAL_CELLS || board2[current] !== oldColor) continue;
      board2[current] = newColor;
      const row = (current / COLS) | 0;
      const col = current % COLS;
      if (row > 0) stack.push(current - COLS);
      if (row < ROWS - 1) stack.push(current + COLS);
      if (col > 0) stack.push(current - 1);
      if (col < COLS - 1) stack.push(current + 1);
    }
    const t3 = performance.now();

    // BFS with Preallocated Queue
    const queue = new Uint32Array(TOTAL_CELLS);
    let head = 0, tail = 0;
    queue[tail++] = index;
    board3[index] = newColor;

    while (head < tail) {
      const current = queue[head++];
      const row = (current / COLS) | 0;
      const col = current % COLS;

      if (row > 0) {
        const up = current - COLS;
        if (board3[up] === oldColor) {
          queue[tail++] = up;
          board3[up] = newColor;
        }
      }
      if (row < ROWS - 1) {
        const down = current + COLS;
        if (board3[down] === oldColor) {
          queue[tail++] = down;
          board3[down] = newColor;
        }
      }
      if (col > 0) {
        const left = current - 1;
        if (board3[left] === oldColor) {
          queue[tail++] = left;
          board3[left] = newColor;
        }
      }
      if (col < COLS - 1) {
        const right = current + 1;
        if (board3[right] === oldColor) {
          queue[tail++] = right;
          board3[right] = newColor;
        }
      }
    }
    const t4 = performance.now();

    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (board1[i] !== board2[i] || board2[i] !== board3[i]) {
        console.error(`Flood fill mismatch at cell ${i}: Rec=${board1[i]}, DFS=${board2[i]}, BFS=${board3[i]}`);
        alert(`Flood fill mismatch at cell ${i}. Check console for details.`);
        throw new Error('Flood fill methods produced inconsistent results.');
      }
    }

    // Accumulate times
    floodFillTimes.recursive += t2 - t1;
    floodFillTimes.dfs      += t3 - t2;
    floodFillTimes.bfs      += t4 - t3;
    floodFillTimes.calls++;

    if (floodFillTimes.calls % 10000 === 0) {
      console.log(floodFillTimes);
    }

    // Apply one result to the board
    board.set(board3);
  }
}

let floodFillTimes = {
  recursive: 0,
  dfs: 0,
  bfs: 0,
  calls: 0,
};

const Filler: Game = {
  name: "Filler",
  createInitialState: (): GameState => new FillerState(),
  render,
};

export default Filler;
