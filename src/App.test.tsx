import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the shell and allows switching to Onitama', () => {
    render(<App />);

    expect(screen.getByText('MCTS Settings')).toBeInTheDocument();
    expect(screen.getByText('Search Tree')).toBeInTheDocument();

    const gameSelect = screen.getByRole('combobox');
    expect(gameSelect).toHaveValue('TicTacToe');

    fireEvent.change(gameSelect, { target: { value: 'Onitama' } });

    expect(gameSelect).toHaveValue('Onitama');
    expect(screen.getByTestId('onitama-board')).toBeInTheDocument();
  });
});
