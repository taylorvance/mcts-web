import { describe, expect, it } from 'vitest';
import Hex from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { getWinningPath, HexState } from './state';

describe('HexState', () => {
  it('tracks a vertical connection for black', () => {
    let state = new HexState();

    for(const move of [0, 1, 7, 2, 14, 3, 21, 4, 28, 5, 35, 6, 42]) {
      state = state.makeMove(move);
    }

    expect(state.winner).toBe('B');
    expect(getWinningPath(state)).toEqual([0, 7, 14, 21, 28, 35, 42]);
  });

  it('rebuilds the same state from encoded move history', () => {
    expectEncodedReplayToMatchTypedReplay({
      initialState: new HexState(),
      moves: [0, 1, 7, 2, 14],
      definition: Hex,
      applyMove: (state, move) => state.makeMove(move),
    });
  });
});
