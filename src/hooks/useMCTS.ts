// src/hooks/useMCTS.ts
import { useCallback, useRef, useState } from 'react';
import { GameState, MCTS } from 'multimcts';
import { runSearchRounds, SearchMetrics } from '../utils/mctsSearch';

export interface SearchStats extends SearchMetrics {
	roundsPerSecond: number;
}

export const useMCTS = (settings: {explorationBias:number; maxIterations:number|null; maxTime:number|null}) => {
	const { explorationBias, maxIterations, maxTime } = settings;
	const mctsRef = useRef<MCTS<GameState> | null>(null);
	const [mcts, setMcts] = useState<MCTS<GameState> | null>(null);
	const [searchStats, setSearchStats] = useState<SearchStats | null>(null);

	const runSearch = useCallback((state: GameState) => {
		const currentMCTS = mctsRef.current;
		const nextMCTS = currentMCTS && currentMCTS.explorationBias === explorationBias
			? currentMCTS
			: new MCTS<GameState>({ explorationBias });
		const { move, metrics } = runSearchRounds(nextMCTS, state, maxIterations, maxTime);
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
	}, [explorationBias, maxIterations, maxTime]);

	const advanceSearchTree = useCallback((move: string, nextState: GameState) => {
		const currentMCTS = mctsRef.current;
		if(!currentMCTS?.root) return;

		if(currentMCTS.advanceToChild(move, nextState)) {
			setMcts(currentMCTS);
			return;
		}

		mctsRef.current = null;
		setMcts(null);
	}, []);

	const resetMCTS = useCallback(() => {
		if(!mctsRef.current) return;
		mctsRef.current.reset();
		mctsRef.current = null;
		setMcts(null);
	}, []);

	return {
		mcts,
		searchStats,
		runSearch,
		advanceSearchTree,
		resetMCTS,
	};
};
