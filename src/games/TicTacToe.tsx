// src/games/TicTacToe.tsx
import TicTacToeState from 'multimcts/tictactoe';
import { Game } from '../types/Game';
import { GameState } from 'multimcts';

// Type guard to check if state is TicTacToeState
const isTicTacToeState = (state: GameState): state is TicTacToeState => {
  return (state as TicTacToeState).board !== undefined;
};

const render = (state:GameState, onMove:(move:string) => void) => {
  if (!isTicTacToeState(state)) {
    throw new Error("Invalid state type");
  }

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
  render: render,
};

export default TicTacToe;
