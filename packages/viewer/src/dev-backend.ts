import { setup, applyMove, availableMoves, type GameState, type Move } from "splendor-engine";
import { stripSecret } from "splendor-engine/wrapper.js";

export interface DevOptions {
  players?: number;
  seed?: string;
  delayMs?: number;
}

const NAMES = ["You", "Ada (bot)", "Cleo (bot)", "Dora (bot)"];
const AVATARS = [
  "",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ada&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Cleo&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Dora&backgroundColor=c0aede"
];

function randomLegal(state: GameState, player: number): Move {
  const moves = availableMoves(state, player);
  const pick = moves[Math.floor(Math.random() * moves.length)] ?? "take:diamond,sapphire,emerald";
  return parseMove(pick);
}

function parseMove(encoded: string): Move {
  const [kind, rest] = encoded.split(":") as [string, string];
  switch (kind) {
    case "take":
      return { action: "take", gems: rest.split(",") as ("diamond" | "sapphire" | "emerald" | "ruby" | "onyx")[] };
    case "take2":
      return { action: "take2", color: rest as "ruby" };
    case "reserve":
      return { action: "reserve", cardId: Number(rest) };
    case "reserve-deck":
      return { action: "reserve", tier: Number(rest) as 1 };
    case "buy":
      return { action: "buy", cardId: Number(rest) };
    case "noble":
      return { action: "noble", nobleId: Number(rest) };
    default:
      throw new Error(`cannot parse move ${encoded}`);
  }
}

export function startDevBackend(emitter: { emit: (event: string, payload?: unknown) => void; on: (event: string, fn: (payload: never) => void) => void }, options: DevOptions = {}): void {
  const playerCount = options.players ?? 2;
  const seed = options.seed ?? `dev-${Math.floor(Math.random() * 1e6)}`;
  const delay = options.delayMs ?? 700;

  let state: GameState = setup(playerCount, {}, seed);
  for (let i = 0; i < playerCount; i++) state.players[i]!.name = NAMES[i] ?? `Player ${i + 1}`;
  state.messages = [];

  const human = 0;
  let ended = false;

  function publish(): void {
    emitter.emit("state", stripSecret(state, human));
    emitter.emit("player", { index: human });
    emitter.emit("avatars", AVATARS.slice(0, playerCount));
    if (state.ended && !ended) {
      ended = true;
      return;
    }
    scheduleBots();
  }

  function scheduleBots(): void {
    if (state.ended) return;
    const current = state.current;
    if (current === human) return;
    window.setTimeout(() => {
      if (state.ended) return;
      try {
        state = applyMove(state, randomLegal(state, current), current);
      } catch (error) {
        console.error("[dev-backend] bot move failed", error);
        return;
      }
      publish();
    }, delay);
  }

  emitter.on("move", ((payload: { move: Move }) => {
    if (state.ended) return;
    try {
      state = applyMove(state, payload.move, human);
    } catch (error) {
      console.error("[dev-backend] illegal move", error);
      return;
    }
    publish();
  }) as never);

  emitter.on("fetchState", (() => publish()) as never);

  window.setTimeout(publish, 50);
}
