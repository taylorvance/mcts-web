export const APP_STORAGE_KEY = 'mcts-web:app:v2';
export const GAME_SESSION_STORAGE_KEY_PREFIX = 'mcts-web:session:v1:';

export const getGameSessionStorageKey = (gameId: string) => `${GAME_SESSION_STORAGE_KEY_PREFIX}${gameId}`;

export const readJsonStorage = <T>(key: string): T | null => {
  if(typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
};

export const writeJsonStorage = (key: string, value: unknown) => {
  if(typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
};

export const removeStorageKey = (key: string) => {
  if(typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage-access failures.
  }
};
