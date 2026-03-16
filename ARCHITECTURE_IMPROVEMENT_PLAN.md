# Architecture Improvement Plan

## Goals
- Make the game integration API type-safe and React-safe.
- Reduce `src/App.tsx` to a thin app shell.
- Separate game rules, game UI, and session orchestration.
- Add enough tests and tooling to change game logic with confidence.
- Improve extensibility so adding a new game is mostly local work.

## Current Problems
- `src/App.tsx` owns too many concerns: game selection, move application, history, autoplay, AI timing, hotkeys, and layout.
- The `Game` API is minimal but weak. It accepts a base `GameState` and string moves everywhere, which forces runtime type guards in each game.
- The `render(state, onMove)` contract is too limited for richer games. `Onitama` already works around this by using React state inside a plain render function.
- Game implementations mix rules and UI in single files, which is convenient early but slows maintenance.
- There is no automated test harness for state transitions, replay, or game-specific behavior.

## Target Architecture
Move toward three layers:

1. App shell
   Responsible for layout, selected game, MCTS settings, and shared controls.

2. Session layer
   A reducer or custom hook that owns:
   - current state
   - initial state
   - encoded move history
   - undo/redo
   - autoplay / pending AI move
   - MCTS lifecycle

3. Game modules
   Each game should provide:
   - rules/state implementation
   - move codec between UI-friendly moves and engine-friendly strings
   - React board component
   - tests

Suggested structure:

```text
src/
  app/
    AppShell.tsx
    useGameSession.ts
    useHotkeys.ts
    gameRegistry.ts
  games/
    tic-tac-toe/
      index.ts
      state.ts
      Board.tsx
      state.test.ts
```

## Proposed Game API
Replace the current `Game` interface with a typed definition that keeps string encoding at the engine boundary instead of exposing it everywhere:

```ts
interface GameDefinition<TState extends GameState, TMove> {
  id: string;
  name: string;
  createInitialState(): TState;
  encodeMove(move: TMove, state: TState): string;
  decodeMove(encoded: string, state: TState): TMove;
  Board: React.ComponentType<{
    state: TState;
    onMove: (move: TMove) => void;
    disabled: boolean;
  }>;
}
```

Why this is better:
- UI components work with typed moves instead of opaque strings.
- Games can use normal React components and hooks.
- Runtime type guards mostly disappear from board rendering.
- The app shell stays generic while still supporting `multimcts`.

## Phased Plan

## Phase 1: Stabilize the Base
Scope: small, low-risk refactors.

- Add a real test runner (`Vitest`) and basic component testing support.
- Install and enforce lint rules that catch hook misuse and unused code.
- Add a lightweight architecture README for the app shell and game module conventions.
- Fix hook rule violations before deeper changes.

Exit criteria:
- `lint` and `test` run locally and in CI.
- No hooks are called from non-component render callbacks.

## Phase 2: Extract Session Logic
Scope: move orchestration out of `App.tsx`.

- Create `useGameSession` with a reducer for move application, reset, history, autoplay, and replay.
- Move hotkey registration into a dedicated hook.
- Move MCTS state handling behind a clearer interface that returns search status and tree data.
- Keep the existing UI behavior intact while shrinking `App.tsx`.

Exit criteria:
- `App.tsx` becomes mostly composition and layout.
- Undo/redo/reset/autoplay behavior is covered by tests.

## Phase 3: Introduce the New Game Definition
Scope: define the new API without migrating every game at once.

- Create `GameDefinition<TState, TMove>` and a typed registry.
- Update the shell to render a `Board` component instead of calling a `render` function.
- Preserve encoded string moves only where the MCTS engine requires them.
- Add adapter utilities if needed so old and new game modules can temporarily coexist.

Exit criteria:
- The shell supports at least one game using the new API.
- New board components can use hooks normally.

## Phase 4: Migrate Games Incrementally
Suggested order:

1. `TicTacToe`
2. `UltimateTicTacToe`
3. `Filler`
4. `Onitama`

Migration checklist for each game:
- Split rules into `state.ts`.
- Move rendering into `Board.tsx`.
- Replace runtime casts with typed props.
- Add rules tests for legal moves, terminal conditions, and rewards.
- Add replay tests to confirm encoded history rebuilds the same state.

Why this order:
- `TicTacToe` is the smallest reference implementation.
- `Onitama` should move last because it is the strongest proof that the new API supports local UI state cleanly.

## Phase 5: Harden the Platform
Scope: improve maintainability and performance after migration.

- Add shared test helpers for game state invariants.
- Define a standard `toString` / debug contract for tree inspection.
- Consider preserving MCTS instances across repeated searches when settings and state lineage allow it.
- If search blocks interaction on larger games, move search execution into a Web Worker.

Exit criteria:
- Every game has state tests.
- App-level flows and at least one board interaction path are covered.
- Performance work is driven by measured pain, not guesswork.

## Pull Request Sequence
- PR 1: testing + lint guardrails
- PR 2: `useGameSession` extraction
- PR 3: typed `GameDefinition` + shell support
- PR 4: migrate `TicTacToe`
- PR 5: migrate remaining games
- PR 6: cleanup, dead code removal, performance follow-up

## Success Metrics
- `src/App.tsx` is reduced to shell composition and stays small.
- Adding a new game does not require editing orchestration logic beyond registry wiring.
- Game boards use normal React component patterns, including hooks.
- Rules are testable without rendering the UI.
- Move history, autoplay, and replay behavior are reliable across all games.
