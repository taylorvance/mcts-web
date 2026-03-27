# Tak Implementation Plan

Status: parked

This is a future-work plan for adding Tak to `mcts-web`. It is intentionally scoped as a design note, not an active implementation checklist.

## Why Tak Is A Bigger Lift

Tak fits the app's generic `GameState` and MCTS shell, but it is materially more complex than the current board games because it combines:

- reserve management
- stacked pieces with top-piece control
- three piece types: flat, wall, and capstone
- opening placement exceptions
- carry and spread moves with ordered drop patterns
- multiple win conditions: road win and flat win
- established external notation formats: PTN and TPS

The shell integration is straightforward. The rules engine and move generation are the expensive parts.

## Recommended V1 Scope

Build the smallest useful version first:

- fixed 5x5 board size only
- human play plus AI play through the existing MCTS flow
- internal typed move model first
- PTN/TPS support after rules correctness
- simple 2D stack rendering
- correctness-focused tests before performance tuning

Non-goals for V1:

- multiple board sizes
- PTN import/export UI
- saved game libraries
- polished stack animation
- heavy Tak-specific heuristics

## External References

Use these as references for rules, notation, and engine structure:

- USTak PTN: <https://ustak.org/portable-tak-notation/>
- USTak TPS: <https://ustak.org/tak-positional-system-tps/>
- `tiltak`: <https://github.com/MortenLohne/tiltak>
- `ViliamVadocz/tak`: <https://github.com/ViliamVadocz/tak>

These should be treated as reference implementations and notation guides, not translation targets.

## Proposed Data Model

Represent the board as an array of stacks:

- `type TakPiece = 'WF' | 'WS' | 'WC' | 'BF' | 'BS' | 'BC'`
- `type TakStack = TakPiece[]`
- `board: TakStack[]`

Track per-state metadata:

- side to move
- reserves remaining for each player
- capstone availability for each player
- opening-turn state
- move count
- cached winner or terminal state when cheap to maintain

The top piece determines control of a stack. Internal move objects should stay structured rather than string-based:

- placement moves: placement kind plus destination
- spread moves: source, direction, carry count, and ordered drops

String encoding should happen at the game-boundary layer, the same way the app already treats other typed games.

## Implementation Phases

### Phase 1: Rules Core

- define core types
- implement initial state for 5x5
- implement legal placements
- implement legal stack spreads
- enforce standing-stone and capstone rules
- implement state transitions

### Phase 2: Terminal Logic

- detect road wins after every move
- detect flat-win conditions when the board or reserves are exhausted
- resolve ties and winner calculation consistently

### Phase 3: App Integration

- add `src/games/Tak/state.ts`
- add `src/games/Tak/Board.tsx`
- add `src/games/Tak/index.ts`
- register the game in `src/games/gameRegistry.ts`

### Phase 4: Serialization

- define a stable serialized state shape for local persistence
- keep the app's internal move encoding simple and lossless
- optionally add PTN/TPS conversion helpers behind the typed interface

### Phase 5: Testing

Minimum test matrix:

- opening placements
- reserve depletion
- legal and illegal spreads
- wall blocking
- capstone flattening
- road win detection for both players
- flat-win detection
- encoded replay parity
- at least one board interaction test through the registry

### Phase 6: Search Quality And Performance

- benchmark baseline branching and playout speed
- identify expensive move-generation paths
- add targeted optimizations only after correctness is stable

## Main Risks

- spread-move generation bugs
- incorrect road detection on stacked boards
- overly allocation-heavy move generation hurting MCTS throughput
- premature PTN/TPS work before internal rules are reliable

## Estimated Effort

For this repo, a reasonable expectation is:

- a few focused days for a playable 5x5-only implementation with tests
- longer if PTN/TPS, multiple board sizes, or search-strength work are included up front

That estimate is based on the current codebase shape and Tak's rules complexity, not on an existing branch.

## If This Ever Becomes Active

Start with a pure rules/test pass first. Do not begin with UI polish or notation parsing.
