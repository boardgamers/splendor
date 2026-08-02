<script lang="ts">
	import type { ViewerStore } from "./store.svelte";

	interface Props {
		store: ViewerStore;
	}

	let { store }: Props = $props();
	const lines = $derived(store.logLines);
	const compact = $derived(store.preferences.compactCards === true);
	const showFeed = $derived(store.preferences.logFeed !== false);
	const recent = $derived(
		lines
			.map((line, index) => ({ line, index }))
			.slice(-8)
			.reverse()
	);
</script>

<div class="side">
	<div class="prefs">
		<label title="Smaller development cards">
			<input
				type="checkbox"
				checked={compact}
				onchange={(e) => store.updatePreference("compactCards", e.currentTarget.checked)}
			/>
			Compact cards
		</label>
		<label title="Show the event feed below the board">
			<input
				type="checkbox"
				checked={showFeed}
				onchange={(e) => store.updatePreference("logFeed", e.currentTarget.checked)}
			/>
			Event feed
		</label>
	</div>

	{#if showFeed}
		<div class="feed">
			{#each recent as item (item.index)}
				<div class="entry" class:latest={item.index === lines.length - 1}>{item.line}</div>
			{/each}
			{#if recent.length === 0}
				<div class="entry dim">No events yet</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.side {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.prefs {
		display: flex;
		gap: 14px;
		align-items: center;
		padding: 0 4px;
	}
	.prefs label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		color: var(--text-dim);
		cursor: pointer;
		user-select: none;
	}
	.prefs input {
		accent-color: var(--gold);
	}
	.feed {
		background: var(--bg-panel);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 8px 12px;
		max-height: 150px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.entry {
		font-size: 12px;
		color: var(--text);
		border-bottom: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
		padding-bottom: 3px;
	}
	.entry:last-child {
		border-bottom: none;
	}
	.entry.latest {
		color: var(--gold);
		font-weight: 600;
	}
	.entry.dim {
		color: var(--text-dim);
	}
</style>
