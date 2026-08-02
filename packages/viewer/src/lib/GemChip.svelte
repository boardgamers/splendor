<script lang="ts">
	import type { TokenColor } from "splendor-engine";

	interface Props {
		color: TokenColor;
		count?: number | null;
		size?: "normal" | "small" | "mini";
		clickable?: boolean;
		selected?: boolean;
		dimmed?: boolean;
		onclick?: () => void;
	}

	let {
		color,
		count = null,
		size = "normal",
		clickable = false,
		selected = false,
		dimmed = false,
		onclick,
	}: Props = $props();
</script>

<span
	class="chip gem-{color} {size}"
	class:clickable
	class:selected
	class:empty={dimmed}
	role={clickable ? "button" : undefined}
	tabindex={clickable ? 0 : undefined}
	onclick={clickable ? onclick : undefined}
	onkeydown={clickable && onclick ? (e) => e.key === "Enter" && onclick() : undefined}
>
	{#if count !== null}{count}{/if}
</span>
