import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { games } from '../gameRegistry';
import { OnitamaState } from './state';
import type { OnitamaCards, OnitamaPiece } from './state';

const renderBoard = (cards: OnitamaCards, board = OnitamaState.initializeBoard()) => {
  const onMove = vi.fn();
  const state = new OnitamaState(board, true, cards, 0);

  render(<games.Onitama.Board state={state} onMove={onMove} />);

  return { onMove };
};

describe('OnitamaBoard', () => {
  it('plays the only matching card implicitly after selecting a piece', () => {
    const { onMove } = renderBoard({ r: [2, 4], b: [1, 3], n: 0 });

    fireEvent.click(screen.getByTestId('onitama-cell-22'));
    fireEvent.click(screen.getByTestId('onitama-cell-17'));

    expect(onMove).toHaveBeenCalledWith({
      type: 'play',
      cardIdx: 2,
      srcIdx: 22,
      dstIdx: 17,
    });
  });

  it('prompts for a card when multiple cards allow the same destination', () => {
    const { onMove } = renderBoard({ r: [2, 6], b: [1, 3], n: 0 });

    fireEvent.click(screen.getByTestId('onitama-cell-22'));
    fireEvent.click(screen.getByTestId('onitama-cell-17'));

    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByText('Multiple cards can make that move. Choose a card.')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('onitama-card-6'));

    expect(onMove).toHaveBeenCalledWith({
      type: 'play',
      cardIdx: 6,
      srcIdx: 22,
      dstIdx: 17,
    });
  });

  it('renders the pass hint below the board', () => {
    const blockedBoard: OnitamaPiece[] = [
      'R', 'r', 'r', 'r', 'r',
      null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, 'B',
    ];
    renderBoard({ r: [2, 1], b: [3, 4], n: 0 }, blockedBoard);

    const board = screen.getByTestId('onitama-board');
    const hint = screen.getByText('No legal moves. Click a card to pass.');

    expect(board.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the victory rules and the winning method when the game is over', () => {
    const streamBoard: OnitamaPiece[] = [
      'r', 'r', 'R', 'r', 'r',
      null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, null,
      'b', 'b', null, 'b', 'b',
    ];
    renderBoard({ r: [2, 4], b: [1, 3], n: 0 }, streamBoard);

    expect(screen.getByText(/Way of the Stone/)).toBeInTheDocument();
    expect(screen.getByText('Red wins by Way of the Stream.')).toBeInTheDocument();
  });
});
