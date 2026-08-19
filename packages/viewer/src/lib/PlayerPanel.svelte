<script lang="ts">
	import { GEM_COLORS, type GameState } from "splendor-engine";
	import { playerColor } from "splendor-engine";
	import type { ViewerStore } from "./store.svelte";
	import GemChip from "./GemChip.svelte";
	import Card from "./Card.svelte";
	import CardBack from "./CardBack.svelte";

	interface Props {
		state: GameState;
		store: ViewerStore;
		index: number;
		onNameClick?: (index: number) => void;
	}

	let { state, store, index, onNameClick }: Props = $props();

	const player = $derived(state.players[index]!);
	const isCurrent = $derived(state.current === index && !state.ended);
	const isMe = $derived(store.playerIndex === index);
	const bonus = $derived(store.bonusesOf(index));
	const bonusList = $derived(GEM_COLORS.map((c) => ({ color: c, n: bonus[c] })).filter((x) => x.n > 0));
	const avatar = $derived(store.avatars[index]);
	const initial = $derived((player.name.trim()[0] ?? "?").toUpperCase());
</script>

<div
	class="panel"
	class:current={isCurrent}
	class:dropped={player.dropped}
	class:me={isMe}
	style="--pc: {playerColor(index)}"
>
	<div class="head">
		<button class="identity" onclick={() => onNameClick?.(index)} title={player.name}>
			{#if avatar}
				<img class="avatar" src={avatar} alt="" referrerpolicy="no-referrer" />
			{:else}
				<span class="avatar fallback" style="--pc: {playerColor(index)}">{initial}</span>
			{/if}
			<span class="name">{player.name}</span>
		</button>
		<span class="prestige">{store.prestigeOf(index)}</span>
	</div>

	<div class="row tokens">
		{#each GEM_COLORS as color (color)}
			{#if player.tokens[color] > 0}
				<GemChip {color} count={player.tokens[color]} size="small" />
			{/if}
		{/each}
		{#if player.tokens.gold > 0}
			<GemChip color="gold" count={player.tokens.gold} size="small" />
		{/if}
		{#if store.tokensOf(index) === 0}
			<span class="none">no gems</span>
		{/if}
	</div>

	<div class="row bonuses">
		{#each bonusList as b (b.color)}
			<GemChip color={b.color} count={b.n} size="mini" />
		{/each}
		{#if player.nobles.length > 0}
			<span class="nobles" title="nobles">♛ {player.nobles.length}</span>
		{/if}
	</div>

	{#if player.reserved.length > 0}
		<div class="row my-reserved">
			{#each player.reserved as cardId, i (cardId + ":" + i)}
				{#if cardId >= 0}
					<!-- visible: own cards, or opponents' table-reserved cards (public info) -->
					<Card
						{cardId}
						mini
						affordable={isMe && store.myTurn && store.affordable(cardId)}
						selectable={isMe && store.myTurn && store.affordable(cardId)}
						onclick={isMe ? () => store.clickCard(cardId, "reserved") : undefined}
					/>
				{:else}
					<!-- -1: a deck-reserved (secret) card -->
					<CardBack />
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.panel {
		background: var(--bg-panel);
		border: 1px solid var(--line);
		border-left: 4px solid var(--pc);
		border-radius: var(--radius);
		padding: 8px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 220px;
		transition:
			box-shadow 0.2s ease,
			border-color 0.2s ease;
	}
	.panel.current {
		border-color: var(--pc);
		box-shadow:
			0 0 0 1px var(--pc),
			0 0 14px color-mix(in srgb, var(--pc) 40%, transparent);
	}
	.panel.me {
		background: var(--bg-elevated);
	}
	.panel.dropped {
		opacity: 0.45;
		filter: grayscale(0.8);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.identity {
		display: flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		padding: 0;
		min-width: 0;
	}
	.identity:hover {
		border: none;
	}
	.identity:hover .name {
		color: var(--gold);
	}
	.avatar {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--pc);
		flex-shrink: 0;
	}
	.avatar.fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--pc) 30%, var(--bg-elevated));
		color: var(--text);
		font-weight: 800;
		font-size: 14px;
	}
	.name {
		font-weight: 700;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.prestige {
		font-weight: 800;
		color: var(--gold);
		font-size: 16px;
	}
	.row {
		display: flex;
		gap: 5px;
		align-items: center;
		flex-wrap: wrap;
		min-height: 20px;
	}
	.none {
		color: var(--text-dim);
		font-size: 11px;
	}
	.nobles {
		font-size: 11px;
		color: var(--text-dim);
		margin-left: auto;
	}
	.my-reserved {
		margin-top: 4px;
	}

	@media (max-width: 720px) {
		.panel {
			min-width: 0;
			padding: 6px 8px;
			gap: 4px;
		}
		.avatar {
			width: 24px;
			height: 24px;
		}
		.head {
			gap: 6px;
		}
		.name {
			font-size: 13px;
		}
		.prestige {
			font-size: 14px;
		}
	}
</style>
