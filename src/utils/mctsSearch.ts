import { GameState, MCTS } from 'multimcts';

export interface SearchMetrics {
	elapsedMs: number;
	iterations: number;
}

export const runSearchRounds = (
	mcts: MCTS<GameState>,
	state: GameState,
	maxIterations: number | null,
	maxTime: number | null,
) => {
	if(maxIterations === null && maxTime === null) {
		throw new Error('At least one search limit is required.');
	}

	const result = mcts.search(state, {
		...(maxIterations !== null ? { maxIterations } : {}),
		...(maxTime !== null ? { maxTimeMs: maxTime * 1000 } : {}),
	});

	if(result.bestMove === null) {
		throw new Error('MCTS search did not produce a legal move.');
	}

	return {
		metrics: {
			elapsedMs: result.elapsedMs,
			iterations: result.iterations,
		},
		move: result.bestMove,
	};
};
