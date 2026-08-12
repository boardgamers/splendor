import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moveAI, parseMove } from "./ai.js";
import { applyMove } from "./moves.js";
import { replay } from "./replay.js";
import { availableMoves, setup } from "./state.js";
import type { GameState } from "./types.js";

function botGame(playerCount: number, seed: string, maxMoves = 2000): GameState {
	let state = setup(playerCount, {}, seed);
	while (!state.ended && state.moveCount < maxMoves) {
		state = moveAI(state, state.current);
	}
	return state;
}

describe("moveAI", () => {
	it("applies a legal move from availableMoves for the current player", () => {
		const state = setup(2, {}, "ai-legal");
		const before = availableMoves(state, 0);
		const after = moveAI(structuredClone(state), 0);
		const entry = after.log[after.log.length - 1];
		assert.ok(entry && entry.type === "move");
		assert.equal(entry.player, 0);
		assert.ok(before.some((encoded) => JSON.stringify(parseMove(encoded)) === JSON.stringify(entry.move)));
		assert.equal(after.current, 1, "the turn advances to the next player");
		assert.equal(after.moveCount, 1);
	});

	it("throws when the player has no legal move (not their turn)", () => {
		const state = setup(2, {}, "ai-not-turn");
		assert.throws(() => moveAI(state, 1), /no legal move/);
	});

	it("is deterministic for a given state", () => {
		const state = setup(3, {}, "ai-determinism");
		const a = moveAI(structuredClone(state), 0);
		const b = moveAI(structuredClone(state), 0);
		assert.deepEqual(a, b);
	});

	it("a full 4-bot game progresses and ends with a result", () => {
		const state = botGame(4, "ai-full-game");
		assert.equal(state.ended, true, `game should end within the move cap (moveCount=${state.moveCount})`);
		assert.ok(state.moveCount > 0);
		assert.ok(state.winner !== null || (state.tied?.length ?? 0) > 1);
	});

	it("every bot move of a full game is legal per availableMoves on the replay path", () => {
		const played = botGame(3, "ai-legality");
		let check = setup(3, {}, "ai-legality");
		for (const entry of played.log) {
			if (entry.type !== "move") {
				continue;
			}
			const legal = availableMoves(check, entry.player);
			assert.ok(
				legal.some((encoded) => JSON.stringify(parseMove(encoded)) === JSON.stringify(entry.move)),
				`move ${JSON.stringify(entry.move)} must be listed by availableMoves`
			);
			check = applyMove(check, entry.move, entry.player);
		}
	});

	it("a bot-only game replays to the identical state", () => {
		const played = botGame(2, "ai-replay");
		played.messages = [];
		const replayed = replay(played);
		assert.deepEqual(replayed, played);
	});
});

describe("swap escape hatch", () => {
	function stuck(overrides: (state: GameState) => void): GameState {
		const state = setup(2, {}, "ai-stuck");
		state.players[0]!.tokens = { diamond: 10, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
		// reserved: three expensive tier-3 cards; table: only expensive tier-3 cards
		state.players[0]!.reserved = [80, 81, 82];
		state.players[0]!.reservedFrom = ["deck", "deck", "deck"];
		state.table = [
			[83, 84, 85, 86],
			[87, 88, 89, 0],
			[1, 2, 3, 4],
		];
		state.bank = { diamond: 0, sapphire: 2, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
		overrides(state);
		const moves = availableMoves(state, 0);
		assert.ok(moves.length > 0, "the stuck player must have moves");
		assert.ok(
			moves.every((m) => m.startsWith("swap:")),
			`the stuck player must only have swaps, got ${moves}`
		);
		return state;
	}

	it("offers 1:1 swaps when no other move exists", () => {
		const state = stuck(() => {});
		assert.ok(availableMoves(state, 0).includes("swap:diamond,sapphire"));
		const next = applyMove(state, { action: "swap", give: "diamond", receive: "sapphire" }, 0);
		assert.equal(next.players[0]?.tokens.diamond, 9);
		assert.equal(next.players[0]?.tokens.sapphire, 1);
		assert.equal(next.bank.diamond, 1);
		assert.equal(next.bank.sapphire, 1);
		assert.equal(next.current, 1);
	});

	it("rejects swaps while other moves exist", () => {
		const state = setup(2, {}, "ai-swap-normal");
		state.players[0]!.tokens.diamond = 1;
		assert.throws(
			() => applyMove(state, { action: "swap", give: "diamond", receive: "sapphire" }, 0),
			/no other legal move/
		);
	});

	it("falls back to returning 2 gems when the gem bank is empty", () => {
		const state = stuck((s) => {
			s.bank.sapphire = 0;
		});
		assert.deepEqual(availableMoves(state, 0), ["swap:diamond,diamond"]);
		const next = applyMove(state, { action: "swap", give: "diamond", receive: "diamond" }, 0);
		assert.equal(next.players[0]?.tokens.diamond, 8);
		assert.equal(next.bank.diamond, 2);
	});

	it("a bot stuck without moves still advances the game", () => {
		const state = stuck(() => {});
		const next = moveAI(state, 0);
		const entry = next.log[next.log.length - 1];
		assert.ok(entry && entry.type === "move" && entry.move.action === "swap");
		assert.equal(next.current, 1);
	});
});
