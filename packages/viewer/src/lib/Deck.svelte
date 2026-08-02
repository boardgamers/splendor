<script lang="ts">
	import type { Tier } from "splendor-engine";

	interface Props {
		tier: Tier;
		count: number;
		selectable?: boolean;
		onclick?: () => void;
	}

	let { tier, count, selectable = false, onclick }: Props = $props();
</script>

<div
	class="deck tier-{tier}"
	class:selectable
	class:empty={count === 0}
	role={selectable ? "button" : undefined}
	tabindex={selectable ? 0 : undefined}
	onclick={selectable && count > 0 ? onclick : undefined}
	onkeydown={selectable && onclick && count > 0 ? (e) => e.key === "Enter" && onclick() : undefined}
>
	<span class="roman">{"I".repeat(tier)}</span>
	<span class="count">{count}</span>
</div>

<style>
	.deck {
		width: var(--card-w);
		height: var(--card-h);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: 1px solid rgba(0, 0, 0, 0.4);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45);
		transition:
			transform 0.16s ease,
			box-shadow 0.16s ease;
		user-select: none;
	}
	.deck.tier-1 {
		background: linear-gradient(150deg, #3d5a43, #2c4231);
	}
	.deck.tier-2 {
		background: linear-gradient(150deg, #6d5a2c, #4f411f);
	}
	.deck.tier-3 {
		background: linear-gradient(150deg, #5d3a4e, #452b39);
	}
	.roman {
		font-size: 22px;
		font-weight: 800;
		letter-spacing: 2px;
		color: rgba(255, 255, 255, 0.85);
	}
	.count {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.65);
	}
	.deck.selectable {
		cursor: pointer;
	}
	.deck.selectable:hover {
		transform: translateY(-6px);
		box-shadow: 0 10px 18px rgba(0, 0, 0, 0.55);
		outline: 2px solid var(--gold);
	}
	.deck.empty {
		opacity: 0.35;
	}
</style>
