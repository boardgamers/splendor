import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cancelled,
  currentPlayer,
  dropPlayer,
  ended,
  factions,
  init,
  logLength,
  logSlice,
  messages,
  move,
  rankings,
  replay,
  round,
  scores,
  setPlayerMetaData,
  stripSecret,
  toSave
} from "../wrapper.js";
import type { GameState, Move } from "./types.js";

async function fresh(players = 2, seed = "wrapper-seed"): Promise<GameState> {
  const state = await init(players, [], {}, seed);
  for (let i = 0; i < players; i++) state.players[i]!.name = NAMES[i]!;
  return state;
}

const NAMES = ["Ada", "Boris", "Cleo", "Dora"];

const TAKE: Move = { action: "take", gems: ["diamond", "ruby", "onyx"] };

describe("wrapper", () => {
  it("init + metadata + factions + currentPlayer", async () => {
    const state = await fresh(3);
    assert.equal(state.players.length, 3);
    assert.deepEqual(factions(state), ["Ada", "Boris", "Cleo"]);
    assert.equal(currentPlayer(state), 0);
    assert.equal(ended(state), false);
    assert.equal(round(state), 1, "the first round is round 1");
    assert.equal(logLength(state), 1);
  });

  it("move throws on illegal moves and advances turns", async () => {
    let state = await fresh();
    await assert.rejects(() => move(state, TAKE, 1), /turn/);
    state = await move(state, TAKE, 0);
    assert.equal(currentPlayer(state), 1);
    assert.equal(round(state), 1);
    state = await move(state, { action: "take2", color: "sapphire" }, 1);
    assert.equal(currentPlayer(state), 0, "after player 1's move the turn returns to player 0");
    assert.equal(round(state), 2, "once everyone played, round 2 starts");
  });

  it("messages drains events", async () => {
    let state = await fresh();
    state = await move(state, TAKE, 0);
    const first = messages(state);
    assert.ok(first.messages.some((m) => m.includes("Ada takes")));
    const second = messages(first.data as GameState);
    assert.deepEqual(second.messages, []);
  });

  it("stripSecret hides decks and other players' reserved cards", async () => {
    let state = await fresh();
    state = await move(state, { action: "reserve", cardId: state.table[0][0]! }, 0);
    state = await move(state, { action: "reserve", tier: 2 }, 1);

    const forZero = stripSecret(state, 0) as GameState;
    assert.deepEqual(forZero.decks.flat(), new Array(35 + 25 + 16).fill(-1));
    assert.deepEqual(forZero.players[0]?.reserved, state.players[0]?.reserved, "own reserved cards stay visible");
    assert.deepEqual(forZero.players[1]?.reserved, [-1], "opponent reserved cards become face-down");
    assert.equal(forZero.players[1]?.reserved.length, 1, "the count is preserved");

    const spectator = stripSecret(state) as GameState;
    assert.deepEqual(spectator.players[0]?.reserved, [-1]);
    assert.deepEqual(spectator.players[1]?.reserved, [-1]);

    const negative = stripSecret(state, -1) as GameState;
    assert.deepEqual(negative.players[0]?.reserved, [-1]);
  });

  it("logSlice returns slices and availableMoves only without end", async () => {
    let state = await fresh();
    state = await move(state, TAKE, 0);
    const slice = logSlice(state, { player: 0 });
    assert.equal(slice.log.length, 2);
    assert.ok(slice.availableMoves && slice.availableMoves.length === 0, "player 0 is not current");
    const currentSlice = logSlice(state, { player: 1 });
    assert.ok(currentSlice.availableMoves && currentSlice.availableMoves.length > 0);
    const historic = logSlice(state, { player: 1, start: 0, end: 1 });
    assert.equal(historic.log.length, 1);
    assert.equal(historic.availableMoves, undefined);
  });

  it("toSave returns the data", async () => {
    const state = await fresh();
    assert.equal(toSave(state), state);
  });

  it("cancelled only when the game ends before everyone made 2 moves", async () => {
    let state = await fresh(3);
    state = await move(state, TAKE, 0);
    state = await dropPlayer(state, 1);
    state = await dropPlayer(state, 2);
    assert.equal(ended(state), true);
    assert.equal(cancelled(state), true);

    let long = await fresh(2);
    for (let i = 0; i < 4; i++) long = await move(long, TAKE, long.current);
    long = await dropPlayer(long, 0);
    assert.equal(ended(long), true);
    assert.equal(cancelled(long), false);
  });

  it("replay reproduces state and rankings are consistent with scores", async () => {
    let state = await fresh(2, "wrapper-replay");
    for (let i = 0; i < 6; i++) {
      const cur = currentPlayer(state) as number;
      const legal = (logSlice(state, { player: cur }).availableMoves ?? [])[0];
      assert.ok(legal, "a legal move exists");
      state = await move(state, parseMove(legal), cur);
    }
    const replayed = replay(state) as GameState;
    assert.deepEqual(replayed.players.map((p) => p.tokens), state.players.map((p) => p.tokens));
    assert.deepEqual(replayed.log.length, state.log.length);

    const doctored = structuredClone(state);
    doctored.players[0]!.nobles = [5, 6, 7, 8, 9];
    doctored.ended = true;
    const partial = replay(state, { to: 2 }) as GameState;
    assert.equal(partial.moveCount, 2);
    assert.deepEqual(rankings(doctored), [1, 2]);
    assert.deepEqual(scores(doctored)[0], 15);
  });
});

function parseMove(encoded: string): Move {
  const [kind, rest] = encoded.split(":") as [string, string | undefined];
  switch (kind) {
    case "take":
      return { action: "take", gems: (rest ?? "").split(",") as ("diamond" | "sapphire" | "emerald" | "ruby" | "onyx")[] };
    case "take2":
      return { action: "take2", color: rest as "ruby" };
    case "reserve":
      return { action: "reserve", cardId: Number(rest) };
    case "reserve-deck":
      return { action: "reserve", tier: Number(rest) as 1 };
    case "buy":
      return { action: "buy", cardId: Number(rest) };
    case "noble":
      return { action: "noble", nobleId: Number(rest) };
    default:
      throw new Error(`cannot parse ${encoded}`);
  }
}
