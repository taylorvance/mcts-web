import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const benchmarkFiles = ['scripts/benchmark.ts'];
const WORKTREE_REF = 'WORKTREE';
const defaultScenarios = [
	'filler-opening',
	'onitama-opening',
	'ultimate-tictactoe-midgame',
];

const run = (command, args, options = {}) => {
	const result = spawnSync(command, args, {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: 'pipe',
		...options,
	});

	if(result.status !== 0) {
		const stderr = result.stderr?.trim();
		const stdout = result.stdout?.trim();
		throw new Error(
			[`Command failed: ${command} ${args.join(' ')}`, stderr, stdout]
				.filter(Boolean)
				.join('\n'),
		);
	}

	return result.stdout.trim();
};

const parseArgs = (rawArgs) => {
	const refs = [];
	const options = {
		explorationBias: 1.414,
		iterations: 1000,
		maxTurns: 200,
		pairs: 1,
		scenarios: [],
		timeMs: null,
	};

	for(let index = 0; index < rawArgs.length; index += 1) {
		const arg = rawArgs[index];
		if(!arg.startsWith('--')) {
			refs.push(arg);
			continue;
		}

		const nextValue = rawArgs[index + 1];
		if(nextValue === undefined) {
			throw new Error(`Missing value for ${arg}`);
		}

		switch(arg) {
			case '--exploration-bias':
				options.explorationBias = Number.parseFloat(nextValue);
				break;
			case '--iterations':
				options.iterations = Number.parseInt(nextValue, 10);
				options.timeMs = null;
				break;
			case '--max-turns':
				options.maxTurns = Number.parseInt(nextValue, 10);
				break;
			case '--pairs':
				options.pairs = Number.parseInt(nextValue, 10);
				break;
			case '--scenario':
				options.scenarios.push(nextValue);
				break;
			case '--time-ms':
				options.timeMs = Number.parseInt(nextValue, 10);
				options.iterations = null;
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}

		index += 1;
	}

	if(!Number.isFinite(options.explorationBias) || options.explorationBias <= 0) {
		throw new Error('--exploration-bias must be a positive number.');
	}

	if(options.iterations !== null && (!Number.isInteger(options.iterations) || options.iterations <= 0)) {
		throw new Error('--iterations must be a positive integer.');
	}

	if(options.timeMs !== null && (!Number.isInteger(options.timeMs) || options.timeMs <= 0)) {
		throw new Error('--time-ms must be a positive integer.');
	}

	if(!Number.isInteger(options.maxTurns) || options.maxTurns <= 0) {
		throw new Error('--max-turns must be a positive integer.');
	}

	if(!Number.isInteger(options.pairs) || options.pairs <= 0) {
		throw new Error('--pairs must be a positive integer.');
	}

	return {
		baselineRef: refs[0] ?? 'origin/main',
		candidateRef: refs[1] ?? WORKTREE_REF,
		options: {
			...options,
			scenarios: options.scenarios.length > 0 ? options.scenarios : defaultScenarios,
		},
	};
};

const ensureHarnessFiles = (worktreeDir) => {
	for(const relativePath of benchmarkFiles) {
		const sourcePath = path.join(repoRoot, relativePath);
		const targetPath = path.join(worktreeDir, relativePath);
		mkdirSync(path.dirname(targetPath), { recursive: true });
		copyFileSync(sourcePath, targetPath);
	}

	const repoNodeModules = path.join(repoRoot, 'node_modules');
	const worktreeNodeModules = path.join(worktreeDir, 'node_modules');
	if(!existsSync(repoNodeModules)) {
		throw new Error('Missing node_modules in the current checkout. Run npm install first.');
	}

	if(!existsSync(worktreeNodeModules)) {
		symlinkSync(repoNodeModules, worktreeNodeModules, 'dir');
	}
};

const addWorktree = (dir, ref) => {
	run('git', ['worktree', 'add', '--detach', dir, ref]);
	ensureHarnessFiles(dir);
};

const removeWorktree = (dir) => {
	spawnSync('git', ['worktree', 'remove', '--force', dir], {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: 'pipe',
	});
	rmSync(dir, { force: true, recursive: true });
};

const printDependencyWarning = (baselineRef, candidateRef) => {
	const diff = spawnSync(
		'git',
		['diff', '--name-only', baselineRef, candidateRef, '--', 'package.json', 'package-lock.json'],
		{
			cwd: repoRoot,
			encoding: 'utf8',
			stdio: 'pipe',
		},
	);

	if(diff.status === 0 && diff.stdout.trim()) {
		console.log('Warning: dependency manifests differ between refs. This comparison reuses the current checkout\'s node_modules for both refs.');
		console.log('');
	}
};

class BenchmarkWorker {
	constructor(worktreeDir) {
		this.nextId = 1;
		this.pending = new Map();
		this.stderr = '';
		this.stdoutBuffer = '';
		this.worktreeDir = worktreeDir;

		const viteNodePath = path.join(worktreeDir, 'node_modules', '.bin', 'vite-node');
		this.process = spawn(viteNodePath, ['scripts/benchmark.ts', '--mode', 'server'], {
			cwd: worktreeDir,
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		this.process.stdout.setEncoding('utf8');
		this.process.stdout.on('data', (chunk) => {
			this.stdoutBuffer += chunk;
			this.flushLines();
		});

		this.process.stderr.setEncoding('utf8');
		this.process.stderr.on('data', (chunk) => {
			this.stderr += chunk;
		});

		this.process.on('exit', (code) => {
			const error = new Error(
				[`Benchmark worker exited with code ${code ?? 'null'}.`, this.stderr.trim()]
					.filter(Boolean)
					.join('\n'),
			);
			for(const { reject } of this.pending.values()) {
				reject(error);
			}
			this.pending.clear();
		});
	}

	flushLines() {
		let newlineIndex = this.stdoutBuffer.indexOf('\n');
		while(newlineIndex >= 0) {
			const line = this.stdoutBuffer.slice(0, newlineIndex).trim();
			this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
			if(line) {
				this.handleLine(line);
			}
			newlineIndex = this.stdoutBuffer.indexOf('\n');
		}
	}

	handleLine(line) {
		const response = JSON.parse(line);
		if(response.id === null && response.error) {
			for(const { reject } of this.pending.values()) {
				reject(new Error(response.error));
			}
			this.pending.clear();
			return;
		}

		const pendingRequest = this.pending.get(response.id);
		if(!pendingRequest) {
			return;
		}

		this.pending.delete(response.id);
		if(response.error) {
			pendingRequest.reject(new Error(response.error));
			return;
		}

		pendingRequest.resolve(response);
	}

	request(payload) {
		return new Promise((resolve, reject) => {
			const id = this.nextId;
			this.nextId += 1;
			this.pending.set(id, { resolve, reject });
			this.process.stdin.write(`${JSON.stringify({ id, ...payload })}\n`);
		});
	}

	async chooseMove(scenarioId, moves, settings) {
		return await this.request({
			explorationBias: settings.explorationBias,
			iterations: settings.iterations,
			maxTimeMs: settings.timeMs,
			mode: 'choose-move',
			moves,
			scenario: scenarioId,
		});
	}

	async getStatus(scenarioId, moves) {
		return await this.request({
			mode: 'status',
			moves,
			scenario: scenarioId,
		});
	}

	close() {
		this.process.kill();
	}
}

const mapWinner = (winner, firstRef, secondRef) => {
	if(winner === 'draw' || winner === null) {
		return 'draw';
	}

	return winner === 'first' ? firstRef : secondRef;
};

const playMatch = async (scenarioId, firstEngine, secondEngine, settings) => {
	const moves = [];

	for(let turn = 0; turn < settings.maxTurns; turn += 1) {
		const activeEngine = turn % 2 === 0 ? firstEngine : secondEngine;
		const result = await activeEngine.worker.chooseMove(scenarioId, moves, settings);
		moves.push(result.move);

		const status = await activeEngine.worker.getStatus(scenarioId, moves);
		if(status.isTerminal) {
			return {
				moves: moves.length,
				winner: mapWinner(status.winner, firstEngine.ref, secondEngine.ref),
			};
		}
	}

	return {
		moves: moves.length,
		winner: 'draw',
	};
};

const createScenarioRecord = () => ({
	baselineWins: 0,
	candidateWins: 0,
	draws: 0,
	totalMoves: 0,
});

const printResults = (baselineRef, candidateRef, scenarioResults) => {
	console.log(`Comparing ${candidateRef} against ${baselineRef} for move strength`);
	console.log('');
	console.log(`${'scenario'.padEnd(28)} ${baselineRef.padStart(12)} ${candidateRef.padStart(12)} ${'draws'.padStart(8)} ${'avg moves'.padStart(10)}`);

	const overall = createScenarioRecord();

	for(const [scenarioId, result] of Object.entries(scenarioResults)) {
		overall.baselineWins += result.baselineWins;
		overall.candidateWins += result.candidateWins;
		overall.draws += result.draws;
		overall.totalMoves += result.totalMoves;

		const gamesPlayed = result.baselineWins + result.candidateWins + result.draws;
		console.log(
			`${scenarioId.padEnd(28)} `
			+ `${String(result.baselineWins).padStart(12)} `
			+ `${String(result.candidateWins).padStart(12)} `
			+ `${String(result.draws).padStart(8)} `
			+ `${(result.totalMoves / gamesPlayed).toFixed(1).padStart(10)}`,
		);
	}

	const totalGames = overall.baselineWins + overall.candidateWins + overall.draws;
	console.log(
		`${'overall'.padEnd(28)} `
		+ `${String(overall.baselineWins).padStart(12)} `
		+ `${String(overall.candidateWins).padStart(12)} `
		+ `${String(overall.draws).padStart(8)} `
		+ `${(overall.totalMoves / totalGames).toFixed(1).padStart(10)}`,
	);
};

const main = async () => {
	const { baselineRef, candidateRef, options } = parseArgs(process.argv.slice(2));
	const tempRoot = mkdtempSync(path.join(tmpdir(), 'mcts-strength-'));
	const baselineDir = path.join(tempRoot, 'baseline');
	const candidateDir = path.join(tempRoot, 'candidate');
	const baselinePath = baselineRef === WORKTREE_REF ? repoRoot : baselineDir;
	const candidatePath = candidateRef === WORKTREE_REF ? repoRoot : candidateDir;
	let baselineWorker = null;
	let candidateWorker = null;

	try {
		if(baselineRef !== WORKTREE_REF) {
			addWorktree(baselineDir, baselineRef);
		}
		if(candidateRef !== WORKTREE_REF) {
			addWorktree(candidateDir, candidateRef);
		}
		printDependencyWarning(baselineRef, candidateRef);
		baselineWorker = new BenchmarkWorker(baselinePath);
		candidateWorker = new BenchmarkWorker(candidatePath);

		const scenarioResults = Object.fromEntries(
			options.scenarios.map((scenarioId) => [scenarioId, createScenarioRecord()]),
		);

		for(const scenarioId of options.scenarios) {
			for(let pairIndex = 0; pairIndex < options.pairs; pairIndex += 1) {
				const firstMatch = await playMatch(
					scenarioId,
					{ ref: baselineRef, worker: baselineWorker },
					{ ref: candidateRef, worker: candidateWorker },
					options,
				);
				const secondMatch = await playMatch(
					scenarioId,
					{ ref: candidateRef, worker: candidateWorker },
					{ ref: baselineRef, worker: baselineWorker },
					options,
				);

				for(const match of [firstMatch, secondMatch]) {
					const record = scenarioResults[scenarioId];
					record.totalMoves += match.moves;

					if(match.winner === baselineRef) {
						record.baselineWins += 1;
					} else if(match.winner === candidateRef) {
						record.candidateWins += 1;
					} else {
						record.draws += 1;
					}
				}
			}
		}

		printResults(baselineRef, candidateRef, scenarioResults);
	} finally {
		baselineWorker?.close();
		candidateWorker?.close();
		if(baselineRef !== WORKTREE_REF) {
			removeWorktree(baselineDir);
		}
		if(candidateRef !== WORKTREE_REF) {
			removeWorktree(candidateDir);
		}
		rmSync(tempRoot, { force: true, recursive: true });
	}
};

await main();
