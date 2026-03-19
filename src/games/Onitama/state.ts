import { GameState } from 'multimcts';

export interface OnitamaCard {
  name: string;
  color: '' | 'R' | 'B';
  first: 'R' | 'B';
  moves: [number, number][];
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
export type OnitamaWinningMethod = 'stone' | 'stream';

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
      cardIdx: parseInt(encodedMove.split(' ')[1], 10),
    };
  }

  const [cardIdx, srcIdx, dstIdx] = encodedMove.split(',').map((value) => parseInt(value, 10));
  return {
    type: 'play',
    cardIdx,
    srcIdx,
    dstIdx,
  };
};

export class OnitamaState extends GameState {
  static _DECK: OnitamaCard[] = [
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

  board: (string | null)[];
  team: boolean;
  cards: OnitamaCards;
  nmoves: number;

  constructor(
    board: (string | null)[] = [],
    team: boolean | null = null,
    cards: OnitamaCards | null = null,
    nmoves = 0,
  ) {
    super();
    this.board = board.length ? board : OnitamaState.initializeBoard();
    this.cards = cards || OnitamaState.initializeCards('all');
    this.team = team !== null ? team : OnitamaState._DECK[this.cards.n].first === 'R';
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

    for(const [moveRow, moveCol] of OnitamaState._DECK[cardIdx].moves) {
      const nextRow = this.team ? row + moveRow : row - moveRow;
      const nextCol = this.team ? col + moveCol : col - moveCol;
      if(nextRow < 0 || nextRow >= 5 || nextCol < 0 || nextCol >= 5) {
        continue;
      }

      const dstIdx = nextRow * 5 + nextCol;
      const dstPiece = this.board[dstIdx];
      if(!dstPiece || dstPiece.toUpperCase() !== team) {
        moves.push(dstIdx);
      }
    }

    return moves;
  }

  getLegalActions(): OnitamaMove[] {
    return this.getLegalMoves().map(decodeOnitamaMove);
  }

  getLegalMoves() {
    const moves: string[] = [];
    const playerCards = this.team ? this.cards.r : this.cards.b;
    const team = this.getCurrentTeam();

    for(const cardIdx of playerCards) {
      const cardMoves = OnitamaState._DECK[cardIdx].moves;
      for(let srcIdx = 0; srcIdx < 25; srcIdx++) {
        const piece = this.board[srcIdx];
        if(piece && piece.toUpperCase() === team) {
          const row = Math.floor(srcIdx / 5);
          const col = srcIdx % 5;
          for(const [moveRow, moveCol] of cardMoves) {
            const nextRow = this.team ? row + moveRow : row - moveRow;
            const nextCol = this.team ? col + moveCol : col - moveCol;
            if(nextRow >= 0 && nextRow < 5 && nextCol >= 0 && nextCol < 5) {
              const dstIdx = nextRow * 5 + nextCol;
              const dstPiece = this.board[dstIdx];
              if(!dstPiece || dstPiece.toUpperCase() !== team) {
                moves.push(`${cardIdx},${srcIdx},${dstIdx}`);
              }
            }
          }
        }
      }
    }

    if(moves.length === 0) {
      for(const cardIdx of playerCards) {
        moves.push(`pass ${cardIdx}`);
      }
    }

    return moves;
  }

  makeTypedMove(move: OnitamaMove): OnitamaState {
    return this.makeMove(encodeOnitamaMove(move));
  }

  makeMove(move: string): OnitamaState {
    const teamKey = this.team ? 'r' : 'b';
    if(move.startsWith('pass ')) {
      const cardIdx = parseInt(move.split(' ')[1], 10);
      const newCards = {
        r: [...this.cards.r],
        b: [...this.cards.b],
        n: cardIdx,
      };
      const playedIdx = this.cards[teamKey].indexOf(cardIdx);
      newCards[teamKey][playedIdx] = this.cards.n;
      return new OnitamaState(this.board, !this.team, newCards, this.nmoves + 1);
    }

    const [cardIdx, srcIdx, dstIdx] = move.split(',').map((value) => parseInt(value, 10));
    const newBoard = [...this.board];
    newBoard[dstIdx] = newBoard[srcIdx];
    newBoard[srcIdx] = null;
    const newCards = {
      r: [...this.cards.r],
      b: [...this.cards.b],
      n: cardIdx,
    };
    const playedIdx = this.cards[teamKey].indexOf(cardIdx);
    newCards[teamKey][playedIdx] = this.cards.n;
    return new OnitamaState(newBoard, !this.team, newCards, this.nmoves + 1);
  }

  getWinner(): 'R' | 'B' | null {
    if(this.board[2] === 'R') {
      return 'R';
    }

    if(this.board[22] === 'B') {
      return 'B';
    }

    if(!this.board.includes('R')) {
      return 'B';
    }

    if(!this.board.includes('B')) {
      return 'R';
    }

    return null;
  }

  getWinningMethod(): OnitamaWinningMethod | null {
    if(this.board[2] === 'R' || this.board[22] === 'B') {
      return 'stream';
    }

    if(!this.board.includes('R') || !this.board.includes('B')) {
      return 'stone';
    }

    return null;
  }

  isTerminal() {
    return this.isDraw() || this.hasWinner();
  }

  getReward(): number {
    return this.isDraw() ? 0 : 1;
  }

  toString() {
    let str = `${this.team ? 'R' : 'B'} :\n`;
    for(let row = 0; row < 5; row++) {
      for(let col = 0; col < 5; col++) {
        const index = row * 5 + col;
        str += this.board[index] || '_';
      }
      if(row < 4) {
        str += '/';
      }
    }
    return str;
  }

  static initializeBoard() {
    const board = Array(25).fill(null);
    for(let col = 0; col < 5; col++) {
      board[col] = col === 2 ? 'B' : 'b';
      board[20 + col] = col === 2 ? 'R' : 'r';
    }
    return board;
  }

  static initializeCards(which: 'all' | 'base' | 'sensei' = 'base') {
    let idxs = Array.from(Array(OnitamaState._DECK.length).keys());
    if(which === 'base') {
      idxs = idxs.slice(0, 16);
    } else if(which === 'sensei') {
      idxs = idxs.slice(16);
    }
    idxs.sort(() => Math.random() - 0.5);
    return {
      r: idxs.slice(0, 2),
      b: idxs.slice(2, 4),
      n: idxs[4],
    };
  }

  private hasWinner() {
    return this.getWinner() !== null;
  }

  private isDraw() {
    return this.nmoves >= 1000;
  }
}

export const ONITAMA_DECK = OnitamaState._DECK;
