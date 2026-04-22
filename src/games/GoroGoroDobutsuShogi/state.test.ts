import { describe, expect, it } from 'vitest';
import GoroGoroDobutsuShogi from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { GoroGoroDobutsuShogiState } from './state';
import type {
  GoroGoroHands,
  GoroGoroMove,
  GoroGoroPiece,
} from './state';

const EMPTY_HANDS: GoroGoroHands = {
  s: { D: 0, T: 0, C: 0 },
  n: { D: 0, T: 0, C: 0 },
};

const createEmptyBoard = () => (
  Array<GoroGoroPiece | null>(30).fill(null)
);

describe('GoroGoroDobutsuShogiState', () => {
  it('captures pieces and adds them to hand', () => {
    const board = createEmptyBoard();
    board[2] = 'l';
    board[12] = 'c';
    board[17] = 'C';
    board[27] = 'L';
    const state = new GoroGoroDobutsuShogiState(board, true, EMPTY_HANDS);

    const next = state.makeTypedMove({
      type: 'move',
      from: 17,
      to: 12,
      promote: false,
    });

    expect(next.board[12]).toBe('C');
    expect(next.board[17]).toBeNull();
    expect(next.hands.s.C).toBe(1);
    expect(next.getCurrentTeam()).toBe('N');
  });

  it('offers optional promotion in the promotion zone and forces it on the last rank', () => {
    const board = createEmptyBoard();
    board[4] = 'l';
    board[12] = 'T';
    board[27] = 'L';
    const state = new GoroGoroDobutsuShogiState(board, true, EMPTY_HANDS);

    expect(state.getLegalMoves()).toContainEqual({
      type: 'move',
      from: 12,
      to: 7,
      promote: false,
    });
    expect(state.getLegalMoves()).toContainEqual({
      type: 'move',
      from: 12,
      to: 7,
      promote: true,
    });

    const chickBoard = createEmptyBoard();
    chickBoard[4] = 'l';
    chickBoard[7] = 'C';
    chickBoard[27] = 'L';
    const chickState = new GoroGoroDobutsuShogiState(
      chickBoard,
      true,
      EMPTY_HANDS,
    );
    const promotionMoves = chickState.getLegalMoves().filter((move) => (
      move.type === 'move' && move.from === 7 && move.to === 2
    ));

    expect(promotionMoves).toEqual([
      {
        type: 'move',
        from: 7,
        to: 2,
        promote: true,
      },
    ]);

    const promoted = chickState.makeTypedMove({
      type: 'move',
      from: 7,
      to: 2,
      promote: true,
    });

    expect(promoted.board[2]).toBe('H');
  });

  it('forbids dropping a chick into a file with another unpromoted chick', () => {
    const board = createEmptyBoard();
    board[4] = 'l';
    board[22] = 'C';
    board[27] = 'L';
    const state = new GoroGoroDobutsuShogiState(
      board,
      true,
      {
        s: { D: 0, T: 0, C: 1 },
        n: { D: 0, T: 0, C: 0 },
      },
    );

    expect(state.getLegalMoves()).not.toContainEqual({
      type: 'drop',
      piece: 'C',
      to: 7,
    });
    expect(state.getLegalMoves()).not.toContainEqual({
      type: 'drop',
      piece: 'C',
      to: 12,
    });
  });

  it('forbids dropping a chick for immediate checkmate', () => {
    const board = createEmptyBoard();
    board[1] = 'c';
    board[2] = 'l';
    board[3] = 'c';
    board[11] = 'D';
    board[13] = 'D';
    board[27] = 'L';
    const state = new GoroGoroDobutsuShogiState(
      board,
      true,
      {
        s: { D: 0, T: 0, C: 1 },
        n: { D: 0, T: 0, C: 0 },
      },
    );

    expect(state.getLegalMoves()).not.toContainEqual({
      type: 'drop',
      piece: 'C',
      to: 7,
    });
  });

  it('disallows moves that leave the lion in check', () => {
    const board = createEmptyBoard();
    board[2] = 'l';
    board[11] = 'd';
    board[22] = 'L';
    const state = new GoroGoroDobutsuShogiState(board, true, EMPTY_HANDS);

    expect(state.getLegalMoves()).not.toContainEqual({
      type: 'move',
      from: 22,
      to: 17,
      promote: false,
    });
  });

  it('declares a draw after the same position appears four times', () => {
    let state = new GoroGoroDobutsuShogiState(
      (() => {
        const board = createEmptyBoard();
        board[2] = 'l';
        board[27] = 'L';
        return board;
      })(),
      true,
      EMPTY_HANDS,
    );

    const cycle: GoroGoroMove[] = [
      { type: 'move', from: 27, to: 26, promote: false },
      { type: 'move', from: 2, to: 1, promote: false },
      { type: 'move', from: 26, to: 27, promote: false },
      { type: 'move', from: 1, to: 2, promote: false },
      { type: 'move', from: 27, to: 26, promote: false },
      { type: 'move', from: 2, to: 1, promote: false },
      { type: 'move', from: 26, to: 27, promote: false },
      { type: 'move', from: 1, to: 2, promote: false },
      { type: 'move', from: 27, to: 26, promote: false },
      { type: 'move', from: 2, to: 1, promote: false },
      { type: 'move', from: 26, to: 27, promote: false },
      { type: 'move', from: 1, to: 2, promote: false },
    ];

    for (const move of cycle) {
      state = state.makeTypedMove(move);
    }

    expect(state.isTerminal()).toBe(true);
    expect(state.getWinner()).toBeNull();
    expect(state.getOutcomeReason()).toBe('repetition');
  });

  it('rebuilds the same state from encoded typed history', () => {
    const initialBoard = createEmptyBoard();
    initialBoard[4] = 'l';
    initialBoard[12] = 'T';
    initialBoard[27] = 'L';
    const initialState = new GoroGoroDobutsuShogiState(initialBoard, true, {
      s: { D: 0, T: 0, C: 1 },
      n: { D: 0, T: 0, C: 0 },
    });
    const moves: GoroGoroMove[] = [
      { type: 'move', from: 12, to: 7, promote: true },
      { type: 'move', from: 4, to: 9, promote: false },
      { type: 'drop', piece: 'C', to: 17 },
    ];

    const { encodedReplayState, typedReplayState } =
      expectEncodedReplayToMatchTypedReplay({
        initialState,
        moves,
        definition: GoroGoroDobutsuShogi,
        applyMove: (state, move) => state.makeTypedMove(move),
      });

    expect(encodedReplayState.hands).toEqual(typedReplayState.hands);
    expect([...encodedReplayState.repetitionCounts.entries()]).toEqual(
      [...typedReplayState.repetitionCounts.entries()],
    );
  });
});
