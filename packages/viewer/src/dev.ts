import { startDevBackend } from "./dev-backend";
import { launch } from "./viewer";

const params = new URLSearchParams(window.location.search);
const players = Math.min(4, Math.max(2, Number(params.get("players") ?? 2)));
const seed = params.get("seed") ?? undefined;
const hideReserved = params.get("hideReserved") === "1" || params.get("hideReserved") === "true";

const emitter = launch("#app");
startDevBackend(emitter as never, { players, seed, hideReserved });

(window as unknown as { splendorDev?: unknown }).splendorDev = {
	emitter,
	replayStart: () => emitter.emit("replay:start" as never),
	replayTo: (to: number) => emitter.emit("replay:to" as never, to as never),
	replayEnd: () => emitter.emit("replay:end" as never),
};

console.log(`[splendor dev] hot-seat vs bots: you are player 0 of ${players}, seed=${seed ?? "random"}`);
