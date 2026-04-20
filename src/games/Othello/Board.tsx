import type { TypedGameBoardProps } from '../../types/Game';
import {
  COLS,
  getLegalPlacementMoves,
  getScore,
  getWinner,
  OthelloState,
  ROWS,
} from './state';
import type { OthelloMove } from './state';

const teamLabel = (team: boolean) => (team ? 'Black' : 'White');

const OthelloBoard = ({ state, onMove }: TypedGameBoardProps<OthelloState, OthelloMove>) => {
  const legalMoves = new Set(getLegalPlacementMoves(state));
  const isTerminal = state.isTerminal();
  const winner = getWinner(state);
  const { black, white } = getScore(state);
  const canPass = !isTerminal && legalMoves.size === 0;

  const statusMessage = isTerminal
    ? (
      winner === null
        ? `Draw. Final score ${black}-${white}.`
        : `${winner === 'B' ? 'Black' : 'White'} wins ${black}-${white}.`
    )
    : (
      canPass
        ? `${teamLabel(state.team)} has no legal moves and must pass.`
        : `${teamLabel(state.team)} to move. Choose a highlighted square.`
    );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <div className="rounded-full border border-slate-300 bg-slate-900 px-3 py-1 text-white">
          Black {black}
        </div>
        <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-900">
          White {white}
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1 rounded-2xl bg-emerald-900 p-3 shadow-lg">
        {Array.from({ length: ROWS * COLS }, (_, index) => {
          const cell = state.board[index];
          const isLegalMove = legalMoves.has(index) && !isTerminal;
          const isLastMove = index === state.lastMove;

          return (
            <button
              key={index}
              type="button"
              className={`flex h-11 w-11 items-center justify-center rounded-md border border-emerald-950 transition ${
                isLegalMove
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : 'bg-emerald-800'
              }`}
              onClick={() => isLegalMove && onMove(index.toString())}
              disabled={!isLegalMove}
              data-testid={`othello-cell-${index}`}
            >
              {cell !== null ? (
                <div
                  className={`h-8 w-8 rounded-full ${
                    cell === 'B' ? 'bg-slate-900' : 'bg-slate-100'
                  } ${
                    isLastMove ? 'ring-4 ring-amber-300/70' : ''
                  }`}
                />
              ) : (
                <div className={`h-3 w-3 rounded-full ${isLegalMove ? 'bg-emerald-200/90' : 'bg-transparent'}`} />
              )}
            </button>
          );
        })}
      </div>

      {canPass && (
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm text-slate-900 transition hover:bg-slate-200"
          onClick={() => onMove('pass')}
        >
          Pass turn
        </button>
      )}

      <div className="min-h-5 text-sm text-gray-700" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
};

export default OthelloBoard;
