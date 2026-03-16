import { GameState } from 'multimcts';
import { expect } from 'vitest';
import { TypedGameDefinition } from '../types/Game';
import { formatGameStateDebugLabel } from '../utils/gameStateDebug';

interface ReplayExpectationOptions<TState extends GameState, TMove> {
  initialState: TState;
  moves: TMove[];
  definition: TypedGameDefinition<TState, TMove>;
  applyMove: (state: TState, move: TMove) => TState;
}

export const expectEncodedReplayToMatchTypedReplay = <TState extends GameState, TMove>({
  initialState,
  moves,
  definition,
  applyMove,
}: ReplayExpectationOptions<TState, TMove>) => {
  let encodedReplayState = initialState;
  let typedReplayState = initialState;

  for(const move of moves) {
    typedReplayState = applyMove(typedReplayState, move);
    encodedReplayState = encodedReplayState.makeMove(
      definition.encodeMove(move, encodedReplayState),
    ) as TState;
  }

  expect(formatGameStateDebugLabel(encodedReplayState)).toBe(
    formatGameStateDebugLabel(typedReplayState),
  );

  return { encodedReplayState, typedReplayState };
};
