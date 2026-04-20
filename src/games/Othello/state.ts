import {
  OthelloState,
  type OthelloCell,
} from 'multimcts/othello';

export const ROWS = 8;
export const COLS = 8;
export const TOTAL_CELLS = ROWS * COLS;

export { OthelloState } from 'multimcts/othello';
export type CellState = OthelloCell;
export type OthelloMove = string;

export const getLegalPlacementMoves = (state: OthelloState) => (
  state.getLegalMoves()
    .filter((move) => move !== 'pass')
    .map((move) => Number.parseInt(move, 10))
);

export const getScore = (state: OthelloState) => {
  let black = 0;
  let white = 0;

  for(const cell of state.board) {
    if(cell === 'B') {
      black += 1;
    } else if(cell === 'W') {
      white += 1;
    }
  }

  return { black, white };
};

export const getWinner = (state: OthelloState) => {
  const { black, white } = getScore(state);
  if(black === white) {
    return null;
  }

  return black > white ? 'B' : 'W';
};
