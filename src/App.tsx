// src/App.tsx
import React, { useState, useCallback } from 'react';
import { GameState } from 'multimcts';
import MCTSSettings from './components/MCTSSettings';
import GameBoard from './components/GameBoard';
import TreeViewer from './components/TreeViewer';
import TicTacToe from './games/TicTacToe';
import { Game } from './types/Game';
import { useMCTS } from './hooks/useMCTS';

const games: Record<string, Game> = {
  TicTacToe: TicTacToe,
  // Add more games here
};

const App: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('TicTacToe');
  const [mctsSettings, setMctsSettings] = useState({
    explorationBias: 1.414,
    maxIterations: 1000,
    maxTime: 1,
  });
  const [gameState, setGameState] = useState<GameState>(games[selectedGame].createInitialState());

  const { runSearch, mcts } = useMCTS(mctsSettings);

  const handleMove = useCallback((move: string) => {
    setGameState((prevState) => {
      const newState = prevState.makeMove(move);
      if (!newState.isTerminal()) {
        const aiMove = runSearch(newState);
        return newState.makeMove(aiMove);
      }
      return newState;
    });
  }, [runSearch]);

  const handleReset = useCallback(() => {
    setGameState(games[selectedGame].createInitialState());
  }, [selectedGame]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap gap-16 justify-center">
        <div className="col-span-2">
          <h1 className="text-2xl font-bold mb-4">Game Interface</h1>
          <select
            value={selectedGame}
            onChange={(e) => {
              setSelectedGame(e.target.value);
              setGameState(games[e.target.value].createInitialState());
            }}
            className="mb-4 p-2 border rounded"
          >
            {Object.keys(games).map((game) => (
              <option key={game} value={game}>
                {games[game].name}
              </option>
            ))}
          </select>
          <button className="p-2 bg-blue-500 text-white rounded" onClick={handleReset}>Reset</button>
          <div>
            <GameBoard
              renderBoard={games[selectedGame].renderBoard}
              gameState={gameState}
              onMove={handleMove}
            />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">MCTS Settings</h1>
          <MCTSSettings settings={mctsSettings} setSettings={setMctsSettings} />

          <h2 className="text-xl font-semibold mb-2">Tree Viewer</h2>
          <TreeViewer mcts={mcts} />
        </div>
      </div>
    </div>
  );
};

export default App;
