import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyMove } from "./moves.js";
import { rankings } from "./rankings.js";
import { prestige, scores, setup } from "./state.js";
import type { GameState, Move } from "./types.js";

const NOBLE_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const TAKE_A: Move = { action: "take", gems: ["diamond", "ruby", "onyx"] };
const TAKE_B: Move = { action: "take", gems: ["emerald", "ruby", "onyx"] };

function giveNobles(state: GameState, player: number, count: number): void {
  const owned = new Set(state.players.flatMap((p) => p.nobles));
  const free = NOBLE_IDS.filter((id) => !owned.has(id));
  assert.ok(free.length >= count, `only ${free.length} free nobles left, need ${count}`);
  state.players[player]!.nobles = free.slice(0, count);
  for (const id of state.players[player]!.nobles) {
    const idx = state.nobles.indexOf(id);
    if (idx >= 0) state.nobles.splice(idx, 1);
  }
  assert.equal(prestige(state.players[player]!), count * 3);
}

describe("game end", () => {
  it("triggers the final round when a player reaches 15 prestige", () => {
    let state = setup(2, {}, "end-trigger");
    giveNobles(state, 0, 4);
    state = applyMove(state, TAKE_A, 0);
    assert.equal(state.lastRound, false, "12 prestige does not trigger");
    giveNobles(state, 1, 5);
    state = applyMove(state, TAKE_A, 1);
    assert.equal(state.lastRound, true);
    assert.ok(state.log.some((e) => e.type === "trigger" && e.player === 1));
    assert.equal(state.ended, true, "player 1 is the last player, so the game ends immediately");
    assert.ok(state.log.some((e) => e.type === "end"));
  });

  it("finishes the round so everyone plays the same number of turns", () => {
    let state = setup(3, {}, "end-round");
    giveNobles(state, 0, 5);
    state = applyMove(state, TAKE_A, 0);
    assert.equal(state.lastRound, true);
    assert.equal(state.ended, false, "players 1 and 2 still have a turn");
    state = applyMove(state, TAKE_A, 1);
    assert.equal(state.ended, false);
    state = applyMove(state, TAKE_A, 2);
    assert.equal(state.ended, true);
    const movesPerPlayer = [0, 0, 0];
    for (const entry of state.log) if (entry.type === "move") movesPerPlayer[entry.player]!++;
    assert.deepEqual(movesPerPlayer, [1, 1, 1]);
  });

  it("declares the player with the most prestige the winner", () => {
    let state = setup(2, {}, "end-winner");
    giveNobles(state, 0, 5);
    giveNobles(state, 1, 2);
    state = applyMove(state, TAKE_A, 0);
    assert.equal(state.lastRound, true);
    state = applyMove(state, TAKE_B, 1);
    assert.equal(state.ended, true);
    assert.deepEqual(scores(state), [15, 6]);
    assert.equal(state.winner, 0);
    assert.equal(state.tied, null);
    assert.deepEqual(rankings(state), [1, 2]);
  });

  it("breaks prestige ties by fewest purchased cards", () => {
    let state = setup(2, {}, "end-tiebreak");
    giveNobles(state, 0, 5);
    giveNobles(state, 1, 5);
    state.players[1]!.cards = [0, 1, 2];
    assert.equal(prestige(state.players[0]!), 15);
    assert.equal(prestige(state.players[1]!), 15);
    state = applyMove(state, TAKE_A, 0);
    assert.equal(state.lastRound, true);
    assert.equal(state.ended, false);
    state = applyMove(state, TAKE_B, 1);
    assert.equal(state.ended, true);
    assert.deepEqual(scores(state), [15, 15]);
    assert.equal(state.winner, 0, "player 0 wins the tie with fewer cards (0 vs 3)");
    assert.deepEqual(rankings(state), [1, 2]);
  });

  it("shares victory on full ties (prestige and cards)", () => {
    let state = setup(2, {}, "end-shared");
    giveNobles(state, 0, 5);
    giveNobles(state, 1, 5);
    assert.equal(prestige(state.players[0]!), 15);
    assert.equal(prestige(state.players[1]!), 15);
    state = applyMove(state, TAKE_A, 0);
    state = applyMove(state, TAKE_B, 1);
    assert.equal(state.ended, true);
    assert.deepEqual(scores(state), [15, 15]);
    assert.deepEqual(state.tied, [0, 1], "full tie: shared victory");
    assert.deepEqual(rankings(state), [1, 1]);
  });

  it("rejects moves after the game ended", () => {
    let state = setup(2, {}, "end-illegal");
    giveNobles(state, 0, 5);
    state = applyMove(state, TAKE_A, 0);
    state = applyMove(state, TAKE_B, 1);
    assert.equal(state.ended, true);
    assert.throws(() => applyMove(state, TAKE_A, 0), /over/);
  });
});
