import { TypedGameDefinition } from '../../types/Game';
import TicTacToeBoard from './Board';
import TicTacToeState from './state';

const TicTacToe: TypedGameDefinition<TicTacToeState, number> = {
  id: 'TicTacToe',
  name: 'TicTacToe',
  createInitialState: () => new TicTacToeState(),
  isState: (state): state is TicTacToeState => state instanceof TicTacToeState,
  encodeMove: (move) => move.toString(),
  decodeMove: (encodedMove) => parseInt(encodedMove, 10),
  Board: TicTacToeBoard,
};

export default TicTacToe;
