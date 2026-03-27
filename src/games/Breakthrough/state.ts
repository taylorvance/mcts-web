import {
  BreakthroughCell,
  BreakthroughMove,
  BreakthroughState,
  BreakthroughTeam,
} from 'multimcts/breakthrough';

export const ROWS = 8;
export const COLS = 8;
export const TOTAL_CELLS = ROWS * COLS;

export { BreakthroughState } from 'multimcts/breakthrough';
export type {
  BreakthroughCell as CellState,
  BreakthroughMove,
  BreakthroughTeam,
};

export interface ParsedBreakthroughMove {
  from: number;
  to: number;
}

export const parseBreakthroughMove = (move: string): ParsedBreakthroughMove => {
  const [fromText, toText] = move.split(':');
  const from = Number.parseInt(fromText ?? '', 10);
  const to = Number.parseInt(toText ?? '', 10);

  if(
    !Number.isInteger(from)
    || !Number.isInteger(to)
    || from < 0
    || from >= TOTAL_CELLS
    || to < 0
    || to >= TOTAL_CELLS
  ) {
    throw new Error(`Invalid Breakthrough move: ${move}`);
  }

  return { from, to };
};

export const getMovesBySource = (state: BreakthroughState) => {
  const movesBySource = new Map<number, number[]>();

  for(const move of state.getLegalMoves()) {
    const { from, to } = parseBreakthroughMove(move);
    const destinations = movesBySource.get(from);

    if(destinations) {
      destinations.push(to);
    } else {
      movesBySource.set(from, [to]);
    }
  }

  return movesBySource;
};
