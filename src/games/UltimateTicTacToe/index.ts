import { TypedGameDefinition } from '../../types/Game';
import UltimateTicTacToeBoard from './Board';
import { UltimateTicTacToeState } from './state';

const UltimateTicTacToe: TypedGameDefinition<UltimateTicTacToeState, number> = {
  id: 'UltimateTicTacToe',
  name: 'UltimateTicTacToe',
  createInitialState: () => new UltimateTicTacToeState(),
  isState: (state): state is UltimateTicTacToeState => state instanceof UltimateTicTacToeState,
  encodeMove: (move) => move.toString(),
  decodeMove: (encodedMove) => parseInt(encodedMove, 10),
  Board: UltimateTicTacToeBoard,
};

export default UltimateTicTacToe;
