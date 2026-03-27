import { GameState } from 'multimcts';

export interface OnitamaCard {
  name: string;
  color: '' | 'R' | 'B';
  first: 'R' | 'B';
  moves: Array<[number, number]>;
}

export interface OnitamaCards {
  r: number[];
  b: number[];
  n: number;
}

export interface OnitamaPlayMove {
  type: 'play';
  cardIdx: number;
  srcIdx: number;
  dstIdx: number;
}

export interface OnitamaPassMove {
  type: 'pass';
  cardIdx: number;
}

export type OnitamaMove = OnitamaPlayMove | OnitamaPassMove;
export type OnitamaPiece = 'R' | 'r' | 'B' | 'b' | null;
export type WinningMethod = 'stream' | 'stone';

export const ONITAMA_DECK: OnitamaCard[] = [
  { name: 'Dragon', color: '', first: 'R', moves: [[-1, -2], [-1, 2], [1, -1], [1, 1]] },
  { name: 'Elephant', color: '', first: 'R', moves: [[-1, -1], [-1, 1], [0, -1], [0, 1]] },
  { name: 'Boar', color: '', first: 'R', moves: [[-1, 0], [0, -1], [0, 1]] },
  { name: 'Mantis', color: '', first: 'R', moves: [[-1, -1], [-1, 1], [1, 0]] },
  { name: 'Tiger', color: '', first: 'B', moves: [[-2, 0], [1, 0]] },
  { name: 'Monkey', color: '', first: 'B', moves: [[-1, -1], [-1, 1], [1, -1], [1, 1]] },
  { name: 'Crab', color: '', first: 'B', moves: [[-1, 0], [0, -2], [0, 2]] },
  { name: 'Crane', color: '', first: 'B', moves: [[-1, 0], [1, -1], [1, 1]] },
  { name: 'Rabbit', color: 'R', first: 'B', moves: [[-1, 1], [0, 2], [1, -1]] },
  { name: 'Rooster', color: 'R', first: 'R', moves: [[-1, 1], [0, -1], [0, 1], [1, -1]] },
  { name: 'Ox', color: 'R', first: 'B', moves: [[-1, 0], [0, 1], [1, 0]] },
  { name: 'Cobra', color: 'R', first: 'R', moves: [[-1, 1], [0, -1], [1, 1]] },
  { name: 'Frog', color: 'B', first: 'R', moves: [[-1, -1], [0, -2], [1, 1]] },
  { name: 'Goose', color: 'B', first: 'B', moves: [[-1, -1], [0, -1], [0, 1], [1, 1]] },
  { name: 'Horse', color: 'B', first: 'R', moves: [[-1, 0], [0, -1], [1, 0]] },
  { name: 'Eel', color: 'B', first: 'B', moves: [[-1, -1], [0, 1], [1, -1]] },
  { name: 'Giraffe', color: '', first: 'B', moves: [[-1, -2], [-1, 2], [1, 0]] },
  { name: 'Kirin', color: '', first: 'R', moves: [[-2, -1], [-2, 1], [2, 0]] },
  { name: 'Phoenix', color: '', first: 'B', moves: [[-1, -1], [-1, 1], [0, -2], [0, 2]] },
  { name: 'Turtle', color: '', first: 'R', moves: [[0, -2], [0, 2], [1, -1], [1, 1]] },
  { name: 'Fox', color: 'R', first: 'R', moves: [[-1, 1], [0, 1], [1, 1]] },
  { name: 'Panda', color: 'R', first: 'R', moves: [[-1, 0], [-1, 1], [1, -1]] },
  { name: 'Sea Snake', color: 'R', first: 'B', moves: [[-1, 0], [0, 2], [1, -1]] },
  { name: 'Mouse', color: 'R', first: 'B', moves: [[-1, 0], [0, 1], [1, -1]] },
  { name: 'Tanuki', color: 'R', first: 'B', moves: [[-1, 0], [-1, 2], [1, -1]] },
  { name: 'Sable', color: 'R', first: 'B', moves: [[-1, 1], [0, -2], [1, -1]] },
  { name: 'Dog', color: 'B', first: 'B', moves: [[-1, -1], [0, -1], [1, -1]] },
  { name: 'Bear', color: 'B', first: 'B', moves: [[-1, -1], [-1, 0], [1, 1]] },
  { name: 'Viper', color: 'B', first: 'R', moves: [[-1, 0], [0, -2], [1, 1]] },
  { name: 'Rat', color: 'B', first: 'R', moves: [[-1, 0], [0, -1], [1, 1]] },
  { name: 'Iguana', color: 'B', first: 'R', moves: [[-1, -2], [-1, 0], [1, 1]] },
  { name: 'Otter', color: 'B', first: 'R', moves: [[-1, -1], [0, 2], [1, 1]] },
];

export const encodeOnitamaMove = (move: OnitamaMove) => {
  if(move.type === 'pass') {
    return `pass ${move.cardIdx}`;
  }

  return `${move.cardIdx},${move.srcIdx},${move.dstIdx}`;
};

export const decodeOnitamaMove = (encodedMove: string): OnitamaMove => {
  if(encodedMove.startsWith('pass ')) {
    return {
      type: 'pass',
      cardIdx: Number.parseInt(encodedMove.split(' ')[1], 10),
    };
  }

  const [cardIdx, srcIdx, dstIdx] = encodedMove
    .split(',')
    .map((value) => Number.parseInt(value, 10));

  return {
    type: 'play',
    cardIdx,
    srcIdx,
    dstIdx,
  };
};

const cloneCards = (cards: OnitamaCards): OnitamaCards => ({
  r: [...cards.r],
  b: [...cards.b],
  n: cards.n,
});

export class OnitamaState extends GameState<OnitamaMove, 'R' | 'B', OnitamaState> {
  board: OnitamaPiece[];
  team: boolean;
  cards: OnitamaCards;
  nmoves: number;

  constructor(
    board: OnitamaPiece[] = [],
    team: boolean | null = null,
    cards: OnitamaCards | null = null,
    nmoves = 0,
  ) {
    super();
    this.board = board.length ? [...board] : OnitamaState.initializeBoard();
    this.cards = cards ? cloneCards(cards) : OnitamaState.initializeCards('all');
    this.team = team !== null ? team : ONITAMA_DECK[this.cards.n].first === 'R';
    this.nmoves = nmoves;
  }

  getCurrentTeam(): 'R' | 'B' {
    return this.team ? 'R' : 'B';
  }

  getCurrentTeamCards(): number[] {
    return this.team ? this.cards.r : this.cards.b;
  }

  isCurrentTeamPiece(index: number): boolean {
    const piece = this.board[index];
    return Boolean(piece && piece.toUpperCase() === this.getCurrentTeam());
  }

  getDestinations(cardIdx: number, srcIdx: number): number[] {
    if(!this.isCurrentTeamPiece(srcIdx)) {
      return [];
    }

    const moves: number[] = [];
    const team = this.getCurrentTeam();
    const row = Math.floor(srcIdx / 5);
    const col = srcIdx % 5;

    for(const [moveRow, moveCol] of ONITAMA_DECK[cardIdx].moves) {
      const nextRow = this.team ? row + moveRow : row - moveRow;
      const nextCol = this.team ? col + moveCol : col - moveCol;
      if(nextRow < 0 || nextRow >= 5 || nextCol < 0 || nextCol >= 5) {
        continue;
      }

      const dstIdx = (nextRow * 5) + nextCol;
      const dstPiece = this.board[dstIdx];
      if(!dstPiece || dstPiece.toUpperCase() !== team) {
        moves.push(dstIdx);
      }
    }

    return moves;
  }

  getLegalActions(): OnitamaMove[] {
    const actions: OnitamaMove[] = [];

    for(const cardIdx of this.getCurrentTeamCards()) {
      for(let srcIdx = 0; srcIdx < 25; srcIdx += 1) {
        for(const dstIdx of this.getDestinations(cardIdx, srcIdx)) {
          actions.push({
            type: 'play',
            cardIdx,
            srcIdx,
            dstIdx,
          });
        }
      }
    }

    if(actions.length > 0) {
      return actions;
    }

    return this.getCurrentTeamCards().map((cardIdx) => ({
      type: 'pass',
      cardIdx,
    }));
  }

  getLegalMoves(): OnitamaMove[] {
    return this.getLegalActions();
  }

  makeTypedMove(move: OnitamaMove): OnitamaState {
    const teamKey = this.team ? 'r' : 'b';
    const nextCards = cloneCards(this.cards);
    nextCards.n = move.cardIdx;

    const playedCardIndex = nextCards[teamKey].indexOf(move.cardIdx);
    if(playedCardIndex === -1) {
      throw new Error(`Illegal Onitama card: ${move.cardIdx}`);
    }
    nextCards[teamKey][playedCardIndex] = this.cards.n;

    if(move.type === 'pass') {
      return new OnitamaState(this.board, !this.team, nextCards, this.nmoves + 1);
    }

    const nextBoard = [...this.board];
    nextBoard[move.dstIdx] = nextBoard[move.srcIdx];
    nextBoard[move.srcIdx] = null;

    return new OnitamaState(nextBoard, !this.team, nextCards, this.nmoves + 1);
  }

  makeMove(move: OnitamaMove): OnitamaState {
    return this.makeTypedMove(move);
  }

  isTerminal(): boolean {
    return this.isDraw() || this.getWinner() !== null;
  }

  getReward(): number {
    return this.isDraw() ? 0 : 1;
  }

  getWinner(): 'R' | 'B' | null {
    if(this.board[2] === 'R' || !this.board.includes('B')) {
      return 'R';
    }

    if(this.board[22] === 'B' || !this.board.includes('R')) {
      return 'B';
    }

    return null;
  }

  getWinningMethod(): WinningMethod | null {
    if(this.board[2] === 'R' || this.board[22] === 'B') {
      return 'stream';
    }

    if(!this.board.includes('R') || !this.board.includes('B')) {
      return 'stone';
    }

    return null;
  }

  toString(): string {
    let str = `${this.team ? 'R' : 'B'} :\n`;
    for(let row = 0; row < 5; row += 1) {
      for(let col = 0; col < 5; col += 1) {
        const index = (row * 5) + col;
        str += this.board[index] || '_';
      }

      if(row < 4) {
        str += '/';
      }
    }

    return str;
  }

  static initializeBoard(): OnitamaPiece[] {
    const board = Array<OnitamaPiece>(25).fill(null);

    for(let col = 0; col < 5; col += 1) {
      board[col] = col === 2 ? 'B' : 'b';
      board[20 + col] = col === 2 ? 'R' : 'r';
    }

    return board;
  }

  static initializeCards(which: 'base' | 'sensei' | 'all' = 'base'): OnitamaCards {
    let indexes = Array.from(Array(ONITAMA_DECK.length).keys());
    if(which === 'base') {
      indexes = indexes.slice(0, 16);
    } else if(which === 'sensei') {
      indexes = indexes.slice(16);
    }

    indexes.sort(() => Math.random() - 0.5);
    return {
      r: indexes.slice(0, 2),
      b: indexes.slice(2, 4),
      n: indexes[4],
    };
  }

  isDraw(): boolean {
    return this.nmoves >= 1000;
  }
}
