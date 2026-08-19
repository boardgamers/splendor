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

	requestAnimationFrame(() => requestAnimationFrame(() => bridge.ready()));
	return bridge.events as unknown as Emitter;
}

if (typeof window !== "undefined") {
	(window as unknown as { splendor?: unknown }).splendor = { launch };
}
