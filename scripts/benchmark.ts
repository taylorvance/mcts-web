/// <reference types="vite/client" />

import { argv } from 'node:process';
import { createInterface } from 'node:readline';
import { GameState, MCTS, Node } from 'multimcts';

interface BenchmarkGame {
	name: string;
	createInitialState: () => GameState;
}

interface BenchmarkScenario {
	id: string;
	game: string;
	description: string;
	createState: () => GameState;
	startingTeam: string;
}

interface BenchmarkOptions {
	explorationBias: number;
	game: string | null;
	iterations: number;
	json: boolean;
	mode: 'benchmark' | 'choose-move' | 'profile-search' | 'server' | 'status';
	moves: string[];
	samples: number;
	scenario: string | null;
	warmup: number;
}

interface ServerRequest {
	explorationBias?: number;
	id: number;
	iterations?: number;
	mode: 'choose-move' | 'status';
	moves?: string[];
	scenario: string;
}

interface BenchmarkResult {
	averageMs: number;
	description: string;
	game: string;
	id: string;
	maxMs: number;
	minMs: number;
	roundsPerSecond: number;
	samples: number;
	searchesPerSecond: number;
	totalMs: number;
	totalRounds: number;
}

const DEFAULT_OPTIONS: BenchmarkOptions = {
	explorationBias: 1.414,
	game: null,
	iterations: 2000,
	json: false,
	mode: 'benchmark',
	moves: [],
	samples: 20,
	scenario: null,
	warmup: 3,
};

const parsePositiveInt = (value: string, flagName: string) => {
	const parsed = Number.parseInt(value, 10);
	if(!Number.isInteger(parsed) || parsed <= 0) {
		throw new Error(`${flagName} must be a positive integer.`);
	}

	return parsed;
};

const parseNonNegativeInt = (value: string, flagName: string) => {
	const parsed = Number.parseInt(value, 10);
	if(!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`${flagName} must be a non-negative integer.`);
	}

	return parsed;
};

const parseOptions = (rawArgs: string[]): BenchmarkOptions => {
	const options = { ...DEFAULT_OPTIONS };

	for(let index = 0; index < rawArgs.length; index += 1) {
		const arg = rawArgs[index];

		if(arg === '--json') {
			options.json = true;
			continue;
		}

		const nextValue = rawArgs[index + 1];
		if(nextValue === undefined) {
			throw new Error(`Missing value for ${arg}`);
		}

		switch(arg) {
			case '--exploration-bias':
				options.explorationBias = Number.parseFloat(nextValue);
				if(!Number.isFinite(options.explorationBias) || options.explorationBias <= 0) {
					throw new Error('--exploration-bias must be a positive number.');
				}
				index += 1;
				break;
			case '--game':
				options.game = nextValue;
				index += 1;
				break;
			case '--iterations':
				options.iterations = parsePositiveInt(nextValue, '--iterations');
				index += 1;
				break;
			case '--mode':
				if(
					nextValue !== 'benchmark'
					&& nextValue !== 'choose-move'
					&& nextValue !== 'profile-search'
					&& nextValue !== 'server'
					&& nextValue !== 'status'
				) {
					throw new Error('--mode must be benchmark, choose-move, profile-search, server, or status.');
				}
				options.mode = nextValue;
				index += 1;
				break;
			case '--moves':
				try {
					const parsedMoves = JSON.parse(nextValue);
					if(!Array.isArray(parsedMoves) || parsedMoves.some((move) => typeof move !== 'string')) {
						throw new Error('Moves must be a JSON array of strings.');
					}
					options.moves = parsedMoves;
				} catch(error) {
					throw new Error(`Invalid --moves value: ${error instanceof Error ? error.message : String(error)}`);
				}
				index += 1;
				break;
			case '--samples':
				options.samples = parsePositiveInt(nextValue, '--samples');
				index += 1;
				break;
			case '--scenario':
				options.scenario = nextValue;
				index += 1;
				break;
			case '--warmup':
				options.warmup = parseNonNegativeInt(nextValue, '--warmup');
				index += 1;
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return options;
};

const createSeededRandom = (seed: number) => {
	let state = seed >>> 0;

	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 0x100000000;
	};
};

const withSeededRandom = <T>(seed: number, factory: () => T) => {
	const originalRandom = Math.random;
	Math.random = createSeededRandom(seed);

	try {
		return factory();
	} finally {
		Math.random = originalRandom;
	}
};

const gameModuleLoaders = import.meta.glob([
	'../src/games/Filler/index.ts',
	'../src/games/Filler.tsx',
	'../src/games/Onitama/index.ts',
	'../src/games/Onitama.tsx',
	'../src/games/UltimateTicTacToe/index.ts',
	'../src/games/UltimateTicTacToe.tsx',
]);

const loadFirstAvailableModule = async (specifiers: string[]) => {
	for(const specifier of specifiers) {
		const loader = gameModuleLoaders[specifier];
		if(!loader) {
			continue;
		}

		return await loader();
	}

	throw new Error(`Unable to load any of: ${specifiers.join(', ')}`);
};

const extractGame = (module: unknown, label: string): BenchmarkGame => {
	if(
		typeof module !== 'object'
		|| module === null
		|| !('default' in module)
		|| typeof module.default !== 'object'
		|| module.default === null
		|| !('createInitialState' in module.default)
		|| typeof module.default.createInitialState !== 'function'
	) {
		throw new Error(`Loaded module for ${label} does not expose a usable default game export.`);
	}

	return module.default as BenchmarkGame;
};

const loadGame = async (name: 'Filler' | 'Onitama' | 'UltimateTicTacToe') => {
	const module = await loadFirstAvailableModule([
		`../src/games/${name}/index.ts`,
		`../src/games/${name}.tsx`,
	]);

	return extractGame(module, name);
};

const playMoves = (initialState: GameState, moves: number[]) => {
	let state = initialState;

	for(const move of moves) {
		const encodedMove = move.toString();
		if(!state.getLegalMoves().includes(encodedMove)) {
			throw new Error(`Illegal setup move: ${encodedMove}`);
		}

		state = state.makeMove(encodedMove);
	}

	return state;
};

const applyMoves = (initialState: GameState, moves: string[]) => {
	let state = initialState;

	for(const move of moves) {
		if(!state.getLegalMoves().includes(move)) {
			throw new Error(`Illegal move in replay: ${move}`);
		}

		state = state.makeMove(move);
	}

	return state;
};

const getCurrentTeam = (state: GameState) => {
	if(typeof state.getCurrentTeam !== 'function') {
		throw new Error('Game state does not expose getCurrentTeam().');
	}

	return state.getCurrentTeam();
};

const runSearch = (
	mcts: MCTS,
	state: GameState,
	maxIterations: number,
) => {
	mcts.rootNode = new Node(state);

	for(let iteration = 0; iteration < maxIterations; iteration += 1) {
		mcts.executeRound(mcts.rootNode);
	}

	const bestChild = mcts.rootNode.findBestChild(0);
	if(!bestChild?.move) {
		throw new Error('Benchmark search did not produce a legal move.');
	}

	return bestChild.move;
};

const loadScenarios = async (): Promise<BenchmarkScenario[]> => {
	const [filler, onitama, ultimateTicTacToe] = await Promise.all([
		loadGame('Filler'),
		loadGame('Onitama'),
		loadGame('UltimateTicTacToe'),
	]);

	return [
		{
			id: 'filler-opening',
			game: 'Filler',
			description: 'Seeded opening board',
			createState: () => withSeededRandom(0xc0ffee, () => filler.createInitialState()),
			startingTeam: withSeededRandom(0xc0ffee, () => getCurrentTeam(filler.createInitialState())),
		},
		{
			id: 'onitama-opening',
			game: 'Onitama',
			description: 'Seeded opening cards',
			createState: () => withSeededRandom(0xbadc0de, () => onitama.createInitialState()),
			startingTeam: withSeededRandom(0xbadc0de, () => getCurrentTeam(onitama.createInitialState())),
		},
		{
			id: 'ultimate-tictactoe-midgame',
			game: 'UltimateTicTacToe',
			description: 'Forced-board midgame after eight legal moves',
			createState: () => playMoves(
				ultimateTicTacToe.createInitialState(),
				[40, 36, 4, 41, 45, 0, 1, 9],
			),
			startingTeam: getCurrentTeam(playMoves(
				ultimateTicTacToe.createInitialState(),
				[40, 36, 4, 41, 45, 0, 1, 9],
			)),
		},
	];
};

const getWinner = (
	scenario: BenchmarkScenario,
	state: GameState,
): 'first' | 'second' | 'draw' | null => {
	if(!state.isTerminal()) {
		return null;
	}

	if(scenario.game === 'Filler') {
		const reward = state.getReward() as Record<string, number>;
		if(reward['1'] === reward['2']) {
			return 'draw';
		}

		return reward['1'] > reward['2'] ? 'first' : 'second';
	}

	const reward = state.getReward(scenario.startingTeam);
	if(typeof reward === 'number' && reward === 0) {
		return 'draw';
	}

	return getCurrentTeam(state) === scenario.startingTeam ? 'second' : 'first';
};

const summarizeResult = (
	scenario: BenchmarkScenario,
	elapsedSamplesMs: number[],
	iterations: number,
): BenchmarkResult => {
	const totalMs = elapsedSamplesMs.reduce((sum, elapsedMs) => sum + elapsedMs, 0);
	const totalRounds = iterations * elapsedSamplesMs.length;

	return {
		averageMs: totalMs / elapsedSamplesMs.length,
		description: scenario.description,
		game: scenario.game,
		id: scenario.id,
		maxMs: Math.max(...elapsedSamplesMs),
		minMs: Math.min(...elapsedSamplesMs),
		roundsPerSecond: totalRounds / (totalMs / 1000),
		samples: elapsedSamplesMs.length,
		searchesPerSecond: elapsedSamplesMs.length / (totalMs / 1000),
		totalMs,
		totalRounds,
	};
};

const benchmarkScenario = (
	scenario: BenchmarkScenario,
	options: BenchmarkOptions,
): BenchmarkResult => {
	for(let warmupIndex = 0; warmupIndex < options.warmup; warmupIndex += 1) {
		runSearch(
			new MCTS(options.explorationBias),
			scenario.createState(),
			options.iterations,
		);
	}

	const elapsedSamplesMs: number[] = [];

	for(let sampleIndex = 0; sampleIndex < options.samples; sampleIndex += 1) {
		const mcts = new MCTS(options.explorationBias);
		const start = performance.now();
		runSearch(mcts, scenario.createState(), options.iterations);
		elapsedSamplesMs.push(performance.now() - start);
	}

	return summarizeResult(scenario, elapsedSamplesMs, options.iterations);
};

const selectScenario = (
	scenarios: BenchmarkScenario[],
	scenarioId: string,
) => {
	const scenario = scenarios.find((candidate) => candidate.id === scenarioId);
	if(!scenario) {
		throw new Error(`Unknown scenario "${scenarioId}".`);
	}

	return scenario;
};

const createServerResponse = (
	scenarios: BenchmarkScenario[],
	request: ServerRequest,
) => {
	const scenario = selectScenario(scenarios, request.scenario);
	const state = applyMoves(scenario.createState(), request.moves ?? []);

	if(request.mode === 'choose-move') {
		const iterations = request.iterations ?? DEFAULT_OPTIONS.iterations;
		const explorationBias = request.explorationBias ?? DEFAULT_OPTIONS.explorationBias;
		return {
			id: request.id,
			move: runSearch(new MCTS(explorationBias), state, iterations),
		};
	}

	return {
		id: request.id,
		isTerminal: state.isTerminal(),
		winner: getWinner(scenario, state),
	};
};

const startServer = async (scenarios: BenchmarkScenario[]) => {
	const readline = createInterface({
		input: process.stdin,
		terminal: false,
	});

	for await (const line of readline) {
		if(!line.trim()) {
			continue;
		}

		try {
			const request = JSON.parse(line) as ServerRequest;
			console.log(JSON.stringify(createServerResponse(scenarios, request)));
		} catch(error) {
			console.log(JSON.stringify({
				error: error instanceof Error ? error.message : String(error),
				id: null,
			}));
		}
	}
};

const createMethodStats = () => ({
	getCurrentTeam: { calls: 0, totalMs: 0 },
	getLegalMoves: { calls: 0, totalMs: 0 },
	getReward: { calls: 0, totalMs: 0 },
	isTerminal: { calls: 0, totalMs: 0 },
	makeMove: { calls: 0, totalMs: 0 },
	toString: { calls: 0, totalMs: 0 },
});

const instrumentStatePrototype = (state: GameState) => {
	const prototype = Object.getPrototypeOf(state) as Record<string, unknown>;
	const methodStats = createMethodStats();
	const restoreCallbacks: Array<() => void> = [];

	for(const methodName of Object.keys(methodStats) as Array<keyof typeof methodStats>) {
		const originalMethod = prototype[methodName];
		if(typeof originalMethod !== 'function') {
			continue;
		}

		prototype[methodName] = function instrumentedMethod(this: GameState, ...args: unknown[]) {
			const start = performance.now();
			try {
				return originalMethod.apply(this, args);
			} finally {
				methodStats[methodName].calls += 1;
				methodStats[methodName].totalMs += performance.now() - start;
			}
		};

		restoreCallbacks.push(() => {
			prototype[methodName] = originalMethod;
		});
	}

	return {
		methodStats,
		restore: () => {
			for(const restoreCallback of restoreCallbacks) {
				restoreCallback();
			}
		},
	};
};

const profileSearchScenario = (
	scenario: BenchmarkScenario,
	options: BenchmarkOptions,
) => {
	const sampleState = scenario.createState();
	const { methodStats, restore } = instrumentStatePrototype(sampleState);
	const elapsedSamplesMs: number[] = [];

	try {
		for(let warmupIndex = 0; warmupIndex < options.warmup; warmupIndex += 1) {
			runSearch(
				new MCTS(options.explorationBias),
				scenario.createState(),
				options.iterations,
			);
		}

		for(const stat of Object.values(methodStats)) {
			stat.calls = 0;
			stat.totalMs = 0;
		}

		for(let sampleIndex = 0; sampleIndex < options.samples; sampleIndex += 1) {
			const mcts = new MCTS(options.explorationBias);
			const start = performance.now();
			runSearch(mcts, scenario.createState(), options.iterations);
			elapsedSamplesMs.push(performance.now() - start);
		}
	} finally {
		restore();
	}

	const totalMs = elapsedSamplesMs.reduce((sum, elapsedMs) => sum + elapsedMs, 0);
	const methodEntries = Object.entries(methodStats)
		.map(([name, stat]) => ({
			averageUs: stat.calls > 0 ? (stat.totalMs * 1000) / stat.calls : 0,
			calls: stat.calls,
			name,
			sharePct: totalMs > 0 ? (stat.totalMs / totalMs) * 100 : 0,
			totalMs: stat.totalMs,
		}))
		.sort((left, right) => right.totalMs - left.totalMs);

	return {
		config: options,
		scenario: {
			description: scenario.description,
			game: scenario.game,
			id: scenario.id,
		},
		summary: {
			roundsPerSecond: (options.iterations * options.samples) / (totalMs / 1000),
			totalMs,
		},
		methods: methodEntries,
	};
};

const formatNumber = (value: number) => value.toLocaleString('en-US', {
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
});

const printTextReport = (options: BenchmarkOptions, results: BenchmarkResult[]) => {
	console.log(
		`Benchmarking ${results.length} scenario(s) with ${options.iterations} rounds/search, `
		+ `${options.samples} sample(s), warmup ${options.warmup}, c=${options.explorationBias}.`,
	);

	for(const result of results) {
		console.log(
			`${result.id.padEnd(28)} `
			+ `${formatNumber(result.averageMs).padStart(9)} ms/search `
			+ `${formatNumber(result.roundsPerSecond).padStart(12)} rounds/s`,
		);
	}

	const totalMs = results.reduce((sum, result) => sum + result.totalMs, 0);
	const totalRounds = results.reduce((sum, result) => sum + result.totalRounds, 0);
	console.log(
		`${'overall'.padEnd(28)} `
		+ `${formatNumber(totalMs / (results.length * options.samples)).padStart(9)} ms/search `
		+ `${formatNumber(totalRounds / (totalMs / 1000)).padStart(12)} rounds/s`,
	);
};

const main = async () => {
	const options = parseOptions(argv.slice(2));
	const scenarios = await loadScenarios();

	if(options.mode === 'server') {
		await startServer(scenarios);
		return;
	}

	if(options.mode !== 'benchmark') {
		if(!options.scenario) {
			throw new Error(`--scenario is required for ${options.mode} mode.`);
		}

		const scenario = selectScenario(scenarios, options.scenario);

		const state = applyMoves(scenario.createState(), options.moves);
		if(options.mode === 'choose-move') {
			const move = runSearch(new MCTS(options.explorationBias), state, options.iterations);
			console.log(JSON.stringify({ move }, null, options.json ? 2 : 0));
			return;
		}

		if(options.mode === 'profile-search') {
			console.log(JSON.stringify(
				profileSearchScenario(scenario, options),
				null,
				options.json ? 2 : 0,
			));
			return;
		}

		console.log(JSON.stringify({
			isTerminal: state.isTerminal(),
			winner: getWinner(scenario, state),
		}, null, options.json ? 2 : 0));
		return;
	}

	const selectedScenarios = options.game
		? scenarios.filter((scenario) => scenario.game === options.game || scenario.id === options.game)
		: scenarios;

	if(selectedScenarios.length === 0) {
		throw new Error(`No benchmark scenarios matched "${options.game}".`);
	}

	const results = selectedScenarios.map((scenario) => benchmarkScenario(scenario, options));
	const totalMs = results.reduce((sum, result) => sum + result.totalMs, 0);
	const totalRounds = results.reduce((sum, result) => sum + result.totalRounds, 0);

	if(options.json) {
		console.log(JSON.stringify({
			config: options,
			results,
			summary: {
				roundsPerSecond: totalRounds / (totalMs / 1000),
				scenarios: results.length,
				searchesPerSecond: (results.length * options.samples) / (totalMs / 1000),
				totalMs,
				totalRounds,
			},
		}, null, 2));
		return;
	}

	printTextReport(options, results);
};

await main();
