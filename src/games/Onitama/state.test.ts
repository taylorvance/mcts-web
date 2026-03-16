import { describe, expect, it } from 'vitest';
import Onitama from '.';
import { OnitamaCards, OnitamaMove, OnitamaState } from './state';

const OPENING_CARDS: OnitamaCards = {
  r: [2, 4],
  b: [1, 3],
  n: 0,
};

describe('OnitamaState', () => {
  it('returns typed actions and rotates cards after a play move', () => {
    const state = new OnitamaState(OnitamaState.initializeBoard(), true, OPENING_CARDS, 0);

    expect(state.getDestinations(2, 22)).toEqual([17]);
    expect(state.getLegalActions()).toContainEqual({
      type: 'play',
      cardIdx: 2,
      srcIdx: 22,
      dstIdx: 17,
    });

    const next = state.makeTypedMove({
      type: 'play',
      cardIdx: 2,
      srcIdx: 22,
      dstIdx: 17,
    });

    expect(next.board[17]).toBe('R');
    expect(next.board[22]).toBeNull();
    expect(next.getCurrentTeam()).toBe('B');
    expect(next.cards.r).toEqual([0, 4]);
    expect(next.cards.n).toBe(2);
  });

  it('falls back to pass actions when no piece can move', () => {
    const blockedBoard = [
      'R', 'r', 'r', 'r', 'r',
      null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, 'B',
    ];
    const passCards: OnitamaCards = {
      r: [2, 1],
      b: [3, 4],
      n: 0,
    };
    const state = new OnitamaState(blockedBoard, true, passCards, 0);

    expect(state.getLegalActions()).toEqual([
      { type: 'pass', cardIdx: 2 },
      { type: 'pass', cardIdx: 1 },
    ]);

    const next = state.makeTypedMove({ type: 'pass', cardIdx: 2 });

    expect(next.getCurrentTeam()).toBe('B');
    expect(next.cards.r).toEqual([0, 1]);
    expect(next.cards.n).toBe(2);
  });

  it('rebuilds the same state from encoded typed history', () => {
    const initialState = new OnitamaState(OnitamaState.initializeBoard(), true, OPENING_CARDS, 0);
    const move: OnitamaMove = {
      type: 'play',
      cardIdx: 2,
      srcIdx: 22,
      dstIdx: 17,
    };

    const typedReplayState = initialState.makeTypedMove(move);
    const encodedReplayState = initialState.makeMove(Onitama.encodeMove(move, initialState));

    expect(encodedReplayState.toString()).toBe(typedReplayState.toString());
    expect(encodedReplayState.cards).toEqual(typedReplayState.cards);
  });
});
