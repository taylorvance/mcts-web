// src/hooks/useMCTS.ts
import { useCallback, useRef, useState } from 'react';
import { SearchMetrics } from 'multimcts';
import { AppGameState, Game, SearchTreeLike } from '../types/Game';

export interface SearchStats extends SearchMetrics {
	roundsPerSecond: number;
}

export const useMCTS = (game: Game, settings: {explorationBias:number; maxIterations:number|null; maxTime:number|null}) => {
	const { explorationBias, maxIterations, maxTime } = settings;
	const mctsRef = useRef<SearchTreeLike | null>(null);
	const [mcts, setMcts] = useState<SearchTreeLike | null>(null);
	const [searchStats, setSearchStats] = useState<SearchStats | null>(null);

	const runSearch = useCallback((state: AppGameState) => {
		const currentMCTS = mctsRef.current;
		const nextMCTS = currentMCTS && currentMCTS.explorationBias === explorationBias
			? currentMCTS
			: game.createSearch(explorationBias);
		const { move, metrics } = game.search(nextMCTS, state, {
			maxIterations,
			maxTime,
		});
		mctsRef.current = nextMCTS;
		const nextSearchStats = {
			...metrics,
			roundsPerSecond: metrics.elapsedMs > 0
				? (metrics.iterations / metrics.elapsedMs) * 1000
				: 0,
		};
		setMcts(nextMCTS);
		setSearchStats(nextSearchStats);
		return move;
	}, [explorationBias, game, maxIterations, maxTime]);

	const advanceSearchTree = useCallback((move: unknown, nextState: AppGameState) => {
		const currentMCTS = mctsRef.current;
		if(!currentMCTS?.root) return;

		if(game.advanceSearchTree(currentMCTS, move, nextState)) {
			setMcts(currentMCTS);
			return;
		}

		mctsRef.current = null;
		setMcts(null);
	}, [game]);

	const resetMCTS = useCallback(() => {
		if(!mctsRef.current) return;
		game.resetSearchTree(mctsRef.current);
		mctsRef.current = null;
		setMcts(null);
	}, [game]);

	return {
		mcts,
		searchStats,
		runSearch,
		advanceSearchTree,
		resetMCTS,
	};
};
