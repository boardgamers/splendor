# Splendor for boardgamers.space

An **unofficial, open-source fan implementation** of the board game **Splendor** (base game, 2–4 players, no expansions) for the [boardgamers.space](https://boardgamers.space) platform. Splendor is a trademark of Space Cowboys / Asmodee; this project is not affiliated with or endorsed by the publisher. Gem colors, card costs and noble requirements are functional game rules data reproduced for interoperability.

## Rules & data sources

The game rules and the card/noble data are **not** re-derived by this project — they reproduce the published base game:

- **Rules**: the official rulebook ([PDF, English](https://bghub.org/r/splendor.pdf); [publisher's game page](https://www.spacecowboys-games.com/game/splendor)). The rules logic in `packages/engine/src/` implements these rules faithfully.
- **Card & noble data** (`packages/engine/src/data.ts`): the published list of 90 development cards (40/30/20) and 10 nobles. This data was transcribed from and cross-verified against two independent open-source implementations that agree exactly — [bouk/splendimax](https://github.com/bouk/splendimax) (`Splendor Cards.csv`, `src/noble.rs`) and [seal256/splendor](https://github.com/seal256/splendor) (`assets/cards.csv`, noble constants).

Gem colors, card costs, bonus colors, prestige values and noble requirements are functional game rules; they are reproduced here for interoperability and are not creative content owned by this project.

## Layout

```
packages/engine    splendor-engine    Rules logic, consumed server-side by the BGS game-server.
                                      Entry point: dist/wrapper.js (BGS Engine API).
packages/viewer    splendor-viewer    Browser UI (Svelte 5 runes + Vite). Built as a single
                                      IIFE bundle exposing window.splendor.launch(selector).
README.md
AGENTS.md
```

The repo is a pnpm workspace. There is no separate `apps/dev` package: the dev harness lives in
the viewer (`packages/viewer/index.html` + `src/dev.ts` + `src/dev-backend.ts`) and runs on the
same Vite dev server — `pnpm dev` is all you need.

## Develop

Requirements: Node >= 24, pnpm 11.

```bash
pnpm install
pnpm dev
```

This starts Vite and serves `packages/viewer/index.html`: a hot-seat harness mounting the viewer
through the exact BGS entry point (`window.splendor.launch('#app')`) with a mock backend — you
(player 0) versus bots playing random legal moves, using the real engine in-process. State and
`player` events are wired the way BGS sends them.

Query params: `?players=2..4&seed=<string>`.

## Test / typecheck / build

```bash
pnpm tsc     # engine tsc --noEmit + viewer svelte-check
pnpm test    # engine unit tests (node --test)
pnpm build   # engine -> packages/engine/dist; viewer -> packages/viewer/dist
pnpm check   # all of the above
```

`pnpm build` produces the publish-ready viewer artifacts:

- `packages/viewer/dist/splendor-viewer.iife.js` (global `splendor`, single file, engine inlined)
- `packages/viewer/dist/splendor-viewer.css` (all styles, single file)

## How the BGS integration works

Two pieces are registered in the BGS admin panel (see "New Boardgame"):

1. **Engine** — an npm package (`splendor-engine`, or `@boardgamers/splendor-engine` once
   published). Registration fields: `engine.package.name` / `engine.package.version`,
   `engine.entryPoint: "dist/wrapper.js"`. The game-server installs it with npm and dynamic-imports
   the entry point; `packages/engine/wrapper.ts` implements the full BGS Engine API
   (`init`, `move`, `ended`, `scores`, `rankings`, `dropPlayer`, `currentPlayer`, `logLength`,
   `logSlice`, `setPlayerMetaData`, `stripSecret`, `toSave`, `messages`, `replay`, `round`,
   `cancelled`, `factions`).

2. **Viewer** — the IIFE bundle served from jsdelivr:
   - `viewer.url`: `//cdn.jsdelivr.net/npm/splendor-viewer@<version>/dist/splendor-viewer.iife.js`
   - `viewer.topLevelVariable`: `splendor`
   - stylesheet: `//cdn.jsdelivr.net/npm/splendor-viewer@<version>/dist/splendor-viewer.css`
   - mark the game `replayable`.

   The BGS host page loads the bundle in an iframe, calls `window.splendor.launch('#app')`, and
   bridges events over postMessage. Downlink (host → viewer): `state`, `state:updated`, `gamelog`,
   `player`, `avatars`, `preferences`, `replay:start` / `replay:to` / `replay:end`. Uplink
   (viewer → host): `ready`, `move`, `fetchState`, `fetchLog`, `addLog`, `replaceLog`,
   `player:clicked`, `update:preference`, `replay:info`.

## Rules notes / design decisions

- Full base game: 90 development cards (40/30/20 across tiers 1–3 with official costs, bonuses and
  prestige) and 10 nobles (4+4 or 3+3+3 bonus requirements, 3 prestige each), bank of 4/5/7 gems
  per color for 2/3/4 players, 5 gold.
- A turn is exactly one action: take 3 different gems, take 2 of the same color (only if the bank
  holds ≥ 4 of it), reserve 1 card (from a row or blind from a deck, +1 gold if available, max 3
  reserved), or buy 1 card (table or reserved; gold is wild; owned bonuses discount the cost).
- **10-gem hand limit**: a take/reserve action that would leave the player above 10 gems is illegal
  (the engine rejects it; the UI disables such actions and says why). There is no gem-return move.
- Nobles: after an action, if exactly one noble is satisfied the visit is automatic; if several,
  the player's turn stays pending until they pick one (`{action:"noble"}` move).
- Game end: reaching ≥ 15 prestige triggers the final round; everyone plays the same number of
  turns. Most prestige wins; ties broken by fewest purchased cards; full ties are a shared victory.
- Determinism: all shuffles use a seeded PRNG (`seedrandom`), so a seed + the move log fully
  reproduce a game (`replay`).
- Hidden information: the face-down decks are always stripped by `stripSecret`. Reserved cards are
  provenance-tracked: a card reserved **from the table** is public info and shown face-up to
  everyone, while a card reserved **blind from a deck** is secret and stripped (shown as a `-1`
  placeholder preserving the count). A player always sees all their own reserved cards.
- Game setup option **`hideReserved`** (boolean): when `true`, all opponents' reserved cards are
  hidden regardless of provenance (strict mode, like the official app). Default off. This is a BGS
  game option: register it in the gameinfo doc's `options` array as
  `{ "name": "hideReserved", "label": "Hide reserved cards from other players", "type": "checkbox", "items": null }`
  — BGS passes it flat into `init(players, expansions, options, seed)` when the host checks it.

## Status / TODO

Done: complete engine + tests, BGS wrapper, viewer (board, bank, nobles, player panels, action
bar with take/take2/buy/reserve flows, noble choice, game-end banner, spectator mode), dev
harness verified in a real browser (move loop + bots work).

Next iterations: replay-mode polish (`replay:info` wiring is basic), avatars/preferences UI,
`fetchLog` usage for incremental logs, sounds (intentionally skipped), publish both packages to
npm and register the game in the BGS admin panel. When registering, declare the `hideReserved`
checkbox option (see the rules section above) in the gameinfo doc's `options` array.
