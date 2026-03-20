/// <reference types="vite/client" />

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv } from 'node:process';
import { GameState } from 'multimcts';
import { gameEntries } from '../src/games/gameRegistry';

interface Options {
  bucketSize: number;
  game: string | null;
  maxPlies: number;
  out: string;
  samples: number;
}

interface PlyAggregate {
  values: number[];
}

interface GameProfile {
  gameId: string;
  gameName: string;
  sampling: {
    samples: number;
    maxPlies: number;
    bucketSize: number;
    truncatedSamples: number;
  };
  openingBranching: number;
  averageBranching: number;
  averageGameLength: number;
  gameLength: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p90: number;
    histogram: Array<{ plies: number; count: number }>;
  };
  complexity: {
    averageLogBranchingPerPly: number;
    averageCumulativeLogBranching: number;
  };
  runtime: {
    averageGetLegalMovesMs: number;
    averageMakeMoveMs: number;
    averageRandomPlayoutMs: number;
    averageRandomPlayoutLength: number;
    playoutPliesPerSecond: number;
  };
  branchingByPly: Array<{
    ply: number;
    positions: number;
    mean: number;
    median: number;
    p90: number;
    min: number;
    max: number;
  }>;
  branchingByBucket: Array<{
    startPly: number;
    endPly: number;
    positions: number;
    mean: number;
    median: number;
    p90: number;
    min: number;
    max: number;
  }>;
}

interface ComplexityDataset {
  generatedAt: string;
  methodology: {
    costPolicy: string;
    movePolicy: string;
    initialStatePolicy: string;
  };
  options: Options;
  games: GameProfile[];
}

const DEFAULT_OPTIONS: Options = {
  bucketSize: 5,
  game: null,
  maxPlies: 200,
  out: 'public/generated/complexity.json',
  samples: 200,
};

const parsePositiveInt = (value: string, flagName: string) => {
  const parsed = Number.parseInt(value, 10);
  if(!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }

  return parsed;
};

const parseOptions = (rawArgs: string[]): Options => {
  const options = { ...DEFAULT_OPTIONS };

  for(let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const nextValue = rawArgs[index + 1];
    if(nextValue === undefined) {
      throw new Error(`Missing value for ${arg}`);
    }

    switch(arg) {
      case '--bucket-size':
        options.bucketSize = parsePositiveInt(nextValue, '--bucket-size');
        index += 1;
        break;
      case '--game':
        options.game = nextValue;
        index += 1;
        break;
      case '--max-plies':
        options.maxPlies = parsePositiveInt(nextValue, '--max-plies');
        index += 1;
        break;
      case '--out':
        options.out = nextValue;
        index += 1;
        break;
      case '--samples':
        options.samples = parsePositiveInt(nextValue, '--samples');
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

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const percentile = (sortedValues: number[], p: number) => {
  if(sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedValues.length) - 1),
  );

  return sortedValues[index];
};

const summarize = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);

  return {
    max: sorted[sorted.length - 1],
    mean: mean(sorted),
    median: percentile(sorted, 50),
    min: sorted[0],
    p90: percentile(sorted, 90),
  };
};

const getRandomMove = (state: GameState) => {
  const legalMoves = state.getLegalMoves();
  if(legalMoves.length === 0) {
    throw new Error('Encountered non-terminal state with no legal moves.');
  }

  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
};

const bucketKey = (ply: number, bucketSize: number) => Math.floor(ply / bucketSize) * bucketSize;

const nowMs = () => performance.now();

const profileGame = (
  gameId: string,
  gameName: string,
  createInitialState: () => GameState,
  options: Options,
): GameProfile => {
  const branchingByPly = new Map<number, PlyAggregate>();
  const branchingByBucket = new Map<number, PlyAggregate>();
  const gameLengths: number[] = [];
  const complexityTotals: number[] = [];
  const playoutLengths: number[] = [];
  let totalGetLegalMovesMs = 0;
  let totalMakeMoveMs = 0;
  let totalRandomPlayoutMs = 0;
  let totalGetLegalMovesCalls = 0;
  let totalMakeMoveCalls = 0;
  let totalBranching = 0;
  let totalPositions = 0;
  let openingBranching = 0;
  let truncatedSamples = 0;

  for(let sample = 0; sample < options.samples; sample += 1) {
    withSeededRandom(sample + 1, () => {
      let state = createInitialState();
      let ply = 0;
      let cumulativeComplexity = 0;
      const playoutStartMs = nowMs();

      while(!state.isTerminal() && ply < options.maxPlies) {
        const legalMovesStartMs = nowMs();
        const legalMoves = state.getLegalMoves();
        totalGetLegalMovesMs += nowMs() - legalMovesStartMs;
        totalGetLegalMovesCalls += 1;
        const branching = legalMoves.length;

        if(ply === 0) {
          openingBranching += branching;
        }

        totalBranching += branching;
        totalPositions += 1;
        cumulativeComplexity += Math.log2(Math.max(1, branching));

        const plyAggregate = branchingByPly.get(ply) ?? { values: [] };
        plyAggregate.values.push(branching);
        branchingByPly.set(ply, plyAggregate);

        const bucketStart = bucketKey(ply, options.bucketSize);
        const bucketAggregate = branchingByBucket.get(bucketStart) ?? { values: [] };
        bucketAggregate.values.push(branching);
        branchingByBucket.set(bucketStart, bucketAggregate);

        const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        const makeMoveStartMs = nowMs();
        state = state.makeMove(move);
        totalMakeMoveMs += nowMs() - makeMoveStartMs;
        totalMakeMoveCalls += 1;
        ply += 1;
      }

      if(!state.isTerminal() && ply >= options.maxPlies) {
        truncatedSamples += 1;
      }

      totalRandomPlayoutMs += nowMs() - playoutStartMs;
      gameLengths.push(ply);
      playoutLengths.push(ply);
      complexityTotals.push(cumulativeComplexity);
    });
  }

  const gameLengthSummary = summarize(gameLengths);
  const histogram = [...new Map<number, number>()];
  const histogramMap = new Map<number, number>();
  for(const length of gameLengths) {
    histogramMap.set(length, (histogramMap.get(length) ?? 0) + 1);
  }

  return {
    gameId,
    gameName,
    sampling: {
      samples: options.samples,
      maxPlies: options.maxPlies,
      bucketSize: options.bucketSize,
      truncatedSamples,
    },
    openingBranching: openingBranching / options.samples,
    averageBranching: totalBranching / totalPositions,
    averageGameLength: mean(gameLengths),
    gameLength: {
      ...gameLengthSummary,
      histogram: [...histogramMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([plies, count]) => ({ plies, count })),
    },
    complexity: {
      averageLogBranchingPerPly: complexityTotals.reduce((sum, value, index) => sum + (value / Math.max(1, gameLengths[index])), 0) / complexityTotals.length,
      averageCumulativeLogBranching: mean(complexityTotals),
    },
    runtime: {
      averageGetLegalMovesMs: totalGetLegalMovesMs / totalGetLegalMovesCalls,
      averageMakeMoveMs: totalMakeMoveMs / totalMakeMoveCalls,
      averageRandomPlayoutMs: totalRandomPlayoutMs / options.samples,
      averageRandomPlayoutLength: mean(playoutLengths),
      playoutPliesPerSecond: (playoutLengths.reduce((sum, value) => sum + value, 0) / totalRandomPlayoutMs) * 1000,
    },
    branchingByPly: [...branchingByPly.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ply, aggregate]) => ({
        ply,
        positions: aggregate.values.length,
        ...summarize(aggregate.values),
      })),
    branchingByBucket: [...branchingByBucket.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([startPly, aggregate]) => ({
        startPly,
        endPly: startPly + options.bucketSize - 1,
        positions: aggregate.values.length,
        ...summarize(aggregate.values),
      })),
  };
};

const main = async () => {
  const options = parseOptions(argv.slice(2));
  const selectedEntries = options.game
    ? gameEntries.filter((entry) => entry.id === options.game)
    : gameEntries;

  if(selectedEntries.length === 0) {
    throw new Error(`Unknown game: ${options.game}`);
  }

  const dataset: ComplexityDataset = {
    generatedAt: new Date().toISOString(),
    methodology: {
      costPolicy: 'measured with performance.now() across sampled random playout positions in the same run',
      movePolicy: 'uniform-random legal move playouts with deterministic seeded randomness',
      initialStatePolicy: 'game createInitialState() under the same seeded randomness',
    },
    options,
    games: selectedEntries.map((entry) => profileGame(
      entry.id,
      entry.name,
      entry.game.createInitialState,
      options,
    )),
  };

  const outputPath = resolve(options.out);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  for(const game of dataset.games) {
    console.log(`${game.gameId}`);
    console.log(`  opening branching: ${game.openingBranching.toFixed(1)}`);
    console.log(`  avg branching: ${game.averageBranching.toFixed(1)}`);
    console.log(`  avg length: ${game.averageGameLength.toFixed(1)} plies`);
    console.log(`  avg cumulative complexity: ${game.complexity.averageCumulativeLogBranching.toFixed(1)}`);
    console.log(`  getLegalMoves: ${game.runtime.averageGetLegalMovesMs.toFixed(4)} ms`);
    console.log(`  makeMove: ${game.runtime.averageMakeMoveMs.toFixed(4)} ms`);
    console.log(`  random playout: ${game.runtime.averageRandomPlayoutMs.toFixed(2)} ms for ${game.runtime.averageRandomPlayoutLength.toFixed(1)} plies`);
    console.log(`  playout plies/s: ${game.runtime.playoutPliesPerSecond.toFixed(1)}`);
  }
  console.log(`Wrote ${outputPath}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
