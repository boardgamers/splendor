import { applyMove, dropPlayer } from "./moves.js";
import { setup } from "./state.js";
import type { GameState, LogEntry } from "./types.js";

export function replay(state: GameState, options?: { to?: number }): GameState {
	const start = state.log.find((entry): entry is Extract<LogEntry, { type: "start" }> => entry.type === "start");
	const playerCount = start?.players ?? state.players.length;
	const limit = options?.to ?? Infinity;

	let replayed = setup(playerCount, state.options, state.seed);
	for (let i = 0; i < playerCount; i++) {
		const name = state.players[i]?.name;
		if (name !== undefined) {
			(replayed.players[i] as { name: string }).name = name;
		}
	}
	replayed.messages = [];

	let applied = 0;
	for (const entry of state.log) {
		if (applied >= limit) {
			break;
		}
		if (entry.type === "move") {
			replayed = applyMove(replayed, entry.move, entry.player);
			applied++;
		} else if (entry.type === "drop") {
			replayed = dropPlayer(replayed, entry.player);
		}
	}
	replayed.messages = [];
	return replayed;
}
