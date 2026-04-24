import { beforeEach, describe, expect, it } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import App from './App';
import {
  APP_STORAGE_KEY,
  getGameSessionStorageKey,
  readJsonStorage,
} from './utils/persistence';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.removeItem(APP_STORAGE_KEY);
    window.history.replaceState(null, '', '/mcts-web/');
  });

  it('renders the shell and allows switching to Onitama', () => {
    render(<App />);

    expect(screen.getByText('MCTS Settings')).toBeInTheDocument();
    expect(screen.getByText('Search Tree')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'tvprograms.tech' }),
    ).toHaveAttribute('href', 'https://tvprograms.tech');

    const gameSelect = screen.getByLabelText('Game');
    expect(gameSelect).toHaveValue('TicTacToe');
    expect(screen.queryByLabelText('Variant')).not.toBeInTheDocument();

    fireEvent.change(gameSelect, { target: { value: 'Onitama' } });

    expect(gameSelect).toHaveValue('Onitama');
    expect(screen.getByTestId('onitama-board')).toBeInTheDocument();
  });

  it('restores the selected game and MCTS settings from localStorage', () => {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        selectedGameId: 'Onitama',
        mctsSettings: {
          explorationBias: 2.5,
          maxIterations: 250,
          maxRetainedNodes: 5000,
          maxTime: 300,
        },
        lastSelectedGameIdByFamily: {
          Onitama: 'Onitama',
        },
      }),
    );

    render(<App />);

    expect(screen.getByLabelText('Game')).toHaveValue('Onitama');
    expect(screen.getByTestId('onitama-board')).toBeInTheDocument();
    expect(screen.getByLabelText('Exploration Bias')).toHaveValue(2.5);
    expect(screen.getByLabelText('Max Iterations')).toHaveValue(250);
    expect(screen.getByLabelText('Max Retained Nodes')).toHaveValue(5000);
    expect(screen.getByLabelText('Max Time (ms)')).toHaveValue(300);
    expect(
      screen.getByText(
        /Leave Max Iterations, Max Time, or Max Retained Nodes blank to unset them\. Search requires Max Iterations or Max Time\./i,
      ),
    ).toBeInTheDocument();
  });

  it('shows the Shogi family when a Dobutsu leaf game is selected', () => {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        selectedGameId: 'DobutsuShogi',
        mctsSettings: {
          explorationBias: 1.414,
          maxIterations: 1000,
          maxRetainedNodes: null,
          maxTime: 1000,
        },
        lastSelectedGameIdByFamily: {
          Shogi: 'DobutsuShogi',
        },
      }),
    );

    render(<App />);

    expect(screen.getByLabelText('Game')).toHaveValue('Shogi');
    expect(screen.getAllByLabelText('Variant')[0]).toHaveValue('DobutsuShogi');
    expect(screen.getByTestId('dobutsu-board')).toBeInTheDocument();
  });

  it('switches between Shogi variants with the variant selector', () => {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        selectedGameId: 'DobutsuShogi',
        mctsSettings: {
          explorationBias: 1.414,
          maxIterations: 1000,
          maxRetainedNodes: null,
          maxTime: 1000,
        },
        lastSelectedGameIdByFamily: {
          Shogi: 'DobutsuShogi',
        },
      }),
    );

    render(<App />);

    fireEvent.change(screen.getAllByLabelText('Variant')[0], {
      target: { value: 'GoroGoroDobutsuShogi' },
    });

    expect(screen.getByLabelText('Game')).toHaveValue('Shogi');
    expect(screen.getAllByLabelText('Variant')[0]).toHaveValue('GoroGoroDobutsuShogi');
    expect(screen.getByTestId('gorogoro-board')).toBeInTheDocument();
  });

  it('prefers the querystring game over localStorage', () => {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        selectedGameId: 'Onitama',
        mctsSettings: {
          explorationBias: 2.5,
          maxIterations: 250,
          maxRetainedNodes: 5000,
          maxTime: 300,
        },
        lastSelectedGameIdByFamily: {
          Onitama: 'Onitama',
        },
      }),
    );
    window.history.replaceState(null, '', '/mcts-web/?game=Othello');

    render(<App />);

    expect(screen.getByLabelText('Game')).toHaveValue('Othello');
  });

  it('keeps the querystring in sync with the selected game', async () => {
    render(<App />);

    let gameSelect = screen.getByLabelText('Game');

    fireEvent.change(gameSelect, { target: { value: 'Onitama' } });
    await waitFor(() => {
      expect(window.location.search).toBe('?game=Onitama');
    });

    gameSelect = screen.getByLabelText('Game');
    fireEvent.change(gameSelect, { target: { value: 'TicTacToe' } });
    await waitFor(() => {
      expect(window.location.search).toBe('');
    });
  });

  it('ignores older unversioned app storage and falls back to defaults', () => {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        selectedGameId: 'Onitama',
        mctsSettings: {
          explorationBias: 2.5,
          maxIterations: 250,
          maxRetainedNodes: 5000,
          maxTime: 1,
        },
        lastSelectedGameIdByFamily: {
          Onitama: 'Onitama',
        },
      }),
    );

    render(<App />);

    expect(screen.getByLabelText('Game')).toHaveValue('TicTacToe');
    expect(screen.getByLabelText('Max Iterations')).toHaveValue(1000);
    expect(screen.getByLabelText('Max Retained Nodes')).toHaveDisplayValue('');
    expect(screen.getByLabelText('Max Time (ms)')).toHaveValue(1000);
  });

  it('can clear saved data and restore default settings', () => {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        selectedGameId: 'Onitama',
        mctsSettings: {
          explorationBias: 2.5,
          maxIterations: 250,
          maxRetainedNodes: 5000,
          maxTime: 300,
        },
        lastSelectedGameIdByFamily: {
          Onitama: 'Onitama',
        },
      }),
    );
    window.localStorage.setItem(
      getGameSessionStorageKey('Onitama'),
      JSON.stringify({
        version: 2,
        history: ['__INITIAL_STATE__'],
        historyIdx: 0,
        isAutoReplyEnabled: true,
        initialState: {},
      }),
    );

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset saved data' }));

    expect(screen.getByLabelText('Game')).toHaveValue('TicTacToe');
    expect(window.location.search).toBe('');
    expect(screen.getByLabelText('Exploration Bias')).toHaveValue(1.414);
    expect(screen.getByLabelText('Max Iterations')).toHaveValue(1000);
    expect(screen.getByLabelText('Max Retained Nodes')).toHaveDisplayValue('');
    expect(screen.getByLabelText('Max Time (ms)')).toHaveValue(1000);
    expect(readJsonStorage(getGameSessionStorageKey('Onitama'))).toBeNull();
    expect(readJsonStorage(APP_STORAGE_KEY)).toMatchObject({
      version: 1,
      selectedGameId: 'TicTacToe',
      mctsSettings: {
        explorationBias: 1.414,
        maxIterations: 1000,
        maxRetainedNodes: null,
        maxTime: 1000,
      },
      lastSelectedGameIdByFamily: {
        TicTacToe: 'TicTacToe',
      },
    });
  });

  it('shows both app help and game-specific help in the modal', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Help' }));

    const appHelpDialog = screen.getByRole('dialog', { name: 'MCTS Help' });
    expect(appHelpDialog).toBeInTheDocument();
    expect(
      within(appHelpDialog).getByText(
        /Play a variety of games, run MCTS from the current position/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(appHelpDialog).getByText(
        /Exploration Bias controls how much MCTS favors proven lines/i,
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'TicTacToe' }));

    const gameHelpDialog = screen.getByRole('dialog', {
      name: 'TicTacToe Help',
    });
    expect(gameHelpDialog).toBeInTheDocument();
    expect(
      within(gameHelpDialog).getByRole('button', { name: 'TicTacToe' }),
    ).toBeInTheDocument();
  });

  it('updates the game help page when the selected game changes', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    fireEvent.click(screen.getByRole('button', { name: 'TicTacToe' }));
    expect(
      screen.getByRole('dialog', { name: 'TicTacToe Help' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Game'), {
      target: { value: 'Onitama' },
    });

    const dialog = screen.getByRole('dialog', { name: 'Onitama Help' });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/shares a fifth card in the center/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/Way of the Stone/i)).toBeInTheDocument();
  });

  it('toggles help with the question mark hotkey', () => {
    render(<App />);

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    const dialog = screen.getByRole('dialog', { name: 'MCTS Help' });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Play a variety of games, run MCTS from the current position/i,
      ),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    const closedDialog = screen.queryByRole('dialog', { name: 'MCTS Help' });
    expect(closedDialog).not.toBeInTheDocument();
  });

  it('persists the selected help tab across closing and reopening', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    fireEvent.click(screen.getByRole('button', { name: 'TicTacToe' }));
    expect(
      screen.getByRole('dialog', { name: 'TicTacToe Help' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(
      screen.queryByRole('dialog', { name: 'TicTacToe Help' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(
      screen.getByRole('dialog', { name: 'TicTacToe Help' }),
    ).toBeInTheDocument();
  });

  it('persists the most recently selected game for the active family', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Game'), {
      target: { value: 'Onitama' },
    });

    await waitFor(() => {
      expect(readJsonStorage(APP_STORAGE_KEY)).toMatchObject({
        version: 1,
        selectedGameId: 'Onitama',
        lastSelectedGameIdByFamily: {
          TicTacToe: 'TicTacToe',
          Onitama: 'Onitama',
        },
      });
    });
  });

  it('persists the last selected variant within the Shogi family', async () => {
    window.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        selectedGameId: 'DobutsuShogi',
        mctsSettings: {
          explorationBias: 1.414,
          maxIterations: 1000,
          maxRetainedNodes: null,
          maxTime: 1000,
        },
        lastSelectedGameIdByFamily: {
          Shogi: 'DobutsuShogi',
        },
      }),
    );

    render(<App />);

    fireEvent.change(screen.getAllByLabelText('Variant')[0], {
      target: { value: 'GoroGoroDobutsuShogi' },
    });

    await waitFor(() => {
      expect(readJsonStorage(APP_STORAGE_KEY)).toMatchObject({
        version: 1,
        selectedGameId: 'GoroGoroDobutsuShogi',
        lastSelectedGameIdByFamily: {
          Shogi: 'GoroGoroDobutsuShogi',
        },
      });
    });
  });

});
