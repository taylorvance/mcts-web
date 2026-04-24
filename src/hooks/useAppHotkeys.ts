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
  autoPlay: HotkeyConfig;
  autoReply: HotkeyConfig;
}

export const useAppHotkeys = (hotkeys: AppHotkeysConfig) => {
  useHotkeys([
    { keys: hotkeys.reset.keys, callback: hotkeys.reset.callback },
    { keys: hotkeys.undo.keys, callback: hotkeys.undo.callback },
    { keys: hotkeys.redo.keys, callback: hotkeys.redo.callback },
    { keys: hotkeys.toggleHistory.keys, callback: hotkeys.toggleHistory.callback },
    { keys: hotkeys.aiMove.keys, callback: hotkeys.aiMove.callback },
    { keys: hotkeys.autoPlay.keys, callback: hotkeys.autoPlay.callback },
    { keys: hotkeys.autoReply.keys, callback: hotkeys.autoReply.callback },
  ], {
    enableOnFormTags: false,
  });
};
