import type { TypedGameDefinition } from '../../types/Game';
import TicTacToeBoard from './Board';
import TicTacToeState from './state';

interface SerializedTicTacToeState {
  board: Array<'X' | 'O' | null>;
  team: 'X' | 'O';
}

interface LegacySerializedTicTacToeState {
  board: Array<boolean | null>;
  team: boolean;
}

const normalizeCell = (cell: unknown): 'X' | 'O' | null => {
  if(cell === null) {
    return null;
  }

  if(cell === 'X' || cell === true) {
    return 'X';
  }

  if(cell === 'O' || cell === false) {
    return 'O';
  }

  throw new Error('Invalid TicTacToe cell');
};

const normalizeTeam = (team: unknown): 'X' | 'O' => {
  if(team === 'X' || team === true) {
    return 'X';
  }

  if(team === 'O' || team === false) {
    return 'O';
  }

  throw new Error('Invalid TicTacToe team');
};

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
    const { board, team } = serializedState as SerializedTicTacToeState | LegacySerializedTicTacToeState;
    if(!Array.isArray(board) || board.length !== 9) {
      throw new Error('Invalid TicTacToe state');
    }

    return new TicTacToeState(board.map(normalizeCell), normalizeTeam(team));
  },
  serializeMove: (move) => move.toString(),
  deserializeMove: (serializedMove) => parseInt(serializedMove, 10),
  Board: TicTacToeBoard,
};

export default TicTacToe;
