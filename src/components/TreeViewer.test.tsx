import { render, screen } from '@testing-library/react';
import { MCTS, Node } from 'multimcts';
import { describe, expect, it } from 'vitest';
import BaseTicTacToeState from 'multimcts/tictactoe';
import TreeViewer from './TreeViewer';

describe('TreeViewer', () => {
  it('renders the latest root node when the MCTS instance is reused', () => {
    const mcts = new MCTS();
    const initialState = new BaseTicTacToeState();
    const initialRoot = new Node(initialState);
    mcts.rootNode = initialRoot;

    const { rerender } = render(<TreeViewer mcts={mcts} />);

    expect(screen.getByTitle(initialState.toString())).toBeInTheDocument();

    const nextState = initialState.makeMove(initialState.getLegalMoves()[0]);
    mcts.rootNode = new Node(nextState);
    rerender(<TreeViewer mcts={mcts} />);

    expect(screen.getByTitle(nextState.toString())).toBeInTheDocument();
  });
});
