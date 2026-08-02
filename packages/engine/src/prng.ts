import seedrandom from "seedrandom";

export type Prng = () => number;

export function createPrng(seed: string): Prng {
	return seedrandom(seed);
}

export function shuffle<T>(items: T[], rand: Prng): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const a = result[i] as T;
		result[i] = result[j] as T;
		result[j] = a;
	}
	return result;
}

export function pick<T>(items: T[], rand: Prng): T {
	const item = items[Math.floor(rand() * items.length)];
	if (item === undefined) {
		throw new Error("pick from empty list");
	}
	return item;
}
