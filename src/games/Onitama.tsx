// src/games/Onitama.tsx
import React, { useState } from 'react';
import { Game } from '../types/Game';
import { GameState } from 'multimcts';
import { FaChessKing, FaChessPawn } from "react-icons/fa6";

const render = (state:GameState, onMove:(move:string) => void) => {
  if((state as OnitamaState).board === undefined) { // Type guard to check if state is OnitamaState.
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
    if(selectedCard !== null && state.board[index] && state.board[index].toUpperCase() === state.getCurrentTeam()) {
      setSelectedPiece(index);
      const cardMoves = OnitamaState._DECK[selectedCard].moves;
      const team = state.getCurrentTeam();
      const r = Math.floor(index / 5);
      const c = index % 5;
      const moves = [];

      for(const [mr, mc] of cardMoves) {
        const nr = state.team ? r + mr : r - mr;
        const nc = state.team ? c + mc : c - mc;
        if(nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
          const dstIdx = nr * 5 + nc;
          const dstPiece = state.board[dstIdx];
          if(!dstPiece || dstPiece.toUpperCase() !== team) {
            moves.push(dstIdx);
          }
        }
      }

      setValidMoves(moves);
    }
  };

  const handleMoveClick = (index:number) => {
    if(selectedCard !== null && selectedPiece !== null && validMoves.includes(index)) {
      onMove(`${selectedCard},${selectedPiece},${index}`);
      setSelectedCard(null);
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const renderCard = (cardIdx:number) => {
    let [name, color, first, moves] = ['', '', '', []];
    if(cardIdx !== null) {
      ({ name, color, first, moves } = OnitamaState._DECK[cardIdx]);
    }
    color = { 'R': 'bg-red-400', 'B': 'bg-blue-400', '': 'bg-yellow-400' }[color];
    return (
      <div
        key={name}
        className={`inline-block mx-1 p-1 border ${cardIdx !== null ? 'border-gray-800' : 'border-white'}`}
        onClick={() => handleCardClick(cardIdx)}
      >
        {cardIdx !== null ? (
          <>
            <div className="flex flex-row items-center justify-between">
              <i className="text-lg">{name}</i>
              {first === 'R' ? '🔴' : '🔵'}
            </div>
            <div className="grid grid-cols-5 border-b border-r border-gray-500">
              {[-2, -1, 0, 1, 2].map((r) => {
                return [-2, -1, 0, 1, 2].map((c) => {
                  const move = moves.find(([mr, mc]) => mr === r && mc === c);
                  return (
                    <div
                      key={`${r},${c}`}
                      className={`w-6 h-6 border-t border-l border-gray-500 ${move ? color : (r === 0 && c === 0 ? 'bg-gray-800' : 'bg-gray-100')}`}
                    ></div>
                  );
                });
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-row items-center">
              <i className="text-lg">&nbsp;</i>
            </div>
            <div className="grid grid-cols-5 border-b border-r border-white">
              {[-2, -1, 0, 1, 2].map((r) => {
                return [-2, -1, 0, 1, 2].map((c) => {
                  return (
                    <div key={`${r},${c}`} className="w-6 h-6 border-t border-l border-white"></div>
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

    const size = ('RB'.includes(cell) ? 'text-3xl' : 'text-2xl');

    let bg = 'bg-gray-200';
    if(index % 5 === 2) {
      if(index < 5) bg = 'bg-blue-200';
      else if(index >= 20) bg = 'bg-red-200';
    }

    const fg = (!cell ? '' : (cell.toUpperCase() === 'R' ? 'text-red-600' : 'text-blue-700'));
    const highlight = validMoves.includes(index) ? 'bg-yellow-200' : '';

    return `w-12 h-12 border-2 border-gray-500 flex items-center justify-center ${size} ${bg} ${fg} ${highlight}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rotate-180">{state.cards.b.map(card => renderCard(card))}</div>

      <div className="flex flex-row items-center gap-2">
        <div className="self-start rotate-180">{renderCard((state.getCurrentTeam() === 'B' ? state.cards.n : null))}</div>

        <div className="grid grid-cols-5 gap-1">
          {state.board.map((cell, index) => (
            <div
              key={index}
              className={cellClass(index)}
              onClick={() => (validMoves.includes(index) ? handleMoveClick(index) : handlePieceClick(index))}
            >
              {!cell ? '' : ('RB'.includes(cell) ? <FaChessKing /> : <FaChessPawn />)}
            </div>
          ))}
        </div>

        <div className="self-end">{renderCard((state.getCurrentTeam() === 'R' ? state.cards.n : null))}</div>
      </div>

      <div>{state.cards.r.map(card => renderCard(card))}</div>
    </div>
  );
};

const Onitama: Game = {
  name: "Onitama",
  createInitialState: () => new OnitamaState(),
  render: render,
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

  constructor(board=null, team=null, cards=null, nmoves=0) {
    super();
    this.board = board || OnitamaState._initializeBoard();
    this.cards = cards || OnitamaState._initializeCards('all');
    this.team = team ?? OnitamaState._DECK[this.cards.n].first==='R'; // true for Red, false for Blue
    this.nmoves = nmoves;
  }

  getCurrentTeam() { return this.team ? 'R' : 'B'; }

  getLegalMoves() {
    const moves = [];
    const playerCards = this.team ? this.cards.r : this.cards.b;
    const team = this.getCurrentTeam();
    for(const cardIdx of playerCards) {
      const cardMoves = OnitamaState._DECK[cardIdx].moves;
      for(let srcIdx = 0; srcIdx < 25; srcIdx++) {
        const piece = this.board[srcIdx];
        if(piece && piece.toUpperCase()===team) {
          const r = Math.floor(srcIdx / 5);
          const c = srcIdx % 5;
          for(const [mr, mc] of cardMoves) {
            // Rotate the move direction if it's Blue's turn.
            const nr = this.team ? r + mr : r - mr;
            const nc = this.team ? c + mc : c - mc;
            if(nr >= 0 && nr < 5 && nc >= 0 && nc < 5) { // Destination is within bounds.
              const dstIdx = nr * 5 + nc;
              const dstPiece = this.board[dstIdx];
              if(!dstPiece || dstPiece.toUpperCase()!==team) { // Destination is empty or has an opponent's piece.
                moves.push(`${cardIdx},${srcIdx},${dstIdx}`);
              }
            }
          }
        }
      }
    }
    if(moves.length === 0) {
      // If there are no legal moves, you must pass one of your cards anyway.
      for(const cardIdx of playerCards) {
        moves.push(`pass ${cardIdx}`);
      }
    }
    return moves;
  }

  makeMove(move) {
    const teamKey = this.team ? 'r' : 'b';
    if(move.startsWith('pass')) {
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
    const [cardIdx, srcIdx, dstIdx] = move.split(',').map(x=>parseInt(x));
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
  getReward(team) { return this._isDraw() ? 0 : 1; }

  toString() {
    let str = (this.team ? 'R' : 'B') + ' :\n';
    for(let r = 0; r < 5; r++) {
      for(let c = 0; c < 5; c++) {
        const index = r * 5 + c;
        str += this.board[index] || '_';
      }
      if(r < 4) str += '/';
    }
    //str += ` R:${this.cards.r.map(idx => OnitamaState._DECK[idx].name).join(',')}; `;
    //str += `B: ${this.cards.b.map(idx => OnitamaState._DECK[idx].name).join(',')}; `;
    //str += OnitamaState._DECK[this.cards.n].name;
    return str;
  }

  static _initializeBoard() {
    const board = Array(25).fill(null);
    for(let c = 0; c < 5; c++) {
      board[c] = c===2 ? 'B' : 'b';
      board[20+c] = c===2 ? 'R' : 'r';
    }
    return board;
  }
  static _initializeCards(which='base') {
    let idxs = [...OnitamaState._DECK.keys()];
    if(which==='base') idxs = idxs.slice(0,16);
    else if(which==='sensei') idxs = idxs.slice(16);
    idxs.sort(() => Math.random() - 0.5);
    return {
      r: idxs.slice(0,2),
      b: idxs.slice(2,4),
      n: idxs[4],
    };
  }
  _hasWinner() { return this.board[2]==='R' || this.board[22]==='B' || !this.board.includes('R') || !this.board.includes('B'); }
  _isDraw() { return this.nmoves >= 1000; } // Setting an arbitrary move limit because there could be a no-win scenario in which both teams just dance around forever.
}

export default Onitama;
