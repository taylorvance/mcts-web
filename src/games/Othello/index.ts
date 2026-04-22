import type { TypedGameDefinition } from '../../types/Game';
import OthelloBoard from './Board';
import { OthelloState, TOTAL_CELLS } from './state';
import type { CellState, OthelloMove } from './state';

interface SerializedOthelloState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;
}

const isValidCellState = (cell: unknown): cell is CellState =>
  cell === null || cell === 'B' || cell === 'W';

const Othello: TypedGameDefinition<OthelloState, OthelloMove, 'B' | 'W'> = {
  id: 'Othello',
  name: 'Othello',
  help: {
    overview:
      'Place a disc so it brackets one or more opposing discs in a straight line. Every bracketed line flips to your color, and the player with more discs at the end wins.',
    sections: [
      {
        title: 'How To Play',
        items: [
          'Legal moves must capture at least one opposing disc.',
          'If you have no legal move, play passes to your opponent.',
          'The game ends when neither player can move.',
        ],
      },
      {
        title: 'Strategy Notes',
        items: [
          'Corners are powerful because they cannot be flipped.',
          'Early disc count is less important than mobility and stable edges.',
        ],
      },
    ],
  },
  createInitialState: () => new OthelloState(),
  isState: (state): state is OthelloState => state instanceof OthelloState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    lastMove: state.lastMove,
  }),
  deserializeState: (serializedState) => {
    const { board, team, lastMove } = serializedState as SerializedOthelloState;

    if (
      !Array.isArray(board) ||
      board.length !== TOTAL_CELLS ||
      board.some((cell) => !isValidCellState(cell)) ||
      typeof team !== 'boolean' ||
      (lastMove !== null &&
        (!Number.isInteger(lastMove) ||
          lastMove < 0 ||
          lastMove >= TOTAL_CELLS))
    ) {
      throw new Error('Invalid Othello state');
    }

    return new OthelloState([...board], team, lastMove);
  },
  serializeMove: (move) => move,
  deserializeMove: (serializedMove) => serializedMove,
  Board: OthelloBoard,
};

export default Othello;
