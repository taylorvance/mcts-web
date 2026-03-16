import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { games } from '../games/gameRegistry';
import { useGameSession } from './useGameSession';

const TEST_SETTINGS = {
  explorationBias: 1.414,
  maxIterations: 1,
  maxTime: 0.01,
};

describe('useGameSession', () => {
  it('supports undo, redo, and reset flows', () => {
    const { result } = renderHook(() => useGameSession(games.TicTacToe, TEST_SETTINGS));

    act(() => {
      result.current.toggleAIMoveAfterPlayer();
      result.current.handlePlayerMove('0');
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
});
