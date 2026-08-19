import { mount } from "svelte";
import App from "./App.svelte";
import { launchBridge } from "./lib/bgs.svelte";
import { createStore } from "./lib/store.svelte";
import type { Emitter } from "./lib/emitter";
import "./lib/theme.css";

export function launch(selector: string): Emitter {
	const target = document.querySelector(selector);
	if (!target) {
		throw new Error(`splendor-viewer: no element matches "${selector}"`);
	}

	const bridge = launchBridge();
	const store = createStore(bridge);

	mount(App, {
		target,
		props: {
			store,
			onPlayerClick: (index: number) => bridge.playerClicked(index),
		},
	});

	// Emit ready on a macrotask, not requestAnimationFrame: the BGS iframe starts
	// hidden (class:hidden until displayReady), and hidden iframes throttle or
	// skip rAF entirely in Firefox/Brave — so a rAF-gated ready never fires and
	// the platform spinner never clears. A timeout always runs.
	setTimeout(() => bridge.ready(), 0);
	return bridge.events as unknown as Emitter;
}

if (typeof window !== "undefined") {
	(window as unknown as { splendor?: unknown }).splendor = { launch };
}
