// src/App.tsx

import React, { useCallback, useEffect, useState } from 'react';
import Select from './components/Select';
import BrandBadge from './components/BrandBadge';
import GameSessionView from './components/GameSessionView';
import { games, gameOptions } from './games/gameRegistry';
import {
  APP_STORAGE_KEY,
  getGameSessionStorageKey,
  readJsonStorage,
  removeStorageKey,
  writeJsonStorage,
} from './utils/persistence';

const defaultGame = 'TicTacToe';
const defaultMctsSettings = { explorationBias: 1.414, maxIterations: 1000, maxTime: 1 };
const gameQueryParam = 'game';

interface PersistedAppState {
  selectedGame: string;
  mctsSettings: typeof defaultMctsSettings;
}

const loadPersistedAppState = (): PersistedAppState | null => {
  const persistedState = readJsonStorage<PersistedAppState>(APP_STORAGE_KEY);
  if(!persistedState) {
    return null;
  }

  if(
    typeof persistedState.selectedGame !== 'string'
    || !(persistedState.selectedGame in games)
    || typeof persistedState.mctsSettings?.explorationBias !== 'number'
    || typeof persistedState.mctsSettings?.maxIterations !== 'number'
    || typeof persistedState.mctsSettings?.maxTime !== 'number'
  ) {
    return null;
  }

  return persistedState;
};

const readSelectedGameFromUrl = (): string | null => {
  if(typeof window === 'undefined') {
    return null;
  }

  const selectedGame = new URLSearchParams(window.location.search).get(gameQueryParam);
  if(!selectedGame || !(selectedGame in games)) {
    return null;
  }

  return selectedGame;
};

const writeSelectedGameToUrl = (selectedGame: string) => {
  if(typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(window.location.href);
  if(selectedGame === defaultGame) {
    nextUrl.searchParams.delete(gameQueryParam);
  } else {
    nextUrl.searchParams.set(gameQueryParam, selectedGame);
  }

  const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if(nextPath !== currentPath) {
    window.history.replaceState(window.history.state, '', nextPath);
  }
};

const App: React.FC = () => {
  const [persistedAppState] = useState(loadPersistedAppState);
  const [mctsSettings, setMctsSettings] = useState(
    () => persistedAppState?.mctsSettings ?? defaultMctsSettings,
  );
  const [selectedGame, setSelectedGame] = useState<string>(
    () => readSelectedGameFromUrl() ?? persistedAppState?.selectedGame ?? defaultGame,
  );
  const [sessionResetVersion, setSessionResetVersion] = useState(0);
  const currentGame = games[selectedGame] ?? games[defaultGame];

  const changeGame = useCallback((game:string) => {
    setSelectedGame(game);
  }, []);

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
    for(const game of Object.values(games)) {
      removeStorageKey(getGameSessionStorageKey(game.id));
    }

    removeStorageKey(APP_STORAGE_KEY);
    setSelectedGame(defaultGame);
    setMctsSettings(defaultMctsSettings);
    setSessionResetVersion((version) => version + 1);
  }, []);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-wrap gap-4">
        <GameSessionView
          key={`${selectedGame}:${sessionResetVersion}`}
          game={currentGame}
          selector={(
            <Select
              value={selectedGame}
              onChange={changeGame}
              options={gameOptions}
              className="text-xl px-4 py-2"
              centerText={true}
            />
          )}
          mctsSettings={mctsSettings}
          setMctsSettings={setMctsSettings}
          onResetSavedData={resetSavedData}
        />
      </div>

      <footer className="mt-8 flex justify-center border-t border-gray-200 pt-4 sm:justify-end">
        <BrandBadge />
      </footer>
    </div>
  );
};

export default App;
