import type { TypedGameBoardProps } from '../../types/Game';
import {
  COLS,
  ConnectFourState,
  getLegalColumns,
  getWinner,
  getWinningLine,
  ROWS,
} from './state';

const teamLabel = (team: boolean) => (team ? 'Red' : 'Yellow');
const discClass = (cell: 'R' | 'Y' | null) => (
  cell === null
    ? 'bg-white'
    : (cell === 'R' ? 'bg-red-500' : 'bg-yellow-400')
);

const ConnectFourBoard = ({ state, onMove }: TypedGameBoardProps<ConnectFourState, string>) => {
  const legalColumns = new Set(getLegalColumns(state));
  const winningLine = new Set(getWinningLine(state) ?? []);
  const winner = getWinner(state);
  const isTerminal = state.isTerminal();

  const statusMessage = winner !== null
    ? `${winner === 'R' ? 'Red' : 'Yellow'} wins.`
    : (isTerminal
      ? 'Draw.'
      : `${teamLabel(state.team)} to move. Click a column to drop a disc.`);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-7 gap-2 rounded-2xl bg-blue-600 p-3 shadow-lg">
        {Array.from({ length: ROWS }, (_, row) => (
          Array.from({ length: COLS }, (_, column) => {
            const index = (row * COLS) + column;
            const cell = state.board[index];
            const isLastMove = index === state.lastMove;
            const isWinningCell = winningLine.has(index);
            const isPlayableColumn = legalColumns.has(column) && !isTerminal;

            return (
              <div
                key={index}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                  isWinningCell
                    ? 'bg-emerald-300'
                    : (isPlayableColumn
                      ? 'cursor-pointer bg-blue-500 hover:bg-blue-400'
                      : 'bg-blue-700')
                }`}
                onClick={() => isPlayableColumn && onMove(column.toString())}
                data-testid={`connect-four-cell-${index}`}
              >
                <div
                  className={`h-9 w-9 rounded-full border ${
                    discClass(cell)
                  } ${
                    isLastMove
                      ? 'ring-4 ring-slate-900/50'
                      : (isWinningCell ? 'ring-4 ring-emerald-700/40' : '')
                  }`}
                />
              </div>
            );
          })
        ))}
      </div>

      <div className="min-h-5 text-sm text-gray-700" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
};

export default ConnectFourBoard;
