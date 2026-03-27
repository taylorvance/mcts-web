import {
  HexCell,
  HexMove,
  HexState,
  HexTeam,
} from 'multimcts/hex';

export { HexState } from 'multimcts/hex';
export type {
  HexCell as CellState,
  HexMove,
  HexTeam,
};

const NEIGHBOR_DELTAS: Array<[rowDelta: number, colDelta: number]> = [
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
];

const getIndex = (row: number, col: number, size: number) => (row * size) + col;

export const getWinningPath = (state: HexState) => {
  if(state.winner === null) {
    return null;
  }

  const startIndexes: number[] = [];

  for(let index = 0; index < state.board.length; index += 1) {
    const row = Math.floor(index / state.size);
    const col = index % state.size;
    const touchesStartEdge = state.winner === 'B' ? row === 0 : col === 0;

    if(touchesStartEdge && state.board[index] === state.winner) {
      startIndexes.push(index);
    }
  }

  const queue = [...startIndexes];
  const parentByIndex = new Map<number, number | null>(
    startIndexes.map((index) => [index, null]),
  );

  while(queue.length > 0) {
    const index = queue.shift();
    if(index === undefined) {
      continue;
    }

    const row = Math.floor(index / state.size);
    const col = index % state.size;
    const touchesEndEdge = state.winner === 'B'
      ? row === state.size - 1
      : col === state.size - 1;

    if(touchesEndEdge) {
      const path: number[] = [];
      let current: number | null = index;

      while(current !== null) {
        path.push(current);
        current = parentByIndex.get(current) ?? null;
      }

      return path.reverse();
    }

    for(const [rowDelta, colDelta] of NEIGHBOR_DELTAS) {
      const nextRow = row + rowDelta;
      const nextCol = col + colDelta;
      if(
        nextRow < 0
        || nextRow >= state.size
        || nextCol < 0
        || nextCol >= state.size
      ) {
        continue;
      }

      const nextIndex = getIndex(nextRow, nextCol, state.size);
      if(state.board[nextIndex] !== state.winner || parentByIndex.has(nextIndex)) {
        continue;
      }

      parentByIndex.set(nextIndex, index);
      queue.push(nextIndex);
    }
  }

  return null;
};
