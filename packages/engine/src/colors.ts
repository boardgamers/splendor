export const PLAYER_COLORS = ["#4f8ef7", "#f0716a", "#57c17b", "#f2b84b"] as const;

export function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length] as string;
}
