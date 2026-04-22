import { useMemo, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  GiChicken,
  GiDeerHead,
  GiElephant,
  GiLion,
  GiRooster,
} from 'react-icons/gi';
import type { TypedGameBoardProps } from '../../types/Game';
import { DobutsuShogiState, type DobutsuDropPieceKind, type DobutsuMove } from './state';

const PIECE_LABELS = {
  L: 'Lion',
  G: 'Giraffe',
  E: 'Elephant',
  C: 'Chick',
  H: 'Hen',
} as const;
const PIECE_ICONS: Record<keyof typeof PIECE_LABELS, IconType> = {
  L: GiLion,
  G: GiDeerHead,
  E: GiElephant,
  C: GiChicken,
  H: GiRooster,
};

const DROP_PIECES: DobutsuDropPieceKind[] = ['G', 'E', 'C'];

const getPieceOwner = (piece: string) => (piece === piece.toUpperCase() ? 'S' : 'N');
const getPieceKind = (piece: string) => piece.toUpperCase() as keyof typeof PIECE_LABELS;
const teamLabel = (team: 'S' | 'N') => (team === 'S' ? 'South' : 'North');
const handKey = (team: 'S' | 'N') => (team === 'S' ? 's' : 'n');

const DobutsuPieceBadge = ({
  piece,
  owner,
}: {
  piece: keyof typeof PIECE_LABELS;
  owner: 'S' | 'N';
}) => {
  const Icon = PIECE_ICONS[piece];

  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-xl border ${
        owner === 'S'
          ? 'border-amber-600/40 bg-amber-50 text-amber-950'
          : 'border-sky-700/40 bg-sky-50 text-sky-950'
      }`}
      aria-label={PIECE_LABELS[piece]}
      title={PIECE_LABELS[piece]}
    >
      <Icon className="text-[1.9rem] sm:text-[2.15rem]" aria-hidden="true" />
    </div>
  );
};

const DobutsuBoard = ({ state, onMove }: TypedGameBoardProps<DobutsuShogiState, DobutsuMove>) => {
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<DobutsuDropPieceKind | null>(null);
  const legalMoves = state.getLegalMoves();
  const currentTeam = state.getCurrentTeam();
  const winner = state.getWinner();
  const outcomeReason = state.getOutcomeReason();
  const isTerminal = state.isTerminal();

  const legalBoardMoves = useMemo(
    () => legalMoves.filter((move): move is Extract<DobutsuMove, { type: 'move' }> => move.type === 'move'),
    [legalMoves],
  );
  const legalDropMoves = useMemo(
    () => legalMoves.filter((move): move is Extract<DobutsuMove, { type: 'drop' }> => move.type === 'drop'),
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

  const handleCellClick = (index: number) => {
    if(isTerminal) {
      return;
    }

    const piece = state.board[index];
    if(piece && getPieceOwner(piece) === currentTeam && selectableBoardIndexes.has(index)) {
      setSelectedHandPiece(null);
      setSelectedBoardIndex((currentIndex) => (currentIndex === index ? null : index));
      return;
    }

    if(activeSelectedBoardIndex !== null) {
      const boardMove = legalBoardMoves.find((move) => move.from === activeSelectedBoardIndex && move.to === index);
      if(boardMove) {
        onMove(boardMove);
        return;
      }
    }

    if(activeSelectedHandPiece !== null) {
      const dropMove = legalDropMoves.find((move) => move.piece === activeSelectedHandPiece && move.to === index);
      if(dropMove) {
        onMove(dropMove);
      }
    }
  };

  const handleHandClick = (piece: DobutsuDropPieceKind) => {
    if(isTerminal) {
      return;
    }

    const hand = state.hands[handKey(currentTeam)];
    if(hand[piece] <= 0) {
      return;
    }

    setSelectedBoardIndex(null);
    setSelectedHandPiece((currentPiece) => (currentPiece === piece ? null : piece));
  };

  const statusMessage = (() => {
    if(outcomeReason === 'repetition') {
      return 'Draw by repetition.';
    }

    if(winner && outcomeReason === 'capture') {
      return `${teamLabel(winner)} wins by catching the lion.`;
    }

    if(winner && outcomeReason === 'try') {
      return `${teamLabel(winner)} wins by reaching the far rank with a safe lion.`;
    }

    if(winner && outcomeReason === 'stalemate') {
      return `${teamLabel(winner)} wins by stalemate.`;
    }

    return null;
  })();

  const renderHand = (team: 'S' | 'N') => {
    const hand = state.hands[handKey(team)];
    const isCurrentTeam = team === currentTeam && !isTerminal;

    return (
      <div className="w-full">
        <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${
          team === 'S' ? 'text-amber-800' : 'text-sky-800'
        }`}
        >
          {teamLabel(team)} hand
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1.5 sm:mt-2 sm:gap-2">
          {DROP_PIECES.map((piece) => {
            const isSelected = isCurrentTeam && activeSelectedHandPiece === piece;
            const count = hand[piece];

            return (
              <button
                key={piece}
                type="button"
                className={`flex h-14 w-full flex-col items-center justify-center rounded-2xl border px-1.5 py-1 text-sm transition sm:h-20 sm:px-3 sm:py-2 ${
                  count > 0
                    ? 'bg-white hover:border-slate-500 hover:bg-slate-50'
                    : 'bg-slate-100 text-slate-400'
                } ${
                  isSelected ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-300'
                } ${
                  isCurrentTeam && count > 0 ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => isCurrentTeam && handleHandClick(piece)}
                disabled={!isCurrentTeam || count <= 0}
                data-testid={`dobutsu-hand-${team}-${piece}`}
              >
                <div
                  className="flex items-center justify-center text-[1.4rem] leading-none sm:text-[1.75rem]"
                  aria-label={PIECE_LABELS[piece]}
                  title={PIECE_LABELS[piece]}
                >
                  {(() => {
                    const Icon = PIECE_ICONS[piece];
                    return <Icon aria-hidden="true" />;
                  })()}
                </div>
                <div className="mt-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-[17rem] max-w-full flex-col items-center gap-3 sm:w-[18rem] sm:gap-4" data-testid="dobutsu-board">
      {renderHand('N')}

      <div className="w-full rounded-[1.5rem] border border-emerald-900 bg-emerald-950 p-2.5 shadow-xl sm:rounded-[1.75rem] sm:p-3">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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

            return (
              <button
                key={index}
                type="button"
                className={`relative flex aspect-[4/5] w-full items-stretch justify-stretch rounded-2xl border-2 transition ${
                  isHighlightedDestination
                    ? 'border-emerald-200 bg-emerald-500/90 ring-4 ring-amber-300/80'
                    : 'border-emerald-800 bg-emerald-100'
                } ${
                  isSelectedBoardPiece ? 'ring-4 ring-sky-300/80' : ''
                } ${
                  sourceHighlight
                } ${
                  isSelectableBoardPiece || isHighlightedDestination ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => handleCellClick(index)}
                data-testid={`dobutsu-cell-${index}`}
              >
                {piece ? (
                  <DobutsuPieceBadge
                    piece={getPieceKind(piece)}
                    owner={getPieceOwner(piece)}
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

      {renderHand('S')}

      {statusMessage && (
        <div className="min-h-5 text-center text-sm text-gray-700" aria-live="polite">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default DobutsuBoard;
