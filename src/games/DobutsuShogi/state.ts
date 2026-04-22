import { GameState } from 'multimcts';

export const ROWS = 4;
export const COLS = 3;
export const TOTAL_CELLS = ROWS * COLS;

export type DobutsuTeam = 'S' | 'N';
export type DobutsuPieceKind = 'L' | 'G' | 'E' | 'C' | 'H';
export type DobutsuDropPieceKind = 'G' | 'E' | 'C';
export type DobutsuPiece =
  | DobutsuPieceKind
  | Lowercase<DobutsuPieceKind>;

export interface DobutsuHand {
  G: number;
  E: number;
  C: number;
}

export interface DobutsuHands {
  s: DobutsuHand;
  n: DobutsuHand;
}

export interface DobutsuBoardMove {
  type: 'move';
  from: number;
  to: number;
}

export interface DobutsuDropMove {
  type: 'drop';
  piece: DobutsuDropPieceKind;
  to: number;
}

export type DobutsuMove = DobutsuBoardMove | DobutsuDropMove;
export type DobutsuOutcomeReason = 'capture' | 'try' | 'stalemate' | 'repetition' | null;

const DROP_PIECES: DobutsuDropPieceKind[] = ['G', 'E', 'C'];
const INITIAL_BOARD: Array<DobutsuPiece | null> = [
  'g', 'l', 'e',
  null, 'c', null,
  null, 'C', null,
  'E', 'L', 'G',
];

export const DOBUTSU_MOVE_DELTAS: Record<DobutsuPieceKind, Array<[number, number]>> = {
  L: [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ],
  G: [
    [-1, 0],
    [0, -1], [0, 1],
    [1, 0],
  ],
  E: [
    [-1, -1], [-1, 1],
    [1, -1], [1, 1],
  ],
  C: [
    [-1, 0],
  ],
  H: [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],            [0, 1],
               [1, 0],
  ],
};

const createEmptyHand = (): DobutsuHand => ({
  G: 0,
  E: 0,
  C: 0,
});

const cloneHands = (hands: DobutsuHands): DobutsuHands => ({
  s: { ...hands.s },
  n: { ...hands.n },
});

const isValidIndex = (index: number) =>
  Number.isInteger(index) && index >= 0 && index < TOTAL_CELLS;

const isValidDropPiece = (piece: unknown): piece is DobutsuDropPieceKind =>
  piece === 'G' || piece === 'E' || piece === 'C';

const isValidBoardPiece = (piece: unknown): piece is DobutsuPiece | null =>
  piece === null
  || piece === 'L'
  || piece === 'G'
  || piece === 'E'
  || piece === 'C'
  || piece === 'H'
  || piece === 'l'
  || piece === 'g'
  || piece === 'e'
  || piece === 'c'
  || piece === 'h';

const getTeamKey = (team: DobutsuTeam): 's' | 'n' => (team === 'S' ? 's' : 'n');

const getOpponentTeam = (team: DobutsuTeam): DobutsuTeam => (team === 'S' ? 'N' : 'S');

const getPieceOwner = (piece: DobutsuPiece): DobutsuTeam => (
  piece === piece.toUpperCase() ? 'S' : 'N'
);

const getPieceKind = (piece: DobutsuPiece): DobutsuPieceKind => piece.toUpperCase() as DobutsuPieceKind;

const createPiece = (team: DobutsuTeam, piece: DobutsuPieceKind): DobutsuPiece => (
  team === 'S' ? piece : piece.toLowerCase() as Lowercase<DobutsuPieceKind>
);

const demoteCapturedPiece = (piece: DobutsuPiece): DobutsuDropPieceKind => {
  const pieceKind = getPieceKind(piece);
  if(pieceKind === 'L') {
    throw new Error('Cannot capture and drop a lion.');
  }

  if(pieceKind === 'H') {
    return 'C';
  }

  return pieceKind as DobutsuDropPieceKind;
};

const getIndex = (row: number, col: number) => (row * COLS) + col;

const getRow = (index: number) => Math.floor(index / COLS);

const isFinalRank = (team: DobutsuTeam, index: number) => (
  team === 'S' ? getRow(index) === 0 : getRow(index) === ROWS - 1
);

const orientDelta = (team: DobutsuTeam, [rowDelta, colDelta]: [number, number]): [number, number] => (
  team === 'S'
    ? [rowDelta, colDelta]
    : [-rowDelta, -colDelta]
);

const formatHands = (hands: DobutsuHands) => (
  `S[G${hands.s.G}E${hands.s.E}C${hands.s.C}]|N[G${hands.n.G}E${hands.n.E}C${hands.n.C}]`
);

const createPositionKey = (
  board: Array<DobutsuPiece | null>,
  team: boolean,
  hands: DobutsuHands,
) => `${team ? 'S' : 'N'}:${board.map((piece) => piece ?? '.').join('')}:${formatHands(hands)}`;

const serializeRepetitionCounts = (repetitionCounts: ReadonlyMap<string, number>) => (
  [...repetitionCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => `${key}=${count}`)
    .join('|')
);

const hasValidHand = (hand: unknown): hand is DobutsuHand => (
  typeof hand === 'object'
  && hand !== null
  && Number.isInteger((hand as DobutsuHand).G)
  && (hand as DobutsuHand).G >= 0
  && Number.isInteger((hand as DobutsuHand).E)
  && (hand as DobutsuHand).E >= 0
  && Number.isInteger((hand as DobutsuHand).C)
  && (hand as DobutsuHand).C >= 0
);

export const encodeDobutsuMove = (move: DobutsuMove) => (
  move.type === 'move'
    ? `m:${move.from}-${move.to}`
    : `d:${move.piece}@${move.to}`
);

export const decodeDobutsuMove = (encodedMove: string): DobutsuMove => {
  const boardMoveMatch = /^m:(\d+)-(\d+)$/.exec(encodedMove);
  if(boardMoveMatch) {
    const from = Number.parseInt(boardMoveMatch[1], 10);
    const to = Number.parseInt(boardMoveMatch[2], 10);
    if(!isValidIndex(from) || !isValidIndex(to)) {
      throw new Error(`Invalid Dobutsu Shogi move: ${encodedMove}`);
    }

    return {
      type: 'move',
      from,
      to,
    };
  }

  const dropMoveMatch = /^d:([GEC])@(\d+)$/.exec(encodedMove);
  if(dropMoveMatch) {
    const piece = dropMoveMatch[1] as DobutsuDropPieceKind;
    const to = Number.parseInt(dropMoveMatch[2], 10);
    if(!isValidDropPiece(piece) || !isValidIndex(to)) {
      throw new Error(`Invalid Dobutsu Shogi move: ${encodedMove}`);
    }

    return {
      type: 'drop',
      piece,
      to,
    };
  }

  throw new Error(`Invalid Dobutsu Shogi move: ${encodedMove}`);
};

export class DobutsuShogiState extends GameState<DobutsuMove, DobutsuTeam, DobutsuShogiState> {
  board: Array<DobutsuPiece | null>;
  team: boolean;
  hands: DobutsuHands;
  repetitionCounts: Map<string, number>;

  constructor(
    board: Array<DobutsuPiece | null> = [...INITIAL_BOARD],
    team = true,
    hands: DobutsuHands = { s: createEmptyHand(), n: createEmptyHand() },
    repetitionCounts: Iterable<readonly [string, number]> | null = null,
  ) {
    super();
    this.board = [...board];
    this.team = team;
    this.hands = cloneHands(hands);
    this.repetitionCounts = repetitionCounts
      ? new Map(repetitionCounts)
      : new Map([[this.getPositionKey(), 1]]);
  }

  getCurrentTeam(): DobutsuTeam {
    return this.team ? 'S' : 'N';
  }

  getPositionKey(): string {
    return createPositionKey(this.board, this.team, this.hands);
  }

  override getStateKey(): string {
    return `${this.getPositionKey()}:rep:${serializeRepetitionCounts(this.repetitionCounts)}`;
  }

  getCurrentHand(): DobutsuHand {
    return this.hands[getTeamKey(this.getCurrentTeam())];
  }

  getLegalMoves(): DobutsuMove[] {
    if(this.getCapturedLionWinner() || this.getTryWinner() || this.isRepetitionDraw()) {
      return [];
    }

    return this.listPseudoLegalMoves();
  }

  makeTypedMove(move: DobutsuMove): DobutsuShogiState {
    const encodedMove = encodeDobutsuMove(move);
    const legalMove = this.getLegalMoves()
      .find((candidateMove) => encodeDobutsuMove(candidateMove) === encodedMove);

    if(!legalMove) {
      throw new Error(`Illegal Dobutsu Shogi move: ${encodedMove}`);
    }

    return this.applyMoveUnchecked(legalMove);
  }

  makeMove(move: DobutsuMove): DobutsuShogiState {
    return this.makeTypedMove(move);
  }

  isTerminal(): boolean {
    if(this.getCapturedLionWinner() || this.getTryWinner() || this.isRepetitionDraw()) {
      return true;
    }

    return this.listPseudoLegalMoves().length === 0;
  }

  getWinner(): DobutsuTeam | null {
    const capturedLionWinner = this.getCapturedLionWinner();
    if(capturedLionWinner) {
      return capturedLionWinner;
    }

    const tryWinner = this.getTryWinner();
    if(tryWinner) {
      return tryWinner;
    }

    if(this.isRepetitionDraw()) {
      return null;
    }

    return this.listPseudoLegalMoves().length === 0
      ? getOpponentTeam(this.getCurrentTeam())
      : null;
  }

  getOutcomeReason(): DobutsuOutcomeReason {
    if(this.getCapturedLionWinner()) {
      return 'capture';
    }

    if(this.getTryWinner()) {
      return 'try';
    }

    if(this.isRepetitionDraw()) {
      return 'repetition';
    }

    return this.listPseudoLegalMoves().length === 0 ? 'stalemate' : null;
  }

  getReward(): Record<DobutsuTeam, number> {
    const winner = this.getWinner();
    if(winner === null) {
      return { S: 0.5, N: 0.5 };
    }

    return winner === 'S'
      ? { S: 1, N: 0 }
      : { S: 0, N: 1 };
  }

  toString(): string {
    const rows: string[] = [];
    for(let row = 0; row < ROWS; row += 1) {
      let rowString = '';
      for(let col = 0; col < COLS; col += 1) {
        rowString += this.board[getIndex(row, col)] ?? '.';
      }
      rows.push(rowString);
    }

    return `${this.getCurrentTeam()}: ${rows.join('/')} ${formatHands(this.hands)}`;
  }

  static initializeBoard() {
    return [...INITIAL_BOARD];
  }

  private listPseudoLegalMoves(): DobutsuMove[] {
    const moves: DobutsuMove[] = [];
    const currentTeam = this.getCurrentTeam();

    for(let index = 0; index < TOTAL_CELLS; index += 1) {
      const piece = this.board[index];
      if(!piece || getPieceOwner(piece) !== currentTeam) {
        continue;
      }

      const pieceKind = getPieceKind(piece);
      for(const to of this.getBoardDestinations(index, piece)) {
        if(pieceKind === 'L' && isFinalRank(currentTeam, to) && this.isAttackedAfterLionMove(index, to, currentTeam)) {
          continue;
        }

        moves.push({
          type: 'move',
          from: index,
          to,
        });
      }
    }

    for(const piece of DROP_PIECES) {
      if(this.getCurrentHand()[piece] <= 0) {
        continue;
      }

      for(let index = 0; index < TOTAL_CELLS; index += 1) {
        if(this.board[index] === null) {
          moves.push({
            type: 'drop',
            piece,
            to: index,
          });
        }
      }
    }

    return moves;
  }

  private getBoardDestinations(index: number, piece: DobutsuPiece): number[] {
    const destinations: number[] = [];
    const team = getPieceOwner(piece);
    const row = getRow(index);
    const col = index % COLS;

    for(const delta of DOBUTSU_MOVE_DELTAS[getPieceKind(piece)]) {
      const [rowDelta, colDelta] = orientDelta(team, delta);
      const nextRow = row + rowDelta;
      const nextCol = col + colDelta;
      if(nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) {
        continue;
      }

      const nextIndex = getIndex(nextRow, nextCol);
      const occupant = this.board[nextIndex];
      if(occupant && getPieceOwner(occupant) === team) {
        continue;
      }

      destinations.push(nextIndex);
    }

    return destinations;
  }

  private isAttackedAfterLionMove(from: number, to: number, team: DobutsuTeam): boolean {
    const nextBoard = [...this.board];
    const lion = nextBoard[from];
    if(!lion || getPieceKind(lion) !== 'L') {
      throw new Error('Expected a lion when evaluating a try move.');
    }

    nextBoard[from] = null;
    nextBoard[to] = lion;

    return this.isSquareAttacked(nextBoard, to, getOpponentTeam(team));
  }

  private isSquareAttacked(
    board: Array<DobutsuPiece | null>,
    targetIndex: number,
    attacker: DobutsuTeam,
  ): boolean {
    for(let index = 0; index < TOTAL_CELLS; index += 1) {
      const piece = board[index];
      if(!piece || getPieceOwner(piece) !== attacker) {
        continue;
      }

      const row = getRow(index);
      const col = index % COLS;
      for(const delta of DOBUTSU_MOVE_DELTAS[getPieceKind(piece)]) {
        const [rowDelta, colDelta] = orientDelta(attacker, delta);
        const nextRow = row + rowDelta;
        const nextCol = col + colDelta;
        if(nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) {
          continue;
        }

        if(getIndex(nextRow, nextCol) === targetIndex) {
          return true;
        }
      }
    }

    return false;
  }

  private getCapturedLionWinner(): DobutsuTeam | null {
    const southLion = this.findLion('S');
    const northLion = this.findLion('N');

    if(southLion === null && northLion !== null) {
      return 'N';
    }

    if(northLion === null && southLion !== null) {
      return 'S';
    }

    return null;
  }

  private getTryWinner(): DobutsuTeam | null {
    const southLion = this.findLion('S');
    if(
      southLion !== null
      && isFinalRank('S', southLion)
      && !this.isSquareAttacked(this.board, southLion, 'N')
    ) {
      return 'S';
    }

    const northLion = this.findLion('N');
    if(
      northLion !== null
      && isFinalRank('N', northLion)
      && !this.isSquareAttacked(this.board, northLion, 'S')
    ) {
      return 'N';
    }

    return null;
  }

  private isRepetitionDraw(): boolean {
    return (this.repetitionCounts.get(this.getPositionKey()) ?? 0) >= 3;
  }

  private findLion(team: DobutsuTeam): number | null {
    for(let index = 0; index < TOTAL_CELLS; index += 1) {
      const piece = this.board[index];
      if(piece && getPieceOwner(piece) === team && getPieceKind(piece) === 'L') {
        return index;
      }
    }

    return null;
  }

  private applyMoveUnchecked(move: DobutsuMove): DobutsuShogiState {
    const currentTeam = this.getCurrentTeam();
    const nextBoard = [...this.board];
    const nextHands = cloneHands(this.hands);

    if(move.type === 'move') {
      const piece = nextBoard[move.from];
      if(!piece || getPieceOwner(piece) !== currentTeam) {
        throw new Error(`Illegal Dobutsu Shogi move: ${encodeDobutsuMove(move)}`);
      }

      const destinationPiece = nextBoard[move.to];
      if(destinationPiece && getPieceOwner(destinationPiece) === currentTeam) {
        throw new Error(`Illegal Dobutsu Shogi move: ${encodeDobutsuMove(move)}`);
      }

      if(destinationPiece && getPieceKind(destinationPiece) !== 'L') {
        nextHands[getTeamKey(currentTeam)][demoteCapturedPiece(destinationPiece)] += 1;
      }

      nextBoard[move.from] = null;
      nextBoard[move.to] = (
        getPieceKind(piece) === 'C' && isFinalRank(currentTeam, move.to)
          ? createPiece(currentTeam, 'H')
          : piece
      );
    } else {
      if(nextBoard[move.to] !== null || nextHands[getTeamKey(currentTeam)][move.piece] <= 0) {
        throw new Error(`Illegal Dobutsu Shogi move: ${encodeDobutsuMove(move)}`);
      }

      nextHands[getTeamKey(currentTeam)][move.piece] -= 1;
      nextBoard[move.to] = createPiece(currentTeam, move.piece);
    }

    const nextTeam = !this.team;
    const nextRepetitionCounts = new Map(this.repetitionCounts);
    const nextPositionKey = createPositionKey(nextBoard, nextTeam, nextHands);
    nextRepetitionCounts.set(nextPositionKey, (nextRepetitionCounts.get(nextPositionKey) ?? 0) + 1);

    return new DobutsuShogiState(nextBoard, nextTeam, nextHands, nextRepetitionCounts);
  }
}

export const isDobutsuMove = (move: unknown): move is DobutsuMove => {
  if(typeof move !== 'object' || move === null || !('type' in move)) {
    return false;
  }

  if((move as DobutsuMove).type === 'move') {
    return isValidIndex((move as DobutsuBoardMove).from) && isValidIndex((move as DobutsuBoardMove).to);
  }

  return (
    (move as DobutsuMove).type === 'drop'
    && isValidDropPiece((move as DobutsuDropMove).piece)
    && isValidIndex((move as DobutsuDropMove).to)
  );
};

export const isDobutsuHands = (hands: unknown): hands is DobutsuHands => (
  typeof hands === 'object'
  && hands !== null
  && hasValidHand((hands as DobutsuHands).s)
  && hasValidHand((hands as DobutsuHands).n)
);

export const isDobutsuBoard = (board: unknown): board is Array<DobutsuPiece | null> => (
  Array.isArray(board)
  && board.length === TOTAL_CELLS
  && board.every((piece) => isValidBoardPiece(piece))
);
