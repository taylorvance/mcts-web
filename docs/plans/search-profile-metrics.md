# Profile Metrics Proposal

Status: proposed

This is a design note for evolving the current `Game Complexity` panel into a broader profile surface that separates game shape, implementation cost, search behavior, and budget scaling.

## Why Change It

The current panel is useful, but it mixes together several different ideas under the name "complexity":

- game-tree shape from random playouts
- implementation/runtime cost for the current rules engine
- search throughput for a given machine

It does not currently say much about search confidence or diminishing returns.

The proposal below keeps the current data, but reframes it and adds a small number of higher-signal metrics.

## Recommended Rename

Rename `Game Complexity` to `Profile`.

Why:

- "complexity" sounds like a single canonical property of the game
- the panel already includes implementation cost, which is not game complexity
- future additions like budget scaling and search confidence fit naturally under `Profile`

Possible subtitles or helper copy:

- `Game shape, engine cost, and search behavior`
- `Offline game profile plus live search metrics`

## Core Framing

Treat the profile as four separate buckets:

1. `Game shape`
   Random-playout branching, game length, phase-by-phase spread, truncation.
2. `Implementation cost`
   `getLegalMoves`, `makeMove`, playout speed, method-level cost share.
3. `Search behavior`
   What the current search actually did under the chosen params.
4. `Budget scaling`
   How search behavior changes as budget increases and where returns flatten out.

This avoids forcing one scalar metric to carry too much meaning.

## Chart Recommendation

Recommended chart:

- use the bucket median as the main line
- add a darker IQR band from `p25` to `p75`
- add a lighter outer band from `p10` to `p90`
- keep hover text with `p10`, `p25`, `median`, `p75`, `p90`, and sample count

Why this is better:

- median is more robust than mean for skewed or spiky branching distributions
- IQR shows the typical spread without clutter
- the lighter `p10-p90` band shows broader volatility without overemphasizing true outliers
- the user can immediately tell whether "branching around 10" means "usually around 10" or "all over the place"

## Distribution Guidance For Cost Metrics

Yes, implementation cost should show spread, not only an average.

Means alone are risky because a few slow positions can dominate perceived latency.

Recommended summaries for cost metrics:

- `median`
- `p90`
- `mean`

Avoid leading with standard deviation in the UI.

Why:

- `p90` is easier to interpret than standard deviation
- latency-style metrics are usually skewed, so stddev is less intuitive
- median + p90 communicates typical case and bad-but-common case

Use stddev in exported JSON only if needed for analysis, not as a primary user-facing metric.

## Strength Versus User-Facing Profile

Engine strength is always relative, but it is not the main user-facing need for this panel.

For the app UI, the more useful concept is:

- `budget scaling`
  How results change as the search budget increases.

That answers the user-facing questions more directly:

- does more search help here?
- when do returns flatten out?

Developer-only comparisons such as:

- current branch vs `main`
- WIP branch vs baseline branch
- arena matchups between temporary variants

are useful during development, but they should remain transient CLI workflows and should not be saved into the user-facing generated profile artifact.

## Root Concentration And Exploration Constant

Root concentration depends on exploration constant, search budget, game, and phase. It is not a universal absolute truth.

It is still useful if presented as a contextual search-behavior metric rather than a global quality score.

Recommended interpretation:

- high concentration: the search is collapsing onto one move
- low concentration: the search is still spread across many contenders

Qualification text should make this explicit:

- `Contextual metric. Depends on budget, exploration setting, and position. Best used for comparing nearby runs, not different games in isolation.`

Recommended normalized presentation:

- `best move visit share`
- `top-2 visit gap`
- `root entropy normalized by legal move count`

That last one helps generalize interpretation:

- raw entropy depends on root branching
- normalized entropy gives a rough `0..1` spread score
- `0` means search is highly concentrated
- `1` means visits are nearly uniform across legal moves

Even then, it should still be framed as a contextual diagnostic, not a direct strength measure.

## Recommended Tree Quality Metrics

These are the highest-value candidates for the live search UI.

### Tier 1: Show By Default

- `Iterations`
- `Elapsed time`
- `Rounds/sec`
- `Retained nodes`
- `Best move visit share`
- `Top-2 visit gap`

These are compact and easy to explain.

### Tier 2: Show In An Expandable "Search Confidence" Section

- `Normalized root entropy`
- `Effective root branching`
  Count children above a small visit threshold such as `>= 1%` of root visits.
- `Principal variation depth`
  Depth along the best-child chain before the line becomes too underexplored.
- `Tree reuse rate`
  Fraction of prior-root visits or nodes preserved after advancing the move.

### Tier 3: Offline Or Advanced Diagnostics

- `Move stability across seeds`
- `Value stability across seeds`
- `Search agreement across budgets`
- `Visit distribution by depth`

These are valuable, but too heavy or too nuanced for the default game UI.

## Budget Scaling Curve

This is one of the best additions.

The goal is to answer:

- where do stronger budgets stop changing the chosen move much?
- where do returns start flattening?
- which games/settings benefit from extra search, and which mostly burn CPU?

Recommended x-axis:

- iterations for deterministic comparisons
- time budget as an alternative view for user-facing tuning

Recommended y-values:

- `best move agreement vs reference budget`
- `root concentration`
- `normalized entropy`
- `relative value improvement vs reference budget`
- `head-to-head win rate vs lower budget`

Best default version:

- compare each budget to a high-budget reference for the same position set
- plot `move agreement` and `top-1 visit share`

Good interpretation:

- if move agreement plateaus early, returns are diminishing
- if agreement keeps moving late, the position/game remains search-sensitive

## Proposed Panel Structure

Do not dump all metrics into one card grid.

Recommended structure:

### Section 1: Game Shape

- opening branching
- average branching
- average game length
- truncation rate
- branching by ply bucket chart with median line, dark IQR band, and light `p10-p90` band

### Section 2: Engine Cost

- `getLegalMoves` median / p90
- `makeMove` median / p90
- playout plies/sec
- optional method-cost breakdown link or details expander

### Section 3: Search Behavior

- iterations
- elapsed time
- rounds/sec
- retained nodes
- best move visit share
- top-2 visit gap
- normalized root entropy

### Section 4: Budget Scaling

- small budget scaling chart
- helper text: `Compared against the highest tested budget on sampled benchmark positions`

## Offline Versus Live Data

Keep these split.

Offline generated data:

- game shape
- implementation cost distributions
- budget scaling curves on benchmark scenarios

Live per-search data:

- iterations
- elapsed time
- rounds/sec
- retained nodes
- root concentration
- top-2 gap
- entropy
- effective branching

This split matters because offline metrics are more stable, while live metrics are position- and setting-dependent.

## Data Model Changes

Recommended additions to `complexity.json` or a renamed profile artifact:

- `branchingByBucket[].p10`
- `branchingByBucket[].p25`
- `branchingByBucket[].median`
- `branchingByBucket[].p75`
- `branchingByBucket[].p90`
- `runtime.getLegalMoves`
  With `mean`, `median`, `p90`, `min`, `max`.
- `runtime.makeMove`
  With `mean`, `median`, `p90`, `min`, `max`.
- `sampling.truncationRate`
- `scaling`
  Per scenario and budget ladder, with agreement/confidence summaries.

Recommended user-facing artifact:

- `generated/profile.json`
  Game shape, implementation cost, and budget scaling.

Developer comparison outputs should stay transient and should not be shipped in `public/generated`.

## Implementation Phases

### Phase 1: Rename And Clarify

- rename the panel to `Profile`
- relabel current complexity score as a tree-width proxy
- surface truncation rate more clearly
- add methodology/help text for what is and is not being measured

### Phase 2: Improve Distributions

- extend branching buckets with `p10`, `p25`, `median`, `p75`, and `p90`
- update chart to median line + dark IQR band + light `p10-p90` band
- change implementation-cost cards from single mean to median + p90

### Phase 3: Add Live Search Behavior

- add best move visit share
- add top-2 visit gap
- add normalized root entropy
- add effective root branching

### Phase 4: Add Budget Scaling

- define benchmark scenarios and budget ladder
- generate move-agreement and confidence curves
- display a compact diminishing-returns chart

## Non-Goals

- one universal "game difficulty" score
- pretending search-confidence metrics are engine-strength metrics
- mixing live per-position diagnostics with offline per-game summaries without labels
- exposing every advanced metric by default
- shipping transient developer arena comparison data in the user-facing profile artifact

## Recommended Defaults

If only a few things are added, the best compact upgrade is:

1. rename panel to `Profile`
2. show a median branching line, dark IQR band, and light `p10-p90` band
3. show truncation rate
4. show implementation cost as median + p90 instead of just mean
5. add live `best move visit share` and `top-2 gap`
6. add an offline budget scaling chart

That would materially improve interpretability without making the panel feel academic or overloaded.

## Open Questions

- Should budget scaling be global per game, or scenario-based with a scenario selector?
- Should live search metrics appear in the same panel as offline profile data, or in a separate `Current Search` card?
- Is root entropy worth showing directly, or only via a friendlier label such as `search spread`?

## Deferred Idea

Relative strength may be added later if we can define a stable shipped baseline and a comparison metric that users will not misread.
