import { CARDS, NOBLES, cardById, nobleById } from "./data.js";
import { createPrng, shuffle } from "./prng.js";
import { GEM_COLORS, type GameState, type GemColor, type PlayerState, type Tier, type TokenColor } from "./types.js";

export const MAX_TOKENS = 10;
export const MAX_RESERVED = 3;
export const PRESTIGE_TARGET = 15;
export const TAKE2_MIN_BANK = 4;

export function bankSize(playerCount: number): number {
	return playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7;
}

function emptyTokens(): Record<TokenColor, number> {
	return { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
}

export function setup(playerCount: number, options: Record<string, unknown>, seed: string): GameState {
	if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 4) {
		throw new Error(`Splendor supports 2-4 players, got ${playerCount}`);
	}
	const rand = createPrng(seed);
	const size = bankSize(playerCount);
	const decks = ([1, 2, 3] as Tier[]).map((tier) =>
		shuffle(
			CARDS.filter((c) => c.tier === tier).map((c) => c.id),
			rand
		)
	);
	const table = decks.map((deck) => deck.splice(0, 4)) as GameState["table"];
	const nobles = shuffle(
		NOBLES.map((n) => n.id),
		rand
	).slice(0, playerCount + 1);
	const players: PlayerState[] = Array.from({ length: playerCount }, (_, i) => ({
		name: `Player ${i + 1}`,
		tokens: emptyTokens(),
		cards: [],
		reserved: [],
		reservedFrom: [],
		nobles: [],
		dropped: false,
	}));
	return {
		seed,
		options: options ?? {},
		players,
		bank: { diamond: size, sapphire: size, emerald: size, ruby: size, onyx: size, gold: 5 },
		decks: decks as GameState["decks"],
		table,
		nobles,
		current: 0,
		pendingNobles: [],
		lastRound: false,
		lastPlayer: playerCount - 1,
		ended: false,
		winner: null,
		tied: null,
		moveCount: 0,
		log: [{ type: "start", players: playerCount, seed, options: options ?? {} }],
		messages: [],
	};
}

export function playerName(state: GameState, index: number): string {
	return state.players[index]?.name ?? `Player ${index + 1}`;
}

export function tokenTotal(player: PlayerState): number {
	return Object.values(player.tokens).reduce((a, b) => a + b, 0);
}

export function bonuses(player: PlayerState): Record<GemColor, number> {
	const result: Record<GemColor, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
	for (const id of player.cards) {
		result[cardById(id).bonus]++;
	}
	return result;
}

export function prestige(player: PlayerState): number {
	let total = 0;
	for (const id of player.cards) {
		total += cardById(id).points;
	}
	for (const id of player.nobles) {
		total += nobleById(id).points;
	}
	return total;
}

export function scores(state: GameState): number[] {
	return state.players.map(prestige);
}

export function cardCostFor(
	state: GameState,
	playerIndex: number,
	cardId: number
): { cost: Record<GemColor, number>; goldNeeded: number } {
	const player = state.players[playerIndex];
	if (!player) {
		throw new Error(`unknown player ${playerIndex}`);
	}
	const card = cardById(cardId);
	const bonus = bonuses(player);
	const cost: Record<GemColor, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
	let goldNeeded = 0;
	for (const color of GEM_COLORS) {
		const remaining = Math.max(0, card.cost[color] - bonus[color]);
		cost[color] = remaining;
		const missing = remaining - player.tokens[color];
		if (missing > 0) {
			goldNeeded += missing;
		}
	}
	return { cost, goldNeeded };
}

export function canBuy(state: GameState, playerIndex: number, cardId: number): boolean {
	const player = state.players[playerIndex];
	if (!player) {
		return false;
	}
	const { goldNeeded } = cardCostFor(state, playerIndex, cardId);
	return goldNeeded <= player.tokens.gold;
}

export function findTableCard(state: GameState, cardId: number): { tier: Tier; index: number } | null {
	for (let t = 0; t < 3; t++) {
		const index = (state.table[t] as number[]).indexOf(cardId);
		if (index >= 0) {
			return { tier: (t + 1) as Tier, index };
		}
	}
	return null;
}

export function canReserveFromDeck(state: GameState, tier: Tier): boolean {
	return (state.decks[tier - 1]?.length ?? 0) > 0;
}

export function nobleEligible(state: GameState, playerIndex: number, nobleId: number): boolean {
	if (!state.nobles.includes(nobleId)) {
		return false;
	}
	const noble = nobleById(nobleId);
	const bonus = bonuses(state.players[playerIndex] as PlayerState);
	return GEM_COLORS.every((color) => bonus[color] >= noble.requirement[color]);
}

export function pendingNoblesFor(state: GameState, playerIndex: number): number[] {
	return state.nobles.filter((id) => nobleEligible(state, playerIndex, id));
}

export function activePlayers(state: GameState): number[] {
	return state.players.map((p, i) => (p.dropped ? -1 : i)).filter((i) => i >= 0);
}

export function isActiveTurn(state: GameState): boolean {
	return !state.ended && !(state.players[state.current]?.dropped ?? true);
}

export function availableMoves(state: GameState, playerIndex?: number): string[] {
	if (state.ended) {
		return [];
	}
	const index = playerIndex ?? state.current;
	if (index !== state.current) {
		return [];
	}
	const player = state.players[index];
	if (!player || player.dropped) {
		return [];
	}
	if (state.pendingNobles.length > 0) {
		return state.pendingNobles.map((id) => `noble:${id}`);
	}

	const moves: string[] = [];
	const total = tokenTotal(player);
	const takeable = GEM_COLORS.filter((c) => state.bank[c] > 0);
	if (total < MAX_TOKENS) {
		for (let a = 0; a < takeable.length; a++) {
			for (let b = a + 1; b < takeable.length; b++) {
				for (let c = b + 1; c < takeable.length; c++) {
					moves.push(`take:${takeable[a] as string},${takeable[b] as string},${takeable[c] as string}`);
				}
			}
		}
		for (const color of GEM_COLORS) {
			if (state.bank[color] >= TAKE2_MIN_BANK && total + 2 <= MAX_TOKENS) {
				moves.push(`take2:${color}`);
			}
		}
	}
	if (player.reserved.length < MAX_RESERVED && total < MAX_TOKENS) {
		for (const row of state.table) {
			for (const id of row) {
				moves.push(`reserve:${id}`);
			}
		}
		for (const tier of [1, 2, 3] as Tier[]) {
			if (canReserveFromDeck(state, tier)) {
				moves.push(`reserve-deck:${tier}`);
			}
		}
	}
	for (const row of state.table) {
		for (const id of row) {
			if (canBuy(state, index, id)) {
				moves.push(`buy:${id}`);
			}
		}
	}
	for (const id of player.reserved) {
		if (canBuy(state, index, id)) {
			moves.push(`buy:${id}`);
		}
	}
	return moves;
}

export function formatMove(state: GameState, playerIndex: number, move: import("./types.js").Move): string {
	const name = playerName(state, playerIndex);
	switch (move.action) {
		case "take":
			return `${name} takes ${move.gems.join(", ")}`;
		case "take2":
			return `${name} takes 2 ${move.color}`;
		case "reserve":
			return move.cardId !== undefined ? `${name} reserves a card` : `${name} reserves from deck ${move.tier}`;
		case "buy":
			return `${name} buys a card (+${cardById(move.cardId).points} prestige)`;
		case "noble":
			return `${nobleById(move.nobleId).name} visits ${name}`;
	}
}
