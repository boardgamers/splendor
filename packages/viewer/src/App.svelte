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
          cards: (state.table[tier - 1] ?? []) as number[]
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
      <Bank {state} {store} />
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
        <Deck tier={row.tier} count={row.deckCount} selectable={store.myTurn && store.reserving && store.canReserveAtAll()} onclick={() => store.clickDeck(row.tier)} />
        {#each row.cards as cardId (cardId)}
          <Card
            {cardId}
            affordable={store.myTurn && store.affordable(cardId)}
            selectable={store.myTurn && (store.affordable(cardId) || (store.reserving && store.canReserveAtAll()))}
            onclick={() => store.clickCard(cardId, "table")}
          />
        {/each}
      </div>
    {/each}

    <ActionBar {store} />
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
  .players {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    flex: 1;
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
  .loading {
    padding: 40px;
    text-align: center;
    color: var(--text-dim);
  }
  .board.compact {
    --card-w: 68px;
    --card-h: 94px;
  }
  @media (max-width: 900px) {
    .tier-row { gap: 8px; }
    :global(:root) { --card-w: 76px; --card-h: 106px; }
  }
</style>
