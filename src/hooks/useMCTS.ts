import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchMetrics } from 'multimcts';
import type { AppGameState, Game, SearchTreeLike } from '../types/Game';

export interface SearchStats extends SearchMetrics {
  roundsPerSecond: number;
}

const SEARCH_BATCH_BUDGET_MS = 12;

const getNow = () => globalThis.performance?.now?.() ?? Date.now();

const yieldToBrowser = async () => new Promise<void>((resolve) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => resolve());
    return;
  }

  globalThis.setTimeout(resolve, 0);
});

const normalizeSearchLimit = (value: number | null) => (
  value !== null && value > 0 ? value : null
);

export const useMCTS = (
  game: Game,
  settings: { explorationBias: number; maxIterations: number | null; maxTime: number | null },
) => {
  const { explorationBias, maxIterations, maxTime } = settings;
  const mctsRef = useRef<SearchTreeLike | null>(null);
  const activeSearchRef = useRef<object | null>(null);
  const [mcts, setMcts] = useState<SearchTreeLike | null>(null);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);

  const cancelSearch = useCallback(() => {
    activeSearchRef.current = null;
  }, []);

  useEffect(() => {
    cancelSearch();
  }, [cancelSearch, explorationBias, game, maxIterations, maxTime]);

  useEffect(() => () => {
    cancelSearch();
  }, [cancelSearch]);

  const runSearch = useCallback(async (state: AppGameState) => {
    const normalizedMaxIterations = normalizeSearchLimit(maxIterations);
    const normalizedMaxTime = normalizeSearchLimit(maxTime);
    if (normalizedMaxIterations === null && normalizedMaxTime === null) {
      throw new Error('At least one positive search limit is required.');
    }

    const currentMCTS = mctsRef.current;
    const nextMCTS = currentMCTS && currentMCTS.explorationBias === explorationBias
      ? currentMCTS
      : game.createSearch(explorationBias);
    const searchToken = {};
    activeSearchRef.current = searchToken;
    try {
      const startTime = getNow();
      game.search(nextMCTS, state, {
        maxIterations: 1,
        maxTime: null,
      });
      mctsRef.current = nextMCTS;

      if (activeSearchRef.current !== searchToken) {
        return null;
      }

      let iterations = 1;
      const iterationLimit = normalizedMaxIterations ?? Number.POSITIVE_INFINITY;
      const deadline = normalizedMaxTime === null
        ? Number.POSITIVE_INFINITY
        : startTime + (normalizedMaxTime * 1000);

      while (iterations < iterationLimit && getNow() < deadline) {
        const batchDeadline = Math.min(deadline, getNow() + SEARCH_BATCH_BUDGET_MS);
        do {
          if (activeSearchRef.current !== searchToken) {
            return null;
          }

          nextMCTS.executeRound(nextMCTS.root);
          iterations += 1;
        } while (iterations < iterationLimit && getNow() < batchDeadline);

        if (iterations < iterationLimit && getNow() < deadline) {
          await yieldToBrowser();
        }
      }

      if (activeSearchRef.current !== searchToken) {
        return null;
      }

      const move = nextMCTS.getBestMove(nextMCTS.root);
      if (move === null) {
        throw new Error('MCTS search did not produce a legal move.');
      }

      const elapsedMs = getNow() - startTime;
      const nextSearchStats = {
        elapsedMs,
        iterations,
        roundsPerSecond: elapsedMs > 0
          ? (iterations / elapsedMs) * 1000
          : 0,
      };
      setMcts(nextMCTS);
      setSearchStats(nextSearchStats);
      return move;
    } finally {
      if (activeSearchRef.current === searchToken) {
        activeSearchRef.current = null;
      }
    }
  }, [explorationBias, game, maxIterations, maxTime]);

  const advanceSearchTree = useCallback((move: unknown, nextState: AppGameState) => {
    cancelSearch();

    const currentMCTS = mctsRef.current;
    if (!currentMCTS?.root) {
      return;
    }

    if (game.advanceSearchTree(currentMCTS, move, nextState)) {
      setMcts(currentMCTS);
      return;
    }

    mctsRef.current = null;
    setMcts(null);
  }, [cancelSearch, game]);

  const resetMCTS = useCallback(() => {
    cancelSearch();

    if (!mctsRef.current) {
      return;
    }

    game.resetSearchTree(mctsRef.current);
    mctsRef.current = null;
    setMcts(null);
  }, [cancelSearch, game]);

  return {
    mcts,
    searchStats,
    runSearch,
    advanceSearchTree,
    resetMCTS,
    cancelSearch,
  };
};
