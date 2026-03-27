import { render, screen } from '@testing-library/react';
import { MCTS } from 'multimcts';
import { describe, expect, it } from 'vitest';
import BaseTicTacToeState from 'multimcts/tictactoe';
import TreeViewer from './TreeViewer';

describe('TreeViewer', () => {
  it('renders the latest root node when the MCTS instance is reused', () => {
    const mcts = new MCTS<BaseTicTacToeState, number, 'X' | 'O'>();
    const initialState = new BaseTicTacToeState();
    const move = mcts.search(initialState, { maxIterations: 1 }).bestMove!;

    const { rerender } = render(<TreeViewer mcts={mcts} />);

    expect(screen.getByTitle(initialState.toString())).toBeInTheDocument();

    const nextState = initialState.makeMove(move);
    mcts.advanceToChild(move, nextState);
    rerender(<TreeViewer mcts={mcts} />);

    expect(screen.getByTitle(nextState.toString())).toBeInTheDocument();
  });
});
