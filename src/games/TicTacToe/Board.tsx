import { FaCat, FaO, FaX } from 'react-icons/fa6';
import { TypedGameBoardProps } from '../../types/Game';
import TicTacToeState from './state';

const TicTacToeBoard = ({ state, onMove }: TypedGameBoardProps<TicTacToeState, number>) => {
  const isTerminal = state.isTerminal();

  let result = undefined;
  if(isTerminal) {
    if(state.getReward('moot') === 0) {
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
          onClick={() => onMove(index)}
          disabled={cell !== null || isTerminal}
        >
          {cell !== null && (cell ? <FaX /> : <FaO />)}
        </button>
      ))}
      {result !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center opacity-70" style={{ fontSize: '15em' }}>
          {result === null ? <FaCat /> : (result ? <FaX className="text-red-600" /> : <FaO className="text-blue-600" />)}
        </div>
      )}
    </div>
  );
};

export default TicTacToeBoard;
