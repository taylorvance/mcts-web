import { describe, expect, it } from 'vitest';
import Onitama from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import {
  createOnitamaPassMove,
  createOnitamaPlayMove,
  decodeOnitamaMove,
  decodeOnitamaMoveObject,
  encodeOnitamaMove,
  OnitamaState,
} from './state';
import type { OnitamaCards, OnitamaMove, OnitamaPiece } from './state';

const OPENING_CARDS: OnitamaCards = {
  r: [2, 4],
  b: [1, 3],
  n: 0,
};

describe('OnitamaState', () => {
  it('returns typed actions and rotates cards after a play move', () => {
    const state = new OnitamaState(OnitamaState.initializeBoard(), true, OPENING_CARDS, 0);

    expect(state.getDestinations(2, 22)).toEqual([17]);
    expect(state.getLegalActions()).toContainEqual(createOnitamaPlayMove(
      2,
      22,
      17,
    ));

    const next = state.makeTypedMove(createOnitamaPlayMove(
      2,
      22,
      17,
    ));

    expect(decodeOnitamaMoveObject(state.getLegalActions()[0])).toMatchObject({
      type: 'play',
      cardIdx: expect.any(Number),
      srcIdx: expect.any(Number),
      dstIdx: expect.any(Number),
    });

    expect(next.board[17]).toBe('R');
    expect(next.board[22]).toBeNull();
    expect(next.getCurrentTeam()).toBe('B');
    expect(next.cards.r).toEqual([0, 4]);
    expect(next.cards.n).toBe(2);
  });

  it('falls back to pass actions when no piece can move', () => {
    const blockedBoard: OnitamaPiece[] = [
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
      createOnitamaPassMove(2),
      createOnitamaPassMove(1),
    ]);

    const next = state.makeTypedMove(createOnitamaPassMove(2));

    expect(next.getCurrentTeam()).toBe('B');
    expect(next.cards.r).toEqual([0, 1]);
    expect(next.cards.n).toBe(2);
  });

  it('rebuilds the same state from encoded typed history', () => {
    const move: OnitamaMove = createOnitamaPlayMove(2, 22, 17);
    const { encodedReplayState, typedReplayState } = expectEncodedReplayToMatchTypedReplay({
      initialState: new OnitamaState(OnitamaState.initializeBoard(), true, OPENING_CARDS, 0),
      moves: [move],
      definition: Onitama,
      applyMove: (state, nextMove) => state.makeTypedMove(nextMove),
    });

    expect(encodedReplayState.cards).toEqual(typedReplayState.cards);
  });

  it('round-trips packed move encodings', () => {
    const move = createOnitamaPlayMove(2, 22, 17);

    expect(decodeOnitamaMove(encodeOnitamaMove(move))).toBe(move);
    expect(decodeOnitamaMove('2,22,17')).toBe(move);
    expect(decodeOnitamaMove('pass 2')).toBe(createOnitamaPassMove(2));
  });

  it('identifies way of the stream and way of the stone wins', () => {
    const streamState = new OnitamaState(
      [
        'r', 'r', 'R', 'r', 'r',
        null, null, null, null, null,
        null, null, null, null, null,
        null, null, null, null, null,
        'b', 'b', null, 'b', 'b',
      ] satisfies OnitamaPiece[],
      false,
      OPENING_CARDS,
      8,
    );
    const stoneState = new OnitamaState(
      [
        'b', 'b', null, 'b', 'b',
        null, null, null, null, null,
        null, null, null, null, null,
        null, null, null, null, null,
        'r', 'r', 'R', 'r', 'r',
      ] satisfies OnitamaPiece[],
      false,
      OPENING_CARDS,
      8,
    );

    expect(streamState.getWinner()).toBe('R');
    expect(streamState.getWinningMethod()).toBe('stream');
    expect(stoneState.getWinner()).toBe('R');
    expect(stoneState.getWinningMethod()).toBe('stone');
  });
});
