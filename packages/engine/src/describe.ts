import { cardById, nobleById } from "./data.js";
import { SWAP_MIN_TOKENS, scores } from "./state.js";
import type { GameState, LogEntry } from "./types.js";

export function describeLogEntry(state: GameState, entry: LogEntry): string {
	const name = (i: number) => state.players[i]?.name ?? `Player ${i + 1}`;
	switch (entry.type) {
		case "start":
			return `Game started with ${entry.players} players`;
		case "move": {
			// Tolerate a double-wrapped move ({ move: { action, ... } }) produced by an
			// earlier viewer bug that nested the payload; unwrap one level if present.
			const raw = entry.move as unknown as { action?: string; move?: unknown };
			const move = (raw && raw.action === undefined && raw.move ? raw.move : entry.move) as typeof entry.move;
			switch (move.action) {
				case "take":
					return `${name(entry.player)} takes ${move.gems.join(", ")}`;
				case "take2":
					return `${name(entry.player)} takes 2 ${move.color}`;
				case "reserve":
					return move.cardId !== undefined
						? `${name(entry.player)} reserves ${cardById(move.cardId).bonus} (tier ${cardById(move.cardId).tier})`
						: `${name(entry.player)} reserves from deck ${move.tier}`;
				case "buy": {
					const card = cardById(move.cardId);
					return `${name(entry.player)} buys ${card.bonus} (tier ${card.tier})${card.points > 0 ? ` +${card.points}` : ""}`;
				}
				case "swap":
					return move.give === move.receive
						? `${name(entry.player)} returns ${SWAP_MIN_TOKENS} ${move.give} to the bank`
						: `${name(entry.player)} swaps 1 ${move.give} for 1 ${move.receive}`;
				case "noble":
					return `${nobleById(move.nobleId).name} visits ${name(entry.player)}`;
			}
		}
		case "noble":
			return `${nobleById(entry.noble).name} visits ${name(entry.player)}`;
		case "trigger":
			return `${name(entry.player)} reaches 15 prestige — final round`;
		case "end":
			return `Game over — ${scores(state).join(" / ")}`;
		case "drop":
			return `${name(entry.player)} left the game`;
	}
}

export function describeLog(state: GameState, entries: LogEntry[]): string[] {
	return entries.map((entry) => describeLogEntry(state, entry));
}
