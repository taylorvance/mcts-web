/// <reference types="vite/client" />

import { argv } from 'node:process';
import { games } from '../src/games/gameRegistry';

interface Options {
  game: string | null;
  maxPlies: number;
  samples: number;
}

interface BucketStats {
  positions: number;
  totalBranching: number;
}

const DEFAULT_OPTIONS: Options = {
  game: null,
  maxPlies: 20,
  samples: 50,
};

const parsePositiveInt = (value: string, flag: string) => {
  const parsed = Number.parseInt(value, 10);
  if(!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
};

const parseOptions = (rawArgs: string[]): Options => {
  const options = { ...DEFAULT_OPTIONS };

  for(let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const next = rawArgs[index + 1];

    if(next === undefined) {
      throw new Error(`Missing value for ${arg}`);
    }

    switch(arg) {
      case '--game':
        options.game = next;
        index += 1;
        break;
      case '--max-plies':
        options.maxPlies = parsePositiveInt(next, '--max-plies');
        index += 1;
        break;
      case '--samples':
        options.samples = parsePositiveInt(next, '--samples');
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

const bucketLabel = (ply: number) => {
  const start = Math.floor(ply / 5) * 5;
  return `${start}-${start + 4}`;
};

const profileGame = (gameId: string, samples: number, maxPlies: number) => {
  const game = games[gameId];
  if(!game) {
    throw new Error(`Unknown game: ${gameId}`);
  }

  const perPly = new Map<number, BucketStats>();
  const perBucket = new Map<string, BucketStats>();
  let openingBranching = 0;
  let totalPositions = 0;
  let totalBranching = 0;

  for(let sample = 0; sample < samples; sample += 1) {
    let state = withSeededRandom(sample + 1, () => game.createInitialState());

    for(let ply = 0; ply < maxPlies && !state.isTerminal(); ply += 1) {
      const legalMoves = state.getLegalMoves();
      const branching = legalMoves.length;

      if(ply === 0) {
        openingBranching += branching;
      }

      totalPositions += 1;
      totalBranching += branching;

      const plyStats = perPly.get(ply) ?? { positions: 0, totalBranching: 0 };
      plyStats.positions += 1;
      plyStats.totalBranching += branching;
      perPly.set(ply, plyStats);

      const bucket = bucketLabel(ply);
      const bucketStats = perBucket.get(bucket) ?? { positions: 0, totalBranching: 0 };
      bucketStats.positions += 1;
      bucketStats.totalBranching += branching;
      perBucket.set(bucket, bucketStats);

      const moveIndex = withSeededRandom((sample * 1000) + ply + 1, () => Math.floor(Math.random() * legalMoves.length));
      state = state.makeMove(legalMoves[moveIndex]);
    }
  }

  return {
    gameId,
    openingAverage: openingBranching / samples,
    overallAverage: totalBranching / totalPositions,
    perPly: [...perPly.entries()].map(([ply, stats]) => ({
      ply,
      average: stats.totalBranching / stats.positions,
      positions: stats.positions,
    })),
    perBucket: [...perBucket.entries()].map(([bucket, stats]) => ({
      bucket,
      average: stats.totalBranching / stats.positions,
      positions: stats.positions,
    })),
  };
};

const main = () => {
  const options = parseOptions(argv.slice(2));
  const gameIds = options.game ? [options.game] : Object.keys(games);

  for(const gameId of gameIds) {
    const result = profileGame(gameId, options.samples, options.maxPlies);

    console.log(`${result.gameId}`);
    console.log(`  opening avg: ${result.openingAverage.toFixed(1)}`);
    console.log(`  overall avg: ${result.overallAverage.toFixed(1)}`);

    for(const bucket of result.perBucket) {
      console.log(`  ply ${bucket.bucket}: ${bucket.average.toFixed(1)} avg branching over ${bucket.positions} positions`);
    }
  }
};

main();
