import type { GameState, Move } from "splendor-engine";
import { Emitter } from "./emitter";

export interface ViewerEvents {
  state: GameState;
  "state:updated": void;
  gamelog: { start: number; end?: number; data: unknown };
  player: { index?: number };
  avatars: string[];
  preferences: Record<string, unknown>;
  "replay:start": void;
  "replay:to": number;
  "replay:end": void;
}

export interface UplinkEvents {
  ready: void;
  move: { move: Move };
  fetchState: void;
  fetchLog: { start: number; end?: number };
  addLog: string[];
  replaceLog: string[];
  "player:clicked": { index: number };
  "update:preference": { name: string; value: string | boolean | null };
  "replay:info": { start: number; current: number; end: number };
}

export class ViewerBridge {
  readonly events = new Emitter();
  readonly uplink = new Emitter();

  constructor() {
    for (const name of ["ready", "move", "fetchState", "fetchLog", "addLog", "replaceLog", "player:clicked", "update:preference", "replay:info"] as const) {
      this.uplink.on(name, (payload) => this.send(name, payload));
    }
  }

  on<K extends keyof ViewerEvents>(event: K, listener: (payload: ViewerEvents[K]) => void): () => void {
    return this.events.on(event, listener);
  }

  emitDownlink<K extends keyof ViewerEvents>(event: K, payload: ViewerEvents[K]): void {
    this.events.emit(event, payload);
  }

  sendMove(move: Move): void {
    this.uplink.emit("move", { move });
  }

  ready(): void {
    this.uplink.emit("ready");
  }

  replaceLog(lines: string[]): void {
    this.uplink.emit("replaceLog", lines);
  }

  fetchState(): void {
    this.uplink.emit("fetchState");
  }

  replayInfo(info: { start: number; current: number; end: number }): void {
    this.uplink.emit("replay:info", info);
  }

  playerClicked(index: number): void {
    this.uplink.emit("player:clicked", { index });
  }

  updatePreference(name: string, value: string | boolean | null): void {
    this.uplink.emit("update:preference", { name, value });
  }

  fetchLog(start: number, end?: number): void {
    this.uplink.emit("fetchLog", { start, end });
  }

  private send(event: string, payload: unknown): void {
    // A host inside the BGS iframe parent listens via postMessage; a local harness
    // (dev page) listens on the emitter returned by launch() — forward uplink there too.
    const target = window.parent === window ? null : window.parent;
    target?.postMessage({ type: `splendor:${event}`, payload }, "*");
    this.events.emit(event, payload);
  }
}

export function launchBridge(): ViewerBridge {
  const bridge = new ViewerBridge();
  window.addEventListener("message", (event) => {
    const data = event.data as { type?: string; payload?: unknown; state?: unknown; data?: unknown; to?: number } | null;
    if (!data || typeof data !== "object" || typeof data.type !== "string") return;
    switch (data.type) {
      case "state":
        bridge.emitDownlink("state", (data.state ?? data.payload) as GameState);
        break;
      case "state:updated":
        bridge.emitDownlink("state:updated", undefined);
        bridge.fetchState();
        break;
      case "gameLog":
      case "gamelog":
        bridge.emitDownlink("gamelog", (data.data ?? data.payload) as ViewerEvents["gamelog"]);
        bridge.fetchState();
        break;
      case "player":
        bridge.emitDownlink("player", data.payload as { index?: number });
        break;
      case "avatars":
        bridge.emitDownlink("avatars", data.payload as string[]);
        break;
      case "preferences":
        bridge.emitDownlink("preferences", data.payload as Record<string, unknown>);
        break;
      case "replay:start":
        bridge.emitDownlink("replay:start", undefined);
        break;
      case "replay:to":
        bridge.emitDownlink("replay:to", (data.to ?? (data.payload as number)) as number);
        break;
      case "replay:end":
        bridge.emitDownlink("replay:end", undefined);
        break;
      case "askReady":
        window.parent?.postMessage({ type: "gameReady" }, "*");
        break;
    }
  });
  return bridge;
}
