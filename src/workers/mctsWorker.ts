// src/workers/mctsWorker.ts
import { MCTS } from 'multimcts';

self.onmessage = (e) => {
	const { state, settings } = e.data;
	const { explorationBias, maxIterations, maxTime } = settings;

	const newMCTS = new MCTS(explorationBias);
	const move = newMCTS.search(state, maxIterations??undefined, maxTime??undefined);

	self.postMessage({ move });
};
