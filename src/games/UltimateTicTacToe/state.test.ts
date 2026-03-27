import { describe, expect, it } from 'vitest';
import UltimateTicTacToe from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { BoardState, CellState, UltimateTicTacToeState } from './state';

const createBoard = () => Array<CellState>(81).fill(undefined);
const createBoardStates = () => Array<BoardState>(9).fill(undefined);

describe('UltimateTicTacToeState', () => {
  it('routes the next move to the destination sub-board after a move', () => {
    const state = new UltimateTicTacToeState();

    expect(state.getLegalMoves()).toHaveLength(81);

    const next = state.makeMove(40);

    expect(next.getCurrentTeam()).toBe('O');
    expect(next.prevMove).toBe(40);
    expect(next.board[40]).toBe(true);
    expect(next.getLegalMoves()).toEqual([36, 37, 38, 39, 41, 42, 43, 44]);
  });

  it('allows a free move when the destination sub-board is closed', () => {
    const board = createBoard();
    board[36] = true;
    board[37] = true;
    board[38] = true;

    const boardStates = createBoardStates();
    boardStates[4] = true;
    const state = new UltimateTicTacToeState(board, false, 40, boardStates);
    const legalMoves = state.getLegalMoves();

    expect(legalMoves).toHaveLength(72);
    expect(legalMoves.some((move) => move >= 36 && move <= 44)).toBe(false);
    expect(legalMoves).toContain(0);
    expect(legalMoves).toContain(80);
  });

  it('detects local board wins, global wins, and terminal rewards', () => {
    expect(UltimateTicTacToeState.calcBoardState([
      true, true, true,
      undefined, false, undefined,
      false, undefined, undefined,
    ])).toBe(true);

    expect(UltimateTicTacToeState.calcBoardState([
      true, false, true,
      false, false, true,
      true, true, false,
    ])).toBeNull();

    const winningState = new UltimateTicTacToeState(
      createBoard(),
      false,
      20,
      [true, true, true, undefined, undefined, undefined, undefined, undefined, undefined],
    );

    expect(winningState.hasWinner()).toBe(true);
    expect(winningState.isTerminal()).toBe(true);
    expect(winningState.getReward()).toBe(1);
  });

  it('rebuilds the same state from encoded move history', () => {
    expectEncodedReplayToMatchTypedReplay({
      initialState: new UltimateTicTacToeState(),
      moves: [40, 36, 4],
      definition: UltimateTicTacToe,
      applyMove: (state, move) => state.makeMove(move),
    });
  });
});
