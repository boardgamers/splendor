import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyMove, dropPlayer } from "./moves.js";
import { replay } from "./replay.js";
import { availableMoves, setup } from "./state.js";
import type { GameState, Move } from "./types.js";

const TAKE: Move = { action: "take", gems: ["diamond", "ruby", "onyx"] };
const TAKE3: Move = { action: "take", gems: ["sapphire", "emerald", "diamond"] };

function playScript(seed: string, script: Move[]): GameState {
	let state = setup(4, {}, seed);
	for (const move of script) {
		state = applyMove(state, move, state.current);
	}
	return state;
}

describe("replay", () => {
	it("reproduces the same state from the log (fixed seed)", () => {
		let played = setup(4, {}, "replay-seed");
		played.players[0]!.name = "Ada";
		played.players[1]!.name = "Boris";
		played.players[2]!.name = "Cleo";
		played.players[3]!.name = "Dora";
		const visible = played.table[0][0]!;
		const script: Move[] = [
			TAKE,
			TAKE3,
			{ action: "reserve", cardId: visible },
			{ action: "take2", color: "ruby" },
			{ action: "reserve", tier: 2 },
			TAKE,
		];
		for (const move of script) {
			played = applyMove(played, move, played.current);
		}
		played.messages = [];

		const replayed = replay(played);
		assert.deepEqual(replayed.decks, played.decks);
		assert.deepEqual(replayed.table, played.table);
		assert.deepEqual(replayed.bank, played.bank);
		assert.deepEqual(replayed.players, played.players);
		assert.deepEqual(replayed.nobles, played.nobles);
		assert.equal(replayed.current, played.current);
		assert.equal(replayed.moveCount, played.moveCount);
		assert.deepEqual(replayed.log, played.log);
	});

	it("replay with {to} stops early", () => {
		const played = playScript("replay-to", [TAKE, TAKE3, TAKE, TAKE3, TAKE, TAKE3]);
		const partial = replay(played, { to: 2 });
		assert.equal(partial.moveCount, 2);
		assert.equal(partial.log.filter((e) => e.type === "move").length, 2);
		const full = replay(played);
		assert.equal(full.moveCount, 6);
		assert.notDeepEqual(partial.bank, full.bank);
	});

	it("same seed produces identical shuffles across fresh setups", () => {
		const a = setup(4, {}, "shuffle");
		const b = setup(4, {}, "shuffle");
		assert.deepEqual(a.decks, b.decks);
		assert.deepEqual(a.nobles, b.nobles);
	});
});

describe("dropPlayer", () => {
	it("marks the player dropped and skips their turns", () => {
		let state = setup(3, {}, "drop");
		state = applyMove(state, TAKE, 0);
		state = dropPlayer(state, 2);
		assert.equal(state.players[2]?.dropped, true);
		assert.equal(state.current, 1, "dropping a non-current player does not change the turn");
	});

	it("skips a dropped current player", () => {
		let state = setup(3, {}, "drop-current");
		state = applyMove(state, TAKE, 0);
		state = dropPlayer(state, 1);
		assert.equal(state.current, 2);
		state = applyMove(state, { action: "take2", color: "sapphire" }, 2);
		assert.equal(state.current, 0);
	});

	it("ends the game when only one active player remains", () => {
		let state = setup(3, {}, "drop-end");
		state = applyMove(state, TAKE, 0);
		state = dropPlayer(state, 2);
		assert.equal(state.ended, false);
		state = dropPlayer(state, 1);
		assert.equal(state.ended, true);
		assert.equal(state.winner, 0);
	});

	it("clears a pending noble choice for the dropped current player", () => {
		const state = setup(2, {}, "drop-noble");
		state.players[0]!.cards = [0, 1, 2, 3, 8, 9, 10, 11, 16, 17, 18, 19, 24, 25, 26, 27, 32, 33, 34, 35];
		state.nobles = [1, 5];
		const pending = applyMove(state, TAKE, 0);
		assert.equal(pending.pendingNobles.length, 2);
		const after = dropPlayer(pending, 0);
		assert.equal(after.pendingNobles.length, 0);
		assert.equal(after.players[0]?.nobles.length, 1, "the pending noble is auto-claimed for the dropped player");
		assert.equal(after.ended, true, "only one player remains");
		assert.equal(after.winner, 1);
	});
});

describe("availableMoves", () => {
	it("returns moves for the current player only", () => {
		const state = setup(2, {}, "moves");
		const moves = availableMoves(state, 0);
		assert.ok(moves.some((m) => m.startsWith("take:")));
		assert.ok(moves.some((m) => m.startsWith("take2:")));
		assert.ok(moves.some((m) => m.startsWith("reserve:")));
		assert.ok(moves.some((m) => m.startsWith("reserve-deck:")));
		assert.deepEqual(availableMoves(state, 1), []);
	});

	it("only noble moves while a noble choice is pending", () => {
		const state = setup(2, {}, "moves-noble");
		state.players[0]!.cards = [0, 1, 2, 3, 8, 9, 10, 11, 16, 17, 18, 19, 24, 25, 26, 27, 32, 33, 34, 35];
		state.nobles = [1, 5];
		const pending = applyMove(state, TAKE, 0);
		const moves = availableMoves(pending, 0);
		assert.ok(moves.length > 0);
		assert.ok(moves.every((m) => m.startsWith("noble:")));
	});

	it("hides take2 when the bank is low and take when the player is at 8+ gems", () => {
		const state = setup(2, {}, "moves-cap");
		state.bank.sapphire = 3;
		const player = state.players[0]!;
		player.tokens = { diamond: 3, sapphire: 3, emerald: 1, ruby: 0, onyx: 0, gold: 0 };
		const moves = availableMoves(state, 0);
		assert.ok(!moves.includes("take2:sapphire"));
		assert.ok(
			moves.some((m) => m.startsWith("take:")),
			"at 7 gems a full take fits"
		);
		player.tokens.emerald = 2;
		assert.ok(!availableMoves(state, 0).some((m) => m.startsWith("take:")), "at 8 gems a take would exceed 10");
		player.tokens.emerald = 3;
		assert.ok(!availableMoves(state, 0).some((m) => m.startsWith("take2:")), "at 9 gems take2 would exceed 10");
	});
});
