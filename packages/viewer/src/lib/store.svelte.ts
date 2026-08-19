import {
	GEM_COLORS,
	applyMove,
	availableMoves,
	bonuses,
	canBuy,
	cardById,
	describeLog,
	nobleById,
	prestige,
	rankings,
	replay as replayEngine,
	scores,
	tokenTotal,
	type GameState,
	type GemColor,
	type Move,
	type Tier,
} from "splendor-engine";
import type { ViewerBridge } from "./bgs.svelte";

export interface ReplayState {
	active: boolean;
	current: number;
	end: number;
	state: GameState | null;
}

export class ViewerStore {
	liveState = $state<GameState | null>(null);
	replay = $state<ReplayState>({ active: false, current: 0, end: 0, state: null });
	playerIndex = $state<number | undefined>(undefined);
	avatars = $state<string[]>([]);
	preferences = $state<Record<string, unknown>>({});
	gemPick = $state<GemColor[]>([]);
	reserving = $state(false);
	logLines = $state<string[]>([]);
	seenLog = $state(0);
	lastMoveAt = $state<number>(0);

	constructor(private bridge: ViewerBridge) {
		bridge.on("state", (state) => this.setState(state));
		bridge.on("player", ({ index }) => {
			this.playerIndex = typeof index === "number" && index >= 0 ? index : undefined;
		});
		bridge.on("avatars", (list) => (this.avatars = list ?? []));
		bridge.on("preferences", (prefs) => (this.preferences = prefs ?? {}));
		bridge.on("state:updated", () => bridge.fetchState());
		bridge.on("gamelog", (payload) => this.onGamelog(payload));
		bridge.on("replay:start", () => this.startReplay());
		bridge.on("replay:to", (to) => this.replayTo(to));
		bridge.on("replay:end", () => this.endReplay());
	}

	get state(): GameState | null {
		return this.replay.active ? this.replay.state : this.liveState;
	}

	private setState(state: GameState): void {
		this.liveState = state;
		this.seenLog = state.log.length;
		this.logLines = describeLog(state, state.log);
		if (!this.replay.active) {
			this.gemPick = [];
			this.reserving = false;
			this.lastMoveAt = Date.now();
		}
		emitLogs(this.bridge, this.logLines);
	}

	private onGamelog(payload: { start: number; end?: number; data: unknown }): void {
		const data = payload?.data as { log?: unknown[] } | undefined;
		const entries = Array.isArray(data?.log) ? (data.log as GameState["log"]) : [];
		const base = this.liveState;
		if (!base || entries.length === 0) {
			this.bridge.fetchState();
			return;
		}
		if (payload.start >= this.logLines.length) {
			this.logLines = [...this.logLines, ...describeLog(base, entries)];
			this.seenLog = base.log.length;
			emitLogs(this.bridge, this.logLines);
		} else {
			this.bridge.fetchState();
		}
	}

	private startReplay(): void {
		const live = this.liveState;
		if (!live) {
			return;
		}
		this.replay = { active: true, current: 0, end: live.log.length, state: replayEngine(live, { to: 0 }) };
		this.bridge.replayInfo({ start: 0, current: 0, end: live.log.length });
	}

	private replayTo(to: number): void {
		const live = this.liveState;
		if (!live || !this.replay.active) {
			return;
		}
		const clamped = Math.max(0, Math.min(to, live.log.length));
		this.replay = { ...this.replay, current: clamped, state: replayEngine(live, { to: clamped }) };
		this.bridge.replayInfo({ start: 0, current: clamped, end: this.replay.end });
	}

	replayToEntry(to: number): void {
		this.replayTo(to);
	}

	private endReplay(): void {
		this.replay = { active: false, current: 0, end: 0, state: null };
	}

	get myTurn(): boolean {
		const s = this.liveState;
		return !!s && !s.ended && this.playerIndex !== undefined && s.current === this.playerIndex && !this.replay.active;
	}

	get spectator(): boolean {
		return this.playerIndex === undefined;
	}

	get moves(): string[] {
		const s = this.liveState;
		if (!s || !this.myTurn || this.playerIndex === undefined) {
			return [];
		}
		return availableMoves(s, this.playerIndex);
	}

	get pendingNobleChoice(): number[] {
		const s = this.liveState;
		if (!s || !this.myTurn) {
			return [];
		}
		return s.pendingNobles;
	}

	get finalRankings(): number[] {
		const s = this.liveState;
		return s && s.ended ? rankings(s) : [];
	}

	get finalScores(): number[] {
		const s = this.liveState;
		return s ? scores(s) : [];
	}

	get myTokens(): number {
		return this.playerIndex !== undefined ? this.tokensOf(this.playerIndex) : 0;
	}

	get canAffordSomething(): boolean {
		const s = this.liveState;
		if (!s || !this.myTurn) {
			return false;
		}
		for (const row of s.table) {
			for (const id of row) {
				if (this.affordable(id)) {
					return true;
				}
			}
		}
		const me = this.playerIndex !== undefined ? s.players[this.playerIndex] : undefined;
		for (const id of me?.reserved ?? []) {
			if (this.affordable(id)) {
				return true;
			}
		}
		return false;
	}

	get bankActive(): boolean {
		const s = this.liveState;
		if (!s || !this.myTurn) {
			return false;
		}
		return GEM_COLORS.some((c) => this.gemEnabled(c));
	}

	get takeDraft(): Move | null {
		const pick = this.gemPick;
		if (pick.length === 2 && pick[0] !== undefined && pick[0] === pick[1]) {
			return { action: "take2", color: pick[0] };
		}
		if (pick.length === 3) {
			return { action: "take", gems: pick };
		}
		return null;
	}

	gemEnabled(color: GemColor): boolean {
		const s = this.liveState;
		if (!s || !this.myTurn || s.bank[color] <= 0) {
			return false;
		}
		const pick = this.gemPick;
		if (pick.length === 0) {
			const twoOk = s.bank[color] >= 4 && this.myTokens + 2 <= 10;
			const threeOk = this.myTokens + 3 <= 10;
			return twoOk || threeOk;
		}
		const first = pick[0] as GemColor;
		if (pick.length === 1) {
			if (color === first) {
				return s.bank[color] >= 4 && this.myTokens + 2 <= 10;
			}
			return this.myTokens + 3 <= 10;
		}
		if (pick.length === 2) {
			return first !== pick[1] && color !== first && color !== pick[1];
		}
		return false;
	}

	get takeHint(): string {
		const s = this.liveState;
		if (!s) {
			return "";
		}
		const pick = this.gemPick;
		if (this.myTokens >= 10) {
			return "You already hold 10 gems — buy a card or reserve one";
		}
		if (pick.length === 0) {
			const buyTip = this.canAffordSomething ? " — or buy a glowing card" : "";
			if (this.myTokens + 3 <= 10) {
				return `Pick 3 different gems, or the same gem twice (bank needs ≥ 4)${buyTip}`;
			}
			if (this.myTokens + 2 <= 10) {
				return `Pick the same gem twice (bank needs ≥ 4) — you may hold at most 10 gems${buyTip}`;
			}
			return `You may hold at most 10 gems — buy a card or reserve one${buyTip}`;
		}
		if (pick.length === 1) {
			return this.myTokens + 3 <= 10
				? "Pick a second gem (same color = take 2, or two more different = take 3)"
				: "Pick the same gem again to take 2";
		}
		if (pick.length === 2 && pick[0] === pick[1]) {
			return `Take 2 ${pick[0]}?`;
		}
		if (pick.length === 2) {
			return "Pick a third, different gem";
		}
		return `Take ${pick.join(", ")}?`;
	}

	affordable(cardId: number): boolean {
		const s = this.liveState;
		if (!s || this.playerIndex === undefined) {
			return false;
		}
		return canBuy(s, this.playerIndex, cardId);
	}

	bonusesOf(index: number) {
		const s = this.state;
		if (!s?.players[index]) {
			return { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
		}
		return bonuses(s.players[index]!);
	}

	prestigeOf(index: number): number {
		const s = this.state;
		return s?.players[index] ? prestige(s.players[index]!) : 0;
	}

	tokensOf(index: number): number {
		const s = this.state;
		return s?.players[index] ? tokenTotal(s.players[index]!) : 0;
	}

	card(id: number) {
		return cardById(id);
	}

	noble(id: number) {
		return nobleById(id);
	}

	pickGem(color: GemColor): void {
		if (!this.myTurn) {
			return;
		}
		if (this.reserving) {
			this.reserving = false;
		}
		const pick = this.gemPick;
		if (this.gemEnabled(color) && pick.length < 3) {
			this.gemPick = [...pick, color];
		}
	}

	unpickGem(): void {
		this.gemPick = this.gemPick.slice(0, -1);
	}

	unpickGemAt(index: number): void {
		this.gemPick = this.gemPick.filter((_, i) => i !== index);
	}

	toggleReserve(): void {
		if (!this.myTurn || !this.canReserveAtAll()) {
			return;
		}
		this.reserving = !this.reserving;
		if (this.reserving) {
			this.gemPick = [];
		}
	}

	cancel(): void {
		this.gemPick = [];
		this.reserving = false;
	}

	confirmTake(): void {
		const draft = this.takeDraft;
		if (draft) {
			this.send(draft);
		}
	}

	canReserveAtAll(): boolean {
		const s = this.liveState;
		if (!s || this.playerIndex === undefined) {
			return false;
		}
		const player = s.players[this.playerIndex];
		return !!player && player.reserved.length < 3 && tokenTotal(player) < 10;
	}

	clickCard(cardId: number, zone: "table" | "reserved"): void {
		if (!this.myTurn) {
			return;
		}
		if (this.reserving && zone === "table" && this.canReserveAtAll()) {
			this.send({ action: "reserve", cardId });
			return;
		}
		if (zone === "reserved" && !this.isOwnReserved(cardId)) {
			return;
		}
		if (this.affordable(cardId)) {
			this.send({ action: "buy", cardId });
		}
	}

	clickDeck(tier: Tier): void {
		if (!this.myTurn || !this.reserving || !this.canReserveAtAll()) {
			return;
		}
		this.send({ action: "reserve", tier });
	}

	chooseNoble(nobleId: number): void {
		this.send({ action: "noble", nobleId });
	}

	updatePreference(name: string, value: string | boolean | null): void {
		this.preferences = { ...this.preferences, [name]: value };
		this.bridge.updatePreference(name, value);
	}

	private isOwnReserved(cardId: number): boolean {
		const s = this.liveState;
		return !!s && this.playerIndex !== undefined && (s.players[this.playerIndex]?.reserved.includes(cardId) ?? false);
	}

	private send(move: Move): void {
		this.bridge.sendMove(move);
		this.cancel();
		this.applyOptimistic(move);
	}

	// Apply my own move to the local (stripped) state right away so the UI feels
	// instant; the authoritative state from the server reconciles on arrival.
	// Only attempted on my turn with a move that's legal against my view — any
	// failure just skips the optimistic step (the server state will correct it).
	private applyOptimistic(move: Move): void {
		const s = this.liveState;
		if (!s || this.playerIndex === undefined || s.current !== this.playerIndex || this.replay.active) {
			return;
		}
		// Reserving blind from a deck can't be applied on the stripped view (decks
		// are -1 placeholders) — skip the optimistic step and wait for the server.
		if (move.action === "reserve" && move.cardId === undefined) {
			return;
		}
		try {
			const clone = JSON.parse(JSON.stringify(s)) as GameState;
			applyMove(clone, move, this.playerIndex);
			this.setState(clone);
		} catch {
			// not applicable against the stripped view — wait for the server state
		}
	}
}

function emitLogs(bridge: ViewerBridge, lines: string[]): void {
	bridge.replaceLog(lines);
}

export function createStore(bridge: ViewerBridge): ViewerStore {
	return new ViewerStore(bridge);
}
