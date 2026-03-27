import { expect } from 'vitest';
import { GameState } from 'multimcts';
import { TypedGameDefinition } from '../types/Game';
import { formatGameStateDebugLabel } from '../utils/gameStateDebug';

interface ReplayExpectationOptions<
  TState extends GameState<TMove, TTeam, TState>,
  TMove,
  TTeam = string,
> {
  initialState: TState;
  moves: TMove[];
  definition: TypedGameDefinition<TState, TMove, TTeam>;
  applyMove: (state: TState, move: TMove) => TState;
}

export const expectEncodedReplayToMatchTypedReplay = <
  TState extends GameState<TMove, TTeam, TState>,
  TMove,
  TTeam = string,
>({
  initialState,
  moves,
  definition,
  applyMove,
}: ReplayExpectationOptions<TState, TMove, TTeam>) => {
  let encodedReplayState = initialState;
  let typedReplayState = initialState;

  for(const move of moves) {
    typedReplayState = applyMove(typedReplayState, move);
    encodedReplayState = applyMove(
      encodedReplayState,
      definition.deserializeMove(
        definition.serializeMove(move, encodedReplayState),
        encodedReplayState,
      ),
    );
  }

  expect(formatGameStateDebugLabel(encodedReplayState)).toBe(
    formatGameStateDebugLabel(typedReplayState),
  );

  return { encodedReplayState, typedReplayState };
};
