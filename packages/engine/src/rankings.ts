import { activePlayers, scores } from "./state.js";
import type { GameState } from "./types.js";

export function rankings(state: GameState): number[] {
  const finalScores = scores(state);
  const active = activePlayers(state);
  const order = active
    .map((index) => ({ index, score: finalScores[index] as number, cards: state.players[index]?.cards.length ?? 0 }))
    .sort((a, b) => b.score - a.score || a.cards - b.cards || a.index - b.index);
  const ranks = new Array<number>(state.players.length).fill(state.players.length);
  let rank = 1;
  for (let i = 0; i < order.length; i++) {
    const current = order[i];
    const previous = order[i - 1];
    if (i > 0 && current && previous && (current.score !== previous.score || current.cards !== previous.cards)) {
      rank = i + 1;
    }
    if (current) ranks[current.index] = rank;
  }
  return ranks;
}
