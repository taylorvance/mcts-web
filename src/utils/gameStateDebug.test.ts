import { describe, expect, it } from 'vitest';
import { formatGameStateDebugLabel } from './gameStateDebug';

describe('formatGameStateDebugLabel', () => {
  it('normalizes multiline debug strings into a compact label', () => {
    expect(formatGameStateDebugLabel({
      toString: () => 'R :\nabcde/\nfg',
    })).toBe('R : abcde/ fg');
  });
});
