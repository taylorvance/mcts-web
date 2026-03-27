# mcts-web

`mcts-web` is a React playground for experimenting with Monte Carlo Tree Search across several turn-based board games. It lets you play moves manually, hand control to the AI, autoplay full games, inspect move history, and view the current search tree while tuning MCTS settings.

Current games:
- Connect Four
- Tic-Tac-Toe
- Ultimate Tic-Tac-Toe
- Filler
- Onitama
- Othello

## Stack

- React 18 + TypeScript
- Vite for local development and builds
- Tailwind CSS for styling
- [`multimcts`](https://www.npmjs.com/package/multimcts) for the core search engine
- Vitest + Testing Library for tests

Use Node 20 to match CI.

## Getting Started

```bash
npm install
npm run dev
```

Open the local Vite URL and choose a game from the selector. The app starts on `TicTacToe`.

## Common Commands

```bash
npm run dev            # start the local dev server
npm run benchmark      # benchmark deterministic MCTS search scenarios
npm run benchmark:complexity -- --samples 100 --max-plies 160  # generate complexity data
npm run benchmark:compare -- origin/main HEAD  # compare two refs
npm run benchmark:strength -- origin/main HEAD  # play head-to-head matches between two refs
npm run lint           # run ESLint
npm run test -- --run  # run tests once
npm run build          # type-check and build for production
npm run preview        # preview the production build
```

If you prefer `make`, the repo also provides `make setup`, `make lint`, `make test`, and `make build`.

## Controls

The session view exposes the same controls for every game:

- `r`: reset
- `z` / `x`: undo / redo
- `h`: toggle history
- `n`: request one AI move
- `p`: toggle autoplay
- `a`: toggle “AI moves after player”

The right panel shows the current search tree and the active MCTS settings. Search trees are reused across repeated searches and advanced when the chosen move already exists in the explored tree.

Below the search tree, the `Game Complexity` panel shows pre-generated per-game profiling data. Its expanded/collapsed state is persisted locally.

## Benchmarking

The repo includes a small CLI harness for measuring raw MCTS search speed on deterministic positions outside the browser. That makes branch-to-branch comparisons much less noisy than timing the UI by hand.

```bash
npm run benchmark -- --iterations 5000 --samples 25
npm run benchmark -- --game Onitama --iterations 10000
npm run benchmark:complexity -- --samples 100 --max-plies 160
npm run benchmark:compare -- origin/main HEAD --iterations 5000 --samples 25
npm run benchmark:strength -- origin/main HEAD --iterations 3000
```

The throughput compare command creates temporary worktrees for both refs, injects the benchmark harness, and prints a rounds-per-second delta. The strength compare command uses the same deterministic scenarios to play equal-budget head-to-head games while swapping who moves first.

The complexity profiler samples full games with deterministic random playouts and writes chart-ready JSON to `public/generated/complexity.json`. It reports branching by ply and ply bucket, game-length distributions, truncation counts, cumulative complexity summaries, and runtime costs such as average `getLegalMoves`, `makeMove`, and random playout timing.

These commands measure search speed and move quality, not React render performance; use the browser profiler separately if the slowdown feels UI-specific.

## Project Layout

```text
docs/          durable project docs and deferred plans
src/
  components/   shared UI such as the session view, tree viewer, and controls
  games/        per-game rules, boards, tests, and the game registry
  hooks/        app/session orchestration and MCTS integration
  test/         shared test helpers
  utils/        small cross-cutting utilities
```

`src/App.tsx` is intentionally small and acts as the app shell. `src/components/GameSessionView.tsx` owns the common session UI. `src/hooks/useGameSession.ts` manages history, replay, autoplay, and AI flow. `src/games/gameRegistry.ts` is the only place where games are wired into the shell.

## Adding or Changing a Game

Prefer the typed game API. A migrated game should live in `src/games/<Game>/` and usually contain:

- `state.ts` for rules and move/state transitions
- `Board.tsx` for React UI and local interaction state
- `index.ts` for the exported typed game definition
- `state.test.ts` for rules coverage

Game boards should work with typed moves locally and only encode to strings at the registry boundary.

## Quality Bar

Before committing, run:

```bash
npm run lint
npm run test -- --run
npm run build
```

Rules changes should include state-focused tests. UI or shell changes should include at least one behavioral test when flow changes.

Lightweight reminders live in `TODO.md`. Durable plans live under `docs/plans/`. Start with `docs/README.md`, then see `docs/plans/tak.md` for an example. Repository-specific working conventions live in `AGENTS.md`.
