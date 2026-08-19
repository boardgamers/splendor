import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyMove } from "./moves.js";
import { setup } from "./state.js";
import type { GameState, Move } from "./types.js";

function snapshot(state: GameState): string {
	return JSON.stringify({ players: state.players, bank: state.bank, current: state.current, log: state.log.length });
}

function rejectsCleanly(state: GameState, raw: unknown, pattern: RegExp): void {
	const before = snapshot(state);
	assert.throws(() => applyMove(state, raw as Move, 0), pattern, `should reject ${JSON.stringify(raw)}`);
	assert.equal(snapshot(state), before, "state unchanged after a rejected move");
}

describe("untrusted move input hardening", () => {
	it("rejects non-object and null moves", () => {
		const state = setup(2, {}, "harden-null");
		for (const raw of [null, undefined, 42, "take", [], true]) {
			rejectsCleanly(state, raw, /plain object/);
		}
	});

	it("rejects missing or non-string action", () => {
		const state = setup(2, {}, "harden-action");
		rejectsCleanly(state, {}, /action must be a string/);
		rejectsCleanly(state, { action: 5 }, /action must be a string/);
		rejectsCleanly(state, { action: null }, /action must be a string/);
	});

	it("rejects unknown actions", () => {
		const state = setup(2, {}, "harden-unknown");
		rejectsCleanly(state, { action: "cheat" }, /unknown move action/);
		rejectsCleanly(state, { action: "__proto__" }, /unknown move action/);
	});

	it("rejects take with non-array or malformed gems", () => {
		const state = setup(2, {}, "harden-take");
		rejectsCleanly(state, { action: "take" }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: "ruby" }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: {} }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: [] }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: ["ruby", "onyx", "diamond", "emerald"] }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: ["ruby", 5] }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: ["ruby", null] }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: ["ruby", "__proto__"] }, /1 to 3 valid gem/);
		rejectsCleanly(state, { action: "take", gems: ["gold"] }, /1 to 3 valid gem/);
	});

	it("rejects take2 with an invalid color", () => {
		const state = setup(2, {}, "harden-take2");
		rejectsCleanly(state, { action: "take2" }, /valid gem color/);
		rejectsCleanly(state, { action: "take2", color: "gold" }, /valid gem color/);
		rejectsCleanly(state, { action: "take2", color: 5 }, /valid gem color/);
		rejectsCleanly(state, { action: "take2", color: "constructor" }, /valid gem color/);
	});

	it("rejects buy/reserve/noble with non-integer or out-of-range ids", () => {
		const state = setup(2, {}, "harden-ids");
		rejectsCleanly(state, { action: "buy" }, /non-negative integer/);
		rejectsCleanly(state, { action: "buy", cardId: "5" }, /non-negative integer/);
		rejectsCleanly(state, { action: "buy", cardId: 1.5 }, /non-negative integer/);
		rejectsCleanly(state, { action: "buy", cardId: -1 }, /non-negative integer/);
		rejectsCleanly(state, { action: "buy", cardId: {} }, /non-negative integer/);
		rejectsCleanly(state, { action: "noble", nobleId: "x" }, /non-negative integer/);
		rejectsCleanly(state, { action: "reserve", cardId: 1.2 }, /non-negative integer/);
	});

	it("rejects reserve with both or neither of cardId/tier, and bad tiers", () => {
		const state = setup(2, {}, "harden-reserve");
		rejectsCleanly(state, { action: "reserve" }, /exactly one of cardId/);
		rejectsCleanly(state, { action: "reserve", cardId: 5, tier: 1 }, /exactly one of cardId/);
		rejectsCleanly(state, { action: "reserve", tier: 0 }, /tier must be 1, 2 or 3/);
		rejectsCleanly(state, { action: "reserve", tier: 4 }, /tier must be 1, 2 or 3/);
		rejectsCleanly(state, { action: "reserve", tier: "1" }, /tier must be 1, 2 or 3/);
	});

	it("rejects swap with invalid colors", () => {
		const state = setup(2, {}, "harden-swap");
		rejectsCleanly(state, { action: "swap", give: "gold", receive: "ruby" }, /valid gem colors/);
		rejectsCleanly(state, { action: "swap", give: "ruby" }, /valid gem colors/);
		rejectsCleanly(state, { action: "swap", give: "ruby", receive: 5 }, /valid gem colors/);
	});

	it("rejects moves carrying unexpected extra fields", () => {
		const state = setup(2, {}, "harden-extra");
		rejectsCleanly(state, { action: "take", gems: ["ruby"], extra: "junk" }, /unexpected field "extra"/);
		rejectsCleanly(state, { action: "buy", cardId: 5, nobleId: 9 }, /unexpected field "nobleId"/);
		rejectsCleanly(state, { action: "take2", color: "ruby", gems: ["ruby"] }, /unexpected field "gems"/);
		rejectsCleanly(state, JSON.parse('{"action":"noble","nobleId":1,"polluted":true}'), /unexpected field "polluted"/);
	});

	it("stores a plain sanitized object in the log, not the caller's object", () => {
		const state = setup(2, {}, "harden-log");
		const source = { action: "take", gems: ["ruby", "onyx", "diamond"] };
		applyMove(state, source as never, 0);
		const entry = state.log.at(-1);
		assert.equal(entry?.type, "move");
		const logged = (entry as { move: Record<string, unknown> }).move;
		assert.deepEqual(logged, { action: "take", gems: ["ruby", "onyx", "diamond"] });
		assert.notEqual(logged, source, "log holds a fresh object, not the caller's");
		assert.notEqual(logged.gems, source.gems, "gems array is a copy, not the caller's");
	});

	it("does not pollute prototypes via a crafted move", () => {
		const state = setup(2, {}, "harden-proto");
		rejectsCleanly(state, JSON.parse('{"action":"take","gems":["__proto__"]}'), /1 to 3 valid gem/);
		assert.equal(({} as Record<string, unknown>).polluted, undefined);
	});
});
