// src/App.tsx

import React, { useState, useCallback, useEffect } from 'react';
// MCTS
import { GameState } from 'multimcts';
import { useMCTS } from './hooks/useMCTS';
import { useAppHotkeys } from './hooks/useAppHotkeys';
// UI components
import Button from './components/Button';
import ButtonGroup from './components/ButtonGroup';
import Select from './components/Select';
// UI sections
import GameBoard from './components/GameBoard';
import MCTSSettings from './components/MCTSSettings';
import TreeViewer from './components/TreeViewer';
// Icons
import { FaUndo, FaRedo } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaForwardStep, FaForwardFast, FaStop } from "react-icons/fa6";
import { HiRefresh } from "react-icons/hi";
import { TbRobot, TbRobotOff } from "react-icons/tb";
// Games
import { Game } from './types/Game';
import TicTacToe from './games/TicTacToe';
import UltimateTicTacToe from './games/UltimateTicTacToe';
import Onitama from './games/Onitama';
import Filler from './games/Filler';

const games: Record<string, Game> = {
  Filler: Filler,
  Onitama: Onitama,
  TicTacToe: TicTacToe,
  UltimateTicTacToe: UltimateTicTacToe,
};
const defaultGame = 'TicTacToe';

// Generate a random string so the history array is never empty. This first "null" move represents the initial game state.
const NULLMOVE = btoa(crypto.getRandomValues(new Uint8Array(16)).reduce((s,b) => s+String.fromCharCode(b), ''));

const App: React.FC = () => {
  const [mctsSettings, setMctsSettings] = useState({explorationBias:1.414, maxIterations:1000, maxTime:1});
  const [selectedGame, setSelectedGame] = useState<string>(defaultGame);
  const [gameState, setGameState] = useState<GameState|null>(null);
  const [initialState, setInitialState] = useState<GameState|null>(null); // cache THIS initial state (move 0), in case this game type randomizes it
  const [history, setHistory] = useState<string[]>([NULLMOVE]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isAutoplaying, setIsAutoplaying] = useState<boolean>(false);
  const [doAIMoveAfterPlayer, setDoAIMoveAfterPlayer] = useState<boolean>(true);
  const [isPendingAIMove, setIsPendingAIMove] = useState<boolean>(false);
  const [isMoveInProgress, setIsMoveInProgress] = useState<boolean>(false);

  const {mcts, runSearch, resetMCTS} = useMCTS(mctsSettings);

  const isTerminal = gameState ? gameState.isTerminal() : false;
  const canPlay = gameState!==null && !isAutoplaying && !isMoveInProgress && !isTerminal;
  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < history.length-1;

  const performMove = useCallback((move:string|null=null) => {
    if(isMoveInProgress) return null;
    setIsMoveInProgress(true);

    try {
      if(!gameState || gameState.isTerminal()) return;

      const newMove = move ?? runSearch(gameState);
      const newState = gameState.makeMove(newMove);
      setGameState(newState);
      const newHistoryIdx = historyIdx + 1;

      setHistory((prevHistory) => [...prevHistory.slice(0, newHistoryIdx), newMove]);
      setHistoryIdx(newHistoryIdx);
    } finally {
      setIsMoveInProgress(false);
    }
  }, [isMoveInProgress, runSearch, historyIdx, gameState]);

  const handlePlayerMove = useCallback((move:string) => {
    if(!canPlay) return;
    performMove(move);
    if(doAIMoveAfterPlayer) setIsPendingAIMove(true);
  }, [canPlay, doAIMoveAfterPlayer, performMove]);

  const doAIMove = useCallback(() => {
    if(canPlay) performMove();
  }, [canPlay, performMove]);

  useEffect(() => {
    if(!isPendingAIMove) return;
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 250)); // delay so the player can see their own move before the AI move is applied
      setIsPendingAIMove(false);
      doAIMove();
    })();
  }, [doAIMove, isPendingAIMove]);

  const toggleAutoplay = useCallback(() => {
    if(isAutoplaying || isTerminal) {
      setIsAutoplaying(false);
    } else {
      setIsAutoplaying(true);
    }
  }, [isAutoplaying, isTerminal]);
  const toggleAIMoveAfterPlayer = useCallback(() => {
    setDoAIMoveAfterPlayer((prev) => !prev);
  }, []);

  useEffect(() => {
    if(!isAutoplaying) return;
    if(isTerminal) {
      setIsAutoplaying(false);
      return;
    }

    if(isAutoplaying && gameState && !gameState.isTerminal()) {
      performMove();
    } else {
      setIsAutoplaying(false);
    }
  }, [gameState, isAutoplaying, isTerminal, performMove]);

  const changeGame = useCallback((game:string) => {
    setIsAutoplaying(false);
    setSelectedGame(game);
    setGameState(null);
    setHistoryIdx(0);
    setHistory([NULLMOVE]);
    setShowHistory(false);
    resetMCTS();

    /*
    // Update the URL hash and tab title.
    if(window.location.hash.slice(1) !== game) {
      window.history.pushState(null, '', `#${game}`);
      document.title = `MCTS - ${games[game].name}`;
    }
    */
  }, [resetMCTS]);

  /*
  useEffect(() => {
    // Check if a game is selected in the URL hash.
    const hashGame = window.location.hash.slice(1);
    if(hashGame && hashGame!==selectedGame && games[hashGame]) {
      setSelectedGame(hashGame);
    }
  }, []); // runs once on mount
  */

  // Selecting a new game.
  useEffect(() => {
    const initState = games[selectedGame].createInitialState();
    setGameState(initState);
    setInitialState(initState);
    setHistoryIdx(0);
    setHistory([NULLMOVE]);
    setShowHistory(false);
  }, [selectedGame]);

  const gotoHistoryIdx = useCallback((idx:number) => {
    if(idx < 0 || idx >= history.length) return;
    setIsAutoplaying(false);
    let state = initialState ?? games[selectedGame].createInitialState();
    for(let i=1; i<=idx; i++) {
      state = state.makeMove(history[i]);
    }
    setGameState(state);
    setHistoryIdx(idx);
    resetMCTS();
  }, [history, initialState, selectedGame, resetMCTS]);

  const resetGame = useCallback(() => {
    if(historyIdx > 0) {
      // The first reset just hits undo lots of times.
      gotoHistoryIdx(0);
      return;
    }

    // The second reset actually clears out the history.
    const initState = games[selectedGame].createInitialState();
    setIsAutoplaying(false);
    setGameState(initState);
    setInitialState(initState);
    setHistoryIdx(0);
    setHistory([NULLMOVE]);
    setShowHistory(false);
    resetMCTS();
  }, [gotoHistoryIdx, historyIdx, resetMCTS, selectedGame]);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);
  const undoMove = useCallback(() => {
    if(canUndo) gotoHistoryIdx(historyIdx-1);
  }, [canUndo, gotoHistoryIdx, historyIdx]);
  const redoMove = useCallback(() => {
    if(canRedo) gotoHistoryIdx(historyIdx+1);
  }, [canRedo, gotoHistoryIdx, historyIdx]);

  const HOTKEYS = {
    reset: {keys:'r', callback:resetGame},
    undo: {keys:'z', callback:undoMove},
    redo: {keys:'x', callback:redoMove},
    toggleHistory: {keys:'h', callback:toggleHistory},
    aiMove: {keys:'n', callback:doAIMove},
    autoplay: {keys:'p', callback:toggleAutoplay},
    aiAfterPlayer: {keys:'a', callback:toggleAIMoveAfterPlayer},
  };
  useAppHotkeys(HOTKEYS);
  const hotkeyHint = (keys:string) => <span className="text-xs">({keys})</span>;

  return (
    <div className="container mx-auto flex flex-wrap gap-4 pt-4">
      {/* Game Section */}
      <section className="flex flex-col flex-1 items-center gap-4">
        {/* Game Selector */}
        <Select
          value={selectedGame}
          onChange={changeGame}
          options={Object.fromEntries(Object.entries(games).map(([key,value]) => [key,value.name]))}
          className="text-xl px-4 py-2"
          centerText={true}
        />

        {/* Game Controls */}
        <section className="flex items-center gap-2 text-xl select-none">
          <Button onClick={resetGame} tooltip="Reset"><HiRefresh />{hotkeyHint(HOTKEYS.reset.keys)}</Button>

          {/* Undo/Redo + History dropdown */}
          <ButtonGroup tooltip={`${historyIdx}/${history.length-1}`}>
            <Button onClick={undoMove} disabled={!canUndo}><FaUndo />{hotkeyHint(HOTKEYS.undo.keys)}</Button>

            <Button onClick={toggleHistory} className="px-0 relative" disabled={history.length===1}>
              <BsThreeDotsVertical />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 select-text text-sm border rounded-lg shadow-lg p-1 flex z-10 backdrop-blur-lg" style={{display:(showHistory?'block':'none')}}>
                {history.map((move, i) => (
                  <div key={i}
                    className={`whitespace-nowrap text-left px-1 rounded hover:bg-gray-200 ${i===historyIdx ? 'bg-gray-300' : ''}`}
                    onClick={() => { gotoHistoryIdx(i); }}
                  >
                    {move !== NULLMOVE
                      ? (<span><small className="w-6 inline-block text-xs text-gray-500 italic">{i}</small><span className="font-mono">{move}</span></span>)
                      : <span className="text-xs text-gray-500 italic">New Game</span>
                    }
                  </div>
                ))}
              </div>
            </Button>

            <Button onClick={redoMove} disabled={!canRedo}><FaRedo />{hotkeyHint(HOTKEYS.redo.keys)}</Button>
          </ButtonGroup>

          <Button onClick={doAIMove} disabled={!canPlay} tooltip="AI Move"><FaForwardStep />{hotkeyHint(HOTKEYS.aiMove.keys)}</Button>

          <Button
            onClick={toggleAutoplay}
            className={isAutoplaying ? "bg-gray-400" : ""}
            tooltip="Autoplay"
            disabled={isTerminal}
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
          {gameState && <GameBoard Board={games[selectedGame].Board} gameState={gameState} onMove={handlePlayerMove} />}
        </div>
      </section>

      {/* MCTS Section */}
      <section className="flex flex-col flex-1 min-w-0 gap-4">
        <h1 className="text-2xl font-bold flex-none">MCTS Settings</h1>
        <div className="flex-none">
          <MCTSSettings settings={mctsSettings} setSettings={setMctsSettings} />
        </div>

        <h2 className="text-xl font-bold flex-none">Search Tree</h2>
        <div className="flex-shrink-0 overflow-x-auto whitespace-nowrap">
          <TreeViewer mcts={mcts} />
        </div>
      </section>
    </div>
  );
};

export default App;
