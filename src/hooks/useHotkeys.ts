// src/hooks/useHotkeys.ts
import { useEffect } from 'react';
import { HOTKEYS } from '../config/hotkeys';

type HotkeyHandlers = {
  [key in keyof typeof HOTKEYS]?: () => void;
};

export const useHotkeys = (handlers: HotkeyHandlers) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      for (const [action, hotkey] of Object.entries(HOTKEYS)) {
        if (key === hotkey && handlers[action as keyof HotkeyHandlers]) {
          event.preventDefault();
          handlers[action as keyof HotkeyHandlers]?.();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); };
  }, [handlers]);
};
