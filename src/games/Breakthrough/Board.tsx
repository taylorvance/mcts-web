import { useMemo, useState } from 'react';
import { TypedGameBoardProps } from '../../types/Game';
import { BreakthroughState, getMovesBySource } from './state';

const teamLabel = (team: boolean) => (team ? 'White' : 'Black');

const BreakthroughBoard = ({ state, onMove }: TypedGameBoardProps<BreakthroughState, string>) => {
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
  const movesBySource = useMemo(() => getMovesBySource(state), [state]);
  const movablePieces = useMemo(() => new Set(movesBySource.keys()), [movesBySource]);
  const activeSelectedFrom = selectedFrom !== null && movesBySource.has(selectedFrom)
    ? selectedFrom
    : null;
  const legalDestinations = new Set(
    activeSelectedFrom === null
      ? []
      : (movesBySource.get(activeSelectedFrom) ?? []),
  );
  const isTerminal = state.isTerminal();

  const statusMessage = state.winner !== null
    ? `${state.winner === 'W' ? 'White' : 'Black'} wins.`
    : (activeSelectedFrom !== null
      ? `${teamLabel(state.team)} selected. Choose a highlighted destination.`
      : `${teamLabel(state.team)} to move. Select a piece, then a destination.`);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-900">
          White {state.whiteCount}
        </div>
        <div className="rounded-full border border-slate-300 bg-slate-900 px-3 py-1 text-white">
          Black {state.blackCount}
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1 rounded-2xl bg-stone-700 p-3 shadow-lg">
        {Array.from({ length: state.board.length }, (_, index) => {
          const cell = state.board[index];
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isLightSquare = (row + col) % 2 === 0;
          const isMovablePiece = movablePieces.has(index) && !isTerminal;
          const isSelectedPiece = index === activeSelectedFrom;
          const isLegalDestination = legalDestinations.has(index) && !isTerminal;
          const isLastMove = index === state.lastMove;

          return (
            <button
              key={index}
              type="button"
              className={`relative flex h-11 w-11 items-center justify-center rounded-md border transition ${
                isLightSquare
                  ? 'border-amber-900/40 bg-amber-100'
                  : 'border-stone-800/50 bg-stone-500'
              } ${
                isMovablePiece || isLegalDestination
                  ? 'cursor-pointer hover:brightness-110'
                  : ''
              } ${
                isSelectedPiece
                  ? 'ring-4 ring-sky-400'
                  : ''
              } ${
                isLastMove
                  ? 'ring-4 ring-amber-300/80'
                  : ''
              }`}
              onClick={() => {
                if(isLegalDestination && activeSelectedFrom !== null) {
                  onMove(`${activeSelectedFrom}:${index}`);
                  return;
                }

                if(isMovablePiece) {
                  setSelectedFrom((current) => (current === index ? null : index));
                  return;
                }

                setSelectedFrom(null);
              }}
              disabled={isTerminal}
              data-testid={`breakthrough-cell-${index}`}
            >
              {cell !== null && (
                <div
                  className={`h-8 w-8 rounded-full border ${
                    cell === 'W'
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-950 bg-slate-900'
                  }`}
                />
              )}

              {cell === null && isLegalDestination && (
                <div className="absolute h-3 w-3 rounded-full bg-emerald-500/90" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-5 text-center text-sm text-gray-700" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
};

export default BreakthroughBoard;
