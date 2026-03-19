import { GameState, MCTS, Node } from 'multimcts';

export const getStateKey = (state: GameState) => state.toString();

export interface SearchMetrics {
	elapsedMs: number;
	iterations: number;
}

export const runSearchRounds = (
	mcts: MCTS,
	state: GameState,
	maxIterations: number | null,
	maxTime: number | null,
) => {
	if(
		!mcts.rootNode
		|| (mcts.rootNode.state !== state && getStateKey(mcts.rootNode.state) !== getStateKey(state))
	) {
		mcts.rootNode = new Node(state);
	}

	let iteration = 0;
	const hasIterationLimit = maxIterations !== null;
	const hasTimeLimit = maxTime !== null;
	const endTime = hasTimeLimit ? Date.now() + (1000 * maxTime) : 0;
	const startTime = performance.now();

	do {
		mcts.executeRound(mcts.rootNode);
		iteration += 1;
	} while(
		(!hasIterationLimit || iteration < maxIterations)
		&& (!hasTimeLimit || Date.now() < endTime)
	);

	const bestChild = mcts.rootNode.findBestChild(0);
	if(!bestChild?.move) {
		throw new Error('MCTS search did not produce a legal move.');
	}

	return {
		metrics: {
			elapsedMs: performance.now() - startTime,
			iterations: iteration,
		},
		move: bestChild.move,
	};
};
