# Repository Guidelines

## Project Structure & Module Organization
`src/main.tsx` boots the Vite app, and `src/App.tsx` wires together game selection, move history, autoplay, and MCTS controls. Put each playable game in `src/games/*.tsx`; each module should satisfy the `Game` interface in `src/types/Game.ts`. Keep reusable UI in `src/components`, shared logic in `src/hooks`, and type shims in `src/types`. Static files live in `public/` and `src/assets/`. Build output lands in `dist/`; do not edit generated files.

## Build, Test, and Development Commands
Use npm for dependency management because `package-lock.json` is checked in.

- `npm install` or `make setup`: install dependencies.
- `npm run dev` or `make start`: start the local Vite dev server with HMR.
- `npm run build` or `make build`: run TypeScript build checks and emit the production bundle to `dist/`.
- `npm run lint` or `make lint`: run ESLint across `.ts` and `.tsx` files.
- `npm run preview`: serve the production build locally.
- `npm run deploy` or `make deploy`: publish `dist/` to GitHub Pages.

## Coding Style & Naming Conventions
This repo uses React 18, TypeScript, Vite, Tailwind, and ESLint. Prefer functional components and strict typing; `tsconfig.app.json` enables `strict`, `noUnusedLocals`, and `noUnusedParameters`. Match the surrounding file style, but prefer two-space indentation, semicolons, and single quotes in new TS/TSX. Use PascalCase for components and game modules (`UltimateTicTacToe.tsx`), `use...` naming for hooks (`useMCTS.ts`), and keep shared UI generic rather than game-specific.

## Testing Guidelines
Vitest is configured for automated tests. Treat `npm run lint`, `npm run test`, and `npm run build` as the required pre-PR checks. Place new tests near the feature or under `src/__tests__/` and keep the corresponding command in `package.json`.

## Commit & Pull Request Guidelines
Recent history uses short, imperative commit subjects with no trailing period, for example `Tweak filler tie scoring` and `Remove artificial delay for moves`. Keep commits narrowly scoped. Pull requests should explain the behavior change, summarize local validation, link the relevant issue when applicable, and include screenshots or GIFs for UI updates. If you change deployment behavior, verify the GitHub Pages workflow and Vite `base` setting still match `/mcts-web/`.
