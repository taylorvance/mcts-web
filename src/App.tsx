// src/App.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { GameState } from 'multimcts';
import MCTSSettings from './components/MCTSSettings';
import GameBoard from './components/GameBoard';
import TreeViewer from './components/TreeViewer';
import Button from './components/Button';
import ButtonGroup from './components/ButtonGroup';
import { Game } from './types/Game';
import { useMCTS } from './hooks/useMCTS';
import { useHotkeys } from './hooks/useHotkeys';
import { HOTKEYS } from './config/hotkeys';
import { FaUndo, FaRedo } from "react-icons/fa";
import { FaForwardStep, FaForwardFast, FaStop } from "react-icons/fa6";
import { HiRefresh } from "react-icons/hi";
import TicTacToe from './games/TicTacToe';
import Onitama from './games/Onitama';

const games: Record<string, Game> = {
  TicTacToe: TicTacToe,
  Onitama: Onitama,
};

const App: React.FC = () => {
  const [mctsSettings, setMctsSettings] = useState({
    explorationBias: 1.414,
    maxIterations: 1000,
    maxTime: 1,
  });
  const [selectedGame, setSelectedGame] = useState<string>('Onitama');
  const [gameState, setGameState] = useState<GameState|null>(null);
  const [history, setHistory] = useState<GameState[]>([games[selectedGame].createInitialState()]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);
  const [isAutoplaying, setIsAutoplaying] = useState<boolean>(false);
  const [doAIMoveAfterPlayer, setDoAIMoveAfterPlayer] = useState<boolean>(true);

  const { mcts, runSearch, resetMCTS } = useMCTS(mctsSettings);

  const isTerminal = useCallback(() => gameState && gameState.isTerminal(), [gameState]);
  const canPlay = useCallback(() => gameState!==null && !isAutoplaying && !isTerminal(), [gameState, isAutoplaying, isTerminal]);
  const canUndo = useCallback(() => historyIdx > 0, [historyIdx]);
  const canRedo = useCallback(() => historyIdx < history.length-1, [historyIdx, history]);

  const performMove = useCallback(async (move:string|null=null): Promise<GameState> => {
    return new Promise((resolve) => {
      setGameState((prevState) => {
        if(!prevState || prevState.isTerminal()) return prevState;
        move = move ?? runSearch(prevState);
        const newState = prevState.makeMove(move);
        const newHistory = [...history.slice(0, historyIdx+1), newState];
        setHistory(newHistory);
        setHistoryIdx(newHistory.length-1);
        resolve(newState);
        return newState;
      });
    });
  }, [isTerminal, runSearch, historyIdx]);

  const handlePlayerMove = useCallback((move:string) => {
    performMove(move).then((newState) => {
      if(doAIMoveAfterPlayer && !newState.isTerminal()) {
        performMove();
      }
    });
  }, [performMove, doAIMoveAfterPlayer]);

  const doAIMove = useCallback(() => {
    if(canPlay()) performMove();
  }, [performMove]);

  useEffect(() => {
    const delay = 100;

    let timeoutId: NodeJS.Timeout;
    const playNextMove = () => {
      if(isAutoplaying && gameState && !gameState.isTerminal()) {
        performMove();
        timeoutId = setTimeout(playNextMove, delay); // Add a delay between moves
      } else {
        setIsAutoplaying(false);
      }
    };

    if(isAutoplaying && gameState && !gameState.isTerminal()) {
      timeoutId = setTimeout(playNextMove, delay);
    }

    return () => {
      if(timeoutId) clearTimeout(timeoutId);
    };
  }, [gameState, isAutoplaying, performMove]);

  useEffect(() => { if(isTerminal()) setIsAutoplaying(false); }, [isTerminal]);

  const resetGame = useCallback(() => {
    setIsAutoplaying(false);
    const initialState = games[selectedGame].createInitialState();
    setGameState(initialState);
    setHistoryIdx(0);
    setHistory([initialState]);
    resetMCTS();
  }, [selectedGame, resetMCTS]);

  const changeGame = useCallback((game:string) => {
    setSelectedGame(game);
    setGameState(null);
    setHistoryIdx(0);
    setHistory([]);
    resetMCTS();
  }, [resetGame]);

  useEffect(() => {
    const initialState = games[selectedGame].createInitialState();
    setGameState(initialState);
    setHistoryIdx(0);
    setHistory([initialState]);
  }, [resetGame]);

  const undoMove = useCallback(() => {
    if(canUndo()) {
      setIsAutoplaying(false);
      setHistoryIdx((prevIdx) => prevIdx-1);
      setGameState(history[historyIdx-1]);
      resetMCTS();
    }
  }, [canUndo, history, historyIdx, resetMCTS]);

  const redoMove = useCallback(() => {
    if(canRedo()) {
      setIsAutoplaying(false);
      setHistoryIdx((prevIdx) => prevIdx+1);
      setGameState(history[historyIdx+1]);
      resetMCTS();
    }
  }, [canRedo, history, historyIdx, resetMCTS]);

  const toggleAutoplay = useCallback(() => {
    if(isAutoplaying || isTerminal()) {
      setIsAutoplaying(false);
    } else {
      setIsAutoplaying(true);
    }
  }, [isAutoplaying, isTerminal]);

  useHotkeys({
    RESET: resetGame,
    UNDO: undoMove,
    REDO: redoMove,
    AI_MOVE: doAIMove,
    AUTOPLAY: toggleAutoplay,
  });

  const hotkeyHint = (key: keyof typeof HOTKEYS) => <span className="text-sm">({HOTKEYS[key]})</span>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap gap-16">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Game Interface</h1>
          <select value={selectedGame} onChange={(e)=>changeGame(e.target.value)} className="p-2 border rounded-lg">
            {Object.keys(games).map((game) => (
              <option key={game} value={game}>{games[game].name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-xl">
            <Button onClick={resetGame} tooltip="Reset Game"><HiRefresh />{hotkeyHint('RESET')}</Button>

            <ButtonGroup tooltip={`${historyIdx}/${history.length-1}`}>
              <Button onClick={undoMove} disabled={!canUndo()}><FaUndo />{hotkeyHint('UNDO')}</Button>
              <Button onClick={redoMove} disabled={!canRedo()}><FaRedo />{hotkeyHint('REDO')}</Button>
            </ButtonGroup>

            <Button onClick={doAIMove} disabled={!canPlay()} tooltip="AI Move"><FaForwardStep />{hotkeyHint('AI_MOVE')}</Button>

            {!isAutoplaying ? (
              <Button onClick={()=>setIsAutoplaying(true)} disabled={isTerminal()?true:false} tooltip="Autoplay On"><FaForwardFast />{hotkeyHint('AUTOPLAY')}</Button>
            ) : (
              <Button onClick={()=>setIsAutoplaying(false)} className="bg-gray-400" tooltip="Autoplay Off"><FaStop />{hotkeyHint('AUTOPLAY')}</Button>
            )}

            <label className="flex items-center gap-1">
              <input type="checkbox" className="scale-125"
              checked={doAIMoveAfterPlayer} onChange={(e)=>setDoAIMoveAfterPlayer(e.target.checked)} />
              <small>AI move after Player</small>
            </label>
          </div>

          <div className="border-2 p-2 rounded-lg">
            {gameState && <GameBoard render={games[selectedGame].render} gameState={gameState} onMove={handlePlayerMove} />}
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
