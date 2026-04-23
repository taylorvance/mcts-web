// src/App.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { BrandBadge } from '@taylorvance/tv-shared-web/BrandBadge';
import { useKeySequence } from '@taylorvance/tv-shared-web/hotkeys';
import { FiHelpCircle } from 'react-icons/fi';
import HelpModal, { type HelpTopic } from './components/HelpModal';
import Select from './components/Select';
import Tooltip from './components/Tooltip';
import GameSessionView from './components/GameSessionView';
import {
  gameEntriesById,
  gameFamilies,
  gameFamilyOptions,
  gameIdToFamilyId,
  games,
} from './games/gameRegistry';
import type { HelpContent } from './types/Game';
import {
  APP_STORAGE_KEY,
  getGameSessionStorageKey,
  readJsonStorage,
  removeStorageKey,
  writeJsonStorage,
} from './utils/persistence';

const defaultGameId = 'TicTacToe';
const defaultMctsSettings = {
  explorationBias: 1.414,
  maxIterations: 1000,
  maxRetainedNodes: 0,
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
        'Max Retained Nodes caps the preserved tree size across repeated searches; set it to 0 for no cap.',
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
  selectedGameId: string;
  mctsSettings: typeof defaultMctsSettings;
  lastSelectedGameIdByFamily: Record<string, string>;
}

const isValidGameId = (gameId: unknown): gameId is string => (
  typeof gameId === 'string' && gameId in games
);

const sanitizeLastSelectedGameIdByFamily = (
  value: unknown,
): Record<string, string> => {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const entries = Object.entries(value).filter(([familyId, gameId]) => (
    familyId in gameFamilies
    && isValidGameId(gameId)
    && gameIdToFamilyId[gameId] === familyId
  ));

  return Object.fromEntries(entries);
};

const loadPersistedAppState = (): PersistedAppState | null => {
  const persistedState = readJsonStorage<PersistedAppState>(APP_STORAGE_KEY);
  if (!persistedState) {
    return null;
  }

  if (
    !isValidGameId(persistedState.selectedGameId) ||
    typeof persistedState.mctsSettings?.explorationBias !== 'number' ||
    typeof persistedState.mctsSettings?.maxIterations !== 'number' ||
    (
      persistedState.mctsSettings?.maxRetainedNodes !== undefined
      && typeof persistedState.mctsSettings.maxRetainedNodes !== 'number'
    ) ||
    typeof persistedState.mctsSettings?.maxTime !== 'number'
  ) {
    return null;
  }

  return {
    selectedGameId: persistedState.selectedGameId,
    mctsSettings: {
      ...defaultMctsSettings,
      ...persistedState.mctsSettings,
    },
    lastSelectedGameIdByFamily: sanitizeLastSelectedGameIdByFamily(
      persistedState.lastSelectedGameIdByFamily,
    ),
  };
};

const readSelectedGameIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const selectedGameId = new URLSearchParams(window.location.search).get(
    gameQueryParam,
  );
  if (!isValidGameId(selectedGameId)) {
    return null;
  }

  return selectedGameId;
};

const writeSelectedGameIdToUrl = (selectedGameId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(window.location.href);
  if (selectedGameId === defaultGameId) {
    nextUrl.searchParams.delete(gameQueryParam);
  } else {
    nextUrl.searchParams.set(gameQueryParam, selectedGameId);
  }

  const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextPath !== currentPath) {
    window.history.replaceState(window.history.state, '', nextPath);
  }
};

const App: React.FC = () => {
  const [persistedAppState] = useState(loadPersistedAppState);
  const initialSelectedGameId = (
    readSelectedGameIdFromUrl()
    ?? persistedAppState?.selectedGameId
    ?? defaultGameId
  );
  const [mctsSettings, setMctsSettings] = useState(
    () => persistedAppState?.mctsSettings ?? defaultMctsSettings,
  );
  const [selectedGameId, setSelectedGameId] = useState<string>(
    initialSelectedGameId,
  );
  const [lastSelectedGameIdByFamily, setLastSelectedGameIdByFamily] = useState<
    Record<string, string>
  >(() => {
    const selectedFamilyId = gameIdToFamilyId[initialSelectedGameId];
    return {
      ...sanitizeLastSelectedGameIdByFamily(
        persistedAppState?.lastSelectedGameIdByFamily,
      ),
      [selectedFamilyId]: initialSelectedGameId,
    };
  });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<HelpTopic>('app');
  const [sessionResetVersion, setSessionResetVersion] = useState(0);
  const selectedFamilyId = gameIdToFamilyId[selectedGameId] ?? gameIdToFamilyId[defaultGameId];
  const currentFamily = gameFamilies[selectedFamilyId];
  const currentGame = games[selectedGameId] ?? games[defaultGameId];
  const currentFamilyVariantOptions = Object.fromEntries(
    currentFamily.gameIds.map((gameId) => {
      const entry = gameEntriesById[gameId];
      return [gameId, entry.variantName ?? entry.name];
    }),
  );
  const hasVariantPicker = currentFamily.gameIds.length > 1;

  const changeSelectedGame = useCallback((gameId: string) => {
    if (!(gameId in games)) {
      return;
    }

    setSelectedGameId(gameId);
    setLastSelectedGameIdByFamily((current) => {
      const familyId = gameIdToFamilyId[gameId];
      if (current[familyId] === gameId) {
        return current;
      }

      return {
        ...current,
        [familyId]: gameId,
      };
    });
  }, []);

  const changeFamily = useCallback((familyId: string) => {
    const family = gameFamilies[familyId];
    if (!family) {
      return;
    }

    changeSelectedGame(
      lastSelectedGameIdByFamily[familyId] ?? family.defaultGameId,
    );
  }, [changeSelectedGame, lastSelectedGameIdByFamily]);

  const changeVariant = useCallback((gameId: string) => {
    changeSelectedGame(gameId);
  }, [changeSelectedGame]);

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
      selectedGameId,
      mctsSettings,
      lastSelectedGameIdByFamily,
    } satisfies PersistedAppState);
  }, [lastSelectedGameIdByFamily, mctsSettings, selectedGameId]);

  useEffect(() => {
    writeSelectedGameIdToUrl(selectedGameId);
  }, [selectedGameId]);

  const resetSavedData = useCallback(() => {
    for (const game of Object.values(games)) {
      removeStorageKey(getGameSessionStorageKey(game.id));
    }

    removeStorageKey(APP_STORAGE_KEY);
    setSelectedGameId(defaultGameId);
    setLastSelectedGameIdByFamily({
      [gameIdToFamilyId[defaultGameId]]: defaultGameId,
    });
    setMctsSettings(defaultMctsSettings);
    setSessionResetVersion((version) => version + 1);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-4">
      <div className="flex w-full max-w-full flex-wrap gap-4 overflow-x-hidden">
        <GameSessionView
          key={`${selectedGameId}:${sessionResetVersion}`}
          game={currentGame}
          selector={
            <div className="flex w-full flex-col items-center gap-2">
              <div className="grid w-full max-w-[23rem] grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2">
                <div aria-hidden="true" className="h-8 w-8" />
                <Select
                  ariaLabel="Game"
                  value={selectedFamilyId}
                  onChange={changeFamily}
                  options={gameFamilyOptions}
                  className="w-full px-4 py-2 text-xl"
                  centerText={true}
                />
                <div className="flex h-8 w-8 items-center justify-center">
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
              </div>
              {hasVariantPicker && (
                <div className="w-full max-w-[18rem]">
                  <Select
                    ariaLabel="Variant"
                    value={selectedGameId}
                    onChange={changeVariant}
                    options={currentFamilyVariantOptions}
                    className="w-full px-4 py-2 text-base"
                    centerText={true}
                  />
                </div>
              )}
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
