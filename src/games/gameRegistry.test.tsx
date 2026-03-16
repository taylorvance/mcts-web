import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { games } from './gameRegistry';

describe('gameRegistry', () => {
  it('adapts typed game boards to encoded string moves', () => {
    const onMove = vi.fn();
    const ticTacToe = games.TicTacToe;

    render(<ticTacToe.Board state={ticTacToe.createInitialState()} onMove={onMove} />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onMove).toHaveBeenCalledWith('0');
  });
});
