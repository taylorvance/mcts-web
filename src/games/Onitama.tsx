import { useState } from 'react';
import { Game } from '../types/Game';
import { GameState } from 'multimcts';
import { FaChessKing, FaChessPawn } from "react-icons/fa6";

// Type predicate to correctly match the GameState type
const isOnitamaState = (state: GameState): state is OnitamaState => {
  return state instanceof OnitamaState;
};

const render = (state: GameState, onMove: (move: string) => void) => {
  if (!isOnitamaState(state)) {
    throw new Error("Invalid state type");
  }

  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);

  const handleCardClick = (cardIdx:number) => {
    setSelectedCard(cardIdx);
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const handlePieceClick = (index:number) => {
    if (selectedCard !== null && state.board[index] && state.board[index]!.toUpperCase() === state.getCurrentTeam()) {
      setSelectedPiece(index);
      const cardMoves = OnitamaState._DECK[selectedCard].moves;
      const team = state.getCurrentTeam();
      const r = Math.floor(index / 5);
      const c = index % 5;
      const moves: number[] = [];

      for (const [mr, mc] of cardMoves) {
        const nr = state.team ? r + mr : r - mr;
        const nc = state.team ? c + mc : c - mc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
          const dstIdx = nr * 5 + nc;
          const dstPiece = state.board[dstIdx];
          if (!dstPiece || dstPiece.toUpperCase() !== team) {
            moves.push(dstIdx);
          }
        }
      }

      setValidMoves(moves);
    }
  };

  const handleMoveClick = (index:number) => {
    if (selectedCard !== null && selectedPiece !== null && validMoves.includes(index)) {
      onMove(`${selectedCard},${selectedPiece},${index}`);
      setSelectedCard(null);
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const renderCard = (cardIdx:number|null) => {
    let name='', color='', first='', moves:[number,number][]=[];
    if(cardIdx !== null) {
      const card = OnitamaState._DECK[cardIdx];
      name = card.name;
      color = card.color;
      first = card.first;
      moves = card.moves.filter((move: number[]) => move.length === 2) as [number, number][]; // Ensure moves have exactly two numbers
    }
    color = {'R':'bg-red-400', 'B':'bg-blue-400', '':'bg-yellow-400'}[color]!;
    return (
      <div
        key={name}
        className={`text-center text-xl p-1 bg-white rounded border ${cardIdx===null ? 'border-white' : 'border-gray-800 '+(first==='R'?'text-red-600':'text-blue-700')}`}
        onClick={() => cardIdx!==null && handleCardClick(cardIdx)}
      >
        {cardIdx!==null ? (
          <>
            <div>{name}</div>
            <div className="grid grid-cols-5 border-b border-r border-gray-500">
              {[-2, -1, 0, 1, 2].map((r) => {
                return [-2, -1, 0, 1, 2].map((c) => {
                  const move = moves.find(([mr, mc]) => mr===r && mc===c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`w-5 h-5 border-t border-l border-gray-500 ${move ? color : (r===0 && c===0 ? 'bg-gray-800' : 'bg-gray-100')}`}
                    ></div>
                  );
                });
              })}
            </div>
          </>
        ) : (
          <>
            <div></div>
            <div className="grid grid-cols-5 border-b border-r border-white">
              {[-2, -1, 0, 1, 2].map((r) => {
                return [-2, -1, 0, 1, 2].map((c) => {
                  return (
                    <div key={`${r}-${c}`} className="w-5 h-5 border-t border-l border-white"></div>
                  );
                });
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const cellClass = (index:number) => {
    const cell = state.board[index];

    const size = ('RB'.includes(cell || '') ? 'text-4xl' : 'text-3xl');

    let bg = 'bg-gray-200';
    if(index % 5 === 2) {
      if(index < 5) bg = 'bg-blue-200';
      else if(index >= 20) bg = 'bg-red-200';
    }

    const fg = (!cell ? '' : (cell.toUpperCase()==='R' ? 'text-red-600' : 'text-blue-700'));
    const highlight = validMoves.includes(index) ? 'bg-yellow-200' : '';
    const cursor = validMoves.includes(index) || (cell && cell.toUpperCase()===state.getCurrentTeam()) ? 'cursor-pointer' : 'cursor-default';

    return `w-12 h-12 border-gray-500 border-b-2 border-r-2 flex items-center justify-center ${size} ${bg} ${fg} ${highlight} ${cursor}`;
  };

  const renderPlayerCards = (team:'R'|'B') => {
    const isCurrentTeam = team === state.getCurrentTeam();
    const teamKey = team.toLowerCase() as 'r'|'b';
    return (
      <div className={`flex flex-row gap-2 ${team==='B'&&'rotate-180'}`}>
        {state.cards[teamKey].map((card:number) => (
          <div key={card} className={isCurrentTeam?'cursor-pointer':'cursor-default'}>
            {renderCard(card)}
          </div>
        ))}
        <div className="scale-90 ml-6 opacity-70 cursor-default">{renderCard(isCurrentTeam ? state.cards.n : null)}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4" style={{fontFamily:"Papyrus,Trattatello,Luminari,cursive"}}>
      {renderPlayerCards('B')}

      <div className="grid grid-cols-5 border-gray-500 border-t-2 border-l-2">
        {state.board.map((cell, index) => (
          <div
            key={index}
            className={cellClass(index)}
            onClick={() => (validMoves.includes(index) ? handleMoveClick(index) : handlePieceClick(index))}
          >{cell ? ('RB'.includes(cell) ? <FaChessKing /> : <FaChessPawn />) : ''}</div>
        ))}
      </div>

      {renderPlayerCards('R')}
    </div>
  );
};

class OnitamaState extends GameState {
  static _DECK = [
    // Base
    {"name":"Dragon",     "color":"",  "first":"R", "moves":[[-1,-2], [-1,2], [1,-1], [1,1]]},
    {"name":"Elephant",   "color":"",  "first":"R", "moves":[[-1,-1], [-1,1], [0,-1], [0,1]]},
    {"name":"Boar",       "color":"",  "first":"R", "moves":[[-1,0], [0,-1], [0,1]]},
    {"name":"Mantis",     "color":"",  "first":"R", "moves":[[-1,-1], [-1,1], [1,0]]},
    {"name":"Tiger",      "color":"",  "first":"B", "moves":[[-2,0], [1,0]]},
    {"name":"Monkey",     "color":"",  "first":"B", "moves":[[-1,-1], [-1,1], [1,-1], [1,1]]},
    {"name":"Crab",       "color":"",  "first":"B", "moves":[[-1,0], [0,-2], [0,2]]},
    {"name":"Crane",      "color":"",  "first":"B", "moves":[[-1,0], [1,-1], [1,1]]},
    {"name":"Rabbit",     "color":"R", "first":"B", "moves":[[-1,1], [0,2], [1,-1]]},
    {"name":"Rooster",    "color":"R", "first":"R", "moves":[[-1,1], [0,-1], [0,1], [1,-1]]},
    {"name":"Ox",         "color":"R", "first":"B", "moves":[[-1,0], [0,1], [1,0]]},
    {"name":"Cobra",      "color":"R", "first":"R", "moves":[[-1,1], [0,-1], [1,1]]},
    {"name":"Frog",       "color":"B", "first":"R", "moves":[[-1,-1], [0,-2], [1,1]]},
    {"name":"Goose",      "color":"B", "first":"B", "moves":[[-1,-1], [0,-1], [0,1], [1,1]]},
    {"name":"Horse",      "color":"B", "first":"R", "moves":[[-1,0], [0,-1], [1,0]]},
    {"name":"Eel",        "color":"B", "first":"B", "moves":[[-1,-1], [0,1], [1,-1]]},
    // Sensei's Path
    {"name":"Giraffe",    "color":"",  "first":"B", "moves":[[-1,-2], [-1,2], [1,0]]},
    {"name":"Kirin",      "color":"",  "first":"R", "moves":[[-2,-1], [-2,1], [2,0]]},
    {"name":"Phoenix",    "color":"",  "first":"B", "moves":[[-1,-1], [-1,1], [0,-2], [0,2]]},
    {"name":"Turtle",     "color":"",  "first":"R", "moves":[[0,-2], [0,2], [1,-1], [1,1]]},
    {"name":"Fox",        "color":"R", "first":"R", "moves":[[-1,1], [0,1], [1,1]]},
    {"name":"Panda",      "color":"R", "first":"R", "moves":[[-1,0], [-1,1], [1,-1]]},
    {"name":"Sea Snake",  "color":"R", "first":"B", "moves":[[-1,0], [0,2], [1,-1]]},
    {"name":"Mouse",      "color":"R", "first":"B", "moves":[[-1,0], [0,1], [1,-1]]},
    {"name":"Tanuki",     "color":"R", "first":"B", "moves":[[-1,0], [-1,2], [1,-1]]},
    {"name":"Sable",      "color":"R", "first":"B", "moves":[[-1,1], [0,-2], [1,-1]]},
    {"name":"Dog",        "color":"B", "first":"B", "moves":[[-1,-1], [0,-1], [1,-1]]},
    {"name":"Bear",       "color":"B", "first":"B", "moves":[[-1,-1], [-1,0], [1,1]]},
    {"name":"Viper",      "color":"B", "first":"R", "moves":[[-1,0], [0,-2], [1,1]]},
    {"name":"Rat",        "color":"B", "first":"R", "moves":[[-1,0], [0,-1], [1,1]]},
    {"name":"Iguana",     "color":"B", "first":"R", "moves":[[-1,-2], [-1,0], [1,1]]},
    {"name":"Otter",      "color":"B", "first":"R", "moves":[[-1,-1], [0,2], [1,1]]},
  ];

  board: (string | null)[];
  team: boolean;
  cards: { r: number[], b: number[], n: number };
  nmoves: number;

  constructor(board: (string | null)[] = [], team: boolean | null = null, cards: { r: number[], b: number[], n: number } | null = null, nmoves: number = 0) {
    super();
    this.board = board.length ? board : OnitamaState._initializeBoard();
    this.cards = cards || OnitamaState._initializeCards('all');
    this.team = team !== null ? team : OnitamaState._DECK[this.cards.n].first === 'R';
    this.nmoves = nmoves;
  }

  getCurrentTeam(): 'R' | 'B' { return this.team ? 'R' : 'B'; }

  getLegalMoves() {
    const moves: string[] = [];
    const playerCards = this.team ? this.cards.r : this.cards.b;
    const team = this.getCurrentTeam();
    for (const cardIdx of playerCards) {
      const cardMoves = OnitamaState._DECK[cardIdx].moves;
      for (let srcIdx = 0; srcIdx < 25; srcIdx++) {
        const piece = this.board[srcIdx];
        if (piece && piece.toUpperCase() === team) {
          const r = Math.floor(srcIdx / 5);
          const c = srcIdx % 5;
          for (const [mr, mc] of cardMoves) {
            const nr = this.team ? r + mr : r - mr;
            const nc = this.team ? c + mc : c - mc;
            if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
              const dstIdx = nr * 5 + nc;
              const dstPiece = this.board[dstIdx];
              if (!dstPiece || dstPiece.toUpperCase() !== team) {
                moves.push(`${cardIdx},${srcIdx},${dstIdx}`);
              }
            }
          }
        }
      }
    }
    if (moves.length === 0) {
      for (const cardIdx of playerCards) {
        moves.push(`pass ${cardIdx}`);
      }
    }
    return moves;
  }

  makeMove(move: string): GameState {
    const teamKey = this.team ? 'r' : 'b';
    if (move.startsWith('pass')) {
      const cardIdx = parseInt(move.split(' ')[1]);
      const newCards = {
        r: [...this.cards.r],
        b: [...this.cards.b],
        n: cardIdx,
      };
      const playedIdx = this.cards[teamKey].indexOf(cardIdx);
      newCards[teamKey][playedIdx] = this.cards.n;
      return new OnitamaState([...this.board], !this.team, newCards, this.nmoves + 1);
    }
    const [cardIdx, srcIdx, dstIdx] = move.split(',').map(x => parseInt(x));
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

  isTerminal() { return this._isDraw() || this._hasWinner(); }

  getReward():number { return this._isDraw() ? 0 : 1; }

  toString() {
    let str = (this.team ? 'R' : 'B') + ' :\n';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const index = r * 5 + c;
        str += this.board[index] || '_';
      }
      if (r < 4) str += '/';
    }
    return str;
  }

  static _initializeBoard() {
    const board = Array(25).fill(null);
    for (let c = 0; 5 > c; c++) {
      board[c] = c === 2 ? 'B' : 'b';
      board[20 + c] = c === 2 ? 'R' : 'r';
    }
    return board;
  }

  static _initializeCards(which = 'base') {
    let idxs = Array.from(Array(OnitamaState._DECK.length).keys());
    if (which === 'base') idxs = idxs.slice(0, 16);
    else if (which === 'sensei') idxs = idxs.slice(16);
    idxs.sort(() => Math.random() - 0.5);
    return {
      r: idxs.slice(0, 2),
      b: idxs.slice(2, 4),
      n: idxs[4],
    };
  }

  _hasWinner() {
    return this.board[2] === 'R' || this.board[22] === 'B' || !this.board.includes('R') || !this.board.includes('B');
  }

  _isDraw() { return this.nmoves >= 1000; }
}

const Onitama: Game = {
  name: "Onitama",
  createInitialState: (): GameState => new OnitamaState(),
  render,
};

export default Onitama;
