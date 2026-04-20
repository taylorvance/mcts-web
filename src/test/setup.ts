import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

const createStorageMock = () => {
  const storage = new Map<string, string>();

  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    },
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  configurable: true,
});

const fetchMock = vi.fn((input: RequestInfo | URL) => {
  const url = String(input);

  if(url.endsWith('/generated/complexity.json')) {
    return new Promise<Response>(() => {
      // App tests do not assert on complexity data, so keep the background
      // fetch pending to avoid un-awaited state updates from this panel.
    });
  }

  throw new Error(`Unhandled fetch in tests: ${url}`);
});

vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/mcts-web/');
  fetchMock.mockClear();
});
