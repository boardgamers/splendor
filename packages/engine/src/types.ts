export const GEM_COLORS = ["diamond", "sapphire", "emerald", "ruby", "onyx"] as const;
export type GemColor = (typeof GEM_COLORS)[number];
export const GOLD = "gold" as const;
export type TokenColor = GemColor | typeof GOLD;

export type GemCount = Partial<Record<GemColor, number>>;
export type TokenCount = Partial<Record<TokenColor, number>>;

export type Tier = 1 | 2 | 3;

export interface Card {
  id: number;
  tier: Tier;
  bonus: GemColor;
  points: number;
  cost: Record<GemColor, number>;
}

export interface Noble {
  id: number;
  name: string;
  points: number;
  requirement: Record<GemColor, number>;
}

export interface PlayerState {
  name: string;
  tokens: Record<TokenColor, number>;
  cards: number[];
  reserved: number[];
  nobles: number[];
  dropped: boolean;
}

export type LogEntry =
  | { type: "start"; players: number; seed: string; options: Record<string, unknown> }
  | { type: "move"; player: number; move: Move }
  | { type: "noble"; player: number; noble: number }
  | { type: "trigger"; player: number }
  | { type: "end"; scores: number[] }
  | { type: "drop"; player: number };

export interface GameState {
  seed: string;
  options: Record<string, unknown>;
  players: PlayerState[];
  bank: Record<TokenColor, number>;
  decks: [number[], number[], number[]];
  table: [number[], number[], number[]];
  nobles: number[];
  current: number;
  pendingNobles: number[];
  lastRound: boolean;
  lastPlayer: number;
  ended: boolean;
  winner: number | null;
  tied: number[] | null;
  moveCount: number;
  log: LogEntry[];
  messages: string[];
}

export type Move =
  | { action: "take"; gems: GemColor[] }
  | { action: "take2"; color: GemColor }
  | { action: "reserve"; cardId?: number; tier?: Tier }
  | { action: "buy"; cardId: number }
  | { action: "noble"; nobleId: number };
