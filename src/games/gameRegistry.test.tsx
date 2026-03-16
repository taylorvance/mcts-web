import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FillerState } from './Filler/state';
import { games } from './gameRegistry';

describe('gameRegistry', () => {
  it.each([
    ['TicTacToe', games.TicTacToe],
    ['UltimateTicTacToe', games.UltimateTicTacToe],
  ])('adapts typed board moves for %s', (_gameName, game) => {
    const onMove = vi.fn();
    const { container } = render(<game.Board state={game.createInitialState()} onMove={onMove} />);

    const firstClickableElement = screen.queryAllByRole('button')[0]
      ?? container.querySelector('.cursor-pointer');
    expect(firstClickableElement).not.toBeNull();
    fireEvent.click(firstClickableElement!);

    expect(onMove).toHaveBeenCalledWith('0');
  });

  it('adapts typed board moves for Filler', () => {
    const onMove = vi.fn();
    const fillerBoard = new Uint8Array([
      0, 2, 2, 2, 3, 3, 4, 4,
      0, 0, 2, 3, 3, 4, 4, 4,
      5, 0, 2, 2, 3, 4, 5, 5,
      5, 5, 1, 1, 1, 4, 4, 5,
      2, 5, 1, 3, 1, 1, 4, 5,
      2, 2, 1, 3, 3, 1, 5, 1,
      2, 2, 1, 3, 3, 5, 1, 1,
    ]);
    const state = new FillerState(fillerBoard, true);

    render(<games.Filler.Board state={state} onMove={onMove} />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onMove).toHaveBeenCalledWith('2');
  });
});
