import { useEffect, useState } from 'react';
import { FaChessKing, FaChessPawn } from 'react-icons/fa6';
import type { TypedGameBoardProps } from '../../types/Game';
import { OnitamaState, ONITAMA_DECK } from './state';
import type { OnitamaMove, OnitamaPlayMove } from './state';

interface PendingMoveSelection {
  srcIdx: number;
  dstIdx: number;
  cardIndexes: number[];
}

const uniqueIndexes = (indexes: number[]) => [...new Set(indexes)];
const teamLabel = (team: 'R' | 'B') => (team === 'R' ? 'Red' : 'Blue');

const OnitamaBoard = ({
  state,
  onMove,
}: TypedGameBoardProps<OnitamaState, OnitamaMove>) => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMoveSelection | null>(
    null,
  );
  const legalActions = state.getLegalActions();
  const playMoves = legalActions.filter(
    (move): move is OnitamaPlayMove => move.type === 'play',
  );
  const passCardIndexes = new Set(
    legalActions.flatMap((move) =>
      move.type === 'pass' ? [move.cardIdx] : [],
    ),
  );
  const pendingCardIndexes = new Set(pendingMove?.cardIndexes ?? []);

  const resetSelection = () => {
    setSelectedCard(null);
    setSelectedPiece(null);
    setPendingMove(null);
  };

  useEffect(() => {
    resetSelection();
  }, [state]);

  const filteredPlayMoves = playMoves.filter((move) => {
    if (selectedPiece !== null && move.srcIdx !== selectedPiece) {
      return false;
    }

    if (selectedCard !== null && move.cardIdx !== selectedCard) {
      return false;
    }

    return true;
  });

  const highlightedSourceIndexes = pendingMove
    ? [pendingMove.srcIdx]
    : selectedPiece !== null
      ? [selectedPiece]
      : selectedCard !== null
        ? uniqueIndexes(
            playMoves
              .filter((move) => move.cardIdx === selectedCard)
              .map((move) => move.srcIdx),
          )
        : [];
  const highlightedDestinationIndexes = pendingMove
    ? [pendingMove.dstIdx]
    : uniqueIndexes(filteredPlayMoves.map((move) => move.dstIdx));

  const handleCardClick = (cardIdx: number) => {
    if (passCardIndexes.has(cardIdx)) {
      onMove({ type: 'pass', cardIdx });
      return;
    }

    if (pendingMove && pendingCardIndexes.has(cardIdx)) {
      onMove({
        type: 'play',
        cardIdx,
        srcIdx: pendingMove.srcIdx,
        dstIdx: pendingMove.dstIdx,
      });
      return;
    }

    setPendingMove(null);
    setSelectedCard((currentCard) =>
      currentCard === cardIdx ? null : cardIdx,
    );
  };

  const handlePieceClick = (index: number) => {
    if (!state.isCurrentTeamPiece(index)) {
      return;
    }

    setPendingMove(null);
    setSelectedPiece((currentPiece) => (currentPiece === index ? null : index));
  };

  const handleMoveClick = (index: number) => {
    if (selectedPiece === null) {
      return;
    }

    const matchingMoves = playMoves.filter((move) => {
      if (move.srcIdx !== selectedPiece || move.dstIdx !== index) {
        return false;
      }

      return selectedCard === null || move.cardIdx === selectedCard;
    });

    if (matchingMoves.length === 1) {
      onMove(matchingMoves[0]);
      return;
    }

    if (matchingMoves.length > 1) {
      setPendingMove({
        srcIdx: selectedPiece,
        dstIdx: index,
        cardIndexes: matchingMoves.map((move) => move.cardIdx),
      });
    }
  };

  const renderCard = (
    cardIdx: number | null,
    isSelected = false,
    isPendingChoice = false,
  ) => {
    if (cardIdx === null) {
      return (
        <div className="text-center text-xl p-1 bg-white rounded border border-white">
          <div />
          <div className="grid grid-cols-5 border-b border-r border-white">
            {Array.from({ length: 25 }, (_, index) => (
              <div
                key={index}
                className="w-5 h-5 border-t border-l border-white"
              />
            ))}
          </div>
        </div>
      );
    }

    const card = ONITAMA_DECK[cardIdx];
    const cardColor = {
      R: 'bg-red-400',
      B: 'bg-blue-400',
      '': 'bg-yellow-400',
    }[card.color];
    const highlight = isPendingChoice
      ? 'ring-2 ring-yellow-500'
      : isSelected
        ? 'ring-2 ring-gray-800'
        : '';

    return (
      <div
        className={`text-center text-xl p-1 bg-white rounded border border-gray-800 ${highlight} ${card.first === 'R' ? 'text-red-600' : 'text-blue-700'}`}
      >
        <div>{card.name}</div>
        <div className="grid grid-cols-5 border-b border-r border-gray-500">
          {[-2, -1, 0, 1, 2].map((row) =>
            [-2, -1, 0, 1, 2].map((col) => {
              const isMove = card.moves.some(
                ([moveRow, moveCol]) => moveRow === row && moveCol === col,
              );
              return (
                <div
                  key={`${row}-${col}`}
                  className={`w-5 h-5 border-t border-l border-gray-500 ${isMove ? cardColor : row === 0 && col === 0 ? 'bg-gray-800' : 'bg-gray-100'}`}
                />
              );
            }),
          )}
        </div>
      </div>
    );
  };

  const cellClass = (index: number) => {
    const cell = state.board[index];
    const size = 'RB'.includes(cell || '') ? 'text-4xl' : 'text-3xl';
    const isCurrentTeamPiece = state.isCurrentTeamPiece(index);
    const isHighlightedSource = highlightedSourceIndexes.includes(index);
    const isHighlightedDestination =
      highlightedDestinationIndexes.includes(index);
    const isClickableDestination =
      selectedPiece !== null && isHighlightedDestination;

    let bg = 'bg-gray-200';
    if (index % 5 === 2) {
      if (index < 5) {
        bg = 'bg-blue-200';
      } else if (index >= 20) {
        bg = 'bg-red-200';
      }
    }

    const fg = !cell
      ? ''
      : cell.toUpperCase() === 'R'
        ? 'text-red-600'
        : 'text-blue-700';
    const highlight = isHighlightedDestination
      ? 'bg-yellow-200 ring-2 ring-inset ring-yellow-500'
      : isHighlightedSource
        ? 'bg-yellow-100 ring-2 ring-inset ring-amber-300'
        : '';
    const cursor =
      isClickableDestination || isCurrentTeamPiece
        ? 'cursor-pointer'
        : 'cursor-default';

    return `w-12 h-12 border-gray-500 border-b-2 border-r-2 flex items-center justify-center ${size} ${bg} ${fg} ${highlight} ${cursor}`;
  };

  const renderPlayerCards = (team: 'R' | 'B') => {
    const isCurrentTeam = team === state.getCurrentTeam();
    const teamKey = team.toLowerCase() as 'r' | 'b';

    return (
      <div
        className={`flex flex-row gap-2 ${team === 'B' ? 'rotate-180' : ''}`}
      >
        {state.cards[teamKey].map((cardIdx) => (
          <div
            key={cardIdx}
            className={isCurrentTeam ? 'cursor-pointer' : 'cursor-default'}
            data-testid={`onitama-card-${cardIdx}`}
            onClick={() => isCurrentTeam && handleCardClick(cardIdx)}
          >
            {renderCard(
              cardIdx,
              isCurrentTeam && selectedCard === cardIdx,
              isCurrentTeam && pendingCardIndexes.has(cardIdx),
            )}
          </div>
        ))}
        <div className="scale-90 ml-6 opacity-70 cursor-default">
          {renderCard(isCurrentTeam ? state.cards.n : null)}
        </div>
      </div>
    );
  };

  const footerMessage = pendingMove
    ? 'Multiple cards can make that move. Choose a card.'
    : passCardIndexes.size > 0
      ? 'No legal moves. Click a card to pass.'
      : null;
  const winner = state.getWinner();
  const winningMethod = state.getWinningMethod();
  const outcomeMessage =
    winner && winningMethod
      ? `${teamLabel(winner)} wins by ${winningMethod === 'stream' ? 'Way of the Stream' : 'Way of the Stone'}.`
      : state.isTerminal()
        ? 'Draw.'
        : null;

  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{ fontFamily: 'Papyrus,Trattatello,Luminari,cursive' }}
    >
      {renderPlayerCards('B')}

      <div
        className="grid grid-cols-5 border-gray-500 border-t-2 border-l-2"
        data-testid="onitama-board"
      >
        {state.board.map((cell, index) => (
          <div
            key={index}
            className={cellClass(index)}
            data-testid={`onitama-cell-${index}`}
            onClick={() =>
              state.isCurrentTeamPiece(index)
                ? handlePieceClick(index)
                : handleMoveClick(index)
            }
          >
            {cell ? (
              'RB'.includes(cell) ? (
                <FaChessKing />
              ) : (
                <FaChessPawn />
              )
            ) : (
              ''
            )}
          </div>
        ))}
      </div>

      {renderPlayerCards('R')}

      <div className="min-h-5 text-sm text-gray-700" aria-live="polite">
        {outcomeMessage ?? footerMessage}
      </div>
    </div>
  );
};

export default OnitamaBoard;
