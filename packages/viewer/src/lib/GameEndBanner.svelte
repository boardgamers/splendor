<script lang="ts">
	import type { ViewerStore } from "./store.svelte";

	interface Props {
		store: ViewerStore;
	}

	let { store }: Props = $props();
	const state = $derived(store.state);
	const ranks = $derived(store.finalRankings);
	const scores = $derived(store.finalScores);
	const winners = $derived(state?.ended ? ranks.map((r, i) => (r === 1 ? i : -1)).filter((i) => i >= 0) : []);
</script>

{#if state?.ended}
	<div class="banner">
		<h2>Game over</h2>
		<p class="result">
			{#if winners.length > 1}
				Shared victory: {winners.map((i) => state.players[i]!.name).join(" & ")}
			{:else if winners.length === 1}
				{state.players[winners[0]!]!.name} wins
			{/if}
		</p>
		<table>
			<thead>
				<tr><th>#</th><th>Player</th><th>Prestige</th><th>Cards</th></tr>
			</thead>
			<tbody>
				{#each state.players.map((p, i) => ({ p, i })).sort((a, b) => ranks[a.i]! - ranks[b.i]!) as row (row.i)}
					<tr class:winner={ranks[row.i] === 1}>
						<td>{ranks[row.i]}</td>
						<td>{row.p.name}</td>
						<td>{scores[row.i]}</td>
						<td>{row.p.cards.length}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.banner {
		background: linear-gradient(160deg, #2c2416, #211a0e);
		border: 1px solid var(--gold);
		border-radius: var(--radius);
		padding: 16px 20px;
		margin-bottom: 14px;
	}
	h2 {
		margin: 0 0 4px;
		color: var(--gold);
		font-size: 20px;
	}
	.result {
		margin: 0 0 12px;
		color: var(--text);
		font-size: 16px;
		font-weight: 600;
	}
	table {
		border-collapse: collapse;
		width: 100%;
		max-width: 420px;
	}
	th,
	td {
		text-align: left;
		padding: 4px 12px 4px 0;
		font-size: 13px;
	}
	th {
		color: var(--text-dim);
		font-weight: 600;
	}
	tr.winner td {
		color: var(--gold);
		font-weight: 700;
	}
</style>
