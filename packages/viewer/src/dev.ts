import { startDevBackend } from "./dev-backend";
import { launch } from "./viewer";

const params = new URLSearchParams(window.location.search);
const players = Math.min(4, Math.max(2, Number(params.get("players") ?? 2)));
const seed = params.get("seed") ?? undefined;

const emitter = launch("#app");
startDevBackend(emitter as never, { players, seed });

console.log(`[splendor dev] hot-seat vs bots: you are player 0 of ${players}, seed=${seed ?? "random"}`);
