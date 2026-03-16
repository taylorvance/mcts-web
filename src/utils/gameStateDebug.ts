export interface DebugStringState {
  toString: () => string;
}

export const formatGameStateDebugLabel = (state: DebugStringState) => (
  state.toString().replace(/\s+/g, ' ').trim()
);
