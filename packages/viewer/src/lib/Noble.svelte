<script lang="ts">
	import { GEM_COLORS, nobleById } from "splendor-engine";
	import GemChip from "./GemChip.svelte";

	interface Props {
		nobleId: number;
		selectable?: boolean;
		onclick?: () => void;
	}

	let { nobleId, selectable = false, onclick }: Props = $props();
	const noble = $derived(nobleById(nobleId));
	const reqs = $derived(GEM_COLORS.map((c) => ({ color: c, n: noble.requirement[c] })).filter((x) => x.n > 0));
</script>

<div
	class="noble"
	class:selectable
	title={noble.name}
	role={selectable ? "button" : undefined}
	tabindex={selectable ? 0 : undefined}
	onclick={selectable ? onclick : undefined}
	onkeydown={selectable && onclick ? (e) => e.key === "Enter" && onclick() : undefined}
>
	<span class="points">{noble.points}</span>
	<span class="name">{noble.name.split(" ")[0]}</span>
	<div class="reqs">
		{#each reqs as req (req.color)}
			<GemChip color={req.color} count={req.n} size="mini" />
		{/each}
	</div>
</div>

<style>
	.noble {
		width: var(--noble);
		height: var(--noble);
		border-radius: 8px;
		background: var(--noble-bg);
		border: 1px solid rgba(212, 175, 55, 0.45);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45);
		padding: calc(var(--noble) * 0.06);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		position: relative;
		user-select: none;
		overflow: hidden;
		transition:
			transform 0.16s ease,
			box-shadow 0.16s ease;
	}
	.points {
		align-self: flex-start;
		font-size: calc(var(--noble) * 0.18);
		font-weight: 800;
		line-height: 1;
		color: var(--gold);
	}
	.name {
		/* vertically centered between the points badge and the gems (flex column + space-between) */
		font-size: calc(var(--noble) * 0.15);
		line-height: 1.1;
		color: var(--noble-text);
		opacity: 0.9;
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.reqs {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-content: flex-end;
		gap: calc(var(--noble) * 0.03);
	}
	.noble.selectable {
		cursor: pointer;
		animation: glowPulse 1.2s ease-in-out infinite;
	}
	.noble.selectable:hover {
		transform: translateY(-4px);
	}
</style>
