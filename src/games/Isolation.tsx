// src/games/Isolation.tsx
import { Game } from '../types/Game';
import { GameState } from 'multimcts';
import React, { useState, useCallback } from 'react';

// Game board dimensions
const ROWS = 6;
const COLS = 8;
const TOTAL_CELLS = ROWS * COLS;

// Cell state enumeration
enum CellState {
  Punched = 0,
  Intact = 1,
}

// Type guard to ensure we're working with IsolationState
const isIsolationState = (state: GameState): state is IsolationState => {
  return state instanceof IsolationState;
};

// Render function - this uses a functional component for proper state management
const Renderer: React.FC<{state: GameState, onMove: (move: string) => void}> = ({ state, onMove }) => {
  if (!isIsolationState(state)) throw new Error("Invalid state type");
  
  const isolationState = state as IsolationState;
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const legalMoves = isolationState.getLegalMoves();
  
  // Extract possible destinations from legal moves
  const possibleDestinations = React.useMemo(() => {
    const destinations = new Set<number>();
    if (selectedMove === null) {
      legalMoves.forEach(move => {
        destinations.add(parseInt(move.split(",")[0]));
      });
    }
    return destinations;
  }, [legalMoves, selectedMove]);

  // Extract possible punches based on selected move
  const possiblePunches = React.useMemo(() => {
    const punches = new Set<number>();
    if (selectedMove !== null) {
      legalMoves
        .filter(move => move.startsWith(`${selectedMove},`))
        .forEach(move => {
          punches.add(parseInt(move.split(",")[1]));
        });
    }
    return punches;
  }, [legalMoves, selectedMove]);

  // Handle cell click
  const handleCellClick = useCallback((index: number) => {
    if (selectedMove === null) {
      // First click: select destination
      if (possibleDestinations.has(index)) {
        setSelectedMove(index);
      }
    } else {
      // Second click: select punch or cancel
      if (possiblePunches.has(index)) {
        onMove(`${selectedMove},${index}`);
        setSelectedMove(null);
      } else {
        // Cancel selection if clicking elsewhere
        setSelectedMove(null);
      }
    }
  }, [selectedMove, possibleDestinations, possiblePunches, onMove]);

  // Calculate the active player's position
  const activePlayerPos = isolationState.team ? isolationState.bluePos : isolationState.redPos;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status display */}
      <div className="text-xl font-bold mb-2">
        Player {isolationState.getCurrentTeam()} Turn
        {selectedMove !== null && 
          <span className="ml-2 text-yellow-600">Select a tile to punch</span>
        }
      </div>
      
      {/* Game board */}
      <div 
        className="grid gap-1 border-2 border-gray-300 p-2 bg-gray-100 rounded-lg"
        style={{gridTemplateColumns:`repeat(${COLS}, minmax(0, 1fr))`}}
      >
        {Array.from(isolationState.board).map((cell, i) => {
          // Determine cell styling
          let cellClass = 'w-10 h-10 flex items-center justify-center rounded-sm transition-all';
          
          // Cell state styles
          if (i === isolationState.redPos) {
            cellClass += ' bg-red-500 text-white';
          } else if (i === isolationState.bluePos) {
            cellClass += ' bg-blue-500 text-white';
          } else if (cell === CellState.Intact) {
            cellClass += ' bg-white shadow-inner border border-gray-300';
          } else {
            cellClass += ' bg-gray-800'; // Punched hole
          }
          
          // Interaction styles
          if (selectedMove === null && possibleDestinations.has(i)) {
            cellClass += ' cursor-pointer ring-2 ring-green-500 ring-opacity-75 hover:ring-opacity-100';
          } else if (selectedMove !== null && possiblePunches.has(i)) {
            cellClass += ' cursor-pointer ring-2 ring-yellow-500 ring-opacity-75 hover:ring-opacity-100';
          }
          
          // Mark the active player
          const isActivePlayer = i === activePlayerPos;

          // Create grid coordinates for better visualization
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          
          return (
            <div 
              key={i} 
              className={cellClass}
              onClick={() => handleCellClick(i)}
              title={`Cell ${row},${col}`}
            >
              {isActivePlayer && <div className="w-3 h-3 bg-white rounded-full"></div>}
            </div>
          );
        })}
      </div>
      
      {/* Game legend */}
      <div className="flex gap-4 mt-2 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 mr-1"></div>
          <span>Blue Player</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 mr-1"></div>
          <span>Red Player</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-800 mr-1"></div>
          <span>Punched Tile</span>
        </div>
      </div>
    </div>
  );
};

// Game state implementation
class IsolationState extends GameState {
  board: Uint8Array; // 1 = Intact, 0 = Punched
  team: boolean; // true = blue's turn, false = red's turn
  redPos: number;
  bluePos: number;

  constructor(board?: Uint8Array, redPos?: number, bluePos?: number, team?: boolean) {
    super();
    this.board = board ?? new Uint8Array(TOTAL_CELLS).fill(CellState.Intact);
    this.redPos = redPos ?? (TOTAL_CELLS - COLS - 1); // Bottom-left corner
    this.bluePos = bluePos ?? 0; // Top-left corner
    this.team = team ?? true; // Blue starts
    
    // Mark player positions as intact (they're not punched)
    if (!board) {
      this.board[this.redPos] = CellState.Intact;
      this.board[this.bluePos] = CellState.Intact;
    }
  }

  // Get current player's team identifier
  getCurrentTeam(): string {
    return this.team ? 'Blue' : 'Red';
  }

  // Generate all legal moves for the current player
  getLegalMoves(): string[] {
    const pos = this.team ? this.bluePos : this.redPos;
    const directions = [
      -1, 1,            // Left, Right
      -COLS, COLS,      // Up, Down
      -COLS-1, -COLS+1, // Diagonal Up-Left, Up-Right
      COLS-1, COLS+1    // Diagonal Down-Left, Down-Right
    ];
    const movePunchCombos: string[] = [];

    // Check moves in each direction
    for (const d of directions) {
      let i = pos;
      
      // Calculate current position coordinates
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      
      // Calculate next position
      const newPos = i + d;
      const nr = Math.floor(newPos / COLS);
      const nc = newPos % COLS;
      
      // Check if move is valid:
      // 1. Not off the board
      // 2. Only moving one square in any direction
      // 3. Target square is intact and unoccupied
      if (
        nr >= 0 && nr < ROWS && 
        nc >= 0 && nc < COLS && 
        Math.abs(nr - r) <= 1 && 
        Math.abs(nc - c) <= 1 &&
        this.board[newPos] === CellState.Intact && 
        newPos !== this.redPos && 
        newPos !== this.bluePos
      ) {
        // For each valid move, find all valid punches
        const occupied = new Set([newPos, this.team ? this.redPos : this.bluePos]);
        for (let j = 0; j < TOTAL_CELLS; j++) {
          if (
            this.board[j] === CellState.Intact && 
            !occupied.has(j) && 
            j !== this.redPos && 
            j !== this.bluePos
          ) {
            movePunchCombos.push(`${newPos},${j}`);
          }
        }
      }
    }

    return movePunchCombos;
  }

  // Execute a move and return the new game state
  makeMove(move: string): IsolationState {
    const [moveToStr, punchStr] = move.split(",");
    const moveTo = parseInt(moveToStr);
    const punch = parseInt(punchStr);
    
    // Create a copy of the current board
    const newBoard = new Uint8Array(this.board);
    
    // Punch the selected tile
    newBoard[punch] = CellState.Punched;
    
    // Update player positions based on current turn
    const newRedPos = this.team ? this.redPos : moveTo;
    const newBluePos = this.team ? moveTo : this.bluePos;
    
    // Return new state with updated board and switched player turn
    return new IsolationState(
      newBoard,
      newRedPos,
      newBluePos,
      !this.team  // Switch turns
    );
  }

  // Check if the game has reached a terminal state (current player has no moves)
  isTerminal(): boolean {
    return this.getLegalMoves().length === 0;
  }

  getReward(): number {
    return -1; // if the player has no moves, they lose
  }

  // String representation of the game state for debugging
  toString(): string {
    return `${this.getCurrentTeam()} R:${this.redPos} B:${this.bluePos} Board:${Array.from(this.board).join('')}`;
  }
}

// Wrap the Renderer component with a function that matches the Game interface
const render = (state: GameState, onMove: (move: string) => void): React.ReactNode => {
  return <Renderer state={state} onMove={onMove} />;
};

// Export the Game object
const Isolation: Game = {
  name: "Isolation",
  createInitialState: (): GameState => new IsolationState(),
  render
};

export default Isolation;
