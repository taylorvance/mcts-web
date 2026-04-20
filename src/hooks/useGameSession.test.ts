import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { games } from '../games/gameRegistry';
import { OnitamaState } from '../games/Onitama/state';
import { formatGameStateDebugLabel } from '../utils/gameStateDebug';
import { getGameSessionStorageKey, readJsonStorage } from '../utils/persistence';
import { useGameSession } from './useGameSession';

const TEST_SETTINGS = {
  explorationBias: 1.414,
  maxIterations: 1,
  maxTime: 0.01,
};

describe('useGameSession', () => {
  beforeEach(() => {
    window.localStorage.removeItem(getGameSessionStorageKey(games.TicTacToe.id));
    window.localStorage.removeItem(getGameSessionStorageKey(games.Onitama.id));
  });

  it('supports undo, redo, and reset flows', () => {
    const { result } = renderHook(() => useGameSession(games.TicTacToe, TEST_SETTINGS));

    act(() => {
      result.current.toggleAIMoveAfterPlayer();
      result.current.handlePlayerMove(0);
    });

    expect(result.current.historyIdx).toBe(1);
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undoMove();
    });

    expect(result.current.historyIdx).toBe(0);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redoMove();
    });

    expect(result.current.historyIdx).toBe(1);

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.historyIdx).toBe(0);

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.history).toHaveLength(1);
  });

  it('clears persisted history on the second reset tap', async () => {
    const { result } = renderHook(() => useGameSession(games.TicTacToe, TEST_SETTINGS));

    act(() => {
      result.current.toggleAIMoveAfterPlayer();
      result.current.handlePlayerMove(0);
    });

    await waitFor(() => {
      expect(readJsonStorage(getGameSessionStorageKey(games.TicTacToe.id))).toMatchObject({
        history: ['__INITIAL_STATE__', '0'],
        historyIdx: 1,
      });
    });

    act(() => {
      result.current.resetGame();
    });

    await waitFor(() => {
      expect(readJsonStorage(getGameSessionStorageKey(games.TicTacToe.id))).toMatchObject({
        history: ['__INITIAL_STATE__', '0'],
        historyIdx: 0,
      });
    });

    act(() => {
      result.current.resetGame();
    });

    await waitFor(() => {
      expect(readJsonStorage(getGameSessionStorageKey(games.TicTacToe.id))).toMatchObject({
        history: ['__INITIAL_STATE__'],
        historyIdx: 0,
      });
    });
  });

  it('can autoplay forward from the current state', async () => {
    const { result } = renderHook(() => useGameSession(games.TicTacToe, TEST_SETTINGS));

    act(() => {
      result.current.toggleAutoplay();
    });

    await waitFor(() => {
      expect(result.current.historyIdx).toBeGreaterThan(0);
    });

    if(result.current.isAutoplaying) {
      act(() => {
        result.current.toggleAutoplay();
      });
    }
  });

  it('persists the current history and replay preference', async () => {
    const { result } = renderHook(() => useGameSession(games.TicTacToe, TEST_SETTINGS));

    act(() => {
      result.current.toggleAIMoveAfterPlayer();
      result.current.handlePlayerMove(0);
    });

    await waitFor(() => {
      expect(readJsonStorage(getGameSessionStorageKey(games.TicTacToe.id))).toMatchObject({
        history: ['__INITIAL_STATE__', '0'],
        historyIdx: 1,
        doAIMoveAfterPlayer: false,
      });
    });
  });

  it('restores a persisted session from localStorage', () => {
    const initialState = new OnitamaState(
      OnitamaState.initializeBoard(),
      true,
      { r: [2, 4], b: [1, 3], n: 0 },
      0,
    );
    const restoredState = initialState.makeMove({ type: 'play', cardIdx: 2, srcIdx: 22, dstIdx: 17 });

    window.localStorage.setItem(getGameSessionStorageKey(games.Onitama.id), JSON.stringify({
      version: 1,
      initialState: games.Onitama.serializeState(initialState),
      history: ['__INITIAL_STATE__', '2,22,17'],
      historyIdx: 1,
      doAIMoveAfterPlayer: false,
    }));

    const { result } = renderHook(() => useGameSession(games.Onitama, TEST_SETTINGS));

    expect(result.current.history).toEqual(['__INITIAL_STATE__', '2,22,17']);
    expect(result.current.historyIdx).toBe(1);
    expect(result.current.doAIMoveAfterPlayer).toBe(false);
    expect(formatGameStateDebugLabel(result.current.gameState)).toBe(
      formatGameStateDebugLabel(restoredState),
    );
  });

  it('restores a persisted Ultimate Tic-Tac-Toe session with JSON null placeholders', () => {
    const initialState = games.UltimateTicTacToe.createInitialState();
    const restoredState = games.UltimateTicTacToe.applyMove(initialState, 0);

    window.localStorage.setItem(getGameSessionStorageKey(games.UltimateTicTacToe.id), JSON.stringify({
      version: 1,
      initialState: games.UltimateTicTacToe.serializeState(initialState),
      history: ['__INITIAL_STATE__', '0'],
      historyIdx: 1,
      doAIMoveAfterPlayer: true,
    }));

    const { result } = renderHook(() => useGameSession(games.UltimateTicTacToe, TEST_SETTINGS));

    expect(result.current.history).toEqual(['__INITIAL_STATE__', '0']);
    expect(result.current.historyIdx).toBe(1);
    expect(formatGameStateDebugLabel(result.current.gameState)).toBe(
      formatGameStateDebugLabel(restoredState),
    );
  });

  it('falls back to a clean Ultimate Tic-Tac-Toe state when persisted data is invalid', () => {
    window.localStorage.setItem(getGameSessionStorageKey(games.UltimateTicTacToe.id), JSON.stringify({
      version: 1,
      initialState: {
        board: Array(81).fill(0),
        team: true,
        boardStates: Array(9).fill(null),
      },
      history: ['__INITIAL_STATE__'],
      historyIdx: 0,
      doAIMoveAfterPlayer: true,
    }));

    const { result } = renderHook(() => useGameSession(games.UltimateTicTacToe, TEST_SETTINGS));
    const state = result.current.gameState;

    expect(formatGameStateDebugLabel(state)).toBe(formatGameStateDebugLabel(games.UltimateTicTacToe.createInitialState()));
  });
});
