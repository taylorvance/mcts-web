// src/hooks/useMCTS.ts
import { useCallback, useState } from 'react';
import { MCTS, GameState } from 'multimcts';

export const useMCTS = (settings: {explorationBias:number; maxIterations:number|null; maxTime:number|null}) => {
	const [mcts, setMCTS] = useState<MCTS | null>(null);
	const { explorationBias, maxIterations, maxTime } = settings;

	const runSearch = useCallback((state: GameState) => {
		const newMCTS = new MCTS(explorationBias);
		const move = newMCTS.search(state, maxIterations??undefined, maxTime??undefined);
		setMCTS(newMCTS);
		return move;
	}, [explorationBias, maxIterations, maxTime]);

	const resetMCTS = useCallback(() => {
		setMCTS(null);
	}, []);

	return { mcts, runSearch, resetMCTS };
};
