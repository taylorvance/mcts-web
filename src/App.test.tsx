import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { APP_STORAGE_KEY, getGameSessionStorageKey, readJsonStorage } from './utils/persistence';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.removeItem(APP_STORAGE_KEY);
  });

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

  it('restores the selected game and MCTS settings from localStorage', () => {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({
      selectedGame: 'Onitama',
      mctsSettings: {
        explorationBias: 2.5,
        maxIterations: 250,
        maxTime: 3,
      },
    }));

    render(<App />);

    expect(screen.getByRole('combobox')).toHaveValue('Onitama');
    expect(screen.getByTestId('onitama-board')).toBeInTheDocument();
    expect(screen.getByLabelText('Exploration Bias')).toHaveValue(2.5);
    expect(screen.getByLabelText('Max Iterations')).toHaveValue(250);
    expect(screen.getByLabelText('Max Time (s)')).toHaveValue(3);
  });

  it('can clear saved data and restore default settings', () => {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({
      selectedGame: 'Onitama',
      mctsSettings: {
        explorationBias: 2.5,
        maxIterations: 250,
        maxTime: 3,
      },
    }));
    window.localStorage.setItem(getGameSessionStorageKey('Onitama'), JSON.stringify({
      version: 1,
      history: ['__INITIAL_STATE__'],
      historyIdx: 0,
      doAIMoveAfterPlayer: true,
      initialState: {},
    }));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset saved data' }));

    expect(screen.getByRole('combobox')).toHaveValue('TicTacToe');
    expect(screen.getByLabelText('Exploration Bias')).toHaveValue(1.414);
    expect(screen.getByLabelText('Max Iterations')).toHaveValue(1000);
    expect(screen.getByLabelText('Max Time (s)')).toHaveValue(1);
    expect(readJsonStorage(getGameSessionStorageKey('Onitama'))).toBeNull();
    expect(readJsonStorage(APP_STORAGE_KEY)).toMatchObject({
      selectedGame: 'TicTacToe',
      mctsSettings: {
        explorationBias: 1.414,
        maxIterations: 1000,
        maxTime: 1,
      },
    });
  });
});
