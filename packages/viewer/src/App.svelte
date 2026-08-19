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
	import GemField from "./lib/GemField.svelte";

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

<GemField />

{#if state}
	<div class="board" class:compact={store.preferences.compactCards === true}>
		<ReplayBar {store} />

		<div class="page">
			<GameEndBanner {store} />

			<div class="columns">
				<div class="main">
					<div class="top">
						<div class="players" data-count={state.players.length}>
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
										selectable={store.myTurn &&
											(store.affordable(cardId) || (store.reserving && store.canReserveAtAll()))}
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
				</div>

				<div class="side">
					<div class="action-zone">
						<Bank {state} {store} />
						<ActionBar {store} />
					</div>
					<LogFeed {store} />
				</div>
			</div>
		</div>
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
		max-width: 1400px;
		/* Center the board within a wide iframe so large screens don't leave a
	   one-sided empty gutter. */
		margin: 0 auto;
		width: 100%;
		/* Sit above the fixed GemField watermark layer (z-index 0). */
		position: relative;
		z-index: 1;
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
		/* Panels share the main column (board) width evenly: 2 players side by
		   side, 3 across, 4 as 2x2 — so the top row aligns with the board below
		   instead of clustering narrow or stretching past it. */
		grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
		grid-auto-rows: min-content;
		align-content: start;
		gap: 10px;
		flex: 1 1 auto;
		min-width: 0;
		align-items: start;
	}
	@media (min-width: 1100px) {
		.players[data-count="2"] {
			grid-template-columns: repeat(2, 1fr);
		}
		.players[data-count="3"] {
			grid-template-columns: repeat(3, 1fr);
		}
		.players[data-count="4"] {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.nobles-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	/* Default (narrow): single column, board stacked above the action zone. */
	.page {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.columns {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
	/* Wide screens: two columns — the board (players/nobles/tiers) on the left,
	   bank + action bar + event feed in a fixed right sidebar. The main column
	   hugs the board content width (the tier rows are its widest element) and the
	   whole group is centered, so there's no dead gap between the columns. */
	@media (min-width: 1100px) {
		/* Shrink-wrap the whole group (banner + columns) to the columns' width and
		   center it, so the end-game banner is exactly as wide as the two columns
		   below instead of stretching to the board's max-width. */
		.page {
			width: fit-content;
			margin: 0 auto;
			align-items: stretch;
		}
		.columns {
			flex-direction: row;
			align-items: flex-start;
			justify-content: center;
			gap: 24px;
		}
		.main {
			flex: 0 0 auto;
			align-items: stretch;
		}
		.side {
			flex: 0 0 360px;
			position: sticky;
			top: 16px;
		}
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
		position: relative;
		z-index: 1;
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
