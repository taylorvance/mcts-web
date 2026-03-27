import { TypedGameBoardProps } from '../../types/Game';
import { getWinningPath, HexState } from './state';

const teamLabel = (team: boolean) => (team ? 'Black' : 'White');

const cellClassName = (cell: 'B' | 'W' | null) => (
  cell === 'B'
    ? 'bg-sky-800 text-white'
    : (cell === 'W'
      ? 'bg-amber-100 text-amber-950'
      : 'bg-stone-100 text-stone-500')
);

const HexBoard = ({ state, onMove }: TypedGameBoardProps<HexState, number>) => {
  const legalMoves = new Set(state.getLegalMoves());
  const winningPath = new Set(getWinningPath(state) ?? []);
  const isTerminal = state.isTerminal();

  const statusMessage = state.winner !== null
    ? `${state.winner === 'B' ? 'Black' : 'White'} connects both sides.`
    : (isTerminal
      ? 'Board full.'
      : `${teamLabel(state.team)} to move. Connect ${state.team ? 'top to bottom' : 'left to right'}.`);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-3xl justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>White</span>
        <span>Black</span>
        <span>White</span>
      </div>

      <div className="flex flex-col gap-1">
        {Array.from({ length: state.size }, (_, row) => (
          <div
            key={row}
            className="flex gap-1"
            style={{ marginLeft: `${row * 1.1}rem` }}
          >
            {Array.from({ length: state.size }, (_, col) => {
              const index = (row * state.size) + col;
              const cell = state.board[index];
              const isLegalMove = legalMoves.has(index) && !isTerminal;
              const isWinningCell = winningPath.has(index);
              const isLastMove = index === state.lastMove;

              return (
                <button
                  key={index}
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center border text-sm font-semibold shadow-sm transition disabled:cursor-default ${
                    cell === null && isLegalMove
                      ? 'cursor-pointer hover:bg-stone-200'
                      : ''
                  } ${
                    isWinningCell
                      ? 'border-emerald-500 ring-2 ring-emerald-300'
                      : 'border-slate-400'
                  } ${
                    isLastMove ? 'ring-2 ring-amber-300' : ''
                  } ${
                    cellClassName(cell)
                  }`}
                  style={{
                    clipPath: 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%)',
                  }}
                  onClick={() => isLegalMove && onMove(index)}
                  disabled={!isLegalMove}
                  data-testid={`hex-cell-${index}`}
                >
                  {cell ?? ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-3xl justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>Black</span>
        <span>White</span>
        <span>Black</span>
      </div>

      <div className="min-h-5 text-center text-sm text-gray-700" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
};

export default HexBoard;
