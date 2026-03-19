// src/hooks/useMCTS.ts
import { useCallback, useReducer, useRef } from 'react';
import { GameState, MCTS } from 'multimcts';
import { getStateKey, runSearchRounds, SearchMetrics } from '../utils/mctsSearch';

interface SearchStats extends SearchMetrics {
	roundsPerSecond: number;
}

export const useMCTS = (settings: {explorationBias:number; maxIterations:number|null; maxTime:number|null}) => {
	const { explorationBias, maxIterations, maxTime } = settings;
	const mctsRef = useRef<MCTS | null>(null);
	const searchStatsRef = useRef<SearchStats | null>(null);
	const [, bumpVersion] = useReducer((version: number) => version + 1, 0);

	const runSearch = useCallback((state: GameState) => {
		const currentMCTS = mctsRef.current;
		const nextMCTS = currentMCTS && currentMCTS.explorationBias === explorationBias
			? currentMCTS
			: new MCTS(explorationBias);
		const { move, metrics } = runSearchRounds(nextMCTS, state, maxIterations, maxTime);
		mctsRef.current = nextMCTS;
		searchStatsRef.current = {
			...metrics,
			roundsPerSecond: metrics.elapsedMs > 0
				? (metrics.iterations / metrics.elapsedMs) * 1000
				: 0,
		};
		bumpVersion();
		return move;
	}, [explorationBias, maxIterations, maxTime]);

	const advanceSearchTree = useCallback((move: string, nextState: GameState) => {
		const currentMCTS = mctsRef.current;
		if(!currentMCTS?.rootNode) return;

		const nextRootNode = currentMCTS.rootNode.children[move];
		if(
			nextRootNode
			&& (nextRootNode.state === nextState || getStateKey(nextRootNode.state) === getStateKey(nextState))
		) {
			nextRootNode.parent = null;
			currentMCTS.rootNode = nextRootNode;
			bumpVersion();
			return;
		}

		mctsRef.current = null;
		bumpVersion();
	}, []);

	const resetMCTS = useCallback(() => {
		if(!mctsRef.current) return;
		mctsRef.current = null;
		bumpVersion();
	}, []);

	return {
		mcts: mctsRef.current,
		searchStats: searchStatsRef.current,
		runSearch,
		advanceSearchTree,
		resetMCTS,
	};
};
