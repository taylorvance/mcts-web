import { describe, expect, it } from 'vitest';
import ConnectFour from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { COLS, ConnectFourState, getLegalColumns, getWinner, ROWS } from './state';

const createBoard = (rows: Array<Array<'R' | 'Y' | null>>) => rows.flat();

describe('ConnectFourState', () => {
  it('lists open columns and drops discs to the bottom-most open slot', () => {
    const state = new ConnectFourState();

    expect(getLegalColumns(state)).toEqual([0, 1, 2, 3, 4, 5, 6]);

    const next = state.makeMove('3');

    expect(next.board[((ROWS - 1) * COLS) + 3]).toBe('R');
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
      ['R', 'R', 'R', 'R', null, null, null],
    ]), false, 38);
    const vertical = new ConnectFourState(createBoard([
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ['Y', null, null, null, null, null, null],
      ['Y', null, null, null, null, null, null],
      ['Y', null, null, null, null, null, null],
      ['Y', null, null, null, null, null, null],
    ]), true, 35);
    const diagonal = new ConnectFourState(createBoard([
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, 'R', null, null, null],
      [null, null, 'R', 'Y', null, null, null],
      [null, 'R', 'Y', 'Y', null, null, null],
      ['R', 'Y', 'Y', 'Y', null, null, null],
    ]), false, 35);

    expect(getWinner(horizontal)).toBe('R');
    expect(getWinner(vertical)).toBe('Y');
    expect(getWinner(diagonal)).toBe('R');
    expect(horizontal.getReward()).toBe(1);
    expect(vertical.getReward()).toBe(1);
    expect(diagonal.getReward()).toBe(1);
  });

  it('detects drawn boards without a winner', () => {
    const drawState = new ConnectFourState(createBoard([
      ['R', 'R', 'Y', 'Y', 'R', 'R', 'Y'],
      ['Y', 'Y', 'R', 'R', 'Y', 'Y', 'R'],
      ['R', 'R', 'Y', 'Y', 'R', 'R', 'Y'],
      ['Y', 'Y', 'R', 'R', 'Y', 'Y', 'R'],
      ['R', 'R', 'Y', 'Y', 'R', 'R', 'Y'],
      ['Y', 'Y', 'R', 'R', 'Y', 'Y', 'R'],
    ]), true);

    expect(drawState.isTerminal()).toBe(true);
    expect(getWinner(drawState)).toBeNull();
    expect(drawState.getReward()).toBe(0);
    expect(drawState.getLegalMoves()).toEqual([]);
  });

  it('rebuilds the same state from encoded move history', () => {
    expectEncodedReplayToMatchTypedReplay({
      initialState: new ConnectFourState(),
      moves: ['3', '2', '3', '2', '4', '2', '4'],
      definition: ConnectFour,
      applyMove: (state, move) => state.makeMove(move),
    });
  });
});
