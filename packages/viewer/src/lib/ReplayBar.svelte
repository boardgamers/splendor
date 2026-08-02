<script lang="ts">
	import type { ViewerStore } from "./store.svelte";

	interface Props {
		store: ViewerStore;
	}

	let { store }: Props = $props();
	const replay = $derived(store.replay);
	const lines = $derived(store.logLines);
	const moves = $derived.by(() => {
		let count = 0;
		const marks: { move: number; log: number }[] = [];
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i] ?? "";
			if (line.startsWith("Game started")) {
				continue;
			}
			count++;
			marks.push({ move: count, log: i });
		}
		return marks;
	});
</script>

{#if replay.active}
	<div class="replaybar">
		<div class="title">
			<span class="badge">REPLAY</span>
			<span class="pos">entry {replay.current} / {replay.end}</span>
		</div>
		<div class="track">
			<button class="nav" disabled={replay.current <= 0} onclick={() => store.replayToEntry(0)} title="Start">⏮</button>
			<div class="marks">
				{#each moves as mark (mark.log)}
					<button
						class="mark"
						class:done={mark.log < replay.current}
						class:current={mark.log === replay.current - 1}
						title={lines[mark.log]}
						onclick={() => store.replayToEntry(mark.log + 1)}
					></button>
				{/each}
			</div>
			<button
				class="nav"
				disabled={replay.current >= replay.end}
				onclick={() => store.replayToEntry(replay.end)}
				title="Live">⏭</button
			>
		</div>
	</div>
{/if}

<style>
	.replaybar {
		background: linear-gradient(160deg, #241f2e, #1a1622);
		border: 1px solid #6d5a9e;
		border-radius: var(--radius);
		padding: 10px 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.badge {
		background: #6d5a9e;
		color: #fff;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 1px;
		padding: 2px 7px;
		border-radius: 4px;
	}
	.pos {
		color: var(--text-dim);
		font-size: 12px;
	}
	.track {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.nav {
		padding: 2px 8px;
		font-size: 12px;
	}
	.marks {
		flex: 1;
		display: flex;
		gap: 3px;
		align-items: center;
		overflow-x: auto;
		padding: 4px 0;
	}
	.mark {
		width: 10px;
		height: 10px;
		min-width: 10px;
		border-radius: 50%;
		border: 1px solid #5a4d80;
		background: transparent;
		padding: 0;
	}
	.mark.done {
		background: #6d5a9e;
	}
	.mark.current {
		border-color: var(--gold);
		background: var(--gold);
		box-shadow: 0 0 6px var(--gold-soft);
	}
</style>
