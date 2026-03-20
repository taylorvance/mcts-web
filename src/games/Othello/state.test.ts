import { describe, expect, it } from 'vitest';
import Othello from '.';
import { expectEncodedReplayToMatchTypedReplay } from '../../test/gameReplay';
import { CellState, OthelloMove, OthelloState } from './state';

const createBoard = (rows: Array<Array<CellState>>) => rows.flat();

describe('OthelloState', () => {
  it('starts from the standard opening position', () => {
    const state = new OthelloState();

    expect(state.getCurrentTeam()).toBe('B');
    expect(state.getLegalPlacementMoves()).toEqual([19, 26, 37, 44]);
    expect(state.getLegalMoves()).toEqual(['19', '26', '37', '44']);
  });

  it('places a disc and flips bracketed opponent discs', () => {
    const state = new OthelloState();

    const next = state.makeDiscMove(19);

    expect(next.board[19]).toBe(true);
    expect(next.board[27]).toBe(true);
    expect(next.team).toBe(false);
    expect(next.lastMove).toBe(19);
    expect(next.getScore()).toEqual({ black: 4, white: 1 });
  });

  it('requires a pass when the current player has no legal placements', () => {
    const state = new OthelloState(createBoard([
      [null, false, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
    ]), false);

    expect(state.isTerminal()).toBe(false);
    expect(state.getLegalPlacementMoves()).toEqual([]);
    expect(state.getLegalMoves()).toEqual(['pass']);

    const next = state.makeTypedMove('pass');

    expect(next.team).toBe(true);
    expect(next.getLegalPlacementMoves()).toEqual([0]);
  });

  it('ends the game when neither team has a legal move', () => {
    const state = new OthelloState(createBoard([
      [null, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
    ]), false);

    expect(state.isTerminal()).toBe(true);
    expect(state.getLegalMoves()).toEqual([]);
    expect(state.getWinner()).toBe(true);
    expect(state.getReward()).toEqual({ B: 1, W: 0 });
  });

  it('rebuilds the same state from encoded move history', () => {
    const initialState = new OthelloState();
    const moves: OthelloMove[] = [];
    let replayState = initialState;

    for(let i = 0; i < 6; i += 1) {
      const [move] = replayState.getLegalPlacementMoves();
      moves.push(move);
      replayState = replayState.makeDiscMove(move);
    }

    expectEncodedReplayToMatchTypedReplay({
      initialState,
      moves,
      definition: Othello,
      applyMove: (state, move) => state.makeTypedMove(move),
    });
  });
});
