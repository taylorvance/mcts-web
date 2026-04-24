import { GameState } from 'multimcts';

export const ROWS = 6;
export const COLS = 5;
export const TOTAL_CELLS = ROWS * COLS;

export type GoroGoroTeam = 'S' | 'N';
export type GoroGoroPieceKind = 'L' | 'D' | 'T' | 'C' | 'H' | 'M';
export type GoroGoroDropPieceKind = 'D' | 'T' | 'C';
export type GoroGoroPiece =
  | GoroGoroPieceKind
  | Lowercase<GoroGoroPieceKind>;

export interface GoroGoroHand {
  D: number;
  T: number;
  C: number;
}

export interface GoroGoroHands {
  s: GoroGoroHand;
  n: GoroGoroHand;
}

export interface GoroGoroBoardMove {
  type: 'move';
  from: number;
  to: number;
  promote: boolean;
}

export interface GoroGoroDropMove {
  type: 'drop';
  piece: GoroGoroDropPieceKind;
  to: number;
}

export type GoroGoroMove = GoroGoroBoardMove | GoroGoroDropMove;
export type GoroGoroOutcomeReason =
  | 'capture'
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | null;

const DROP_PIECES: GoroGoroDropPieceKind[] = ['D', 'T', 'C'];
const INITIAL_BOARD: Array<GoroGoroPiece | null> = [
  't', 'd', 'l', 'd', 't',
  null, 'c', 'c', 'c', null,
  null, null, null, null, null,
  null, null, null, null, null,
  null, 'C', 'C', 'C', null,
  'T', 'D', 'L', 'D', 'T',
];

export const GOROGORO_MOVE_DELTAS: Record<
  GoroGoroPieceKind,
  Array<[number, number]>
> = {
  L: [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ],
  D: [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],            [0, 1],
               [1, 0],
  ],
  T: [
    [-1, -1], [-1, 0], [-1, 1],
    [1, -1],            [1, 1],
  ],
  C: [
    [-1, 0],
  ],
  H: [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],            [0, 1],
               [1, 0],
  ],
  M: [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],            [0, 1],
               [1, 0],
  ],
};

const createEmptyHand = (): GoroGoroHand => ({
  D: 0,
  T: 0,
  C: 0,
});

const cloneHands = (hands: GoroGoroHands): GoroGoroHands => ({
  s: { ...hands.s },
  n: { ...hands.n },
});

const isValidIndex = (index: number) => (
  Number.isInteger(index) && index >= 0 && index < TOTAL_CELLS
);

const isValidDropPiece = (piece: unknown): piece is GoroGoroDropPieceKind => (
  piece === 'D' || piece === 'T' || piece === 'C'
);

const isValidBoardPiece = (piece: unknown): piece is GoroGoroPiece | null => (
  piece === null
  || piece === 'L'
  || piece === 'D'
  || piece === 'T'
  || piece === 'C'
  || piece === 'H'
  || piece === 'M'
  || piece === 'l'
  || piece === 'd'
  || piece === 't'
  || piece === 'c'
  || piece === 'h'
  || piece === 'm'
);

const getTeamKey = (team: GoroGoroTeam): 's' | 'n' => (
  team === 'S' ? 's' : 'n'
);

const getOpponentTeam = (team: GoroGoroTeam): GoroGoroTeam => (
  team === 'S' ? 'N' : 'S'
);

const getPieceOwner = (piece: GoroGoroPiece): GoroGoroTeam => (
  piece === piece.toUpperCase() ? 'S' : 'N'
);

const getPieceKind = (piece: GoroGoroPiece): GoroGoroPieceKind => (
  piece.toUpperCase() as GoroGoroPieceKind
);

const createPiece = (team: GoroGoroTeam, piece: GoroGoroPieceKind): GoroGoroPiece => (
  team === 'S' ? piece : piece.toLowerCase() as Lowercase<GoroGoroPieceKind>
);

const demoteCapturedPiece = (piece: GoroGoroPiece): GoroGoroDropPieceKind => {
  const pieceKind = getPieceKind(piece);
  if (pieceKind === 'L') {
    throw new Error('Cannot capture and drop a lion.');
  }

  if (pieceKind === 'H') {
    return 'C';
  }

  if (pieceKind === 'M') {
    return 'T';
  }

  return pieceKind as GoroGoroDropPieceKind;
};

const getPromotedPieceKind = (
  pieceKind: GoroGoroPieceKind,
): GoroGoroPieceKind => {
  if (pieceKind === 'C') {
    return 'H';
  }

  if (pieceKind === 'T') {
    return 'M';
  }

  throw new Error(`Piece ${pieceKind} cannot promote.`);
};

const getIndex = (row: number, col: number) => (row * COLS) + col;
const getRow = (index: number) => Math.floor(index / COLS);

const isFinalRank = (team: GoroGoroTeam, index: number) => (
  team === 'S' ? getRow(index) === 0 : getRow(index) === ROWS - 1
);

const isPromotionZone = (team: GoroGoroTeam, index: number) => (
  team === 'S' ? getRow(index) <= 1 : getRow(index) >= ROWS - 2
);

const orientDelta = (
  team: GoroGoroTeam,
  [rowDelta, colDelta]: [number, number],
): [number, number] => (
  team === 'S'
    ? [rowDelta, colDelta]
    : [-rowDelta, -colDelta]
);

const canPieceAttackWithDelta = (
  pieceKind: GoroGoroPieceKind,
  team: GoroGoroTeam,
  rowDelta: number,
  colDelta: number,
) => GOROGORO_MOVE_DELTAS[pieceKind].some(([baseRowDelta, baseColDelta]) => {
  const [orientedRowDelta, orientedColDelta] = orientDelta(team, [baseRowDelta, baseColDelta]);
  return orientedRowDelta === rowDelta && orientedColDelta === colDelta;
});

const formatHands = (hands: GoroGoroHands) => (
  `S[D${hands.s.D}T${hands.s.T}C${hands.s.C}]|N[D${hands.n.D}T${hands.n.T}C${hands.n.C}]`
);

const createPositionKey = (
  board: Array<GoroGoroPiece | null>,
  team: boolean,
  hands: GoroGoroHands,
) => `${team ? 'S' : 'N'}:${board.map((piece) => piece ?? '.').join('')}:${formatHands(hands)}`;

const serializeRepetitionCounts = (repetitionCounts: ReadonlyMap<string, number>) => (
  [...repetitionCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => `${key}=${count}`)
    .join('|')
);

const hasValidHand = (hand: unknown): hand is GoroGoroHand => (
  typeof hand === 'object'
  && hand !== null
  && Number.isInteger((hand as GoroGoroHand).D)
  && (hand as GoroGoroHand).D >= 0
  && Number.isInteger((hand as GoroGoroHand).T)
  && (hand as GoroGoroHand).T >= 0
  && Number.isInteger((hand as GoroGoroHand).C)
  && (hand as GoroGoroHand).C >= 0
);

const isPromotablePiece = (pieceKind: GoroGoroPieceKind) => (
  pieceKind === 'T' || pieceKind === 'C'
);

const isMandatoryPromotion = (
  pieceKind: GoroGoroPieceKind,
  team: GoroGoroTeam,
  to: number,
) => pieceKind === 'C' && isFinalRank(team, to);

export const encodeGoroGoroMove = (move: GoroGoroMove) => (
  move.type === 'move'
    ? `m:${move.from}-${move.to}${move.promote ? '+' : ''}`
    : `d:${move.piece}@${move.to}`
);

export const decodeGoroGoroMove = (encodedMove: string): GoroGoroMove => {
  const boardMoveMatch = /^m:(\d+)-(\d+)(\+?)$/.exec(encodedMove);
  if (boardMoveMatch) {
    const from = Number.parseInt(boardMoveMatch[1], 10);
    const to = Number.parseInt(boardMoveMatch[2], 10);
    if (!isValidIndex(from) || !isValidIndex(to)) {
      throw new Error(`Invalid Goro-Goro Dobutsu Shogi move: ${encodedMove}`);
    }

    return {
      type: 'move',
      from,
      to,
      promote: boardMoveMatch[3] === '+',
    };
  }

  const dropMoveMatch = /^d:([DTC])@(\d+)$/.exec(encodedMove);
  if (dropMoveMatch) {
    const piece = dropMoveMatch[1] as GoroGoroDropPieceKind;
    const to = Number.parseInt(dropMoveMatch[2], 10);
    if (!isValidDropPiece(piece) || !isValidIndex(to)) {
      throw new Error(`Invalid Goro-Goro Dobutsu Shogi move: ${encodedMove}`);
    }

    return {
      type: 'drop',
      piece,
      to,
    };
  }

  throw new Error(`Invalid Goro-Goro Dobutsu Shogi move: ${encodedMove}`);
};

export class GoroGoroDobutsuShogiState extends GameState<
  GoroGoroMove,
  GoroGoroTeam,
  GoroGoroDobutsuShogiState
> {
  board: Array<GoroGoroPiece | null>;
  team: boolean;
  hands: GoroGoroHands;
  repetitionCounts: Map<string, number>;
  private legalMovesCache: GoroGoroMove[] | null;
  private hasAnyLegalMoveCache: boolean | null;

  constructor(
    board: Array<GoroGoroPiece | null> = [...INITIAL_BOARD],
    team = true,
    hands: GoroGoroHands = {
      s: createEmptyHand(),
      n: createEmptyHand(),
    },
    repetitionCounts: Iterable<readonly [string, number]> | null = null,
  ) {
    super();
    this.board = [...board];
    this.team = team;
    this.hands = cloneHands(hands);
    this.repetitionCounts = repetitionCounts
      ? new Map(repetitionCounts)
      : new Map([[this.getPositionKey(), 1]]);
    this.legalMovesCache = null;
    this.hasAnyLegalMoveCache = null;
  }

  getCurrentTeam(): GoroGoroTeam {
    return this.team ? 'S' : 'N';
  }

  getPositionKey(): string {
    return createPositionKey(this.board, this.team, this.hands);
  }

  override getStateKey(): string {
    return `${this.getPositionKey()}:rep:${serializeRepetitionCounts(this.repetitionCounts)}`;
  }

  getCurrentHand(): GoroGoroHand {
    return this.hands[getTeamKey(this.getCurrentTeam())];
  }

  getLegalMoves(): GoroGoroMove[] {
    if (this.getCapturedLionWinner() || this.isRepetitionDraw()) {
      return [];
    }

    if (this.legalMovesCache !== null) {
      return [...this.legalMovesCache];
    }

    const legalMoves: GoroGoroMove[] = [];
    this.forEachPseudoLegalMove((move) => {
      if (this.isLegalMove(move)) {
        legalMoves.push(move);
      }
    });

    this.legalMovesCache = legalMoves;
    this.hasAnyLegalMoveCache = legalMoves.length > 0;
    return [...legalMoves];
  }

  makeTypedMove(move: GoroGoroMove): GoroGoroDobutsuShogiState {
    const encodedMove = encodeGoroGoroMove(move);
    const legalMove = this.getLegalMoves().find(
      (candidateMove) => encodeGoroGoroMove(candidateMove) === encodedMove,
    );

    if (!legalMove) {
      throw new Error(`Illegal Goro-Goro Dobutsu Shogi move: ${encodedMove}`);
    }

    return this.applyMoveUnchecked(legalMove);
  }

  makeMove(move: GoroGoroMove): GoroGoroDobutsuShogiState {
    return this.applyMoveUnchecked(move);
  }

  isTerminal(): boolean {
    if (this.getCapturedLionWinner() || this.isRepetitionDraw()) {
      return true;
    }

    return !this.hasAnyLegalMove();
  }

  getWinner(): GoroGoroTeam | null {
    const capturedLionWinner = this.getCapturedLionWinner();
    if (capturedLionWinner) {
      return capturedLionWinner;
    }

    if (this.isRepetitionDraw()) {
      return null;
    }

    return !this.hasAnyLegalMove()
      ? getOpponentTeam(this.getCurrentTeam())
      : null;
  }

  getOutcomeReason(): GoroGoroOutcomeReason {
    if (this.getCapturedLionWinner()) {
      return 'capture';
    }

    if (this.isRepetitionDraw()) {
      return 'repetition';
    }

    if (this.hasAnyLegalMove()) {
      return null;
    }

    return this.isInCheck(this.board, this.getCurrentTeam())
      ? 'checkmate'
      : 'stalemate';
  }

  getReward(): Record<GoroGoroTeam, number> {
    const winner = this.getWinner();
    if (winner === null) {
      return { S: 0.5, N: 0.5 };
    }

    return winner === 'S'
      ? { S: 1, N: 0 }
      : { S: 0, N: 1 };
  }

  toString(): string {
    const rows: string[] = [];
    for (let row = 0; row < ROWS; row += 1) {
      let rowString = '';
      for (let col = 0; col < COLS; col += 1) {
        rowString += this.board[getIndex(row, col)] ?? '.';
      }
      rows.push(rowString);
    }

    return `${this.getCurrentTeam()}: ${rows.join('/')} ${formatHands(this.hands)}`;
  }

  static initializeBoard() {
    return [...INITIAL_BOARD];
  }

  override sampleLegalMove(random: () => number): GoroGoroMove {
    const choice = this.findRandomLegalSuccessor(random);
    if (choice === null) {
      throw new Error('Non-terminal Goro-Goro Dobutsu Shogi state has no legal moves.');
    }

    return choice.move;
  }

  override suggestRollout(random: () => number) {
    return this.findRandomLegalSuccessor(random);
  }

  private hasAnyLegalMove() {
    if (this.hasAnyLegalMoveCache !== null) {
      return this.hasAnyLegalMoveCache;
    }

    if (this.legalMovesCache !== null) {
      this.hasAnyLegalMoveCache = this.legalMovesCache.length > 0;
      return this.hasAnyLegalMoveCache;
    }

    let hasLegalMove = false;
    this.forEachPseudoLegalMove((move) => {
      if (!this.isLegalMove(move)) {
        return false;
      }

      hasLegalMove = true;
      return true;
    });

    this.hasAnyLegalMoveCache = hasLegalMove;
    return hasLegalMove;
  }

  private isLegalMove(move: GoroGoroMove) {
    const { board, hands } = this.applyMoveToPosition(move);
    const currentTeam = this.getCurrentTeam();
    const lionIndex = this.findLionOnBoard(board, currentTeam);
    if (lionIndex === null) {
      return false;
    }

    if (this.isSquareAttacked(board, lionIndex, getOpponentTeam(currentTeam))) {
      return false;
    }

    if (move.type !== 'drop' || move.piece !== 'C') {
      return true;
    }

    const nextState = this.createStateFromPosition(board, hands, !this.team);
    return !this.isIllegalChickDropMateOnState(nextState);
  }

  private forEachPseudoLegalMove(visit: (move: GoroGoroMove) => boolean | void) {
    const currentTeam = this.getCurrentTeam();
    const currentHand = this.getCurrentHand();

    for (let index = 0; index < TOTAL_CELLS; index += 1) {
      const piece = this.board[index];
      if (!piece || getPieceOwner(piece) !== currentTeam) {
        continue;
      }

      const pieceKind = getPieceKind(piece);
      for (const to of this.getBoardDestinations(index, piece)) {
        if (
          isPromotablePiece(pieceKind)
          && (isPromotionZone(currentTeam, index) || isPromotionZone(currentTeam, to))
        ) {
          if (isMandatoryPromotion(pieceKind, currentTeam, to)) {
            if (visit({
              type: 'move',
              from: index,
              to,
              promote: true,
            })) {
              return;
            }
            continue;
          }

          if (visit({
            type: 'move',
            from: index,
            to,
            promote: false,
          })) {
            return;
          }
          if (visit({
            type: 'move',
            from: index,
            to,
            promote: true,
          })) {
            return;
          }
          continue;
        }

        if (visit({
          type: 'move',
          from: index,
          to,
          promote: false,
        })) {
          return;
        }
      }
    }

    for (const piece of DROP_PIECES) {
      if (currentHand[piece] <= 0) {
        continue;
      }

      for (let index = 0; index < TOTAL_CELLS; index += 1) {
        if (this.board[index] !== null) {
          continue;
        }

        if (piece === 'C' && !this.canDropChick(index, currentTeam)) {
          continue;
        }

        if (visit({
          type: 'drop',
          piece,
          to: index,
        })) {
          return;
        }
      }
    }
  }

  private findRandomLegalSuccessor(random: () => number) {
    const boardStart = Math.floor(random() * TOTAL_CELLS);

    for (let boardOffset = 0; boardOffset < TOTAL_CELLS; boardOffset += 1) {
      const from = (boardStart + boardOffset) % TOTAL_CELLS;
      const piece = this.board[from];
      if (!piece || getPieceOwner(piece) !== this.getCurrentTeam()) {
        continue;
      }

      const destinations = this.getBoardDestinations(from, piece);
      if (destinations.length === 0) {
        continue;
      }

      const destinationStart = Math.floor(random() * destinations.length);
      const pieceKind = getPieceKind(piece);
      for (let destinationOffset = 0; destinationOffset < destinations.length; destinationOffset += 1) {
        const to = destinations[(destinationStart + destinationOffset) % destinations.length];
        if (to === undefined) {
          continue;
        }

        const candidates = this.getBoardMoveCandidates(from, to, pieceKind, this.getCurrentTeam(), random);
        for (const move of candidates) {
          const nextState = this.getNextStateIfLegal(move);
          if (nextState !== null) {
            return { move, nextState };
          }
        }
      }
    }

    const pieceStart = Math.floor(random() * DROP_PIECES.length);
    for (let pieceOffset = 0; pieceOffset < DROP_PIECES.length; pieceOffset += 1) {
      const piece = DROP_PIECES[(pieceStart + pieceOffset) % DROP_PIECES.length];
      if (piece === undefined || this.getCurrentHand()[piece] <= 0) {
        continue;
      }

      const squareStart = Math.floor(random() * TOTAL_CELLS);
      for (let squareOffset = 0; squareOffset < TOTAL_CELLS; squareOffset += 1) {
        const to = (squareStart + squareOffset) % TOTAL_CELLS;
        if (this.board[to] !== null) {
          continue;
        }

        if (piece === 'C' && !this.canDropChick(to, this.getCurrentTeam())) {
          continue;
        }

        const move: GoroGoroDropMove = {
          type: 'drop',
          piece,
          to,
        };
        const nextState = this.getNextStateIfLegal(move);
        if (nextState !== null) {
          return { move, nextState };
        }
      }
    }

    return null;
  }

  private getBoardMoveCandidates(
    from: number,
    to: number,
    pieceKind: GoroGoroPieceKind,
    team: GoroGoroTeam,
    random: () => number,
  ): GoroGoroBoardMove[] {
    if (
      isPromotablePiece(pieceKind)
      && (isPromotionZone(team, from) || isPromotionZone(team, to))
    ) {
      if (isMandatoryPromotion(pieceKind, team, to)) {
        return [{
          type: 'move',
          from,
          to,
          promote: true,
        }];
      }

      const preferPromotion = random() < 0.5;
      return preferPromotion
        ? [
          { type: 'move', from, to, promote: true },
          { type: 'move', from, to, promote: false },
        ]
        : [
          { type: 'move', from, to, promote: false },
          { type: 'move', from, to, promote: true },
        ];
    }

    return [{
      type: 'move',
      from,
      to,
      promote: false,
    }];
  }

  private getBoardDestinations(index: number, piece: GoroGoroPiece): number[] {
    const destinations: number[] = [];
    const team = getPieceOwner(piece);
    const row = getRow(index);
    const col = index % COLS;

    for (const delta of GOROGORO_MOVE_DELTAS[getPieceKind(piece)]) {
      const [rowDelta, colDelta] = orientDelta(team, delta);
      const nextRow = row + rowDelta;
      const nextCol = col + colDelta;
      if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) {
        continue;
      }

      const nextIndex = getIndex(nextRow, nextCol);
      const occupant = this.board[nextIndex];
      if (occupant && getPieceOwner(occupant) === team) {
        continue;
      }

      destinations.push(nextIndex);
    }

    return destinations;
  }

  private canDropChick(index: number, team: GoroGoroTeam): boolean {
    if (isFinalRank(team, index)) {
      return false;
    }

    const file = index % COLS;
    for (let row = 0; row < ROWS; row += 1) {
      const piece = this.board[getIndex(row, file)];
      if (
        piece
        && getPieceOwner(piece) === team
        && getPieceKind(piece) === 'C'
      ) {
        return false;
      }
    }

    return true;
  }

  private getNextStateIfLegal(move: GoroGoroMove) {
    const currentTeam = this.getCurrentTeam();
    const { board, hands } = this.applyMoveToPosition(move);
    const lionIndex = this.findLionOnBoard(board, currentTeam);
    if (lionIndex === null) {
      return null;
    }

    if (this.isSquareAttacked(board, lionIndex, getOpponentTeam(currentTeam))) {
      return null;
    }

    const nextState = this.createStateFromPosition(board, hands, !this.team);
    if (
      move.type === 'drop'
      && move.piece === 'C'
      && this.isIllegalChickDropMateOnState(nextState)
    ) {
      return null;
    }

    return nextState;
  }

  private isIllegalChickDropMateOnState(nextState: GoroGoroDobutsuShogiState) {
    return (
      nextState.isInCheck(nextState.board, nextState.getCurrentTeam())
      && !nextState.hasAnyLegalMove()
    );
  }

  private applyMoveToPosition(move: GoroGoroMove) {
    const currentTeam = this.getCurrentTeam();
    const nextBoard = [...this.board];
    const nextHands = cloneHands(this.hands);

    if (move.type === 'move') {
      const piece = nextBoard[move.from];
      if (!piece || getPieceOwner(piece) !== currentTeam) {
        throw new Error(`Illegal Goro-Goro Dobutsu Shogi move: ${encodeGoroGoroMove(move)}`);
      }

      const destinationPiece = nextBoard[move.to];
      if (destinationPiece && getPieceOwner(destinationPiece) === currentTeam) {
        throw new Error(`Illegal Goro-Goro Dobutsu Shogi move: ${encodeGoroGoroMove(move)}`);
      }

      if (destinationPiece && getPieceKind(destinationPiece) !== 'L') {
        nextHands[getTeamKey(currentTeam)][demoteCapturedPiece(destinationPiece)] += 1;
      }

      const pieceKind = getPieceKind(piece);
      nextBoard[move.from] = null;
      nextBoard[move.to] = move.promote
        ? createPiece(currentTeam, getPromotedPieceKind(pieceKind))
        : piece;
    } else {
      if (
        nextBoard[move.to] !== null
        || nextHands[getTeamKey(currentTeam)][move.piece] <= 0
      ) {
        throw new Error(`Illegal Goro-Goro Dobutsu Shogi move: ${encodeGoroGoroMove(move)}`);
      }

      nextHands[getTeamKey(currentTeam)][move.piece] -= 1;
      nextBoard[move.to] = createPiece(currentTeam, move.piece);
    }

    return {
      board: nextBoard,
      hands: nextHands,
    };
  }

  private isInCheck(
    board: Array<GoroGoroPiece | null>,
    team: GoroGoroTeam,
  ): boolean {
    const lionIndex = this.findLionOnBoard(board, team);
    if (lionIndex === null) {
      return true;
    }

    return this.isSquareAttacked(board, lionIndex, getOpponentTeam(team));
  }

  private isSquareAttacked(
    board: Array<GoroGoroPiece | null>,
    targetIndex: number,
    attacker: GoroGoroTeam,
  ): boolean {
    const targetRow = getRow(targetIndex);
    const targetCol = targetIndex % COLS;

    for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
      for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
        if (rowDelta === 0 && colDelta === 0) {
          continue;
        }

        const sourceRow = targetRow - rowDelta;
        const sourceCol = targetCol - colDelta;
        if (
          sourceRow < 0
          || sourceRow >= ROWS
          || sourceCol < 0
          || sourceCol >= COLS
        ) {
          continue;
        }

        const piece = board[getIndex(sourceRow, sourceCol)];
        if (!piece || getPieceOwner(piece) !== attacker) {
          continue;
        }

        if (canPieceAttackWithDelta(getPieceKind(piece), attacker, rowDelta, colDelta)) {
          return true;
        }
      }
    }

    return false;
  }

  private getCapturedLionWinner(): GoroGoroTeam | null {
    const southLion = this.findLionOnBoard(this.board, 'S');
    const northLion = this.findLionOnBoard(this.board, 'N');

    if (southLion === null && northLion !== null) {
      return 'N';
    }

    if (northLion === null && southLion !== null) {
      return 'S';
    }

    return null;
  }

  private isRepetitionDraw(): boolean {
    return (this.repetitionCounts.get(this.getPositionKey()) ?? 0) >= 4;
  }

  private findLionOnBoard(
    board: Array<GoroGoroPiece | null>,
    team: GoroGoroTeam,
  ): number | null {
    for (let index = 0; index < TOTAL_CELLS; index += 1) {
      const piece = board[index];
      if (
        piece
        && getPieceOwner(piece) === team
        && getPieceKind(piece) === 'L'
      ) {
        return index;
      }
    }

    return null;
  }

  private applyMoveUnchecked(move: GoroGoroMove): GoroGoroDobutsuShogiState {
    const { board, hands } = this.applyMoveToPosition(move);
    return this.createStateFromPosition(board, hands, !this.team);
  }

  private createStateFromPosition(
    board: Array<GoroGoroPiece | null>,
    hands: GoroGoroHands,
    nextTeam: boolean,
  ) {
    const nextRepetitionCounts = new Map(this.repetitionCounts);
    const nextPositionKey = createPositionKey(board, nextTeam, hands);
    nextRepetitionCounts.set(
      nextPositionKey,
      (nextRepetitionCounts.get(nextPositionKey) ?? 0) + 1,
    );

    return new GoroGoroDobutsuShogiState(
      board,
      nextTeam,
      hands,
      nextRepetitionCounts,
    );
  }
}

export const isGoroGoroMove = (move: unknown): move is GoroGoroMove => {
  if (typeof move !== 'object' || move === null || !('type' in move)) {
    return false;
  }

  if ((move as GoroGoroMove).type === 'move') {
    return (
      isValidIndex((move as GoroGoroBoardMove).from)
      && isValidIndex((move as GoroGoroBoardMove).to)
      && typeof (move as GoroGoroBoardMove).promote === 'boolean'
    );
  }

  return (
    (move as GoroGoroMove).type === 'drop'
    && isValidDropPiece((move as GoroGoroDropMove).piece)
    && isValidIndex((move as GoroGoroDropMove).to)
  );
};

export const isGoroGoroHands = (hands: unknown): hands is GoroGoroHands => (
  typeof hands === 'object'
  && hands !== null
  && hasValidHand((hands as GoroGoroHands).s)
  && hasValidHand((hands as GoroGoroHands).n)
);

export const isGoroGoroBoard = (
  board: unknown,
): board is Array<GoroGoroPiece | null> => (
  Array.isArray(board)
  && board.length === TOTAL_CELLS
  && board.every((piece) => isValidBoardPiece(piece))
);
