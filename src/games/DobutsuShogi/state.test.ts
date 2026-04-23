import { describe, expect, it } from 'vitest';
import DobutsuShogi from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { DobutsuShogiState, encodeDobutsuMove } from './state';
import type { DobutsuHands, DobutsuMove, DobutsuPiece } from './state';

const EMPTY_HANDS: DobutsuHands = {
  s: { G: 0, E: 0, C: 0 },
  n: { G: 0, E: 0, C: 0 },
};

describe('DobutsuShogiState', () => {
  it('captures pieces and adds them to hand', () => {
    const state = new DobutsuShogiState();

    expect(state.getLegalMoves()).toContainEqual({
      type: 'move',
      from: 7,
      to: 4,
    });

    const next = state.makeTypedMove({
      type: 'move',
      from: 7,
      to: 4,
    });

    expect(next.board[4]).toBe('C');
    expect(next.board[7]).toBeNull();
    expect(next.hands.s.C).toBe(1);
    expect(next.getCurrentTeam()).toBe('N');
  });

  it('allows capturing the lion to end the game immediately', () => {
    const state = new DobutsuShogiState(
      [
        null, 'l', null,
        null, 'C', null,
        null, null, null,
        null, 'L', null,
      ] satisfies Array<DobutsuPiece | null>,
      true,
      EMPTY_HANDS,
    );

    const next = state.makeTypedMove({
      type: 'move',
      from: 4,
      to: 1,
    });

    expect(next.board[1]).toBe('H');
    expect(next.getWinner()).toBe('S');
    expect(next.getOutcomeReason()).toBe('capture');
    expect(next.hands.s.C).toBe(0);
  });

  it('promotes moving chicks and demotes captured hens back to chicks', () => {
    const promotingState = new DobutsuShogiState(
      [
        null, null, 'l',
        null, 'C', null,
        null, null, null,
        null, 'L', null,
      ] satisfies Array<DobutsuPiece | null>,
      true,
      EMPTY_HANDS,
    );

    const promoted = promotingState.makeTypedMove({
      type: 'move',
      from: 4,
      to: 1,
    });

    expect(promoted.board[1]).toBe('H');

    const captureState = new DobutsuShogiState(
      [
        'g', 'H', 'l',
        null, null, null,
        null, null, null,
        null, 'L', null,
      ] satisfies Array<DobutsuPiece | null>,
      false,
      EMPTY_HANDS,
    );

    const captured = captureState.makeTypedMove({
      type: 'move',
      from: 0,
      to: 1,
    });

    expect(captured.hands.n.C).toBe(1);
    expect(captured.board[1]).toBe('g');
  });

  it('allows drops and does not auto-promote dropped chicks on the final rank', () => {
    const state = new DobutsuShogiState(
      [
        null, null, 'l',
        null, null, null,
        null, null, null,
        null, 'L', null,
      ] satisfies Array<DobutsuPiece | null>,
      true,
      {
        s: { G: 0, E: 0, C: 1 },
        n: { G: 0, E: 0, C: 0 },
      },
    );

    const next = state.makeTypedMove({
      type: 'drop',
      piece: 'C',
      to: 0,
    });

    expect(next.board[0]).toBe('C');
    expect(next.hands.s.C).toBe(0);
  });

  it('only awards a try win on an unattacked far-rank square', () => {
    const safeTry = new DobutsuShogiState(
      [
        null, 'L', null,
        null, null, null,
        null, 'l', null,
        null, null, null,
      ] satisfies Array<DobutsuPiece | null>,
      false,
      EMPTY_HANDS,
    );
    const attackedTry = new DobutsuShogiState(
      [
        null, 'L', null,
        null, null, 'e',
        null, 'l', null,
        null, null, null,
      ] satisfies Array<DobutsuPiece | null>,
      false,
      EMPTY_HANDS,
    );

    expect(safeTry.getWinner()).toBe('S');
    expect(safeTry.getOutcomeReason()).toBe('try');
    expect(attackedTry.getWinner()).toBeNull();
    expect(attackedTry.getOutcomeReason()).toBeNull();
  });

  it('declares a draw after the same position appears for the third time', () => {
    let state = new DobutsuShogiState(
      [
        null, 'l', null,
        null, null, null,
        null, null, null,
        null, 'L', null,
      ] satisfies Array<DobutsuPiece | null>,
      true,
      EMPTY_HANDS,
    );

    const cycle: DobutsuMove[] = [
      { type: 'move', from: 10, to: 9 },
      { type: 'move', from: 1, to: 0 },
      { type: 'move', from: 9, to: 10 },
      { type: 'move', from: 0, to: 1 },
      { type: 'move', from: 10, to: 9 },
      { type: 'move', from: 1, to: 0 },
      { type: 'move', from: 9, to: 10 },
      { type: 'move', from: 0, to: 1 },
    ];

    for(const move of cycle) {
      state = state.makeTypedMove(move);
    }

    expect(state.isTerminal()).toBe(true);
    expect(state.getWinner()).toBeNull();
    expect(state.getOutcomeReason()).toBe('repetition');
  });

  it('prefers immediate wins in rollout suggestions', () => {
    const state = new DobutsuShogiState(
      [
        null, 'l', null,
        null, 'C', null,
        null, null, null,
        null, 'L', null,
      ] satisfies Array<DobutsuPiece | null>,
      true,
      EMPTY_HANDS,
    );

    const suggestion = state.suggestRollout(() => 0);

    expect(encodeDobutsuMove(suggestion.move)).toBe('m:4-1');
    expect(suggestion.nextState.getWinner()).toBe('S');
  });

  it('avoids rollout moves that allow an immediate losing reply when a safe capture exists', () => {
    const state = new DobutsuShogiState(
      [
        null, 'l', null,
        null, null, null,
        null, 'g', null,
        null, 'L', 'G',
      ] satisfies Array<DobutsuPiece | null>,
      true,
      EMPTY_HANDS,
    );

    const suggestion = state.suggestRollout(() => 0);

    expect(encodeDobutsuMove(suggestion.move)).toBe('m:10-7');
    expect(
      suggestion.nextState.getLegalMoves().some(
        (reply) => suggestion.nextState.makeTypedMove(reply).getWinner() === 'N',
      ),
    ).toBe(false);
  });

  it('rebuilds the same state from encoded typed history', () => {
    const moves: DobutsuMove[] = [
      { type: 'move', from: 7, to: 4 },
      { type: 'move', from: 1, to: 5 },
      { type: 'drop', piece: 'C', to: 6 },
    ];

    const { encodedReplayState, typedReplayState } = expectEncodedReplayToMatchTypedReplay({
      initialState: new DobutsuShogiState(),
      moves,
      definition: DobutsuShogi,
      applyMove: (state, move) => state.makeTypedMove(move),
    });

    expect(encodedReplayState.hands).toEqual(typedReplayState.hands);
    expect([...encodedReplayState.repetitionCounts.entries()]).toEqual(
      [...typedReplayState.repetitionCounts.entries()],
    );
  });
});
