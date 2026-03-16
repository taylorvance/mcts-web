import { describe, expect, it } from 'vitest';
import Filler from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { FillerState, TOTAL_CELLS } from './state';

const createBoard = (rows: number[][]) => new Uint8Array(rows.flat());

const TEST_BOARD = createBoard([
  [0, 2, 2, 2, 3, 3, 4, 4],
  [0, 0, 2, 3, 3, 4, 4, 4],
  [5, 0, 2, 2, 3, 4, 5, 5],
  [5, 5, 1, 1, 1, 4, 4, 5],
  [2, 5, 1, 3, 1, 1, 4, 5],
  [2, 2, 1, 3, 3, 1, 5, 1],
  [2, 2, 1, 3, 3, 5, 1, 1],
]);

describe('FillerState', () => {
  it('returns unique legal color moves and grows territory after a move', () => {
    const state = new FillerState(TEST_BOARD, true);

    expect(state.getLegalColorMoves()).toEqual([2, 3, 4, 5]);

    const next = state.applyColorMove(2);

    expect(next.getCurrentTeam()).toBe('2');
    expect(next.board[0]).toBe(2);
    expect(next.getTerritory().player1).toBeGreaterThan(state.getTerritory().player1);
  });

  it('detects terminal boards and normalizes rewards', () => {
    const terminalBoard = new Uint8Array(
      Array.from({ length: TOTAL_CELLS }, (_, index) => (index < 30 ? 0 : 1)),
    );
    const state = new FillerState(terminalBoard, true);

    expect(state.isTerminal()).toBe(true);
    expect(state.getReward()).toEqual({
      '1': 30 / TOTAL_CELLS,
      '2': 26 / TOTAL_CELLS,
    });
  });

  it('rebuilds the same state from encoded move history', () => {
    expectEncodedReplayToMatchTypedReplay({
      initialState: new FillerState(TEST_BOARD, true),
      moves: [2, 4, 3],
      definition: Filler,
      applyMove: (state, move) => state.applyColorMove(move),
    });
  });
});
