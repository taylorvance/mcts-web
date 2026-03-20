import { TypedGameDefinition } from '../../types/Game';
import OthelloBoard from './Board';
import { CellState, OthelloMove, OthelloState, TOTAL_CELLS } from './state';

interface SerializedOthelloState {
  board: CellState[];
  team: boolean;
  lastMove: number | null;
}

const Othello: TypedGameDefinition<OthelloState, OthelloMove> = {
  id: 'Othello',
  name: 'Othello',
  createInitialState: () => new OthelloState(),
  isState: (state): state is OthelloState => state instanceof OthelloState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    lastMove: state.lastMove,
  }),
  deserializeState: (serializedState) => {
    const { board, team, lastMove } = serializedState as SerializedOthelloState;

    if(
      !Array.isArray(board)
      || board.length !== TOTAL_CELLS
      || board.some((cell) => cell !== null && typeof cell !== 'boolean')
      || typeof team !== 'boolean'
      || (lastMove !== null && (!Number.isInteger(lastMove) || lastMove < 0 || lastMove >= TOTAL_CELLS))
    ) {
      throw new Error('Invalid Othello state');
    }

    return new OthelloState([...board], team, lastMove);
  },
  encodeMove: (move) => move === 'pass' ? 'pass' : move.toString(),
  decodeMove: (encodedMove) => encodedMove === 'pass' ? 'pass' : Number.parseInt(encodedMove, 10),
  Board: OthelloBoard,
};

export default Othello;
