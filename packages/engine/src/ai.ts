import { applyMove } from "./moves.js";
import { createPrng, pick } from "./prng.js";
import { availableMoves } from "./state.js";
import type { GameState, GemColor, Move, Tier } from "./types.js";

export function parseMove(encoded: string): Move {
	const [kind, rest] = encoded.split(":") as [string, string | undefined];
	switch (kind) {
		case "take":
			return { action: "take", gems: (rest ?? "").split(",") as GemColor[] };
		case "take2":
			return { action: "take2", color: rest as GemColor };
		case "reserve":
			return { action: "reserve", cardId: Number(rest) };
		case "reserve-deck":
			return { action: "reserve", tier: Number(rest) as Tier };
		case "buy":
			return { action: "buy", cardId: Number(rest) };
		case "swap": {
			const [give, receive] = (rest ?? "").split(",") as [GemColor, GemColor];
			return { action: "swap", give, receive };
		}
		case "noble":
			return { action: "noble", nobleId: Number(rest) };
		default:
			throw new Error(`cannot parse move ${encoded}`);
	}
}

// Bot players: pick a uniformly random legal move. The PRNG is seeded from the
// game seed and move history so a given state always yields the same pick
// (Math.random is banned in the engine — replay determinism).
export function moveAI(state: GameState, playerIndex: number): GameState {
	const moves = availableMoves(state, playerIndex);
	if (moves.length === 0) {
		throw new Error(`no legal move available for player ${playerIndex}`);
	}
	const rand = createPrng(`${state.seed}:ai:${state.moveCount}:${playerIndex}`);
	return applyMove(state, parseMove(pick(moves, rand)), playerIndex);
}
