import type { Card, GemColor, Noble, Tier } from "./types.js";

type Row = [
	tier: Tier,
	bonus: GemColor,
	points: number,
	white: number,
	blue: number,
	green: number,
	red: number,
	black: number,
];

// Published base-game card list (Space Cowboys, 2014): 40/30/20 cards in tiers 1/2/3.
// Official rulebook: https://bghub.org/r/splendor.pdf. Transcribed from and cross-verified
// against github.com/bouk/splendimax and github.com/seal256/splendor (identical data).
// Cost column order: diamond(white), sapphire(blue), emerald(green), ruby(red), onyx(black).
const CARD_ROWS: Row[] = [
	[1, "onyx", 0, 1, 1, 1, 1, 0],
	[1, "onyx", 0, 1, 1, 1, 2, 0],
	[1, "onyx", 0, 2, 0, 1, 2, 0],
	[1, "onyx", 0, 0, 1, 0, 3, 1],
	[1, "onyx", 0, 0, 0, 2, 1, 0],
	[1, "onyx", 0, 2, 0, 2, 0, 0],
	[1, "onyx", 0, 0, 0, 3, 0, 0],
	[1, "onyx", 1, 0, 4, 0, 0, 0],
	[1, "sapphire", 0, 1, 0, 1, 1, 1],
	[1, "sapphire", 0, 1, 0, 1, 2, 1],
	[1, "sapphire", 0, 1, 0, 2, 2, 0],
	[1, "sapphire", 0, 0, 1, 3, 1, 0],
	[1, "sapphire", 0, 1, 2, 0, 0, 0],
	[1, "sapphire", 0, 2, 0, 2, 0, 0],
	[1, "sapphire", 0, 0, 3, 0, 0, 0],
	[1, "sapphire", 1, 0, 0, 0, 4, 0],
	[1, "diamond", 0, 0, 1, 1, 1, 1],
	[1, "diamond", 0, 0, 1, 2, 1, 1],
	[1, "diamond", 0, 0, 2, 2, 0, 1],
	[1, "diamond", 0, 1, 1, 0, 0, 3],
	[1, "diamond", 0, 0, 1, 0, 2, 0],
	[1, "diamond", 0, 2, 2, 0, 0, 0],
	[1, "diamond", 0, 0, 0, 3, 0, 0],
	[1, "diamond", 1, 0, 0, 4, 0, 0],
	[1, "emerald", 0, 1, 1, 0, 1, 1],
	[1, "emerald", 0, 1, 1, 0, 1, 2],
	[1, "emerald", 0, 2, 1, 0, 2, 0],
	[1, "emerald", 0, 1, 0, 3, 1, 0],
	[1, "emerald", 0, 0, 0, 1, 0, 2],
	[1, "emerald", 0, 0, 2, 0, 2, 0],
	[1, "emerald", 0, 0, 0, 0, 3, 0],
	[1, "emerald", 1, 0, 0, 0, 0, 4],
	[1, "ruby", 0, 1, 1, 1, 0, 1],
	[1, "ruby", 0, 2, 1, 1, 0, 1],
	[1, "ruby", 0, 2, 0, 1, 0, 2],
	[1, "ruby", 0, 1, 3, 0, 0, 1],
	[1, "ruby", 0, 0, 0, 2, 1, 0],
	[1, "ruby", 0, 0, 2, 0, 0, 2],
	[1, "ruby", 0, 0, 0, 0, 0, 3],
	[1, "ruby", 1, 0, 0, 0, 0, 4],
	[2, "onyx", 1, 3, 2, 2, 0, 0],
	[2, "onyx", 1, 3, 2, 0, 0, 2],
	[2, "onyx", 2, 0, 1, 4, 2, 0],
	[2, "onyx", 2, 0, 0, 5, 3, 0],
	[2, "onyx", 2, 5, 0, 0, 0, 0],
	[2, "onyx", 3, 0, 0, 0, 0, 6],
	[2, "sapphire", 1, 0, 2, 2, 3, 0],
	[2, "sapphire", 1, 0, 3, 2, 0, 3],
	[2, "sapphire", 2, 5, 0, 3, 0, 0],
	[2, "sapphire", 2, 2, 4, 0, 1, 0],
	[2, "sapphire", 2, 0, 0, 5, 0, 0],
	[2, "sapphire", 3, 0, 0, 0, 6, 0],
	[2, "diamond", 1, 0, 0, 3, 2, 2],
	[2, "diamond", 1, 2, 0, 0, 3, 3],
	[2, "diamond", 2, 0, 0, 1, 4, 2],
	[2, "diamond", 2, 0, 3, 0, 5, 0],
	[2, "diamond", 2, 0, 0, 0, 0, 5],
	[2, "diamond", 3, 0, 0, 0, 0, 6],
	[2, "emerald", 1, 3, 0, 0, 3, 2],
	[2, "emerald", 1, 2, 3, 0, 0, 2],
	[2, "emerald", 2, 0, 2, 0, 0, 4],
	[2, "emerald", 2, 0, 0, 5, 3, 0],
	[2, "emerald", 2, 0, 5, 0, 0, 0],
	[2, "emerald", 3, 0, 0, 6, 0, 0],
	[2, "ruby", 1, 2, 0, 0, 2, 3],
	[2, "ruby", 1, 2, 0, 3, 0, 3],
	[2, "ruby", 2, 1, 0, 0, 4, 2],
	[2, "ruby", 2, 0, 0, 0, 3, 5],
	[2, "ruby", 2, 0, 0, 0, 0, 5],
	[2, "ruby", 3, 0, 0, 0, 6, 0],
	[3, "onyx", 3, 3, 3, 5, 3, 0],
	[3, "onyx", 4, 0, 0, 0, 7, 0],
	[3, "onyx", 4, 3, 0, 0, 6, 3],
	[3, "onyx", 5, 3, 0, 0, 7, 0],
	[3, "sapphire", 3, 3, 0, 3, 3, 5],
	[3, "sapphire", 4, 7, 0, 0, 0, 0],
	[3, "sapphire", 4, 6, 3, 0, 0, 3],
	[3, "sapphire", 5, 7, 0, 0, 0, 3],
	[3, "diamond", 3, 0, 3, 3, 3, 5],
	[3, "diamond", 4, 0, 0, 0, 0, 7],
	[3, "diamond", 4, 3, 6, 0, 0, 3],
	[3, "diamond", 5, 0, 7, 0, 0, 3],
	[3, "emerald", 3, 5, 3, 0, 3, 3],
	[3, "emerald", 4, 0, 7, 0, 0, 0],
	[3, "emerald", 4, 3, 3, 6, 0, 0],
	[3, "emerald", 5, 0, 0, 7, 3, 0],
	[3, "ruby", 3, 3, 3, 3, 0, 5],
	[3, "ruby", 4, 0, 0, 7, 0, 0],
	[3, "ruby", 4, 3, 0, 3, 6, 0],
	[3, "ruby", 5, 0, 3, 7, 0, 0],
];

export const CARDS: Card[] = CARD_ROWS.map((row, i) => ({
	id: i,
	tier: row[0],
	bonus: row[1],
	points: row[2],
	cost: { diamond: row[3], sapphire: row[4], emerald: row[5], ruby: row[6], onyx: row[7] },
}));

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function cardById(id: number): Card {
	const card = CARD_BY_ID.get(id);
	if (!card) {
		throw new Error(`unknown card id ${id}`);
	}
	return card;
}

type NobleRow = [name: string, white: number, blue: number, green: number, red: number, black: number];

const NOBLE_ROWS: NobleRow[] = [
	["Mary Stuart", 0, 0, 4, 4, 0],
	["Charles V", 0, 4, 4, 0, 0],
	["Machiavelli", 4, 4, 0, 0, 0],
	["Isabella of Castile", 4, 0, 0, 0, 4],
	["Suleiman the Magnificent", 0, 0, 0, 4, 4],
	["Catherine de' Medici", 0, 3, 3, 3, 0],
	["Anne of Brittany", 3, 0, 3, 3, 0],
	["Henry VIII", 3, 3, 0, 0, 3],
	["Elisabeth of Austria", 0, 0, 3, 3, 3],
	["Francis I of France", 3, 3, 3, 0, 0],
];

export const NOBLES: Noble[] = NOBLE_ROWS.map((row, i) => ({
	id: i,
	name: row[0],
	points: 3,
	requirement: { diamond: row[1], sapphire: row[2], emerald: row[3], ruby: row[4], onyx: row[5] },
}));

const NOBLE_BY_ID = new Map(NOBLES.map((n) => [n.id, n]));

export function nobleById(id: number): Noble {
	const noble = NOBLE_BY_ID.get(id);
	if (!noble) {
		throw new Error(`unknown noble id ${id}`);
	}
	return noble;
}
