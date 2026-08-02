import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CARDS, NOBLES, nobleById } from "./data.js";
import { applyMove } from "./moves.js";
import { pendingNoblesFor, prestige, setup } from "./state.js";
import type { GameState, GemColor } from "./types.js";

function onlyNobles(state: GameState, nobleIds: number[]): void {
	state.nobles = [...nobleIds];
}

function giveBonuses(state: GameState, player: number, needs: Partial<Record<GemColor, number>>): void {
	const ps = state.players[player]!;
	const used = new Set(ps.cards);
	for (const [color, n] of Object.entries(needs) as [GemColor, number][]) {
		let found = 0;
		for (const card of CARDS) {
			if (card.bonus === color && !used.has(card.id) && found < n) {
				ps.cards.push(card.id);
				used.add(card.id);
				found++;
			}
		}
		assert.equal(found, n, `could not grant ${n} ${color} bonuses`);
	}
}

const noble44 = NOBLES.find((n) => n.requirement.emerald === 4 && n.requirement.ruby === 4)!;
const another44 = NOBLES.find((n) => n.requirement.diamond === 4 && n.requirement.sapphire === 4)!;
const noble333 = NOBLES.find(
	(n) =>
		(n.requirement.emerald === 3 && n.requirement.ruby === 3 && n.requirement.diamond === 3) ||
		(n.requirement.emerald === 3 && n.requirement.ruby === 3 && n.requirement.sapphire === 3)
)!;

describe("nobles", () => {
	it("detects eligibility from bonuses", () => {
		const state = setup(2, {}, "noble-eligible");
		onlyNobles(state, [noble44.id]);
		giveBonuses(state, 0, { emerald: 4, ruby: 3 });
		assert.deepEqual(pendingNoblesFor(state, 0), []);
		giveBonuses(state, 0, { ruby: 1 });
		assert.deepEqual(pendingNoblesFor(state, 0), [noble44.id]);
	});

	it("auto-visits when exactly one noble is eligible after an action", () => {
		const state = setup(2, {}, "noble-auto");
		onlyNobles(state, [noble44.id]);
		giveBonuses(state, 0, { emerald: 4, ruby: 4 });
		const before = prestige(state.players[0]!);
		const next = applyMove(state, { action: "take", gems: ["diamond", "sapphire", "onyx"] }, 0);
		assert.deepEqual(next.players[0]?.nobles, [noble44.id]);
		assert.equal(next.nobles.length, 0);
		assert.equal(prestige(next.players[0]!), before + 3);
		assert.equal(next.current, 1);
		assert.ok(next.log.some((e) => e.type === "noble" && e.noble === noble44.id));
	});

	it("requires a choice when several nobles are eligible", () => {
		const state = setup(2, {}, "noble-choice");
		onlyNobles(state, [noble44.id, noble333.id]);
		giveBonuses(state, 0, noble44.requirement);
		giveBonuses(
			state,
			0,
			Object.fromEntries(Object.entries(noble333.requirement).filter(([, v]) => v === 3)) as Partial<
				Record<GemColor, number>
			>
		);
		const eligible = pendingNoblesFor(state, 0);
		assert.deepEqual(new Set(eligible), new Set([noble44.id, noble333.id]));
		const next = applyMove(state, { action: "take", gems: ["emerald", "ruby", "onyx"] }, 0);
		assert.deepEqual(new Set(next.pendingNobles), new Set([noble44.id, noble333.id]));
		assert.equal(next.current, 0, "turn stays with the player until a noble is chosen");
		assert.throws(() => applyMove(next, { action: "take2", color: "ruby" }, 0), /noble/);
		const visited = applyMove(next, { action: "noble", nobleId: noble333.id }, 0);
		assert.deepEqual(visited.players[0]?.nobles, [noble333.id]);
		assert.equal(visited.nobles.length, 1);
		assert.equal(visited.current, 1);
		assert.deepEqual(
			pendingNoblesFor(visited, 0),
			[noble44.id],
			"the player still qualifies for the other noble next turn"
		);
	});

	it("rejects claiming a noble that is not eligible", () => {
		const state = setup(2, {}, "noble-invalid");
		onlyNobles(state, [noble44.id, noble333.id]);
		giveBonuses(state, 0, noble44.requirement);
		giveBonuses(
			state,
			0,
			Object.fromEntries(Object.entries(noble333.requirement).filter(([, v]) => v === 3)) as Partial<
				Record<GemColor, number>
			>
		);
		const next = applyMove(state, { action: "take", gems: ["emerald", "ruby", "onyx"] }, 0);
		assert.ok(next.pendingNobles.length > 0);
		const third = NOBLES.find((n) => n.id !== noble44.id && n.id !== noble333.id)!;
		assert.throws(() => applyMove(next, { action: "noble", nobleId: third.id }, 0), /does not visit/);
	});

	it("a noble action without pending nobles is illegal", () => {
		const state = setup(2, {}, "noble-none");
		assert.throws(() => applyMove(state, { action: "noble", nobleId: noble44.id }, 0), /no noble/);
	});

	it("noble requirements use bonuses only, not tokens", () => {
		const state = setup(2, {}, "noble-tokens");
		onlyNobles(state, [noble44.id]);
		const player = state.players[0]!;
		player.tokens.emerald = 4;
		player.tokens.ruby = 4;
		assert.deepEqual(pendingNoblesFor(state, 0), []);
	});

	it("visited nobles count toward prestige", () => {
		const state = setup(2, {}, "noble-prestige");
		state.players[0]!.nobles.push(another44.id);
		assert.equal(prestige(state.players[0]!), nobleById(another44.id).points);
	});
});
