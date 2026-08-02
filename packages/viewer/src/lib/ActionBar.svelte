<script lang="ts">
  import type { ViewerStore } from "./store.svelte";
  import GemChip from "./GemChip.svelte";

  interface Props {
    store: ViewerStore;
  }

  let { store }: Props = $props();
  const pending = $derived(store.pendingNobleChoice);
  const draft = $derived(store.takeDraft);
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
    {:else if store.reserving}
      <div class="flow">
        <span class="hint gold-hint">Reserving: click a card or a deck to reserve it (+1 gold if available).</span>
        <button class="cancel" onclick={() => store.cancel()}>Cancel</button>
      </div>
    {:else}
      <div class="flow">
        <span class="hint">{store.takeHint}</span>
        {#if store.gemPick.length > 0}
          <div class="picked">
            {#each store.gemPick as color, i (i)}
              <GemChip {color} size="small" clickable={i === store.gemPick.length - 1} onclick={() => store.unpickGem()} />
            {/each}
          </div>
          <button class="confirm" disabled={!draft} onclick={() => store.confirmTake()}>
            {draft ? (draft.action === "take2" ? "Take 2" : "Take 3") : "Take…"}
          </button>
          <button class="cancel" onclick={() => store.cancel()}>Clear</button>
        {/if}
      </div>
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
  .flow {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hint { color: var(--text-dim); }
  .gold-hint { color: var(--gold); }
  .picked { display: flex; gap: 5px; }
  .confirm { border-color: var(--gold); }
  .cancel { color: var(--text-dim); }
  .noble-choice .prompt { color: var(--gold); font-weight: 600; }
  .nobles { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
  .noble-btn {
    border-color: var(--gold);
    background: linear-gradient(155deg, #3a2f1d, #2a2114);
  }
</style>
