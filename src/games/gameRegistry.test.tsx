import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
