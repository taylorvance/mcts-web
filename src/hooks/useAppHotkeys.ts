import { useHotkeys } from '@taylorvance/tv-shared-web/hotkeys';

interface HotkeyConfig {
  keys: string;
  callback: () => void;
}

interface AppHotkeysConfig {
  reset: HotkeyConfig;
  undo: HotkeyConfig;
  redo: HotkeyConfig;
  toggleHistory: HotkeyConfig;
  aiMove: HotkeyConfig;
  autoplay: HotkeyConfig;
  aiAfterPlayer: HotkeyConfig;
}

export const useAppHotkeys = (hotkeys: AppHotkeysConfig) => {
  useHotkeys([
    { keys: hotkeys.reset.keys, callback: hotkeys.reset.callback },
    { keys: hotkeys.undo.keys, callback: hotkeys.undo.callback },
    { keys: hotkeys.redo.keys, callback: hotkeys.redo.callback },
    { keys: hotkeys.toggleHistory.keys, callback: hotkeys.toggleHistory.callback },
    { keys: hotkeys.aiMove.keys, callback: hotkeys.aiMove.callback },
    { keys: hotkeys.autoplay.keys, callback: hotkeys.autoplay.callback },
    { keys: hotkeys.aiAfterPlayer.keys, callback: hotkeys.aiAfterPlayer.callback },
  ], {
    enableOnFormTags: false,
  });
};
