import { TypedGameDefinition } from '../../types/Game';
import TicTacToeBoard from './Board';
import TicTacToeState from './state';

interface SerializedTicTacToeState {
  board: (boolean | null)[];
  team: boolean;
}

const TicTacToe: TypedGameDefinition<TicTacToeState, number> = {
  id: 'TicTacToe',
  name: 'TicTacToe',
  createInitialState: () => new TicTacToeState(),
  isState: (state): state is TicTacToeState => state instanceof TicTacToeState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
  }),
  deserializeState: (serializedState) => {
    const { board, team } = serializedState as SerializedTicTacToeState;
    if(!Array.isArray(board) || typeof team !== 'boolean') {
      throw new Error('Invalid TicTacToe state');
    }

    const state = new TicTacToeState();
    state.board = [...board];
    state.team = team;
    return state;
  },
  encodeMove: (move) => move.toString(),
  decodeMove: (encodedMove) => parseInt(encodedMove, 10),
  Board: TicTacToeBoard,
};

export default TicTacToe;
