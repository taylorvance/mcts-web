import { describe, expect, it } from 'vitest';
import ConnectFour from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { COLS, ConnectFourState, ROWS } from './state';

const createBoard = (rows: Array<Array<boolean | null>>) => rows.flat();

describe('ConnectFourState', () => {
  it('lists open columns and drops discs to the bottom-most open slot', () => {
    const state = new ConnectFourState();

    expect(state.getLegalColumns()).toEqual([0, 1, 2, 3, 4, 5, 6]);

    const next = state.makeColumnMove(3);

    expect(next.board[((ROWS - 1) * COLS) + 3]).toBe(true);
    expect(next.team).toBe(false);
    expect(next.lastMove).toBe(((ROWS - 1) * COLS) + 3);
  });

  it('detects horizontal, vertical, and diagonal wins', () => {
    const horizontal = new ConnectFourState(createBoard([
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [true, true, true, true, null, null, null],
    ]), false);
    const vertical = new ConnectFourState(createBoard([
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [false, null, null, null, null, null, null],
      [false, null, null, null, null, null, null],
      [false, null, null, null, null, null, null],
      [false, null, null, null, null, null, null],
    ]), true);
    const diagonal = new ConnectFourState(createBoard([
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, true, null, null, null],
      [null, null, true, false, null, null, null],
      [null, true, false, false, null, null, null],
      [true, false, false, false, null, null, null],
    ]), false);

    expect(horizontal.getWinner()).toBe(true);
    expect(vertical.getWinner()).toBe(false);
    expect(diagonal.getWinner()).toBe(true);
    expect(horizontal.getReward()).toBe(1);
    expect(vertical.getReward()).toBe(1);
    expect(diagonal.getReward()).toBe(1);
  });

  it('detects drawn boards without a winner', () => {
    const drawState = new ConnectFourState(createBoard([
      [true, true, false, false, true, true, false],
      [false, false, true, true, false, false, true],
      [true, true, false, false, true, true, false],
      [false, false, true, true, false, false, true],
      [true, true, false, false, true, true, false],
      [false, false, true, true, false, false, true],
    ]), true);

    expect(drawState.isTerminal()).toBe(true);
    expect(drawState.getWinner()).toBeNull();
    expect(drawState.getReward()).toBe(0);
    expect(drawState.getLegalMoves()).toEqual([]);
  });

  it('rebuilds the same state from encoded move history', () => {
    expectEncodedReplayToMatchTypedReplay({
      initialState: new ConnectFourState(),
      moves: [3, 2, 3, 2, 4, 2, 4],
      definition: ConnectFour,
      applyMove: (state, move) => state.makeColumnMove(move),
    });
  });
});
