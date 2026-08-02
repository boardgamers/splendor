import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardById } from "./data.js";
import { applyMove } from "./moves.js";
import { setup } from "./state.js";

describe("reserve", () => {
  it("reserves a face-up card, gains gold, and refills the row", () => {
    const state = setup(2, {}, "reserve");
    const cardId = state.table[0][0] as number;
    const next = applyMove(state, { action: "reserve", cardId }, 0);
    const player = next.players[0];
    assert.deepEqual(player?.reserved, [cardId]);
    assert.equal(player?.tokens.gold, 1);
    assert.equal(next.bank.gold, 4);
    assert.equal(next.table[0].length, 4);
    assert.ok(!next.table[0].includes(cardId));
    assert.equal(next.decks[0].length, 35);
  });

  it("reserves blind from a tier deck", () => {
    const state = setup(2, {}, "reserve-blind");
    const top = state.decks[1][0] as number;
    const next = applyMove(state, { action: "reserve", tier: 2 }, 0);
    assert.deepEqual(next.players[0]?.reserved, [top]);
    assert.equal(next.decks[1].length, 25);
    assert.equal(next.table[1].length, 4);
  });

  it("does not give gold when the bank is empty", () => {
    const state = setup(2, {}, "reserve-nogold");
    state.bank.gold = 0;
    const next = applyMove(state, { action: "reserve", cardId: state.table[2][0] as number }, 0);
    assert.equal(next.players[0]?.tokens.gold, 0);
    assert.equal(next.players[0]?.reserved.length, 1);
  });

  it("caps reserved cards at 3", () => {
    let state = setup(2, {}, "reserve-max");
    for (let i = 0; i < 3; i++) {
      state = applyMove(state, { action: "reserve", cardId: state.table[0][0] as number }, 0);
      state = applyMove(state, { action: "take", gems: ["diamond", "ruby", "onyx"] }, 1);
      state.players[1]!.tokens = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
      for (const color of ["diamond", "ruby", "onyx"] as const) state.bank[color]++;
    }
    assert.equal(state.players[0]?.reserved.length, 3);
    assert.throws(() => applyMove(state, { action: "reserve", cardId: state.table[0][0] as number }, 0), /at most 3/);
    assert.throws(() => applyMove(state, { action: "reserve", tier: 1 }, 0), /at most 3/);
  });

  it("rejects reserving with 10 gems (gold would exceed the cap)", () => {
    const state = setup(2, {}, "reserve-cap");
    state.players[0]!.tokens = { diamond: 3, sapphire: 3, emerald: 2, ruby: 1, onyx: 1, gold: 0 };
    assert.throws(() => applyMove(state, { action: "reserve", cardId: state.table[0][0] as number }, 0), /at most 10/);
  });

  it("rejects reserving cards that are not on the table or from empty decks", () => {
    const state = setup(2, {}, "reserve-invalid");
    assert.throws(() => applyMove(state, { action: "reserve", cardId: 89 }, 0), /not available/);
    state.decks[2] = [];
    assert.throws(() => applyMove(state, { action: "reserve", tier: 3 }, 0), /empty/);
  });

  it("reserved blind cards come from the deck top deterministically", () => {
    const a = setup(2, {}, "blind");
    const b = setup(2, {}, "blind");
    const nextA = applyMove(a, { action: "reserve", tier: 3 }, 0);
    const nextB = applyMove(b, { action: "reserve", tier: 3 }, 0);
    assert.deepEqual(nextA.players[0]?.reserved, nextB.players[0]?.reserved);
    assert.equal(cardById(nextA.players[0]?.reserved[0] as number).tier, 3);
  });
});
