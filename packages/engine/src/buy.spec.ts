import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardById } from "./data.js";
import { applyMove } from "./moves.js";
import { bonuses, canBuy, cardCostFor, setup } from "./state.js";
import type { GameState } from "./types.js";

function giveCards(state: GameState, player: number, cardIds: number[]): void {
	state.players[player]?.cards.push(...cardIds);
}

describe("buy", () => {
	it("buys a face-up card paying gems, refilling the row", () => {
		const state = setup(2, {}, "buy");
		const cardId = state.table[0][0] as number;
		const card = cardById(cardId);
		const player = state.players[0]!;
		for (const [color, n] of Object.entries(card.cost)) {
			if (n > 0) {
				player.tokens[color as keyof typeof player.tokens] = n;
				state.bank[color as keyof typeof state.bank] -= n;
			}
		}
		const next = applyMove(state, { action: "buy", cardId }, 0);
		const bought = next.players[0]!;
		assert.ok(bought.cards.includes(cardId));
		assert.equal(next.table[0].length, 4);
		assert.ok(!next.table[0].includes(cardId));
		for (const [color, n] of Object.entries(card.cost)) {
			if (n > 0) {
				assert.equal(bought.tokens[color as keyof typeof bought.tokens], 0);
				assert.equal(next.bank[color as keyof typeof next.bank], 4);
			}
		}
		assert.equal(bonuses(bought)[card.bonus], 1);
	});

	it("buys a reserved card", () => {
		let state = setup(2, {}, "buy-reserved");
		const cardId = state.table[0][0] as number;
		const card = cardById(cardId);
		state = applyMove(state, { action: "reserve", cardId }, 0);
		state = applyMove(state, { action: "take2", color: "ruby" }, 1);
		const player = state.players[0]!;
		for (const [color, n] of Object.entries(card.cost)) {
			if (n > 0) {
				player.tokens[color as keyof typeof player.tokens] += n;
			}
		}
		const next = applyMove(state, { action: "buy", cardId }, 0);
		assert.ok(next.players[0]?.cards.includes(cardId));
		assert.equal(next.players[0]?.reserved.length, 0);
	});

	it("rejects buying cards that are neither on the table nor reserved", () => {
		const state = setup(2, {}, "buy-invalid");
		assert.throws(() => applyMove(state, { action: "buy", cardId: 89 }, 0), /neither/);
	});

	it("rejects buying without enough gems", () => {
		const state = setup(2, {}, "buy-poor");
		const cardId = state.table[0][0] as number;
		assert.throws(() => applyMove(state, { action: "buy", cardId }, 0), /cannot afford/);
	});

	it("discounts the cost with owned bonuses", () => {
		const state = setup(2, {}, "buy-bonus");
		const target = state.table[1][0] as number;
		const card = cardById(target);
		const player = state.players[0]!;
		for (const [color, n] of Object.entries(card.cost)) {
			if (n > 0) {
				player.tokens[color as keyof typeof player.tokens] = n;
			}
		}
		const tier1ByBonus: Record<string, number> = { onyx: 0, sapphire: 8, diamond: 16, emerald: 24, ruby: 32 };
		giveCards(state, 0, [tier1ByBonus[card.bonus] as number]);
		const { cost } = cardCostFor(state, 0, target);
		assert.equal(cost[card.bonus], Math.max(0, card.cost[card.bonus] - 1));
		const before = player.tokens[card.bonus];
		const next = applyMove(state, { action: "buy", cardId: target }, 0);
		assert.equal(next.players[0]!.tokens[card.bonus], before - cost[card.bonus]);
	});

	it("uses gold as a wild for missing gems", () => {
		const state = setup(2, {}, "buy-gold");
		const cardId = state.table[0][0] as number;
		const card = cardById(cardId);
		const player = state.players[0]!;
		const missingColor = (Object.keys(card.cost) as (keyof typeof card.cost)[]).find((c) => card.cost[c] > 0)!;
		player.tokens.gold = 1;
		for (const [color, n] of Object.entries(card.cost)) {
			const own = color === missingColor ? Math.max(0, n - 1) : n;
			player.tokens[color as keyof typeof player.tokens] += own;
		}
		assert.ok(canBuy(state, 0, cardId));
		const goldBefore = player.tokens.gold;
		const next = applyMove(state, { action: "buy", cardId }, 0);
		assert.equal(next.players[0]!.tokens.gold, goldBefore - 1);
		assert.ok(next.players[0]?.cards.includes(cardId));
	});

	it("prefers color gems over gold when both can pay", () => {
		const state = setup(2, {}, "buy-gold-priority");
		const cardId = state.table[0].find((id) => {
			const card = cardById(id);
			return (
				card.points === 0 &&
				Object.values(card.cost).some((n) => n === 3) &&
				Object.values(card.cost).every((n) => n === 0 || n === 3)
			);
		})!;
		assert.notEqual(cardId, undefined, "expected a visible 3-of-one-color tier-1 card");
		const card = cardById(cardId);
		const player = state.players[0]!;
		player.tokens.gold = 5;
		for (const [color, n] of Object.entries(card.cost)) {
			if (n > 0) {
				player.tokens[color as keyof typeof player.tokens] += n;
			}
		}
		const next = applyMove(state, { action: "buy", cardId }, 0);
		assert.equal(next.players[0]!.tokens.gold, 5);
	});

	it("does not spend gems beyond the discounted cost", () => {
		const state = setup(2, {}, "buy-overspend");
		const cardId = state.table[0][0] as number;
		const card = cardById(cardId);
		const player = state.players[0]!;
		for (const [color, n] of Object.entries(card.cost)) {
			if (n > 0) {
				player.tokens[color as keyof typeof player.tokens] = n + 1;
			}
		}
		const next = applyMove(state, { action: "buy", cardId }, 0);
		const tokens = next.players[0]!.tokens;
		for (const [color, n] of Object.entries(card.cost)) {
			if (n > 0) {
				assert.equal(tokens[color as keyof typeof tokens], 1);
			}
		}
	});
});
