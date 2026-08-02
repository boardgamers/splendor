import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyMove } from "./moves.js";
import { setup } from "./state.js";
import { GEM_COLORS } from "./types.js";

describe("take gems", () => {
	it("takes 3 gems of different colors", () => {
		const state = setup(2, {}, "take");
		const next = applyMove(state, { action: "take", gems: ["diamond", "ruby", "onyx"] }, 0);
		assert.equal(next.players[0]?.tokens.diamond, 1);
		assert.equal(next.players[0]?.tokens.ruby, 1);
		assert.equal(next.players[0]?.tokens.onyx, 1);
		assert.equal(next.bank.diamond, 3);
		assert.equal(next.bank.emerald, 4);
		assert.equal(next.current, 1);
		assert.equal(next.moveCount, 1);
	});

	it("rejects duplicate colors, wrong counts, gold, and unknown colors", () => {
		const state = setup(2, {}, "take-invalid");
		assert.throws(() => applyMove(state, { action: "take", gems: ["ruby", "ruby", "onyx"] }, 0), /different/);
		assert.throws(() => applyMove(state, { action: "take", gems: ["ruby", "onyx"] }, 0), /exactly 3/);
		assert.throws(() => applyMove(state, { action: "take", gems: ["ruby", "onyx", "gold"] as never }, 0));
	});

	it("rejects gems the bank does not have", () => {
		const state = setup(2, {}, "take-empty");
		state.bank.emerald = 0;
		assert.throws(() => applyMove(state, { action: "take", gems: ["emerald", "ruby", "onyx"] }, 0), /no emerald/);
	});

	it("takes 2 of the same color only when the bank has >= 4", () => {
		const state = setup(2, {}, "take2");
		const next = applyMove(state, { action: "take2", color: "sapphire" }, 0);
		assert.equal(next.players[0]?.tokens.sapphire, 2);
		assert.equal(next.bank.sapphire, 2);
	});

	it("rejects take2 when the bank drops below 4", () => {
		const state = setup(2, {}, "take2-low");
		state.bank.onyx = 3;
		assert.throws(() => applyMove(state, { action: "take2", color: "onyx" }, 0), /at least 4/);
	});

	it("rejects takes that would exceed 10 gems", () => {
		const state = setup(2, {}, "take-cap");
		const player = state.players[0];
		assert.ok(player);
		player.tokens = { diamond: 4, sapphire: 4, emerald: 0, ruby: 1, onyx: 0, gold: 0 };
		assert.throws(() => applyMove(state, { action: "take", gems: ["emerald", "ruby", "onyx"] }, 0), /at most 10/);
		player.tokens = { diamond: 4, sapphire: 5, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
		assert.throws(() => applyMove(state, { action: "take2", color: "emerald" }, 0), /at most 10/);
		player.tokens = { diamond: 4, sapphire: 3, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
		const ok = applyMove(state, { action: "take", gems: ["emerald", "ruby", "onyx"] }, 0);
		assert.equal(
			Object.values(ok.players[0]?.tokens ?? {}).reduce((a, b) => a + b, 0),
			10
		);
	});

	it("rejects moves out of turn", () => {
		const state = setup(2, {}, "turn");
		assert.throws(() => applyMove(state, { action: "take", gems: ["diamond", "ruby", "onyx"] }, 1), /turn/);
	});

	it("accepts every color in take2 with a full bank", () => {
		for (const color of GEM_COLORS) {
			const state = setup(4, {}, `take2-${color}`);
			const next = applyMove(state, { action: "take2", color }, 0);
			assert.equal(next.players[0]?.tokens[color], 2);
		}
	});
});
