import React, { useCallback, useState } from 'react';
import type { Game } from '../types/Game';
import { NULLMOVE, useGameSession } from '../hooks/useGameSession';
import { useAppHotkeys } from '../hooks/useAppHotkeys';
import Button from './Button';
import ButtonGroup from './ButtonGroup';
import GameBoard from './GameBoard';
import GameComplexityPanel from './GameComplexityPanel';
import MCTSSettings from './MCTSSettings';
import TreeViewer from './TreeViewer';
import { FaUndo, FaRedo } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaForwardStep, FaForwardFast, FaStop } from 'react-icons/fa6';
import { HiRefresh } from 'react-icons/hi';
import { TbRobot, TbRobotOff } from 'react-icons/tb';

interface MCTSSettings {
  explorationBias: number;
  maxIterations: number;
  maxTime: number;
}

interface GameSessionViewProps {
  game: Game;
  selector: React.ReactNode;
  mctsSettings: MCTSSettings;
  setMctsSettings: React.Dispatch<React.SetStateAction<MCTSSettings>>;
  onResetSavedData: () => void;
}

const GameSessionView: React.FC<GameSessionViewProps> = ({
  game,
  selector,
  mctsSettings,
  setMctsSettings,
  onResetSavedData,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const {
    gameState,
    history,
    historyIdx,
    isAutoplaying,
    doAIMoveAfterPlayer,
    mcts,
    searchStats,
    isTerminal,
    canPlay,
    canUndo,
    canRedo,
    handlePlayerMove,
    doAIMove,
    toggleAutoplay,
    toggleAIMoveAfterPlayer,
    resetGame,
    gotoHistoryIdx,
    undoMove,
    redoMove,
  } = useGameSession(game, mctsSettings);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  const hotkeys = {
    reset: { keys: 'r', callback: resetGame },
    undo: { keys: 'z', callback: undoMove },
    redo: { keys: 'x', callback: redoMove },
    toggleHistory: { keys: 'h', callback: toggleHistory },
    aiMove: { keys: 'n', callback: doAIMove },
    autoplay: { keys: 'p', callback: toggleAutoplay },
    aiAfterPlayer: { keys: 'a', callback: toggleAIMoveAfterPlayer },
  };
  useAppHotkeys(hotkeys);

  const hotkeyHint = (keys: string) => (
    <span className="text-xs leading-none opacity-70">{keys}</span>
  );
  const controlButtonClass = 'h-10 text-lg sm:h-11 sm:text-xl';
  const formatNumber = (value: number) =>
    value.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  return (
    <div className="flex w-full max-w-full flex-col gap-4 overflow-x-hidden xl:flex-row">
      <section className="flex w-full min-w-0 max-w-full flex-col items-center gap-4 overflow-x-hidden xl:flex-1">
        {selector}

        <section className="flex w-full max-w-full flex-nowrap items-center justify-center gap-1 select-none sm:gap-2">
          <Button
            onClick={resetGame}
            tooltip="Reset"
            ariaLabel="Reset game"
            className={controlButtonClass}
          >
            <HiRefresh />
            {hotkeyHint(hotkeys.reset.keys)}
          </Button>

          <ButtonGroup tooltip={`${historyIdx}/${history.length - 1}`}>
            <Button
              onClick={undoMove}
              disabled={!canUndo}
              ariaLabel="Undo move"
              className={controlButtonClass}
            >
              <FaUndo />
              {hotkeyHint(hotkeys.undo.keys)}
            </Button>

            <Button
              onClick={toggleHistory}
              ariaLabel="Toggle move history"
              className={`${controlButtonClass} relative px-0`}
              disabled={history.length === 1}
            >
              <BsThreeDotsVertical />
              <div
                className="absolute top-10 left-1/2 -translate-x-1/2 select-text text-sm border rounded-lg shadow-lg p-1 flex z-10 backdrop-blur-lg"
                style={{ display: showHistory ? 'block' : 'none' }}
              >
                {history.map((move, i) => (
                  <div
                    key={i}
                    className={`whitespace-nowrap text-left px-1 rounded hover:bg-gray-200 ${i === historyIdx ? 'bg-gray-300' : ''}`}
                    onClick={() => {
                      gotoHistoryIdx(i);
                    }}
                  >
                    {move !== NULLMOVE ? (
                      <span>
                        <small className="w-6 inline-block text-xs text-gray-500 italic">
                          {i}
                        </small>
                        <span className="font-mono">{move}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        New Game
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Button>

            <Button
              onClick={redoMove}
              disabled={!canRedo}
              ariaLabel="Redo move"
              className={controlButtonClass}
            >
              <FaRedo />
              {hotkeyHint(hotkeys.redo.keys)}
            </Button>
          </ButtonGroup>

          <Button
            onClick={doAIMove}
            disabled={!canPlay}
            tooltip="AI Move"
            ariaLabel="Play AI move"
            className={controlButtonClass}
          >
            <FaForwardStep />
            {hotkeyHint(hotkeys.aiMove.keys)}
          </Button>

          <Button
            onClick={toggleAutoplay}
            className={`${controlButtonClass} ${isAutoplaying ? 'bg-gray-400' : ''}`}
            tooltip="Autoplay"
            ariaLabel={isAutoplaying ? 'Stop autoplay' : 'Start autoplay'}
            disabled={isTerminal}
          >
            {isAutoplaying ? <FaStop /> : <FaForwardFast />}
            {hotkeyHint(hotkeys.autoplay.keys)}
          </Button>

          <Button
            onClick={toggleAIMoveAfterPlayer}
            className={`${controlButtonClass} ${doAIMoveAfterPlayer ? 'bg-gray-400' : ''}`}
            tooltip="AI move after Player"
            ariaLabel={
              doAIMoveAfterPlayer
                ? 'Disable AI move after player'
                : 'Enable AI move after player'
            }
          >
            {doAIMoveAfterPlayer ? <TbRobot /> : <TbRobotOff />}
            {hotkeyHint(hotkeys.aiAfterPlayer.keys)}
          </Button>
        </section>

        <div className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded-lg border-2 p-2">
          <div className="mx-auto w-max">
            <GameBoard
              Board={game.Board}
              gameState={gameState}
              onMove={handlePlayerMove}
            />
          </div>
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-4 xl:flex-1">
        <h1 className="text-2xl font-bold flex-none">MCTS Settings</h1>
        <div className="flex-none">
          <MCTSSettings settings={mctsSettings} setSettings={setMctsSettings} />
        </div>
        <div className="flex-none">
          <Button onClick={onResetSavedData} className="justify-center">
            Reset saved data
          </Button>
        </div>

        <h2 className="text-xl font-bold flex-none">Search Tree</h2>
        {searchStats && (
          <div className="flex-none text-sm text-gray-700">
            Last search: {formatNumber(searchStats.iterations)} rounds &bull;{' '}
            {searchStats.elapsedMs.toFixed(1)} ms &bull;{' '}
            {formatNumber(searchStats.roundsPerSecond)} rounds/s
          </div>
        )}
        <div className="flex-shrink-0 overflow-x-auto whitespace-nowrap">
          <TreeViewer mcts={mcts} />
        </div>
        <GameComplexityPanel gameId={game.id} />
      </section>
    </div>
  );
};

export default GameSessionView;
