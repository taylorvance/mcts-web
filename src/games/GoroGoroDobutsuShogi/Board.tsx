import { useMemo, useState } from 'react';
import type { TypedGameBoardProps } from '../../types/Game';
import AnimalShogiPieceBadge from '../Shogi/shared/AnimalShogiPieceBadge';
import {
  getPieceKind,
  getPieceOwner,
  handKey,
  teamLabel,
} from '../Shogi/shared/animalShogiPieces';
import {
  COLS,
  GOROGORO_MOVE_DELTAS,
  type GoroGoroBoardMove,
  type GoroGoroDropPieceKind,
  type GoroGoroMove,
  GoroGoroDobutsuShogiState,
} from './state';

const GOROGORO_PIECE_SET = {
  labels: {
    L: 'Lion',
    D: 'Dog',
    T: 'Cat',
    C: 'Chick',
    H: 'Hen',
    M: 'Super Cat',
  },
  emoji: {
    L: '🦁',
    D: '🐶',
    T: '🐱',
    C: '🐤',
    H: '🐔',
    M: '😺',
  },
  moveDeltas: GOROGORO_MOVE_DELTAS,
} as const;

const DROP_PIECES: GoroGoroDropPieceKind[] = ['D', 'T', 'C'];

interface PendingPromotionChoice {
  from: number;
  to: number;
  moves: GoroGoroBoardMove[];
}

const GoroGoroDobutsuBoard = ({
  state,
  onMove,
}: TypedGameBoardProps<GoroGoroDobutsuShogiState, GoroGoroMove>) => {
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<GoroGoroDropPieceKind | null>(null);
  const [pendingPromotionChoice, setPendingPromotionChoice] = useState<PendingPromotionChoice | null>(null);
  const legalMoves = state.getLegalMoves();
  const currentTeam = state.getCurrentTeam();
  const winner = state.getWinner();
  const outcomeReason = state.getOutcomeReason();
  const isTerminal = state.isTerminal();

  const legalBoardMoves = useMemo(
    () => legalMoves.filter((move): move is GoroGoroBoardMove => move.type === 'move'),
    [legalMoves],
  );
  const legalDropMoves = useMemo(
    () => legalMoves.filter((move): move is Extract<GoroGoroMove, { type: 'drop' }> => move.type === 'drop'),
    [legalMoves],
  );

  const selectableBoardIndexes = new Set(legalBoardMoves.map((move) => move.from));
  const activeSelectedBoardIndex = selectedBoardIndex !== null && selectableBoardIndexes.has(selectedBoardIndex)
    ? selectedBoardIndex
    : null;
  const activeSelectedHandPiece = selectedHandPiece !== null && state.hands[handKey(currentTeam)][selectedHandPiece] > 0
    ? selectedHandPiece
    : null;
  const selectedBoardDestinations = new Set(
    legalBoardMoves
      .filter((move) => move.from === activeSelectedBoardIndex)
      .map((move) => move.to),
  );
  const selectedDropDestinations = new Set(
    legalDropMoves
      .filter((move) => move.piece === activeSelectedHandPiece)
      .map((move) => move.to),
  );

  const clearSelections = () => {
    setSelectedBoardIndex(null);
    setSelectedHandPiece(null);
    setPendingPromotionChoice(null);
  };

  const handleCellClick = (index: number) => {
    if (isTerminal) {
      return;
    }

    const piece = state.board[index];
    if (piece && getPieceOwner(piece) === currentTeam && selectableBoardIndexes.has(index)) {
      setSelectedHandPiece(null);
      setPendingPromotionChoice(null);
      setSelectedBoardIndex((currentIndex) => (currentIndex === index ? null : index));
      return;
    }

    if (activeSelectedBoardIndex !== null) {
      const matchingMoves = legalBoardMoves.filter((move) => (
        move.from === activeSelectedBoardIndex && move.to === index
      ));

      if (matchingMoves.length === 1) {
        onMove(matchingMoves[0]);
        return;
      }

      if (matchingMoves.length > 1) {
        setPendingPromotionChoice({
          from: activeSelectedBoardIndex,
          to: index,
          moves: matchingMoves,
        });
        return;
      }
    }

    if (activeSelectedHandPiece !== null) {
      const dropMove = legalDropMoves.find((move) => (
        move.piece === activeSelectedHandPiece && move.to === index
      ));
      if (dropMove) {
        onMove(dropMove);
      }
    }
  };

  const handleHandClick = (piece: GoroGoroDropPieceKind) => {
    if (isTerminal) {
      return;
    }

    const hand = state.hands[handKey(currentTeam)];
    if (hand[piece] <= 0) {
      return;
    }

    setSelectedBoardIndex(null);
    setPendingPromotionChoice(null);
    setSelectedHandPiece((currentPiece) => (currentPiece === piece ? null : piece));
  };

  const statusMessage = (() => {
    if (outcomeReason === 'repetition') {
      return 'Draw by repetition.';
    }

    if (winner && outcomeReason === 'capture') {
      return `${teamLabel(winner)} wins by catching the lion.`;
    }

    if (winner && outcomeReason === 'checkmate') {
      return `${teamLabel(winner)} wins by checkmate.`;
    }

    if (winner && outcomeReason === 'stalemate') {
      return `${teamLabel(winner)} wins by stalemate.`;
    }

    return null;
  })();

  const renderHand = (team: 'S' | 'N') => {
    const hand = state.hands[handKey(team)];
    const isCurrentTeam = team === currentTeam && !isTerminal;

    return (
      <div className="w-full">
        <div className="flex items-end justify-center gap-2 sm:gap-2.5">
          {DROP_PIECES.map((piece) => {
            const isSelected = isCurrentTeam && activeSelectedHandPiece === piece;
            const count = hand[piece];

            return (
              <button
                key={piece}
                type="button"
                className={`flex w-[3.65rem] flex-col items-center justify-end gap-1 bg-transparent transition sm:w-[4rem] ${
                  isCurrentTeam && count > 0 ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => isCurrentTeam && handleHandClick(piece)}
                disabled={!isCurrentTeam || count <= 0}
                data-testid={`gorogoro-hand-${team}-${piece}`}
              >
                <div className={`relative aspect-[4/5] w-full transition ${
                  count > 0 ? '' : 'opacity-30 grayscale'
                } ${
                  isSelected ? 'scale-105' : ''
                }`}
                >
                  {count > 1 && (
                    <div className="absolute inset-0 translate-x-[0.22rem] translate-y-[-0.18rem] opacity-35">
                      <AnimalShogiPieceBadge piece={piece} owner={team} pieceSet={GOROGORO_PIECE_SET} />
                    </div>
                  )}
                  <div className={`absolute inset-0 ${
                    isSelected ? 'ring-4 ring-emerald-300/90 rounded-xl' : ''
                  }`}
                  >
                    <AnimalShogiPieceBadge piece={piece} owner={team} pieceSet={GOROGORO_PIECE_SET} />
                  </div>
                </div>
                <div
                  className={`min-h-4 text-[0.7rem] font-semibold leading-none ${
                    team === 'S' ? 'text-amber-900' : 'text-sky-900'
                  } ${count > 0 ? 'opacity-90' : 'opacity-35'}`}
                  aria-hidden="true"
                >
                  {count > 1 ? `x${count}` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex max-w-full flex-col items-center gap-3 sm:gap-4"
      style={{ width: '22rem' }}
      data-testid="gorogoro-board"
    >
      {renderHand('N')}

      <div className="w-full rounded-[1.5rem] border border-emerald-900 bg-emerald-950 p-2.5 shadow-xl sm:rounded-[1.75rem] sm:p-3">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {state.board.map((piece, index) => {
            const isSelectedBoardPiece = activeSelectedBoardIndex === index;
            const isHighlightedDestination = selectedBoardDestinations.has(index) || selectedDropDestinations.has(index);
            const isSelectableBoardPiece = piece !== null
              && getPieceOwner(piece) === currentTeam
              && selectableBoardIndexes.has(index)
              && !isTerminal;
            const sourceHighlight = isSelectableBoardPiece && !isSelectedBoardPiece
              ? 'ring-2 ring-sky-200/70'
              : '';
            const row = Math.floor(index / COLS);
            const isCampSquare = row <= 1 || row >= 4;

            return (
              <button
                key={index}
                type="button"
                className={`relative flex aspect-[4/5] w-full items-stretch justify-stretch rounded-2xl border-2 transition ${
                  isHighlightedDestination
                    ? 'border-emerald-200 bg-emerald-500/90 ring-4 ring-amber-300/80'
                    : isCampSquare
                      ? 'border-emerald-800 bg-emerald-200'
                      : 'border-emerald-800 bg-emerald-100'
                } ${
                  isSelectedBoardPiece ? 'ring-4 ring-sky-300/80' : ''
                } ${
                  sourceHighlight
                } ${
                  isSelectableBoardPiece || isHighlightedDestination ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => handleCellClick(index)}
                data-testid={`gorogoro-cell-${index}`}
              >
                {piece ? (
                  <AnimalShogiPieceBadge
                    piece={getPieceKind(piece)}
                    owner={getPieceOwner(piece)}
                    pieceSet={GOROGORO_PIECE_SET}
                  />
                ) : (
                  <div className={`m-auto h-3 w-3 rounded-full ${
                    isHighlightedDestination ? 'bg-amber-50' : 'bg-emerald-300/30'
                  }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {pendingPromotionChoice && (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <span>Promote this move?</span>
          {pendingPromotionChoice.moves.map((move) => (
            <button
              key={`${move.from}-${move.to}-${move.promote ? 'p' : 'n'}`}
              type="button"
              className="rounded-lg border border-amber-300 bg-white px-3 py-1 font-medium text-amber-950 transition hover:bg-amber-100"
              onClick={() => {
                onMove(move);
                clearSelections();
              }}
            >
              {move.promote ? 'Promote' : 'Keep'}
            </button>
          ))}
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-amber-700 transition hover:bg-amber-100"
            onClick={() => setPendingPromotionChoice(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {renderHand('S')}

      {statusMessage && (
        <div className="min-h-5 text-center text-sm text-gray-700" aria-live="polite">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default GoroGoroDobutsuBoard;
