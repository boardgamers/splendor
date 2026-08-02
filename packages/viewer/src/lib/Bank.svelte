<script lang="ts">
  import { GEM_COLORS, type GameState } from "splendor-engine";
  import type { ViewerStore } from "./store.svelte";
  import GemChip from "./GemChip.svelte";

  interface Props {
    state: GameState;
    store: ViewerStore;
  }

  let { state, store }: Props = $props();
</script>

<div class="bank" class:active={store.bankActive && !store.reserving} class:reserving={store.reserving}>
  <span class="bank-label">Bank</span>
  {#each GEM_COLORS as color (color)}
    {@const count = state.bank[color]}
    {@const enabled = store.gemEnabled(color)}
    <GemChip
      {color}
      {count}
      clickable={enabled}
      selected={store.gemPick.includes(color)}
      dimmed={!enabled}
      onclick={() => store.pickGem(color)}
    />
  {/each}
  <GemChip
    color="gold"
    count={state.bank.gold}
    clickable={store.myTurn && store.pendingNobleChoice.length === 0}
    selected={store.reserving}
    dimmed={state.bank.gold === 0}
    onclick={() => store.toggleReserve()}
  />
</div>

<style>
  .bank {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    background: var(--bg-panel);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .bank.active {
    border-color: color-mix(in srgb, var(--gold) 55%, var(--line));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--gold) 35%, transparent), 0 0 16px rgba(212, 175, 55, 0.12);
  }
  .bank.active .bank-label { color: var(--gold); }
  .bank.reserving {
    border-color: var(--gold);
  }
  .bank-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-right: 2px;
    transition: color 0.2s ease;
  }
</style>
