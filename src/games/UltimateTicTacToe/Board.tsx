import { FaCat, FaO, FaX } from 'react-icons/fa6';
import { TypedGameBoardProps } from '../../types/Game';
import { BoardState, UltimateTicTacToeState } from './state';

const UltimateTicTacToeBoard = ({ state, onMove }: TypedGameBoardProps<UltimateTicTacToeState, number>) => {
  const xForeground = 'text-red-600';
  const xBackground = 'bg-red-200';
  const oForeground = 'text-blue-600';
  const oBackground = 'bg-blue-200';

  const boards = [];
  for(let i = 0; i < 9; i++) {
    const minIdx = i * 9;
    boards.push(state.board.slice(minIdx, minIdx + 9));
  }

  const prevCellIdx = state.prevMove;
  const isTerminal = state.isTerminal();
  const legalMoves = isTerminal ? [] : state.getLegalMoves();

  let result = undefined;
  if(isTerminal) {
    if(state.getReward('moot') === 0) {
      result = null;
    } else {
      result = !state.team;
    }
  }

  return (
    <div className="relative grid grid-cols-3 gap-3 text-2xl font-bold select-none cursor-default">
      {boards.map((board, boardIdx) => {
        const boardState: BoardState = state.boardStates[boardIdx];
        const isOpen = boardState === undefined;

        return (
          <div key={boardIdx} className="relative">
            <div className="grid grid-cols-3 gap-0.5">
              {board.map((cell, cellIdxWithinBoard) => {
                const cellIdx = (9 * boardIdx) + cellIdxWithinBoard;
                const isPlayable = !isTerminal && isOpen && legalMoves.includes(cellIdx);

                let cellClass = 'w-9 h-9 flex items-center justify-center border border-gray-700';
                if(isPlayable) {
                  cellClass += ` cursor-pointer border-2 ${state.team ? xBackground : oBackground}`;
                } else {
                  cellClass += ' bg-gray-200';
                }
                if(cell !== undefined) {
                  cellClass += cell ? ` ${xForeground}` : ` ${oForeground}`;
                }
                if(cellIdx === prevCellIdx) {
                  cellClass += ' border-4 border-gray-800';
                }

                return (
                  <div key={cellIdxWithinBoard} className={cellClass} onClick={() => isPlayable && onMove(cellIdx)}>
                    {cell !== undefined && (cell ? <FaX /> : <FaO />)}
                  </div>
                );
              })}
            </div>

            {!isOpen && (
              <div className="absolute inset-0 flex items-center justify-center opacity-50" style={{ fontSize: '5em' }}>
                {boardState === null
                  ? <FaCat />
                  : (boardState
                    ? <FaX className={xForeground} />
                    : <FaO className={oForeground} />
                  )}
              </div>
            )}
          </div>
        );
      })}

      {result !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center opacity-70" style={{ fontSize: '15em' }}>
          {result === null ? <FaCat /> : (result ? <FaX className={xForeground} /> : <FaO className={oForeground} />)}
        </div>
      )}
    </div>
  );
};

export default UltimateTicTacToeBoard;
