import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { games } from '../games/gameRegistry';
import TicTacToeState from '../games/TicTacToe/state';
import { useMCTS } from './useMCTS';

const TEST_SETTINGS = {
  explorationBias: 1.414,
  maxIterations: 1,
  maxTime: null,
};

describe('useMCTS', () => {
  it('reuses the same root node for repeated searches from the same state', async () => {
    const state = new TicTacToeState();
    const { result } = renderHook(() => useMCTS(games.TicTacToe, TEST_SETTINGS));

    await act(async () => {
      await result.current.runSearch(state);
    });

    const initialRoot = result.current.mcts?.root;
    const initialVisits = initialRoot?.visits ?? 0;

    await act(async () => {
      await result.current.runSearch(state);
    });

    expect(result.current.searchStats?.iterations).toBe(1);
    expect(result.current.searchStats?.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(result.current.mcts?.root).toBe(initialRoot);
    expect(result.current.mcts?.root?.visits).toBeGreaterThan(initialVisits);
  });

  it('promotes an explored child node after applying its move', async () => {
    const state = new TicTacToeState();
    const { result } = renderHook(() => useMCTS(games.TicTacToe, TEST_SETTINGS));
    let move = -1;

    await act(async () => {
      move = await result.current.runSearch(state) as number;
    });

    const childNode = result.current.mcts?.root?.children.get(move);
    const nextState = state.makeMove(move);

    act(() => {
      result.current.advanceSearchTree(move, nextState);
    });

    expect(result.current.mcts?.root).toBe(childNode);
    expect(result.current.mcts?.root?.parent).toBeNull();
    expect(result.current.mcts?.root?.state.toString()).toBe(nextState.toString());
  });

  it('clears the tree when the applied move was not explored', async () => {
    const state = new TicTacToeState();
    const { result } = renderHook(() => useMCTS(games.TicTacToe, TEST_SETTINGS));
    let exploredMove = -1;

    await act(async () => {
      exploredMove = await result.current.runSearch(state) as number;
    });

    const unexploredMove = state.getLegalMoves().find((move) => move !== exploredMove)!;
    const nextState = state.makeMove(unexploredMove);

    act(() => {
      result.current.advanceSearchTree(unexploredMove, nextState);
    });

    expect(result.current.mcts).toBeNull();
  });
});
