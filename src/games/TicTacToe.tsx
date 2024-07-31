// src/games/TicTacToe.ts
import React from 'react';
import { GameState } from 'multimcts';
import TicTacToeState from 'multimcts/tictactoe';
import { Game } from '../types/Game';

const renderBoard = (state:TicTacToeState, onMove:(move:string) => void) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {state.board.map((cell, index) => (
        <button
          key={index}
          className="w-20 h-20 bg-gray-200 flex items-center justify-center text-6xl font-bold"
          onClick={() => onMove(index.toString())}
          disabled={cell!==null || state.isTerminal()}
        >
          {cell===null ? '' : (cell?'X':'O')}
        </button>
      ))}
    </div>
  );
};

const TicTacToe: Game = {
  name: "TicTacToe",
  createInitialState: () => new TicTacToeState(),
  renderBoard: renderBoard,
};

export default TicTacToe;
