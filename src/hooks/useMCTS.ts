// src/hooks/useMCTS.ts
import { useCallback, useState } from 'react';
import { MCTS, GameState } from 'multimcts';

export const useMCTS = (settings: {explorationBias:number; maxIterations:number, maxTime:number}) => {
	const [mcts, setMCTS] = useState<MCTS | null>(null);

	const runSearch = useCallback((state: GameState) => {
		let { explorationBias, maxIterations, maxTime } = settings;
		explorationBias = explorationBias>0 ? explorationBias : null;
		maxIterations = maxIterations>0 ? maxIterations : null;
		maxTime = maxTime>0 ? maxTime : null;

		const newMCTS = new MCTS(explorationBias);
		const move = newMCTS.search(state, maxIterations, maxTime);
		setMCTS(newMCTS);
		return move;
	}, [settings.explorationBias, settings.maxIterations, settings.maxTime]);

	return { runSearch, mcts };
};
