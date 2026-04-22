import { useMemo, useState } from 'react';
import type { TypedGameBoardProps } from '../../types/Game';
import {
  DOBUTSU_MOVE_DELTAS,
  DobutsuShogiState,
  type DobutsuDropPieceKind,
  type DobutsuMove,
} from './state';

const PIECE_LABELS = {
  L: 'Lion',
  G: 'Giraffe',
  E: 'Elephant',
  C: 'Chick',
  H: 'Hen',
} as const;
const PIECE_EMOJI: Record<keyof typeof PIECE_LABELS, string> = {
  L: '🦁',
  G: '🦒',
  E: '🐘',
  C: '🐤',
  H: '🐔',
};

const DROP_PIECES: DobutsuDropPieceKind[] = ['G', 'E', 'C'];

const getPieceOwner = (piece: string) => (piece === piece.toUpperCase() ? 'S' : 'N');
const getPieceKind = (piece: string) => piece.toUpperCase() as keyof typeof PIECE_LABELS;
const teamLabel = (team: 'S' | 'N') => (team === 'S' ? 'South' : 'North');
const handKey = (team: 'S' | 'N') => (team === 'S' ? 's' : 'n');

const MOVE_MARKER_POSITIONS = {
  '-1,-1': { position: 'left-0 top-0', rotation: 'rotate(-45deg)' },
  '-1,0': { position: 'left-1/2 top-0 -translate-x-1/2', rotation: 'rotate(0deg)' },
  '-1,1': { position: 'right-0 top-0', rotation: 'rotate(45deg)' },
  '0,-1': { position: 'left-0 top-1/2 -translate-y-1/2', rotation: 'rotate(-90deg)' },
  '0,1': { position: 'right-0 top-1/2 -translate-y-1/2', rotation: 'rotate(90deg)' },
  '1,-1': { position: 'bottom-0 left-0', rotation: 'rotate(-135deg)' },
  '1,0': { position: 'bottom-0 left-1/2 -translate-x-1/2', rotation: 'rotate(180deg)' },
  '1,1': { position: 'bottom-0 right-0', rotation: 'rotate(135deg)' },
} as const;

const MoveMarker = ({
  rowDelta,
  colDelta,
}: {
  rowDelta: number;
  colDelta: number;
}) => {
  const marker = MOVE_MARKER_POSITIONS[`${rowDelta},${colDelta}` as keyof typeof MOVE_MARKER_POSITIONS];

  return (
    <span className={`absolute ${marker.position} flex items-center justify-center`} aria-hidden="true">
      <span
        className="block h-0 w-0 border-x-[0.26rem] border-b-[0.44rem] border-x-transparent border-b-current opacity-95 drop-shadow-[0_0_1px_rgba(255,255,255,0.22)] sm:border-x-[0.3rem] sm:border-b-[0.5rem]"
        style={{ transform: marker.rotation }}
      />
    </span>
  );
};

const DobutsuPieceBadge = ({
  piece,
  owner,
}: {
  piece: keyof typeof PIECE_LABELS;
  owner: 'S' | 'N';
}) => {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 ${
        owner === 'S'
          ? 'border-[#b45309] bg-[#fff1c2] text-[#7c2d12] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]'
          : 'border-[#2563eb] bg-[#dbeafe] text-[#0f2f6b] shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]'
      }`}
      aria-label={PIECE_LABELS[piece]}
      title={PIECE_LABELS[piece]}
    >
      <div className={`relative h-full w-full ${owner === 'N' ? 'rotate-180' : ''}`}>
        <div className="absolute inset-x-[7%] inset-y-[6%]">
          {DOBUTSU_MOVE_DELTAS[piece].map(([rowDelta, colDelta]) => (
            <MoveMarker
              key={`${rowDelta},${colDelta}`}
              rowDelta={rowDelta}
              colDelta={colDelta}
            />
          ))}
        </div>
        <div className="flex h-full w-full items-center justify-center">
          <span
            className="relative text-[2.05rem] leading-none sm:text-[2.4rem]"
            aria-hidden="true"
          >
            {PIECE_EMOJI[piece]}
          </span>
        </div>
      </div>
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
        <div className="mt-1 flex items-end justify-center gap-2 sm:mt-2 sm:gap-2.5">
          {DROP_PIECES.map((piece) => {
            const isSelected = isCurrentTeam && activeSelectedHandPiece === piece;
            const count = hand[piece];

            return (
              <button
                key={piece}
                type="button"
                className={`flex w-[3.65rem] flex-col items-center justify-end gap-1 bg-transparent transition sm:w-[4.15rem] ${
                  isCurrentTeam && count > 0 ? 'cursor-pointer' : 'cursor-default'
                }`}
                onClick={() => isCurrentTeam && handleHandClick(piece)}
                disabled={!isCurrentTeam || count <= 0}
                data-testid={`dobutsu-hand-${team}-${piece}`}
              >
                <div className={`relative aspect-[4/5] w-full transition ${
                  count > 0 ? '' : 'opacity-30 grayscale'
                } ${
                  isSelected ? 'scale-105' : ''
                }`}
                >
                  {count > 1 && (
                    <div className="absolute inset-0 translate-x-[0.22rem] translate-y-[-0.18rem] opacity-35">
                      <DobutsuPieceBadge piece={piece} owner={team} />
                    </div>
                  )}
                  <div className={`absolute inset-0 ${
                    isSelected ? 'ring-4 ring-emerald-300/90 rounded-xl' : ''
                  }`}
                  >
                    <DobutsuPieceBadge piece={piece} owner={team} />
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
