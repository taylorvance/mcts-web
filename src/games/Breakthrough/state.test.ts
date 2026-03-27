import { describe, expect, it } from 'vitest';
import Breakthrough from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { BreakthroughState, getMovesBySource } from './state';

describe('BreakthroughState', () => {
  it('lists opening moves for the current player', () => {
    const state = new BreakthroughState();
    const movesBySource = getMovesBySource(state);

    expect(movesBySource.get(48)).toEqual([40, 41]);
    expect(movesBySource.get(55)).toEqual([47, 46]);
  });

  it('rebuilds the same state from encoded move history', () => {
    expectEncodedReplayToMatchTypedReplay({
      initialState: new BreakthroughState(),
      moves: ['48:40', '8:16', '49:41', '9:17'],
      definition: Breakthrough,
      applyMove: (state, move) => state.makeMove(move),
    });
  });
});
