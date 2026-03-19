import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const benchmarkFiles = ['scripts/benchmark.ts'];
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
	const profileArgs = [];

	for(let index = 0; index < rawArgs.length; index += 1) {
		const arg = rawArgs[index];
		if(arg.startsWith('--')) {
			profileArgs.push(arg);
			if(arg !== '--json') {
				const value = rawArgs[index + 1];
				if(value === undefined) {
					throw new Error(`Missing value for ${arg}`);
				}
				profileArgs.push(value);
				index += 1;
			}
			continue;
		}

		refs.push(arg);
	}

	if(!profileArgs.includes('--scenario')) {
		profileArgs.push('--scenario', 'onitama-opening');
	}

	return {
		baselineRef: refs[0] ?? 'origin/main',
		candidateRef: refs[1] ?? WORKTREE_REF,
		profileArgs,
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

const runProfile = (worktreeDir, profileArgs) => {
	const viteNodePath = path.join(worktreeDir, 'node_modules', '.bin', 'vite-node');
	const jsonOutput = run(
		viteNodePath,
		['scripts/benchmark.ts', '--mode', 'profile-search', '--json', ...profileArgs],
		{ cwd: worktreeDir },
	);
	return JSON.parse(jsonOutput);
};

const formatDelta = (baseline, candidate) => {
	const delta = ((candidate - baseline) / baseline) * 100;
	const sign = delta >= 0 ? '+' : '';
	return `${sign}${delta.toFixed(2)}%`;
};

const formatNumber = (value) => value.toLocaleString('en-US', {
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
});

const printResults = (baselineRef, candidateRef, baselineProfile, candidateProfile) => {
	console.log(`Profiling ${candidateRef} against ${baselineRef}`);
	console.log('');
	console.log(`${'method'.padEnd(18)} ${baselineRef.padStart(12)} ${candidateRef.padStart(12)} ${'delta'.padStart(10)} ${'calls/sample'.padStart(14)}`);

	for(const baselineMethod of baselineProfile.methods) {
		const candidateMethod = candidateProfile.methods.find((method) => method.name === baselineMethod.name);
		if(!candidateMethod) {
			continue;
		}

		console.log(
			`${baselineMethod.name.padEnd(18)} `
			+ `${formatNumber(baselineMethod.totalMs).padStart(12)} `
			+ `${formatNumber(candidateMethod.totalMs).padStart(12)} `
			+ `${formatDelta(baselineMethod.totalMs, candidateMethod.totalMs).padStart(10)} `
			+ `${formatNumber(candidateMethod.calls / candidateProfile.config.samples).padStart(14)}`,
		);
	}

	console.log('');
	console.log(
		`search total: ${formatNumber(baselineProfile.summary.totalMs)} ms -> ${formatNumber(candidateProfile.summary.totalMs)} ms `
		+ `(${formatDelta(baselineProfile.summary.totalMs, candidateProfile.summary.totalMs)})`,
	);
};

const main = () => {
	const { baselineRef, candidateRef, profileArgs } = parseArgs(process.argv.slice(2));
	const tempRoot = mkdtempSync(path.join(tmpdir(), 'mcts-profile-'));
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
		const baselineProfile = runProfile(baselinePath, profileArgs);
		const candidateProfile = runProfile(candidatePath, profileArgs);
		printResults(baselineRef, candidateRef, baselineProfile, candidateProfile);
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
