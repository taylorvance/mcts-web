import { useEffect, useState } from 'react';
import { FaChessKing, FaChessPawn } from 'react-icons/fa6';
import { TypedGameBoardProps } from '../../types/Game';
import { OnitamaMove, OnitamaState, ONITAMA_DECK } from './state';

const OnitamaBoard = ({ state, onMove }: TypedGameBoardProps<OnitamaState, OnitamaMove>) => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const passCardIndexes = new Set(
    state.getLegalActions()
      .flatMap((move) => (move.type === 'pass' ? [move.cardIdx] : [])),
  );

  const resetSelection = () => {
    setSelectedCard(null);
    setSelectedPiece(null);
    setValidMoves([]);
  };

  useEffect(() => {
    resetSelection();
  }, [state]);

  const handleCardClick = (cardIdx: number) => {
    if(passCardIndexes.has(cardIdx)) {
      onMove({ type: 'pass', cardIdx });
      return;
    }

    setSelectedCard(cardIdx);
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const handlePieceClick = (index: number) => {
    if(selectedCard === null || !state.isCurrentTeamPiece(index)) {
      return;
    }

    setSelectedPiece(index);
    setValidMoves(state.getDestinations(selectedCard, index));
  };

  const handleMoveClick = (index: number) => {
    if(selectedCard === null || selectedPiece === null || !validMoves.includes(index)) {
      return;
    }

    onMove({
      type: 'play',
      cardIdx: selectedCard,
      srcIdx: selectedPiece,
      dstIdx: index,
    });
  };

  const renderCard = (cardIdx: number | null, isSelected = false) => {
    if(cardIdx === null) {
      return (
        <div className="text-center text-xl p-1 bg-white rounded border border-white">
          <div />
          <div className="grid grid-cols-5 border-b border-r border-white">
            {Array.from({ length: 25 }, (_, index) => (
              <div key={index} className="w-5 h-5 border-t border-l border-white" />
            ))}
          </div>
        </div>
      );
    }

    const card = ONITAMA_DECK[cardIdx];
    const cardColor = { R: 'bg-red-400', B: 'bg-blue-400', '': 'bg-yellow-400' }[card.color];
    const highlight = isSelected ? 'ring-2 ring-gray-800' : '';

    return (
      <div
        className={`text-center text-xl p-1 bg-white rounded border border-gray-800 ${highlight} ${card.first === 'R' ? 'text-red-600' : 'text-blue-700'}`}
      >
        <div>{card.name}</div>
        <div className="grid grid-cols-5 border-b border-r border-gray-500">
          {[-2, -1, 0, 1, 2].map((row) => (
            [-2, -1, 0, 1, 2].map((col) => {
              const isMove = card.moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
              return (
                <div
                  key={`${row}-${col}`}
                  className={`w-5 h-5 border-t border-l border-gray-500 ${isMove ? cardColor : (row === 0 && col === 0 ? 'bg-gray-800' : 'bg-gray-100')}`}
                />
              );
            })
          ))}
        </div>
      </div>
    );
  };

  const cellClass = (index: number) => {
    const cell = state.board[index];
    const size = 'RB'.includes(cell || '') ? 'text-4xl' : 'text-3xl';

    let bg = 'bg-gray-200';
    if(index % 5 === 2) {
      if(index < 5) {
        bg = 'bg-blue-200';
      } else if(index >= 20) {
        bg = 'bg-red-200';
      }
    }

    const fg = !cell ? '' : (cell.toUpperCase() === 'R' ? 'text-red-600' : 'text-blue-700');
    const highlight = validMoves.includes(index)
      ? 'bg-yellow-200'
      : (selectedPiece === index ? 'bg-yellow-100' : '');
    const cursor = validMoves.includes(index) || state.isCurrentTeamPiece(index)
      ? 'cursor-pointer'
      : 'cursor-default';

    return `w-12 h-12 border-gray-500 border-b-2 border-r-2 flex items-center justify-center ${size} ${bg} ${fg} ${highlight} ${cursor}`;
  };

  const renderPlayerCards = (team: 'R' | 'B') => {
    const isCurrentTeam = team === state.getCurrentTeam();
    const teamKey = team.toLowerCase() as 'r' | 'b';

    return (
      <div className={`flex flex-row gap-2 ${team === 'B' ? 'rotate-180' : ''}`}>
        {state.cards[teamKey].map((cardIdx) => (
          <div
            key={cardIdx}
            className={isCurrentTeam ? 'cursor-pointer' : 'cursor-default'}
            data-testid={`onitama-card-${cardIdx}`}
            onClick={() => isCurrentTeam && handleCardClick(cardIdx)}
          >
            {renderCard(cardIdx, isCurrentTeam && selectedCard === cardIdx)}
          </div>
        ))}
        <div className="scale-90 ml-6 opacity-70 cursor-default">
          {renderCard(isCurrentTeam ? state.cards.n : null)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4" style={{ fontFamily: 'Papyrus,Trattatello,Luminari,cursive' }}>
      {renderPlayerCards('B')}

      {passCardIndexes.size > 0 && (
        <div className="text-sm text-gray-700">No legal moves. Click a card to pass.</div>
      )}

      <div className="grid grid-cols-5 border-gray-500 border-t-2 border-l-2" data-testid="onitama-board">
        {state.board.map((cell, index) => (
          <div
            key={index}
            className={cellClass(index)}
            data-testid={`onitama-cell-${index}`}
            onClick={() => (validMoves.includes(index) ? handleMoveClick(index) : handlePieceClick(index))}
          >
            {cell ? ('RB'.includes(cell) ? <FaChessKing /> : <FaChessPawn />) : ''}
          </div>
        ))}
      </div>

      {renderPlayerCards('R')}
    </div>
  );
};

export default OnitamaBoard;
