import {
  GEM_COLORS,
  availableMoves,
  bonuses,
  canBuy,
  cardById,
  describeLog,
  nobleById,
  prestige,
  rankings,
  scores,
  tokenTotal,
  type GameState,
  type GemColor,
  type Move,
  type Tier
} from "splendor-engine";
import type { ViewerBridge } from "./bgs";

export type ActionTab = "take" | "take2" | "buy" | "reserve" | null;

export class ViewerStore {
  state = $state<GameState | null>(null);
  playerIndex = $state<number | undefined>(undefined);
  avatars = $state<string[]>([]);
  preferences = $state<Record<string, unknown>>({});
  tab = $state<ActionTab>(null);
  gemPick = $state<GemColor[]>([]);
  replay = $state<{ active: boolean; current: number; end: number }>({ active: false, current: 0, end: 0 });
  lastMoveAt = $state<number>(0);

  constructor(private bridge: ViewerBridge) {
    bridge.on("state", (state) => this.setState(state));
    bridge.on("player", ({ index }) => {
      this.playerIndex = typeof index === "number" && index >= 0 ? index : undefined;
    });
    bridge.on("avatars", (list) => (this.avatars = list ?? []));
    bridge.on("preferences", (prefs) => (this.preferences = prefs ?? {}));
    bridge.on("state:updated", () => bridge.fetchState());
    bridge.on("gamelog", () => bridge.fetchState());
    bridge.on("replay:start", () => {
      this.replay = { active: true, current: 0, end: this.state?.log.length ?? 0 };
      bridge.replayInfo({ start: 0, current: 0, end: this.replay.end });
    });
    bridge.on("replay:to", (to) => {
      this.replay.current = to;
      bridge.replayInfo({ start: 0, current: to, end: this.replay.end });
    });
    bridge.on("replay:end", () => (this.replay = { active: false, current: 0, end: 0 }));
  }

  private setState(state: GameState): void {
    this.state = state;
    this.tab = null;
    this.gemPick = [];
    this.lastMoveAt = Date.now();
    bridge_emit_logs(this.bridge, state);
  }

  get myTurn(): boolean {
    const s = this.state;
    return !!s && !s.ended && this.playerIndex !== undefined && s.current === this.playerIndex && !this.replay.active;
  }

  get spectator(): boolean {
    return this.playerIndex === undefined;
  }

  get moves(): string[] {
    const s = this.state;
    if (!s || !this.myTurn || this.playerIndex === undefined) return [];
    return availableMoves(s, this.playerIndex);
  }

  get pendingNobleChoice(): number[] {
    const s = this.state;
    if (!s || !this.myTurn) return [];
    return s.pendingNobles;
  }

  get finalRankings(): number[] {
    const s = this.state;
    return s && s.ended ? rankings(s) : [];
  }

  get finalScores(): number[] {
    const s = this.state;
    return s ? scores(s) : [];
  }

  affordable(cardId: number): boolean {
    const s = this.state;
    if (!s || this.playerIndex === undefined) return false;
    return canBuy(s, this.playerIndex, cardId);
  }

  bonusesOf(index: number) {
    const s = this.state;
    if (!s?.players[index]) return { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
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

  selectTab(tab: Exclude<ActionTab, null>): void {
    if (!this.myTurn) return;
    this.tab = this.tab === tab ? null : tab;
    this.gemPick = [];
  }

  cancel(): void {
    this.tab = null;
    this.gemPick = [];
  }

  pickGem(color: GemColor): void {
    if (this.tab === "take") {
      if (this.gemPick.includes(color)) {
        this.gemPick = this.gemPick.filter((c) => c !== color);
      } else if (this.gemPick.length < 3 && (this.state?.bank[color] ?? 0) > 0) {
        this.gemPick = [...this.gemPick, color];
      }
    } else if (this.tab === "take2") {
      this.confirmTake2(color);
    }
  }

  canTake2(color: GemColor): boolean {
    const s = this.state;
    if (!s || this.playerIndex === undefined) return false;
    return s.bank[color] >= 4 && this.tokensOf(this.playerIndex) + 2 <= 10;
  }

  canTakeAtAll(): boolean {
    const s = this.state;
    if (!s || this.playerIndex === undefined) return false;
    return GEM_COLORS.filter((c) => s.bank[c] > 0).length >= 3 && this.tokensOf(this.playerIndex) + 3 <= 10;
  }

  confirmTake(): void {
    if (this.gemPick.length !== 3) return;
    this.send({ action: "take", gems: this.gemPick });
  }

  confirmTake2(color: GemColor): void {
    if (!this.canTake2(color)) return;
    this.send({ action: "take2", color });
  }

  clickCard(cardId: number, zone: "table" | "reserved"): void {
    if (!this.myTurn || this.tab === null) return;
    if (this.tab === "buy" && (zone === "table" || (zone === "reserved" && this.isOwnReserved(cardId)))) {
      if (this.affordable(cardId)) this.send({ action: "buy", cardId });
    } else if (this.tab === "reserve" && zone === "table") {
      this.send({ action: "reserve", cardId });
    }
  }

  clickDeck(tier: Tier): void {
    if (!this.myTurn || this.tab !== "reserve") return;
    this.send({ action: "reserve", tier });
  }

  chooseNoble(nobleId: number): void {
    this.send({ action: "noble", nobleId });
  }

  private isOwnReserved(cardId: number): boolean {
    const s = this.state;
    return !!s && this.playerIndex !== undefined && (s.players[this.playerIndex]?.reserved.includes(cardId) ?? false);
  }

  private send(move: Move): void {
    this.bridge.sendMove(move);
    this.cancel();
  }
}

function bridge_emit_logs(bridge: ViewerBridge, state: GameState): void {
  bridge.replaceLog(describeLog(state, state.log));
}

export function createStore(bridge: ViewerBridge): ViewerStore {
  return new ViewerStore(bridge);
}
