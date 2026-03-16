// src/hooks/useMCTS.ts
import { useCallback, useReducer, useRef } from 'react';
import { GameState, MCTS, Node } from 'multimcts';

const getStateKey = (state: GameState) => state.toString();

const runSearchRounds = (
	mcts: MCTS,
	state: GameState,
	maxIterations: number | null,
	maxTime: number | null,
) => {
	if(!mcts.rootNode || getStateKey(mcts.rootNode.state) !== getStateKey(state)) {
		mcts.rootNode = new Node(state);
	}

	let iteration = 0;
	const hasIterationLimit = maxIterations !== null;
	const hasTimeLimit = maxTime !== null;
	const endTime = hasTimeLimit ? Date.now() + (1000 * maxTime) : 0;

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

	return bestChild.move;
};

export const useMCTS = (settings: {explorationBias:number; maxIterations:number|null; maxTime:number|null}) => {
	const { explorationBias, maxIterations, maxTime } = settings;
	const mctsRef = useRef<MCTS | null>(null);
	const [, bumpVersion] = useReducer((version: number) => version + 1, 0);

	const runSearch = useCallback((state: GameState) => {
		const currentMCTS = mctsRef.current;
		const nextMCTS = currentMCTS && currentMCTS.explorationBias === explorationBias
			? currentMCTS
			: new MCTS(explorationBias);
		const move = runSearchRounds(nextMCTS, state, maxIterations, maxTime);
		mctsRef.current = nextMCTS;
		bumpVersion();
		return move;
	}, [explorationBias, maxIterations, maxTime]);

	const advanceSearchTree = useCallback((move: string, nextState: GameState) => {
		const currentMCTS = mctsRef.current;
		if(!currentMCTS?.rootNode) return;

		const nextRootNode = currentMCTS.rootNode.children[move];
		if(nextRootNode && getStateKey(nextRootNode.state) === getStateKey(nextState)) {
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
		runSearch,
		advanceSearchTree,
		resetMCTS,
	};
};
