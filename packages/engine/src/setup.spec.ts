import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CARDS, NOBLES } from "./data.js";
import { applyMove } from "./moves.js";
import { bankSize, setup } from "./state.js";
import type { GameState } from "./types.js";

describe("data", () => {
  it("has 90 cards split 40/30/20 across tiers", () => {
    assert.equal(CARDS.length, 90);
    assert.equal(CARDS.filter((c) => c.tier === 1).length, 40);
    assert.equal(CARDS.filter((c) => c.tier === 2).length, 30);
    assert.equal(CARDS.filter((c) => c.tier === 3).length, 20);
    assert.equal(new Set(CARDS.map((c) => c.id)).size, 90);
  });

  it("has 10 nobles worth 3 prestige with 4+4 or 3+3+3 requirements", () => {
    assert.equal(NOBLES.length, 10);
    for (const noble of NOBLES) {
      assert.equal(noble.points, 3);
      const values = Object.values(noble.requirement).filter((v) => v > 0);
      const shape = values.length === 2 ? values.every((v) => v === 4) : values.length === 3 && values.every((v) => v === 3);
      assert.ok(shape, `noble ${noble.name} has an invalid requirement`);
    }
    assert.equal(NOBLES.filter((n) => Object.values(n.requirement).filter((v) => v > 0).length === 2).length, 5);
  });
});

describe("setup", () => {
  for (const [players, gems] of [
    [2, 4],
    [3, 5],
    [4, 7]
  ] as const) {
    it(`sets up a ${players}-player game with ${gems} gems per color`, () => {
      const state = setup(players, {}, "seed-setup");
      assert.equal(state.players.length, players);
      assert.equal(bankSize(players), gems);
      for (const color of ["diamond", "sapphire", "emerald", "ruby", "onyx"] as const) {
        assert.equal(state.bank[color], gems);
      }
      assert.equal(state.bank.gold, 5);
      assert.equal(state.nobles.length, players + 1);
      assert.equal(state.decks[0].length, 36);
      assert.equal(state.decks[1].length, 26);
      assert.equal(state.decks[2].length, 16);
      for (const row of state.table) assert.equal(row.length, 4);
      assert.equal(state.current, 0);
      assert.equal(state.ended, false);
      assert.equal(state.log.length, 1);
    });
  }

  it("rejects invalid player counts", () => {
    assert.throws(() => setup(1, {}, "s"));
    assert.throws(() => setup(5, {}, "s"));
  });

  it("is deterministic for a fixed seed", () => {
    const a = setup(3, {}, "same-seed");
    const b = setup(3, {}, "same-seed");
    assert.deepEqual(a.decks, b.decks);
    assert.deepEqual(a.table, b.table);
    assert.deepEqual(a.nobles, b.nobles);
    const c = setup(3, {}, "other-seed");
    assert.notDeepEqual([...a.decks, ...a.table], [...c.decks, ...c.table]);
  });

  it("decks + table contain every card exactly once", () => {
    const state = setup(4, {}, "cards-check");
    const all = [...state.decks.flat(), ...state.table.flat()].sort((a, b) => a - b);
    assert.deepEqual(all, Array.from({ length: 90 }, (_, i) => i));
  });
});

export function newGame(players = 2, seed = "test-seed"): GameState {
  return setup(players, {}, seed);
}
