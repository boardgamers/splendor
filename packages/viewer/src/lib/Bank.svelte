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

<div class="bank">
  {#each GEM_COLORS as color (color)}
    {@const count = state.bank[color]}
    <GemChip
      {color}
      {count}
      clickable={store.myTurn && (store.tab === "take" || store.tab === "take2") && count > 0}
      selected={store.gemPick.includes(color)}
      dimmed={count === 0}
      onclick={() => store.pickGem(color)}
    />
  {/each}
  <GemChip color="gold" count={state.bank.gold} dimmed={state.bank.gold === 0} />
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
  }
</style>
