// src/App.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { BrandBadge } from '@taylorvance/tv-shared-web/BrandBadge';
import { useKeySequence } from '@taylorvance/tv-shared-web/hotkeys';
import { FiHelpCircle } from 'react-icons/fi';
import HelpModal, { type HelpTopic } from './components/HelpModal';
import Select from './components/Select';
import Tooltip from './components/Tooltip';
import GameSessionView from './components/GameSessionView';
import { games, gameOptions } from './games/gameRegistry';
import type { HelpContent } from './types/Game';
import {
  APP_STORAGE_KEY,
  getGameSessionStorageKey,
  readJsonStorage,
  removeStorageKey,
  writeJsonStorage,
} from './utils/persistence';

const defaultGame = 'TicTacToe';
const defaultMctsSettings = {
  explorationBias: 1.414,
  maxIterations: 1000,
  maxTime: 1,
};
const gameQueryParam = 'game';
const appHelpContent: HelpContent = {
  overview:
    'Play a variety of games, run MCTS from the current position, and inspect how the search explored the tree.',
  sections: [
    {
      title: 'Play',
      items: [
        'Choose a game, then play moves directly on the board.',
        'Use AI Move (n) for one searched move, or Autoplay (p) to let the engine keep playing.',
        'Undo (z), redo (x), and move history (h) let you revisit earlier positions.',
      ],
    },
    {
      title: 'Search',
      items: [
        'Exploration Bias controls how much MCTS favors proven lines versus less-visited branches.',
        'Max Iterations and Max Time cap how long each search runs.',
        'The Search Tree shows visits, average value, and explored continuations after each search.',
      ],
    },
    {
      title: 'Keyboard Shortcuts',
      items: [
        'Game state: (r) reset, (z) undo, (x) redo, (h) toggle move history',
        'AI play: (n) one AI move, (p) autoplay, (a) AI-after-player',
        'Help: (?) toggle the help dialog',
      ],
    },
  ],
};

interface PersistedAppState {
  selectedGame: string;
  mctsSettings: typeof defaultMctsSettings;
}

const loadPersistedAppState = (): PersistedAppState | null => {
  const persistedState = readJsonStorage<PersistedAppState>(APP_STORAGE_KEY);
  if (!persistedState) {
    return null;
  }

  if (
    typeof persistedState.selectedGame !== 'string' ||
    !(persistedState.selectedGame in games) ||
    typeof persistedState.mctsSettings?.explorationBias !== 'number' ||
    typeof persistedState.mctsSettings?.maxIterations !== 'number' ||
    typeof persistedState.mctsSettings?.maxTime !== 'number'
  ) {
    return null;
  }

  return persistedState;
};

const readSelectedGameFromUrl = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const selectedGame = new URLSearchParams(window.location.search).get(
    gameQueryParam,
  );
  if (!selectedGame || !(selectedGame in games)) {
    return null;
  }

  return selectedGame;
};

const writeSelectedGameToUrl = (selectedGame: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(window.location.href);
  if (selectedGame === defaultGame) {
    nextUrl.searchParams.delete(gameQueryParam);
  } else {
    nextUrl.searchParams.set(gameQueryParam, selectedGame);
  }

  const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextPath !== currentPath) {
    window.history.replaceState(window.history.state, '', nextPath);
  }
};

const App: React.FC = () => {
  const [persistedAppState] = useState(loadPersistedAppState);
  const [mctsSettings, setMctsSettings] = useState(
    () => persistedAppState?.mctsSettings ?? defaultMctsSettings,
  );
  const [selectedGame, setSelectedGame] = useState<string>(
    () =>
      readSelectedGameFromUrl() ??
      persistedAppState?.selectedGame ??
      defaultGame,
  );
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<HelpTopic>('app');
  const [sessionResetVersion, setSessionResetVersion] = useState(0);
  const currentGame = games[selectedGame] ?? games[defaultGame];

  const changeGame = useCallback((game: string) => {
    setSelectedGame(game);
  }, []);

  const openHelpModal = useCallback(() => {
    setIsHelpModalOpen(true);
  }, []);

  const toggleHelpModal = useCallback(() => {
    if (isHelpModalOpen) {
      setIsHelpModalOpen(false);
      return;
    }

    setIsHelpModalOpen(true);
  }, [isHelpModalOpen]);

  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false);
  }, []);

  useKeySequence(
    ['?'],
    toggleHelpModal,
    {
      enableOnFormTags: false,
      preventDefault: true,
    },
    [toggleHelpModal],
  );

  useEffect(() => {
    writeJsonStorage(APP_STORAGE_KEY, {
      selectedGame,
      mctsSettings,
    } satisfies PersistedAppState);
  }, [mctsSettings, selectedGame]);

  useEffect(() => {
    writeSelectedGameToUrl(selectedGame);
  }, [selectedGame]);

  const resetSavedData = useCallback(() => {
    for (const game of Object.values(games)) {
      removeStorageKey(getGameSessionStorageKey(game.id));
    }

    removeStorageKey(APP_STORAGE_KEY);
    setSelectedGame(defaultGame);
    setMctsSettings(defaultMctsSettings);
    setSessionResetVersion((version) => version + 1);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-4">
      <div className="flex w-full max-w-full flex-wrap gap-4 overflow-x-hidden">
        <GameSessionView
          key={`${selectedGame}:${sessionResetVersion}`}
          game={currentGame}
          selector={
            <div className="flex w-full items-center justify-center gap-2">
              <Select
                ariaLabel="Game"
                value={selectedGame}
                onChange={changeGame}
                options={gameOptions}
                className="px-4 py-2 text-xl"
                centerText={true}
              />
              <Tooltip content="Help" placement="bottom">
                <button
                  type="button"
                  onClick={openHelpModal}
                  aria-label="Help"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full p-1 text-gray-700 transition hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  <FiHelpCircle className="text-lg" />
                </button>
              </Tooltip>
            </div>
          }
          mctsSettings={mctsSettings}
          setMctsSettings={setMctsSettings}
          onResetSavedData={resetSavedData}
        />
      </div>

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={closeHelpModal}
        topic={helpTopic}
        onTopicChange={setHelpTopic}
        appHelp={appHelpContent}
        gameName={currentGame.name}
        gameHelp={currentGame.help}
      />

      <footer className="mt-8 flex justify-center border-t border-gray-200 pt-4">
        <BrandBadge />
      </footer>
    </div>
  );
};

export default App;
