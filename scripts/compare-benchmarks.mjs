import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const benchmarkFiles = [
	'scripts/benchmark.ts',
];
const WORKTREE_REF = 'WORKTREE';

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
	const benchmarkArgs = [];

	for(let index = 0; index < rawArgs.length; index += 1) {
		const arg = rawArgs[index];
		if(arg.startsWith('--')) {
			benchmarkArgs.push(arg);
			if(arg !== '--json') {
				const value = rawArgs[index + 1];
				if(value === undefined) {
					throw new Error(`Missing value for ${arg}`);
				}
				benchmarkArgs.push(value);
				index += 1;
			}
			continue;
		}

		refs.push(arg);
	}

	return {
		baselineRef: refs[0] ?? 'origin/main',
		candidateRef: refs[1] ?? WORKTREE_REF,
		benchmarkArgs,
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

const runBenchmark = (worktreeDir, benchmarkArgs) => {
	const viteNodePath = path.join(worktreeDir, 'node_modules', '.bin', 'vite-node');
	const jsonOutput = run(
		viteNodePath,
		['scripts/benchmark.ts', '--json', ...benchmarkArgs],
		{ cwd: worktreeDir },
	);
	return JSON.parse(jsonOutput);
};

const formatDelta = (baseline, candidate) => {
	const delta = ((candidate - baseline) / baseline) * 100;
	const sign = delta >= 0 ? '+' : '';
	return `${sign}${delta.toFixed(2)}%`;
};

const formatRate = (value) => value.toLocaleString('en-US', {
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
});

const printComparison = (baselineRef, candidateRef, baselineResult, candidateResult) => {
	console.log(`Comparing ${candidateRef} against ${baselineRef}`);
	console.log('');
	console.log(`${'scenario'.padEnd(28)} ${baselineRef.padStart(14)} ${candidateRef.padStart(14)} ${'delta'.padStart(10)}`);

	for(const baselineScenario of baselineResult.results) {
		const candidateScenario = candidateResult.results.find((result) => result.id === baselineScenario.id);
		if(!candidateScenario) {
			continue;
		}

		console.log(
			`${baselineScenario.id.padEnd(28)} `
			+ `${formatRate(baselineScenario.roundsPerSecond).padStart(14)} `
			+ `${formatRate(candidateScenario.roundsPerSecond).padStart(14)} `
			+ `${formatDelta(baselineScenario.roundsPerSecond, candidateScenario.roundsPerSecond).padStart(10)}`,
		);
	}

	console.log(
		`${'overall'.padEnd(28)} `
		+ `${formatRate(baselineResult.summary.roundsPerSecond).padStart(14)} `
		+ `${formatRate(candidateResult.summary.roundsPerSecond).padStart(14)} `
		+ `${formatDelta(baselineResult.summary.roundsPerSecond, candidateResult.summary.roundsPerSecond).padStart(10)}`,
	);
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

const main = () => {
	const { baselineRef, candidateRef, benchmarkArgs } = parseArgs(process.argv.slice(2));
	const tempRoot = mkdtempSync(path.join(tmpdir(), 'mcts-bench-'));
	const baselineDir = path.join(tempRoot, 'baseline');
	const candidateDir = path.join(tempRoot, 'candidate');
	const baselinePath = baselineRef === WORKTREE_REF ? repoRoot : baselineDir;
	const candidatePath = candidateRef === WORKTREE_REF ? repoRoot : candidateDir;

	try {
		if(baselineRef !== WORKTREE_REF) {
			addWorktree(baselineDir, baselineRef);
		}
		if(candidateRef !== WORKTREE_REF) {
			addWorktree(candidateDir, candidateRef);
		}
		printDependencyWarning(baselineRef, candidateRef);
		const baselineResult = runBenchmark(baselinePath, benchmarkArgs);
		const candidateResult = runBenchmark(candidatePath, benchmarkArgs);
		printComparison(baselineRef, candidateRef, baselineResult, candidateResult);
	} finally {
		if(baselineRef !== WORKTREE_REF) {
			removeWorktree(baselineDir);
		}
		if(candidateRef !== WORKTREE_REF) {
			removeWorktree(candidateDir);
		}
		rmSync(tempRoot, { force: true, recursive: true });
	}
};

main();
