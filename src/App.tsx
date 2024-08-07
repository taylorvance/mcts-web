import React, { useState, useCallback, useEffect } from 'react';
import { GameState } from 'multimcts';
import MCTSSettings from './components/MCTSSettings';
import GameBoard from './components/GameBoard';
import TreeViewer from './components/TreeViewer';
import TicTacToe from './games/TicTacToe';
import { Game } from './types/Game';
import { useMCTS } from './hooks/useMCTS';
import { FaX, FaBackwardStep, FaForwardStep, FaForwardFast, FaStop } from "react-icons/fa6";

const games: Record<string, Game> = {
  TicTacToe: TicTacToe,
  // Add more games here
};

const App: React.FC = () => {
  const [mctsSettings, setMctsSettings] = useState({
    explorationBias: 1.414,
    maxIterations: 1000,
    maxTime: 1,
  });
  const [selectedGame, setSelectedGame] = useState<string>('TicTacToe');
  const [gameState, setGameState] = useState<GameState>(games[selectedGame].createInitialState());
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [isAutoplaying, setIsAutoplaying] = useState<boolean>(false);

  const { mcts, runSearch, resetMCTS } = useMCTS(mctsSettings);

  const canUndo = useCallback(() => gameHistory.length>0, [gameHistory]);
  const isTerminal = useCallback(() => gameState.isTerminal(), [gameState]);

  const handleMove = useCallback((move: string) => {
    setGameState((prevState) => {
      const newState = prevState.makeMove(move);
      setGameHistory((prevHistory) => [...prevHistory, prevState]);
      if(!newState.isTerminal()) {
        //.make this a disablable option
        const aiMove = runSearch(newState);
        return newState.makeMove(aiMove);
      }
      return newState;
    });
  }, [runSearch]);

  const makeMove = useCallback(() => {
    setGameState((prevState) => {
      const aiMove = runSearch(prevState);
      const newState = prevState.makeMove(aiMove);
      setGameHistory((prevHistory) => [...prevHistory, prevState]);
      return newState;
    });
  }, [runSearch]);

  const startAutoPlay = useCallback(() => { setIsAutoplaying(true); }, []);
  const stopAutoPlay = useCallback(() => { setIsAutoplaying(false); }, []);

  useEffect(() => {
    if(isAutoplaying && !isTerminal()) {
      const aiMove = runSearch(gameState);
      const newState = gameState.makeMove(aiMove);
      setGameHistory((prevHistory) => [...prevHistory, gameState]);
      setGameState(newState);
    } else {
      setIsAutoplaying(false);
    }
  }, [gameState, isAutoplaying, isTerminal, runSearch]);

  const resetGame = useCallback(() => {
    setGameState(games[selectedGame].createInitialState());
    setGameHistory([]);
    resetMCTS();
  }, [selectedGame, resetMCTS]);

  const undoMove = useCallback(() => {
    setGameHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const lastState = prevHistory[prevHistory.length - 1];
      setGameState(lastState);
      return prevHistory.slice(0, -1);
    });
    resetMCTS();
  }, [resetMCTS]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap gap-16">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Game Interface</h1>
          <select
            value={selectedGame}
            onChange={(e) => {
              setSelectedGame(e.target.value);
              setGameState(games[e.target.value].createInitialState());
              setGameHistory([]);
            }}
            className="p-2 border rounded"
          >{Object.keys(games).map((game) => (
            <option key={game} value={game}>
              {games[game].name}
            </option>
          ))}</select>

          <div className="flex gap-2 text-xl">
            <button
              className="bg-gray-200 p-2 rounded"
              onClick={resetGame}
            ><FaX /></button>
            <button
              className={`bg-gray-200 p-2 rounded ${!canUndo() ? 'cursor-not-allowed text-white' : ''}`}
              onClick={undoMove}
              disabled={!canUndo()}
            ><FaBackwardStep /></button>
            <button
              className={`bg-gray-200 p-2 rounded ${isTerminal() ? 'cursor-not-allowed text-white' : ''}`}
              onClick={makeMove}
              disabled={isTerminal()}
            ><FaForwardStep /></button>
            {!isAutoplaying ? (
              <button
                className={`bg-gray-200 p-2 rounded ${isTerminal() ? 'cursor-not-allowed text-white' : ''}`}
                onClick={startAutoPlay}
                disabled={isTerminal()}
              ><FaForwardFast /></button>
            ) : (
              <button
                className="bg-gray-200 p-2 rounded"
                onClick={stopAutoPlay}
              ><FaStop /></button>
            )}
          </div>

          <div className="border-2 p-2 rounded">
            <GameBoard
              renderBoard={games[selectedGame].renderBoard}
              gameState={gameState}
              onMove={handleMove}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">MCTS Settings</h1>
          <MCTSSettings settings={mctsSettings} setSettings={setMctsSettings} />
          <TreeViewer mcts={mcts} />
        </div>
      </div>
    </div>
  );
};

export default App;
