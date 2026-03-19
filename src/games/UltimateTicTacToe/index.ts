import { TypedGameDefinition } from '../../types/Game';
import UltimateTicTacToeBoard from './Board';
import { BoardState, CellState, UltimateTicTacToeState } from './state';

interface SerializedUltimateTicTacToeState {
  board: CellState[];
  team: boolean;
  prevMove?: number;
  boardStates: BoardState[];
}

const UltimateTicTacToe: TypedGameDefinition<UltimateTicTacToeState, number> = {
  id: 'UltimateTicTacToe',
  name: 'UltimateTicTacToe',
  createInitialState: () => new UltimateTicTacToeState(),
  isState: (state): state is UltimateTicTacToeState => state instanceof UltimateTicTacToeState,
  serializeState: (state) => ({
    board: [...state.board],
    team: state.team,
    prevMove: state.prevMove,
    boardStates: [...state.boardStates],
  }),
  deserializeState: (serializedState) => {
    const { board, team, prevMove, boardStates } = serializedState as SerializedUltimateTicTacToeState;
    if(!Array.isArray(board) || typeof team !== 'boolean' || !Array.isArray(boardStates)) {
      throw new Error('Invalid Ultimate Tic-Tac-Toe state');
    }

    return new UltimateTicTacToeState([...board], team, prevMove, [...boardStates]);
  },
  encodeMove: (move) => move.toString(),
  decodeMove: (encodedMove) => parseInt(encodedMove, 10),
  Board: UltimateTicTacToeBoard,
};

export default UltimateTicTacToe;
