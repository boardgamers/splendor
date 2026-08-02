<script lang="ts">
  import type { ViewerStore } from "./store.svelte";
  import GemChip from "./GemChip.svelte";

  interface Props {
    store: ViewerStore;
  }

  let { store }: Props = $props();
  const pending = $derived(store.pendingNobleChoice);
  const tokensOver = $derived(store.playerIndex !== undefined ? store.tokensOf(store.playerIndex) : 0);
</script>

{#if store.myTurn}
  <div class="actionbar">
    {#if pending.length > 0}
      <div class="noble-choice">
        <span class="prompt">A noble visits you — choose one:</span>
        <div class="nobles">
          {#each pending as nobleId (nobleId)}
            <button class="noble-btn" onclick={() => store.chooseNoble(nobleId)}>
              {store.noble(nobleId).name}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <div class="tabs">
        <button class:active={store.tab === "take"} disabled={!store.canTakeAtAll()} onclick={() => store.selectTab("take")}>
          Take 3 different
        </button>
        <button class:active={store.tab === "take2"} onclick={() => store.selectTab("take2")}>
          Take 2 same
        </button>
        <button class:active={store.tab === "buy"} onclick={() => store.selectTab("buy")}>Buy</button>
        <button class:active={store.tab === "reserve"} onclick={() => store.selectTab("reserve")}>Reserve</button>
        {#if store.tab}
          <button class="cancel" onclick={() => store.cancel()}>Cancel</button>
        {/if}
      </div>

      {#if store.tab === "take"}
        <div class="flow">
          <span class="hint">
            Pick 3 gems from the bank ({{ 0: "none", 1: "one", 2: "two", 3: "three" }[store.gemPick.length]} picked)
            {#if tokensOver + 3 > 10}<span class="warn">— you may hold at most 10 gems</span>{/if}
          </span>
          <div class="picked">
            {#each store.gemPick as color (color)}
              <GemChip {color} size="small" />
            {/each}
          </div>
          <button class="confirm" disabled={store.gemPick.length !== 3 || tokensOver + 3 > 10} onclick={() => store.confirmTake()}>
            Confirm
          </button>
        </div>
      {:else if store.tab === "take2"}
        <div class="flow">
          <span class="hint">Click a bank color with at least 4 gems.</span>
        </div>
      {:else if store.tab === "buy"}
        <div class="flow">
          <span class="hint">Click a glowing card on the board or in your reserved row to buy it.</span>
        </div>
      {:else if store.tab === "reserve"}
        <div class="flow">
          <span class="hint">Click a card or a deck to reserve it (gold joker included if available).</span>
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .actionbar {
    background: var(--bg-panel);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .tabs button.active {
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold) 18%, var(--bg-elevated));
  }
  .tabs .cancel {
    margin-left: auto;
    color: var(--text-dim);
  }
  .flow {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hint { color: var(--text-dim); }
  .warn { color: var(--ruby); }
  .picked { display: flex; gap: 5px; }
  .confirm { border-color: var(--gold); }
  .noble-choice .prompt { color: var(--gold); font-weight: 600; }
  .nobles { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
  .noble-btn {
    border-color: var(--gold);
    background: linear-gradient(155deg, #3a2f1d, #2a2114);
  }
</style>
