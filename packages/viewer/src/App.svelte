<script lang="ts">
	import type { ViewerStore } from "./lib/store.svelte";
	import Bank from "./lib/Bank.svelte";
	import Card from "./lib/Card.svelte";
	import Deck from "./lib/Deck.svelte";
	import Noble from "./lib/Noble.svelte";
	import PlayerPanel from "./lib/PlayerPanel.svelte";
	import ActionBar from "./lib/ActionBar.svelte";
	import GameEndBanner from "./lib/GameEndBanner.svelte";
	import ReplayBar from "./lib/ReplayBar.svelte";
	import LogFeed from "./lib/LogFeed.svelte";

	interface Props {
		store: ViewerStore;
		onPlayerClick?: (index: number) => void;
	}

	let { store, onPlayerClick }: Props = $props();
	const state = $derived(store.state);
	const tierRows = $derived(
		state
			? ([3, 2, 1] as const).map((tier) => ({
					tier: tier as 1 | 2 | 3,
					deckCount: state.decks[tier - 1]?.length ?? 0,
					cards: (state.table[tier - 1] ?? []) as number[],
				}))
			: []
	);
</script>

{#if state}
	<div class="board" class:compact={store.preferences.compactCards === true}>
		<ReplayBar {store} />
		<GameEndBanner {store} />

		<div class="top">
			<div class="players">
				{#each state.players as _, i (i)}
					<PlayerPanel {state} {store} index={i} onNameClick={onPlayerClick} />
				{/each}
			</div>
		</div>

		<div class="nobles-row">
			{#each state.nobles as nobleId (nobleId)}
				<Noble
					{nobleId}
					selectable={store.myTurn && store.pendingNobleChoice.includes(nobleId)}
					onclick={() => store.chooseNoble(nobleId)}
				/>
			{/each}
		</div>

		{#each tierRows as row (row.tier)}
			<div class="tier-row">
				<Deck
					tier={row.tier}
					count={row.deckCount}
					selectable={store.myTurn && store.reserving && store.canReserveAtAll()}
					onclick={() => store.clickDeck(row.tier)}
				/>
				{#each row.cards as cardId, i (i)}
					{#if cardId >= 0}
						<Card
							{cardId}
							affordable={store.myTurn && store.affordable(cardId)}
							selectable={store.myTurn && (store.affordable(cardId) || (store.reserving && store.canReserveAtAll()))}
							onclick={() => store.clickCard(cardId, "table")}
						/>
					{:else}
						<!-- -1: an unknown card drawn from the deck as a replacement after an
						     optimistic buy/reserve on the stripped view — show a face-down slot. -->
						<div class="card-placeholder tier-{row.tier}"></div>
					{/if}
				{/each}
			</div>
		{/each}

		<div class="action-zone">
			<Bank {state} {store} />
			<ActionBar {store} />
		</div>
		<LogFeed {store} />
	</div>
{:else}
	<div class="loading">Waiting for game state…</div>
{/if}

<style>
	.board {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 16px;
		max-width: 1060px;
	}
	.top {
		display: flex;
		gap: 14px;
		align-items: flex-start;
		flex-wrap: wrap;
	}
	/* Bank sits directly above the action bar so picking gems and confirming the
	   take are next to each other (short mouse travel). */
	.action-zone {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: stretch;
	}
	.players {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		grid-auto-rows: min-content;
		align-content: start;
		gap: 10px;
		flex: 1 1 auto;
		min-width: 0;
		align-items: start;
	}
	.nobles-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.tier-row {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	/* Face-down slot for a -1 placeholder (unknown replacement card on the
	   stripped view after an optimistic buy/reserve). Matches the card size. */
	.card-placeholder {
		width: var(--card-w);
		height: var(--card-h);
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.35);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45);
		flex-shrink: 0;
	}
	.card-placeholder.tier-1 {
		background: linear-gradient(150deg, #3d5a43, #2c4231);
	}
	.card-placeholder.tier-2 {
		background: linear-gradient(150deg, #6d5a2c, #4f411f);
	}
	.card-placeholder.tier-3 {
		background: linear-gradient(150deg, #5d3a4e, #452b39);
	}
	/* Keep cards at natural size; if a row is genuinely too wide, scroll it
	   horizontally instead of flex-shrinking cards into tall slivers. */
	.tier-row > :global(*) {
		flex-shrink: 0;
	}
	.loading {
		padding: 40px;
		text-align: center;
		color: var(--text-dim);
	}
	.board.compact {
		--card-w: 68px;
		--card-h: 94px;
	}

	@media (max-width: 720px) {
		.board {
			padding: 10px;
			gap: 10px;
		}
		.top {
			flex-direction: column;
			align-items: stretch;
		}
		.top > .players {
			align-self: start;
			width: 100%;
		}
		/* Players collapse to a compact grid above the board; Bank sits full-width
		   below them, before the nobles/cards. */
		.players {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 8px;
			flex: 0 0 auto;
		}
		.tier-row {
			gap: 8px;
			overflow-x: auto;
			padding-bottom: 4px;
		}
		.nobles-row {
			gap: 8px;
		}
	}
</style>
