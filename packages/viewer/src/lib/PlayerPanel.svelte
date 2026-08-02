<script lang="ts">
  import { GEM_COLORS, type GameState } from "splendor-engine";
  import { playerColor } from "splendor-engine";
  import type { ViewerStore } from "./store.svelte";
  import GemChip from "./GemChip.svelte";
  import Card from "./Card.svelte";

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
</script>

<div
  class="panel"
  class:current={isCurrent}
  class:dropped={player.dropped}
  class:me={isMe}
  style="--pc: {playerColor(index)}"
>
  <div class="head">
    <button class="name" onclick={() => onNameClick?.(index)} title={player.name}>
      {player.name}
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
    {#if player.reserved.length > 0}
      <span class="reserved" title="{player.reserved.length} reserved">
        ▤ {player.reserved.length}
      </span>
    {/if}
    {#if player.nobles.length > 0}
      <span class="nobles" title="nobles">♛ {player.nobles.length}</span>
    {/if}
  </div>

  {#if isMe && player.reserved.length > 0}
    <div class="row my-reserved">
      {#each player.reserved as cardId (cardId)}
        <Card
          {cardId}
          mini
          affordable={store.myTurn && store.affordable(cardId)}
          selectable={store.myTurn && store.tab === "buy" && store.affordable(cardId)}
          onclick={() => store.clickCard(cardId, "reserved")}
        />
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
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .panel.current {
    border-color: var(--pc);
    box-shadow: 0 0 0 1px var(--pc), 0 0 14px color-mix(in srgb, var(--pc) 40%, transparent);
  }
  .panel.me { background: var(--bg-elevated); }
  .panel.dropped { opacity: 0.45; filter: grayscale(0.8); }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .name {
    background: none;
    border: none;
    padding: 0;
    font-weight: 700;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name:hover { color: var(--gold); border: none; }
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
  .none { color: var(--text-dim); font-size: 11px; }
  .reserved, .nobles { font-size: 11px; color: var(--text-dim); margin-left: auto; }
  .my-reserved { margin-top: 4px; }
</style>
