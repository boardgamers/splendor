<script lang="ts">
	interface Props {
		faceDown?: boolean;
		tier?: 1 | 2 | 3;
	}

	let { faceDown = true, tier }: Props = $props();
</script>

<div class="cardback tier-{tier ?? 0}" class:faceDown>
	{#if tier}
		<span class="roman">{"I".repeat(tier)}</span>
	{:else}
		<span class="glyph">◆</span>
	{/if}
</div>

<style>
	.cardback {
		width: 56px;
		height: 78px;
		border-radius: 6px;
		background: linear-gradient(150deg, #343a49, #23272f 65%, #1b1e25);
		border: 1px solid rgba(212, 175, 55, 0.35);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
	}
	.cardback.tier-1 { background: linear-gradient(150deg, #3d5a43, #2c4231); }
	.cardback.tier-2 { background: linear-gradient(150deg, #6d5a2c, #4f411f); }
	.cardback.tier-3 { background: linear-gradient(150deg, #5d3a4e, #452b39); }
	.roman {
		font-size: 15px;
		font-weight: 800;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.6);
	}
	.glyph {
		font-size: 18px;
		color: rgba(212, 175, 55, 0.5);
	}
</style>
