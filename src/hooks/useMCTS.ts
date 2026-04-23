import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchMetrics } from 'multimcts';
import type {
  AppGameState,
  Game,
  SearchTreeLike,
  SearchTreeNodeView,
} from '../types/Game';

export interface SearchStats extends SearchMetrics {
  retainedNodeCount: number;
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

const countRetainedNodes = (root: SearchTreeLike['root']) => {
  if (!root) {
    return 0;
  }

  let retainedNodeCount = 0;
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    retainedNodeCount += 1;
    for (const child of node.children.values()) {
      stack.push(child);
    }
  }

  return retainedNodeCount;
};

type SearchTreeStateLike = SearchTreeNodeView['state'];

const resolveStateKey = (state: AppGameState | SearchTreeStateLike) => (
  typeof state === 'object'
  && state !== null
  && 'getStateKey' in state
  && typeof state.getStateKey === 'function'
    ? state.getStateKey()
    : state.toString()
);

export const useMCTS = (
  game: Game,
  settings: {
    explorationBias: number;
    maxIterations: number | null;
    maxRetainedNodes: number | null;
    maxTime: number | null;
  },
) => {
  const {
    explorationBias,
    maxIterations,
    maxRetainedNodes,
    maxTime,
  } = settings;
  const mctsRef = useRef<SearchTreeLike | null>(null);
  const activeSearchRef = useRef<object | null>(null);
  const [mcts, setMcts] = useState<SearchTreeLike | null>(null);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);

  const cancelSearch = useCallback(() => {
    activeSearchRef.current = null;
  }, []);

  useEffect(() => {
    cancelSearch();
  }, [cancelSearch, explorationBias, game, maxIterations, maxRetainedNodes, maxTime]);

  useEffect(() => () => {
    cancelSearch();
  }, [cancelSearch]);

  const runSearch = useCallback(async (state: AppGameState) => {
    const normalizedMaxIterations = normalizeSearchLimit(maxIterations);
    const normalizedMaxRetainedNodes = normalizeSearchLimit(maxRetainedNodes);
    const normalizedMaxTime = normalizeSearchLimit(maxTime);
    if (
      normalizedMaxIterations === null
      && normalizedMaxRetainedNodes === null
      && normalizedMaxTime === null
    ) {
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
      const currentRetainedNodeCount = countRetainedNodes(nextMCTS.root);
      const isMatchingRoot = nextMCTS.root !== null
        && resolveStateKey(nextMCTS.root.state) === resolveStateKey(state);
      let iterations = 0;
      let retainedNodeCount = currentRetainedNodeCount;

      if (
        normalizedMaxRetainedNodes === null
        || !isMatchingRoot
        || currentRetainedNodeCount < normalizedMaxRetainedNodes
      ) {
        game.search(nextMCTS, state, {
          maxIterations: 1,
          maxTime: null,
        });
        mctsRef.current = nextMCTS;
        iterations = 1;
        retainedNodeCount = countRetainedNodes(nextMCTS.root);
      } else {
        mctsRef.current = nextMCTS;
      }

      if (activeSearchRef.current !== searchToken) {
        return null;
      }

      const iterationLimit = normalizedMaxIterations ?? Number.POSITIVE_INFINITY;
      const deadline = normalizedMaxTime === null
        ? Number.POSITIVE_INFINITY
        : startTime + (normalizedMaxTime * 1000);

      while (
        iterations < iterationLimit
        && getNow() < deadline
        && (
          normalizedMaxRetainedNodes === null
          || retainedNodeCount < normalizedMaxRetainedNodes
        )
      ) {
        const batchDeadline = Math.min(deadline, getNow() + SEARCH_BATCH_BUDGET_MS);
        do {
          if (activeSearchRef.current !== searchToken) {
            return null;
          }

          nextMCTS.executeRound(nextMCTS.root);
          iterations += 1;
        } while (iterations < iterationLimit && getNow() < batchDeadline);

        retainedNodeCount = countRetainedNodes(nextMCTS.root);

        if (
          iterations < iterationLimit
          && getNow() < deadline
          && (
            normalizedMaxRetainedNodes === null
            || retainedNodeCount < normalizedMaxRetainedNodes
          )
        ) {
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
        retainedNodeCount,
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
  }, [explorationBias, game, maxIterations, maxRetainedNodes, maxTime]);

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
