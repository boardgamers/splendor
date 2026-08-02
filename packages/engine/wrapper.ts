import { applyMove, dropPlayer as dropPlayerCore } from "./src/moves.js";
import { rankings as computeRankings } from "./src/rankings.js";
import { replay as replayCore } from "./src/replay.js";
import { availableMoves, scores as computeScores, setup } from "./src/state.js";
import type { GameState, LogEntry, Move } from "./src/types.js";

export async function init(
  players: number,
  _expansions: string[],
  options: Record<string, unknown>,
  seed: string,
  _creator?: number
): Promise<GameState> {
  return setup(players, options ?? {}, seed);
}

export async function move(data: GameState, mv: Move, player: number): Promise<GameState> {
  return applyMove(data, mv, player);
}

export function ended(data: GameState): boolean {
  return data.ended;
}

export function scores(data: GameState): number[] {
  return computeScores(data);
}

export function rankings(data: GameState): number[] {
  return computeRankings(data);
}

export async function dropPlayer(data: GameState, player: number): Promise<GameState> {
  return dropPlayerCore(data, player);
}

export function currentPlayer(data: GameState): number | number[] | undefined {
  if (data.ended) return undefined;
  if (data.players[data.current]?.dropped) return undefined;
  return data.current;
}

export function logLength(data: GameState): number {
  return data.log.length;
}

export interface StripOptions {
  player?: number;
}

export function stripSecret(data: GameState, player?: number): GameState {
  const viewer = player !== undefined && player >= 0 ? player : undefined;
  return {
    ...data,
    decks: data.decks.map((deck) => deck.map(() => -1)) as GameState["decks"],
    players: data.players.map((p, i) =>
      i === viewer ? p : { ...p, reserved: p.reserved.map(() => -1) }
    ),
    messages: [...data.messages]
  };
}

export interface LogSliceOptions {
  player?: number;
  start?: number;
  end?: number;
}

export interface LogSliceResult {
  log: LogEntry[];
  availableMoves?: string[];
}

export function logSlice(data: GameState, options?: LogSliceOptions): LogSliceResult {
  const start = Math.max(0, options?.start ?? 0);
  const end = options?.end ?? data.log.length;
  const log = data.log.slice(start, end);
  const result: LogSliceResult = { log };
  if (options?.end === undefined) {
    result.availableMoves = availableMoves(data, options?.player !== undefined && options.player >= 0 ? options.player : undefined);
  }
  return result;
}

export function setPlayerMetaData(data: GameState, player: number, metaData: { name: string }): GameState {
  const target = data.players[player];
  if (target) target.name = metaData.name;
  return data;
}

export function toSave(data: GameState): GameState {
  return data;
}

export function messages(data: GameState): { messages: string[]; data: GameState } {
  const drained = [...data.messages];
  data.messages = [];
  return { messages: drained, data };
}

export function replay(data: GameState, options?: { to?: number }): GameState {
  return replayCore(data, options);
}

export const stripSecretLike = stripSecret;

export function round(data: GameState): number {
  return Math.floor(data.moveCount / data.players.length) + 1;
}

export function cancelled(data: GameState): boolean {
  return data.ended && data.moveCount < data.players.length * 2;
}

export function factions(data: GameState): string[] {
  return data.players.map((p) => p.name);
}
