// src/App.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { GameState } from 'multimcts';
import MCTSSettings from './components/MCTSSettings';
import GameBoard from './components/GameBoard';
import TreeViewer from './components/TreeViewer';
import Button from './components/Button';
import ButtonGroup from './components/ButtonGroup';
import Select from './components/Select';
import { Game } from './types/Game';
import { useMCTS } from './hooks/useMCTS';
import { useHotkeys } from 'react-hotkeys-hook';
import { FaUndo, FaRedo } from "react-icons/fa";
import { FaForwardStep, FaForwardFast, FaStop } from "react-icons/fa6";
import { HiRefresh } from "react-icons/hi";
import { TbRobot, TbRobotOff } from "react-icons/tb";
import TicTacToe from './games/TicTacToe';
import Onitama from './games/Onitama';
import Filler from './games/Filler';

const games: Record<string, Game> = {
  Filler: Filler,
  Onitama: Onitama,
  TicTacToe: TicTacToe,
};
const defaultGame = 'TicTacToe';

const MOVE_DELAY = 100; // (helps React keep up with the latest game state)

const App: React.FC = () => {
  const [mctsSettings, setMctsSettings] = useState({
    explorationBias: 1.414,
    maxIterations: 1000,
    maxTime: 1,
  });

  const [selectedGame, setSelectedGame] = useState<string>(defaultGame);
  const [gameState, setGameState] = useState<GameState|null>(null);
  const [history, setHistory] = useState<GameState[]>([games[selectedGame].createInitialState()]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);
  const [isAutoplaying, setIsAutoplaying] = useState<boolean>(false);
  const [doAIMoveAfterPlayer, setDoAIMoveAfterPlayer] = useState<boolean>(true);
  const [isMoveInProgress, setIsMoveInProgress] = useState<boolean>(false);

  const {mcts, runSearch, resetMCTS} = useMCTS(mctsSettings);

  const isTerminal = useCallback(() => gameState ? gameState.isTerminal() : false, [gameState]);
  const canPlay = useCallback(() => gameState!==null && !isAutoplaying && !isMoveInProgress && !isTerminal(), [gameState, isAutoplaying, isMoveInProgress, isTerminal]);
  const canUndo = useCallback(() => historyIdx > 0, [historyIdx]);
  const canRedo = useCallback(() => historyIdx < history.length-1, [historyIdx, history]);

  const performMove = useCallback(async (move:string|null=null): Promise<GameState|null> => {
    if(isMoveInProgress) return gameState;
    setIsMoveInProgress(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, MOVE_DELAY));

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
    } finally {
      setIsMoveInProgress(false);
    }
  }, [runSearch, history, historyIdx, isMoveInProgress, gameState]);

  const handlePlayerMove = useCallback(async (move:string) => {
    if(!canPlay()) return;
    const newState = await performMove(move);

    if(doAIMoveAfterPlayer && newState && !newState.isTerminal()) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      performMove();
    }
  }, [canPlay, performMove, doAIMoveAfterPlayer]);

  const doAIMove = useCallback(() => {
    if(!canPlay()) return;
    performMove();
  }, [performMove, canPlay]);

  const startAutoplay = () => setIsAutoplaying(true);
  const stopAutoplay = () => setIsAutoplaying(false);
  const toggleAIMoveAfterPlayer = () => setDoAIMoveAfterPlayer((prev) => !prev);

  useEffect(() => {
    if(!isAutoplaying) return;
    if(isTerminal()) {
      stopAutoplay();
      return;
    }

    (async () => {
      if(isAutoplaying && gameState && !gameState.isTerminal()) {
        performMove();
      } else {
        stopAutoplay();
      }
    })();
  }, [isAutoplaying, isTerminal, gameState, performMove]);

  const resetGame = useCallback(() => {
    stopAutoplay();
    const newState = historyIdx===0 ? games[selectedGame].createInitialState() : history[0];
    setGameState(newState);
    setHistoryIdx(0);
    setHistory([newState]);
    resetMCTS();
  }, [selectedGame, resetMCTS, history, historyIdx]);

  const changeGame = (game:string) => {
    stopAutoplay();
    setSelectedGame(game);
    setGameState(null);
    setHistoryIdx(0);
    setHistory([]);
    resetMCTS();
  };

  useEffect(() => {
    const initialState = games[selectedGame].createInitialState();
    setGameState(initialState);
    setHistoryIdx(0);
    setHistory([initialState]);
  }, [selectedGame]);

  const undoMove = useCallback(() => {
    if(canUndo()) {
      stopAutoplay();
      setHistoryIdx((prevIdx) => prevIdx-1);
      setGameState(history[historyIdx-1]);
      resetMCTS();
    }
  }, [canUndo, history, historyIdx, resetMCTS]);

  const redoMove = useCallback(() => {
    if(canRedo()) {
      stopAutoplay();
      setHistoryIdx((prevIdx) => prevIdx+1);
      setGameState(history[historyIdx+1]);
      resetMCTS();
    }
  }, [canRedo, history, historyIdx, resetMCTS]);

  const toggleAutoplay = useCallback(() => {
    if(isAutoplaying || isTerminal()) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }, [isAutoplaying, isTerminal]);

  const HOTKEYS = {
    reset: {keys:'r', callback:resetGame},
    undo: {keys:'z', callback:undoMove},
    redo: {keys:'x', callback:redoMove},
    aiMove: {keys:'n', callback:doAIMove},
    autoplay: {keys:'p', callback:toggleAutoplay},
    aiAfterPlayer: {keys:'a', callback:toggleAIMoveAfterPlayer},
  };
  Object.values(HOTKEYS).forEach(({keys, callback}) => {
    useHotkeys(keys, callback);
  });
  const hotkeyHint = (keys:string) => <span className="text-sm">({keys})</span>;

  return (
    <div className="container mx-auto flex flex-wrap gap-4">
      {/* Game Section */}
      <section className="flex flex-col flex-1 items-center gap-4">
        <h1 className="text-2xl font-bold">Game Interface</h1>

        {/* Game Selector */}
        <Select
          value={selectedGame}
          onChange={changeGame}
          options={Object.fromEntries(Object.entries(games).map(([key,value]) => [key,value.name]))}
          className="text-xl px-4 py-2"
          centerText={true}
        />

        {/* Game Controls */}
        <section className="flex items-center gap-2 text-xl">
          <Button onClick={resetGame} tooltip="Reset"><HiRefresh />{hotkeyHint(HOTKEYS.reset.keys)}</Button>

          <ButtonGroup tooltip={`${historyIdx}/${history.length-1}`}>
            <Button onClick={undoMove} disabled={!canUndo()}><FaUndo />{hotkeyHint(HOTKEYS.undo.keys)}</Button>
            <Button onClick={redoMove} disabled={!canRedo()}><FaRedo />{hotkeyHint(HOTKEYS.redo.keys)}</Button>
          </ButtonGroup>

          <Button onClick={doAIMove} disabled={!canPlay()} tooltip="AI Move"><FaForwardStep />{hotkeyHint(HOTKEYS.aiMove.keys)}</Button>

          <Button
            onClick={isAutoplaying ? stopAutoplay : startAutoplay}
            className={isAutoplaying ? "bg-gray-400" : ""}
            tooltip="Autoplay"
            disabled={isTerminal()}
          >
            {isAutoplaying ? <FaStop /> : <FaForwardFast />}
            {hotkeyHint(HOTKEYS.autoplay.keys)}
          </Button>

          <Button
            onClick={toggleAIMoveAfterPlayer}
            className={doAIMoveAfterPlayer ? "bg-gray-400" : ""}
            tooltip="AI move after Player"
          >
            {doAIMoveAfterPlayer ? <TbRobot /> : <TbRobotOff />}
            {hotkeyHint(HOTKEYS.aiAfterPlayer.keys)}
          </Button>
        </section>

        {/* Game Board */}
        <div className="border-2 p-2 rounded-lg">
          {gameState && (
            <GameBoard render={games[selectedGame].render} gameState={gameState} onMove={handlePlayerMove} />
          )}
        </div>
      </section>

      {/* MCTS Section */}
      <section className="flex flex-col flex-1 min-w-0 gap-4">
        <h1 className="text-2xl font-bold flex-none">MCTS Settings</h1>
        <div className="flex-none">
          <MCTSSettings settings={mctsSettings} setSettings={setMctsSettings} />
        </div>
        <div className="flex-shrink-0 overflow-x-auto whitespace-nowrap">
          <TreeViewer mcts={mcts} />
        </div>
      </section>
    </div>
  );
};

export default App;
