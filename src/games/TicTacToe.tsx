// src/games/TicTacToe.tsx
import TicTacToeState from 'multimcts/tictactoe';
import { Game, GameBoardProps } from '../types/Game';
import { GameState } from 'multimcts';
import { FaX, FaO, FaCat } from "react-icons/fa6";

// Type guard to check if state is TicTacToeState
const isTicTacToeState = (state: GameState): state is TicTacToeState => {
  return (state as TicTacToeState).board !== undefined;
};

const TicTacToeBoard = ({ state, onMove }: GameBoardProps) => {
  if (!isTicTacToeState(state)) {
    throw new Error("Invalid state type");
  }

  const isTerminal = state.isTerminal();

  let result = undefined;
  if (isTerminal) {
    if (state.getReward('moot') === 0) {
      result = null;
    } else {
      result = !state.team;
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 relative">
      {state.board.map((cell, index) => (
        <button
          key={index}
          className={`w-20 h-20 bg-gray-200 flex items-center justify-center text-6xl ${cell===null ? '' : (cell ? 'text-red-600' : 'text-blue-600')}`}
          onClick={() => onMove(index.toString())}
          disabled={cell!==null || isTerminal}
        >{cell!==null && (cell ? <FaX /> : <FaO />)}</button>
      ))}
      {result!==undefined && (
        <div className="absolute inset-0 flex items-center justify-center opacity-70" style={{fontSize:'15em'}}>
          {result===null ? <FaCat /> : (result ? <FaX className="text-red-600" /> : <FaO className="text-blue-600" />)}
        </div>
      )}
    </div>
  );
};

const TicTacToe: Game = {
  name: "TicTacToe",
  createInitialState: () => new TicTacToeState(),
  Board: TicTacToeBoard,
};

export default TicTacToe;
