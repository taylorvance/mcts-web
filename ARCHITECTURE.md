# Architecture Notes

## Current Shape

- `src/App.tsx` is the application shell. It should focus on selected game, shared app settings, and high-level composition.
- `src/components/GameSessionView.tsx` renders the active game session UI and consumes the session hook.
- `src/hooks/useGameSession.ts` owns session concerns such as move history, replay, auto-play, and MCTS integration.
- `src/hooks/` is for orchestration concerns shared across games, such as MCTS integration and hotkey registration.
- `src/games/gameRegistry.ts` is the boundary where typed and legacy game definitions are adapted into the current shell-facing runtime API.
- `src/games/` holds game-specific code only.
- Migrated games should live in `src/games/<Game>/` with `state.ts`, `Board.tsx`, and `index.ts`.

## Game Module Convention

Each game module should expose:

- `name`
- `createInitialState()`
- `Board`

Rules for game modules:

- Keep React state inside the `Board` component, not inside plain render callbacks.
- Keep game-specific move parsing and rendering local to the game module.
- Keep shared UI out of game files unless it is genuinely reusable across multiple games.
- Prefer the typed `TypedGameDefinition<TState, TMove>` API for new games. Legacy string-based games should only be added when you are intentionally deferring migration.

## Testing Expectations

- Rules changes should add or update state-focused tests.
- Shared UI and app-shell changes should add at least one component test when behavior changes.
- `npm run lint`, `npm run test -- --run`, and `npm run build` are the baseline local checks.

## Near-Term Direction

- Move toward typed game definitions and per-game folders.
- Keep the app shell generic and keep game logic isolated.
