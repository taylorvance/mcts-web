import { useHotkeys } from 'react-hotkeys-hook';

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
  useHotkeys(hotkeys.reset.keys, hotkeys.reset.callback);
  useHotkeys(hotkeys.undo.keys, hotkeys.undo.callback);
  useHotkeys(hotkeys.redo.keys, hotkeys.redo.callback);
  useHotkeys(hotkeys.toggleHistory.keys, hotkeys.toggleHistory.callback);
  useHotkeys(hotkeys.aiMove.keys, hotkeys.aiMove.callback);
  useHotkeys(hotkeys.autoplay.keys, hotkeys.autoplay.callback);
  useHotkeys(hotkeys.aiAfterPlayer.keys, hotkeys.aiAfterPlayer.callback);
};
