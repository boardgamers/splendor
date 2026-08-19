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

// The BGS iframe shim (resources/game/<game>/<v>/iframe) owns the postMessage
// protocol: it re-emits controller messages on the emitter returned by launch()
// (downlink) and re-posts our emitted uplink events to the parent. The dev
// harness drives the same emitter directly. So this bridge is just the typed
// emitter surface — no window/postMessage code of our own (that double-handling
// is what caused the `player` undefined destructure and the proxy-clone throw).
export class ViewerBridge {
	readonly events = new Emitter();

	on<K extends keyof ViewerEvents>(event: K, listener: (payload: ViewerEvents[K]) => void): () => void {
		return this.events.on(event, listener);
	}

	sendMove(move: Move): void {
		this.events.emit("move", { move });
	}

	ready(): void {
		this.events.emit("ready");
	}

	replaceLog(lines: string[]): void {
		this.events.emit("replaceLog", lines);
	}

	fetchState(): void {
		this.events.emit("fetchState");
	}

	replayInfo(info: { start: number; current: number; end: number }): void {
		this.events.emit("replay:info", info);
	}

	playerClicked(index: number): void {
		this.events.emit("player:clicked", { index });
	}

	updatePreference(name: string, value: string | boolean | null): void {
		this.events.emit("update:preference", { name, value });
	}

	fetchLog(start: number, end?: number): void {
		this.events.emit("fetchLog", { start, end });
	}
}

export function launchBridge(): ViewerBridge {
	return new ViewerBridge();
}
