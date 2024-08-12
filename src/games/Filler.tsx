// src/games/Filler.tsx
import React from 'react';
import { Game } from '../types/Game';
import { GameState } from 'multimcts';

const BOARD_SIZE = 7;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const COLOR_COUNT = COLORS.length;

const isFillerState = (state:GameState): state is FillerState => {
  return state instanceof FillerState;
};

const render = (state:GameState, onMove:(move:number) => void) => {
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

      <div className="grid grid-cols-7 gap-1">
        {Array.from(state.board).map((colorIndex, index) => (
          <div
            key={index}
            className={`w-8 h-8 ${[0,TOTAL_CELLS-1].includes(index) ? 'border-black border-4' : ''}`}
            style={{ backgroundColor: COLORS[colorIndex] }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center">
        Player {state.getCurrentTeam()}
        <div className="flex flex-row gap-2">
          {state.getLegalMoves().map((colorIndex) => (
            <button key={colorIndex} className="w-14 h-14" style={{ backgroundColor: COLORS[colorIndex] }} onClick={() => onMove(colorIndex)}></button>
          ))}
        </div>
      </div>
    </div>
  );
};

class FillerState extends GameState {
  board: Uint8Array;
  team: boolean;

  constructor(board?: Uint8Array, team?: boolean) {
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

  makeMove(move: string): GameState {
    const newColor = parseInt(move);
    const oldColor = this.team ? this.board[0] : this.board[TOTAL_CELLS-1];
    const newBoard = new Uint8Array(this.board);
    this._floodFill(newBoard, (this.team?0:TOTAL_CELLS-1), oldColor, newColor);
    return new FillerState(newBoard, !this.team);
  }

  isTerminal(): boolean {
    const activeColors = new Set([this.board[0], this.board[TOTAL_CELLS-1]]);
    for(let i = 0; i < TOTAL_CELLS; i++) {
      if(!activeColors.has(this.board[i])) return false;
    }
    return true;
  }

  getReward(): number {
    const color = this.board[0];
    let score = 0;
    for(let i = 0; i < TOTAL_CELLS; i++) {
      if(this.board[i] === color) score++;
      else score--;
    }
    const terminalTeam = !this.team;
    if(!terminalTeam) score *= -1;
    return score;
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

  _floodFill(board:Uint8Array, index:number, oldColor:number, newColor:number) {
    if(index < 0 || index >= TOTAL_CELLS || board[index] !== oldColor) return;

    board[index] = newColor;

    const row = (index / BOARD_SIZE) | 0;
    const col = index % BOARD_SIZE;

    if(row > 0) this._floodFill(board, index - BOARD_SIZE, oldColor, newColor);
    if(row < BOARD_SIZE - 1) this._floodFill(board, index + BOARD_SIZE, oldColor, newColor);
    if(col > 0) this._floodFill(board, index - 1, oldColor, newColor);
    if(col < BOARD_SIZE - 1) this._floodFill(board, index + 1, oldColor, newColor);
  }
}

const Filler: Game = {
  name: "Filler",
  createInitialState: (): GameState => new FillerState(),
  render: render,
};

export default Filler;
