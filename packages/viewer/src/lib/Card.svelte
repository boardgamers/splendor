<script lang="ts">
	import { GEM_COLORS, cardById } from "splendor-engine";
	import GemChip from "./GemChip.svelte";

	interface Props {
		cardId: number;
		mini?: boolean;
		affordable?: boolean;
		selectable?: boolean;
		onclick?: () => void;
	}

	let { cardId, mini = false, affordable = false, selectable = false, onclick }: Props = $props();
	const card = $derived(cardById(cardId));
	const costs = $derived(GEM_COLORS.map((c) => ({ color: c, n: card.cost[c] })).filter((x) => x.n > 0));
</script>

<div
	class="card tier-{card.tier}"
	class:mini
	class:affordable
	class:selectable
	role={selectable ? "button" : undefined}
	tabindex={selectable ? 0 : undefined}
	onclick={selectable ? onclick : undefined}
	onkeydown={selectable && onclick ? (e) => e.key === "Enter" && onclick() : undefined}
>
	<div class="top">
		{#if card.points > 0}<span class="points">{card.points}</span>{/if}
		<span class="bonus gem-{card.bonus}"></span>
	</div>
	<div class="costs">
		{#each costs as cost (cost.color)}
			<GemChip color={cost.color} count={cost.n} size="mini" />
		{/each}
	</div>
</div>

<style>
	.card {
		width: var(--card-w);
		height: var(--card-h);
		border-radius: 8px;
		background: linear-gradient(160deg, #f4efe4 0%, #e7dfd0 55%, #d9cfba 100%);
		color: #23211c;
		position: relative;
		padding: 7px;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(0, 0, 0, 0.35);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45);
		transition:
			transform 0.16s ease,
			box-shadow 0.16s ease;
	}

	.card.tier-1 {
		background: linear-gradient(160deg, #eef2ec 0%, #dfe7dc 55%, #cbd8c6 100%);
	}
	.card.tier-2 {
		background: linear-gradient(160deg, #f0ede2 0%, #e4ddc8 55%, #d2c8a8 100%);
	}
	.card.tier-3 {
		background: linear-gradient(160deg, #ece4da 0%, #ded0bd 55%, #c9b699 100%);
	}

	.card.selectable {
		cursor: pointer;
	}
	.card.selectable:hover {
		transform: translateY(-6px);
		box-shadow: 0 10px 18px rgba(0, 0, 0, 0.55);
	}
	.card.affordable {
		outline: 2px solid var(--gold);
		outline-offset: 1px;
	}
	.card.affordable.selectable:hover {
		animation: glowPulse 1.2s ease-in-out infinite;
	}
	.card.selectable:not(.affordable):hover {
		outline: 2px dashed var(--gold-soft);
		outline-offset: 1px;
	}

	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.points {
		font-size: 20px;
		font-weight: 800;
		color: #2a2418;
	}
	.bonus {
		width: 22px;
		height: 22px;
		border-radius: 4px;
		background: var(--gem);
		border: 1px solid color-mix(in srgb, var(--gem) 55%, #000);
		box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.35);
	}
	.costs {
		margin-top: auto;
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
	}

	.card.mini {
		width: 56px;
		height: 78px;
		padding: 4px;
	}
	.card.mini .points {
		font-size: 14px;
	}
	.card.mini .bonus {
		width: 14px;
		height: 14px;
	}
</style>
