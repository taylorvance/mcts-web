import type { TypedGameDefinition } from '../../types/Game';
import FillerBoard from './Board';
import { COLOR_COUNT, FillerState } from './state';

interface SerializedFillerState {
  board: number[];
  team: boolean;
}

const Filler: TypedGameDefinition<FillerState, number> = {
  id: 'Filler',
  name: 'Filler',
  help: {
    overview: 'Each player controls a corner territory and expands it by choosing colors. Your region flood-fills into every connected cell of the chosen color, and the larger territory wins once only the two player colors remain.',
    sections: [
      {
        title: 'How To Play',
        items: [
          'Choose a color button to repaint your territory and absorb adjacent connected cells of that color.',
          'You cannot choose the color currently owned by either player.',
          'The game ends when the board has collapsed to just the two player colors.',
        ],
      },
      {
        title: 'Strategy Notes',
        items: [
          'Short-term gains can hand your opponent an even larger follow-up color.',
          'Watch both corners at once because legal colors are shared constraints.',
        ],
      },
    ],
  },
  createInitialState: () => new FillerState(),
  isState: (state): state is FillerState => state instanceof FillerState,
  serializeState: (state) => ({
    board: Array.from(state.board),
    team: state.team,
  }),
  deserializeState: (serializedState) => {
    const { board, team } = serializedState as SerializedFillerState;
    if(!Array.isArray(board) || typeof team !== 'boolean') {
      throw new Error('Invalid Filler state');
    }

    return new FillerState(Uint8Array.from(board), team);
  },
  serializeMove: (move) => move.toString(),
  deserializeMove: (serializedMove) => {
    const move = Number.parseInt(serializedMove, 10);
    if(!Number.isInteger(move) || move < 0 || move >= COLOR_COUNT) {
      throw new Error(`Invalid Filler move: ${serializedMove}`);
    }

    return move;
  },
  Board: FillerBoard,
};

export default Filler;
