import { cardById, nobleById } from "./data.js";
import {
	MAX_RESERVED,
	MAX_TOKENS,
	PRESTIGE_TARGET,
	SWAP_MIN_TOKENS,
	TAKE2_MIN_BANK,
	activePlayers,
	availableMoves,
	bonuses,
	canReserveFromDeck,
	cardCostFor,
	findTableCard,
	pendingNoblesFor,
	playerName,
	prestige,
	scores,
	tokenTotal,
} from "./state.js";
import { GEM_COLORS, type GameState, type GemColor, type Move, type PlayerState, type Tier } from "./types.js";

function fail(message: string): never {
	throw new Error(`Illegal move: ${message}`);
}

// The move arrives over the network as untrusted JSON — the declared `Move`
// type is only a compile-time promise. Narrow it to a well-formed move before
// any rule validation or state access, so a malformed payload (wrong types,
// non-array gems, string/object ids, huge arrays, junk enum values) is rejected
// with an Illegal-move error instead of crashing with a TypeError or, worse,
// being silently mishandled. Only plain data shapes are accepted.
function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

function isGemColor(value: unknown): value is GemColor {
	return typeof value === "string" && (GEM_COLORS as readonly string[]).includes(value);
}

function isCardId(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

// Allowed keys per action — anything else on the payload is rejected outright,
// so a malformed move is always an error rather than silently ignoring a field.
const MOVE_KEYS: Record<string, readonly string[]> = Object.assign(Object.create(null), {
	take: ["action", "gems"],
	take2: ["action", "color"],
	reserve: ["action", "cardId", "tier"],
	buy: ["action", "cardId"],
	noble: ["action", "nobleId"],
	swap: ["action", "give", "receive"],
});

function sanitizeMove(raw: unknown): Move {
	if (!isPlainObject(raw)) {
		fail("move must be a plain object");
	}
	const action = raw.action;
	if (typeof action !== "string") {
		fail("move.action must be a string");
	}
	// MOVE_KEYS is a null-prototype object, so "__proto__"/"constructor" actions
	// look up as undefined (no Object.prototype inheritance) and are rejected here.
	const allowed = MOVE_KEYS[action];
	if (!allowed) {
		fail(`unknown move action ${action}`);
	}
	for (const key of Object.keys(raw)) {
		if (!allowed.includes(key)) {
			fail(`unexpected field "${key}" on a ${action} move`);
		}
	}
	switch (action) {
		case "take": {
			const gems = raw.gems;
			if (!Array.isArray(gems) || gems.length < 1 || gems.length > 3 || !gems.every(isGemColor)) {
				fail("take needs 1 to 3 valid gem colors");
			}
			return { action: "take", gems: [...gems] };
		}
		case "take2": {
			if (!isGemColor(raw.color)) {
				fail("take2 needs a valid gem color");
			}
			return { action: "take2", color: raw.color };
		}
		case "reserve": {
			const hasCard = raw.cardId !== undefined;
			const hasTier = raw.tier !== undefined;
			if (hasCard === hasTier) {
				fail("reserve needs exactly one of cardId (table) or tier (deck)");
			}
			if (hasCard) {
				if (!isCardId(raw.cardId)) {
					fail("reserve cardId must be a non-negative integer");
				}
				return { action: "reserve", cardId: raw.cardId };
			}
			if (raw.tier !== 1 && raw.tier !== 2 && raw.tier !== 3) {
				fail("reserve tier must be 1, 2 or 3");
			}
			return { action: "reserve", tier: raw.tier };
		}
		case "buy": {
			if (!isCardId(raw.cardId)) {
				fail("buy cardId must be a non-negative integer");
			}
			return { action: "buy", cardId: raw.cardId };
		}
		case "noble": {
			if (!isCardId(raw.nobleId)) {
				fail("noble nobleId must be a non-negative integer");
			}
			return { action: "noble", nobleId: raw.nobleId };
		}
		case "swap": {
			if (!isGemColor(raw.give) || !isGemColor(raw.receive)) {
				fail("swap needs valid gem colors for give and receive");
			}
			return { action: "swap", give: raw.give, receive: raw.receive };
		}
		default:
			fail(`unknown move action ${action}`);
	}
}

function currentPlayerState(state: GameState): PlayerState {
	const player = state.players[state.current];
	if (!player || player.dropped) {
		fail("no active current player");
	}
	return player;
}

function assertTurn(state: GameState, playerIndex: number): PlayerState {
	if (state.ended) {
		fail("the game is over");
	}
	if (playerIndex !== state.current) {
		fail(`it is ${playerName(state, state.current)}'s turn`);
	}
	return currentPlayerState(state);
}

function drawReplacement(state: GameState, tier: Tier): void {
	const deck = state.decks[tier - 1] as number[];
	const row = state.table[tier - 1] as number[];
	const next = deck.shift();
	if (next !== undefined) {
		row.push(next);
	}
}

function takeGems(state: GameState, player: PlayerState, gems: (keyof GameState["bank"])[]): void {
	for (const color of gems) {
		if (state.bank[color] <= 0) {
			fail(`the bank has no ${color} left`);
		}
	}
	const total = tokenTotal(player);
	if (total + gems.length > MAX_TOKENS) {
		fail(`you may hold at most ${MAX_TOKENS} gems (you have ${total})`);
	}
	for (const color of gems) {
		state.bank[color]--;
		player.tokens[color]++;
	}
}

function checkTakeGems(state: GameState, gems: GemColor[]): void {
	if (gems.length < 1 || gems.length > 3) {
		fail("you must take 1 to 3 different gems");
	}
	if (new Set(gems).size !== gems.length) {
		fail("the gems must be of different colors");
	}
	for (const color of gems) {
		if (!GEM_COLORS.includes(color)) {
			fail(`${color} is not a gem color (gold cannot be taken directly)`);
		}
	}
	const takeable = GEM_COLORS.filter((color) => state.bank[color] > 0).length;
	if (gems.length < 3 && gems.length !== takeable) {
		fail(`you must take 3 different gems unless fewer bank colors remain (${takeable} left)`);
	}
}

function doTake(state: GameState, player: PlayerState, move: Extract<Move, { action: "take" }>): void {
	checkTakeGems(state, move.gems);
	takeGems(state, player, move.gems);
}

function doTake2(state: GameState, player: PlayerState, move: Extract<Move, { action: "take2" }>): void {
	if (!GEM_COLORS.includes(move.color)) {
		fail(`${move.color} is not a gem color (gold cannot be taken directly)`);
	}
	if (state.bank[move.color] < TAKE2_MIN_BANK) {
		fail(`you can take 2 ${move.color} only if the bank has at least ${TAKE2_MIN_BANK}`);
	}
	takeGems(state, player, [move.color, move.color]);
}

function doReserve(state: GameState, player: PlayerState, move: Extract<Move, { action: "reserve" }>): void {
	if (player.reserved.length >= MAX_RESERVED) {
		fail(`you may reserve at most ${MAX_RESERVED} cards`);
	}
	if (tokenTotal(player) >= MAX_TOKENS) {
		fail(`you may hold at most ${MAX_TOKENS} gems`);
	}
	let cardId: number;
	let from: "table" | "deck" = "table";
	if (move.cardId !== undefined) {
		const spot = findTableCard(state, move.cardId);
		if (!spot) {
			fail(`card ${move.cardId} is not available on the table`);
		}
		cardId = move.cardId;
		(state.table[spot.tier - 1] as number[]).splice(spot.index, 1);
		drawReplacement(state, spot.tier);
	} else if (move.tier !== undefined) {
		if (!canReserveFromDeck(state, move.tier)) {
			fail(`tier ${move.tier} deck is empty`);
		}
		cardId = (state.decks[move.tier - 1] as number[]).shift() as number;
		from = "deck";
	} else {
		fail("reserve needs a cardId (from the table) or a tier (from a deck)");
	}
	player.reserved.push(cardId);
	player.reservedFrom.push(from);
	if (state.bank.gold > 0) {
		state.bank.gold--;
		player.tokens.gold++;
	}
}

function doBuy(state: GameState, player: PlayerState, move: Extract<Move, { action: "buy" }>): void {
	const card = cardById(move.cardId);
	const spot = findTableCard(state, move.cardId);
	const reservedIndex = player.reserved.indexOf(move.cardId);
	if (!spot && reservedIndex < 0) {
		fail(`card ${move.cardId} is neither on the table nor in your reserved cards`);
	}
	const { cost, goldNeeded } = cardCostFor(state, state.current, move.cardId);
	if (goldNeeded > player.tokens.gold) {
		fail(`you cannot afford card ${move.cardId} (${goldNeeded} gold needed, ${player.tokens.gold} owned)`);
	}
	let goldLeft = player.tokens.gold;
	for (const color of GEM_COLORS) {
		const spent = Math.min(cost[color], player.tokens[color]);
		const goldSpent = cost[color] - spent;
		player.tokens[color] -= spent;
		state.bank[color] += spent;
		goldLeft -= goldSpent;
		state.bank.gold += goldSpent;
	}
	player.tokens.gold = goldLeft;
	if (spot) {
		(state.table[spot.tier - 1] as number[]).splice(spot.index, 1);
		drawReplacement(state, spot.tier);
	} else {
		player.reserved.splice(reservedIndex, 1);
		player.reservedFrom.splice(reservedIndex, 1);
	}
	player.cards.push(card.id);
}

function doSwap(state: GameState, player: PlayerState, move: Extract<Move, { action: "swap" }>): void {
	if (move.give === move.receive) {
		player.tokens[move.give] -= SWAP_MIN_TOKENS;
		state.bank[move.give] += SWAP_MIN_TOKENS;
		return;
	}
	player.tokens[move.give]--;
	state.bank[move.give]++;
	state.bank[move.receive]--;
	player.tokens[move.receive]++;
}

function doNoble(state: GameState, player: PlayerState, move: Extract<Move, { action: "noble" }>): void {
	const index = state.pendingNobles.indexOf(move.nobleId);
	if (index < 0) {
		fail(`noble ${move.nobleId} does not visit you now`);
	}
	state.pendingNobles.splice(index, 1);
	state.nobles.splice(state.nobles.indexOf(move.nobleId), 1);
	player.nobles.push(move.nobleId);
	state.log.push({ type: "noble", player: state.current, noble: move.nobleId });
	state.messages.push(`${nobleById(move.nobleId).name} visits ${playerName(state, state.current)} (+3 prestige)`);
}

export function endGameCheck(state: GameState): void {
	if (!state.lastRound) {
		const scoring = state.players
			.map((p, i) => (!p.dropped && prestige(p) >= PRESTIGE_TARGET ? i : -1))
			.filter((i) => i >= 0);
		if (scoring.length > 0) {
			state.lastRound = true;
			state.messages.push(`${playerName(state, state.current)} reaches ${PRESTIGE_TARGET} prestige — final round!`);
			state.log.push({ type: "trigger", player: state.current });
		}
	}
	if (state.lastRound && state.current === state.lastPlayer) {
		finishGame(state);
	}
}

export function finishGame(state: GameState): void {
	state.ended = true;
	const finalScores = scores(state);
	let best = -1;
	for (let i = 0; i < state.players.length; i++) {
		if (!state.players[i]?.dropped && (finalScores[i] as number) > best) {
			best = finalScores[i] as number;
		}
	}
	const top = activePlayers(state).filter((i) => finalScores[i] === best);
	let fewestCards = Infinity;
	for (const i of top) {
		fewestCards = Math.min(fewestCards, (state.players[i] as PlayerState).cards.length);
	}
	const winners = top.filter((i) => (state.players[i] as PlayerState).cards.length === fewestCards);
	state.winner = winners[0] ?? null;
	state.tied = winners.length > 1 ? winners : null;
	state.log.push({ type: "end", scores: finalScores });
	const names = winners.map((i) => playerName(state, i)).join(" and ");
	state.messages.push(
		winners.length > 1
			? `Game over: shared victory for ${names} (${best} prestige)`
			: `Game over: ${names} wins with ${best} prestige`
	);
}

function advanceTurn(state: GameState): void {
	if (state.ended) {
		return;
	}
	let next = state.current;
	do {
		next = (next + 1) % state.players.length;
	} while (state.players[next]?.dropped);
	state.current = next;
}

function postAction(state: GameState): void {
	endGameCheck(state);
	if (!state.ended) {
		advanceTurn(state);
	}
}

function validate(state: GameState, move: Move, playerIndex: number): void {
	const player = assertTurn(state, playerIndex);
	if (state.pendingNobles.length > 0) {
		if (move.action !== "noble") {
			fail("a noble is waiting to visit you — choose one");
		}
		if (!state.pendingNobles.includes(move.nobleId)) {
			fail(`noble ${move.nobleId} does not visit you now`);
		}
		return;
	}
	if (move.action === "noble") {
		fail("no noble visits you this turn");
	}
	switch (move.action) {
		case "take": {
			checkTakeGems(state, move.gems);
			for (const color of move.gems) {
				if (state.bank[color] <= 0) {
					fail(`the bank has no ${color} left`);
				}
			}
			if (tokenTotal(player) + move.gems.length > MAX_TOKENS) {
				fail(`you may hold at most ${MAX_TOKENS} gems (you have ${tokenTotal(player)})`);
			}
			return;
		}
		case "take2": {
			if (!GEM_COLORS.includes(move.color)) {
				fail(`${move.color} is not a gem color (gold cannot be taken directly)`);
			}
			if (state.bank[move.color] < TAKE2_MIN_BANK) {
				fail(`you can take 2 ${move.color} only if the bank has at least ${TAKE2_MIN_BANK}`);
			}
			if (tokenTotal(player) + 2 > MAX_TOKENS) {
				fail(`you may hold at most ${MAX_TOKENS} gems (you have ${tokenTotal(player)})`);
			}
			return;
		}
		case "reserve": {
			if (player.reserved.length >= MAX_RESERVED) {
				fail(`you may reserve at most ${MAX_RESERVED} cards`);
			}
			if (tokenTotal(player) >= MAX_TOKENS) {
				fail(`you may hold at most ${MAX_TOKENS} gems`);
			}
			if (move.cardId !== undefined) {
				if (!findTableCard(state, move.cardId)) {
					fail(`card ${move.cardId} is not available on the table`);
				}
			} else if (move.tier !== undefined) {
				if (!canReserveFromDeck(state, move.tier)) {
					fail(`tier ${move.tier} deck is empty`);
				}
			} else {
				fail("reserve needs a cardId (from the table) or a tier (from a deck)");
			}
			return;
		}
		case "buy": {
			const spot = findTableCard(state, move.cardId);
			const reservedIndex = player.reserved.indexOf(move.cardId);
			if (!spot && reservedIndex < 0) {
				fail(`card ${move.cardId} is neither on the table nor in your reserved cards`);
			}
			const { goldNeeded } = cardCostFor(state, playerIndex, move.cardId);
			if (goldNeeded > player.tokens.gold) {
				fail(`you cannot afford card ${move.cardId} (${goldNeeded} gold needed, ${player.tokens.gold} owned)`);
			}
			return;
		}
		case "swap": {
			if (!GEM_COLORS.includes(move.give) || !GEM_COLORS.includes(move.receive)) {
				fail("swap needs gem colors (gold cannot be swapped)");
			}
			if (move.give === move.receive) {
				if (!GEM_COLORS.every((color) => state.bank[color] <= 0)) {
					fail("you may only return gems when the bank has no gems left");
				}
				if (player.tokens[move.give] < SWAP_MIN_TOKENS) {
					fail(`you need at least ${SWAP_MIN_TOKENS} ${move.give} to return`);
				}
			} else {
				if (player.tokens[move.give] <= 0) {
					fail(`you have no ${move.give} to give back`);
				}
				if (state.bank[move.receive] <= 0) {
					fail(`the bank has no ${move.receive} left`);
				}
			}
			if (availableMoves(state, playerIndex).some((encoded) => !encoded.startsWith("swap:"))) {
				fail("you may only swap gems when you have no other legal move");
			}
			return;
		}
		default:
			// Reject unknown/undefined actions (e.g. a malformed or double-wrapped
			// move) instead of falling through — otherwise applyMove would log a
			// no-op move and advance the turn, corrupting the game log.
			fail(`unknown move action ${(move as { action?: unknown }).action}`);
	}
}

export function applyMove(state: GameState, rawMove: Move, playerIndex: number): GameState {
	// Sanitize first: narrow the untrusted payload to a well-formed move and use
	// the fresh plain object throughout (so the log never stores a hostile object).
	const move = sanitizeMove(rawMove);
	validate(state, move, playerIndex);
	const player = state.players[playerIndex] as PlayerState;
	state.log.push({ type: "move", player: playerIndex, move });
	state.moveCount++;

	if (state.pendingNobles.length > 0) {
		const nobleMove = move as Extract<Move, { action: "noble" }>;
		// doNoble already emits the chat message ("X visits Y (+3 prestige)");
		// pushing formatMove here too would double-post the same event to chat.
		doNoble(state, player, nobleMove);
		postAction(state);
		return state;
	}

	// Individual moves (take/buy/reserve/swap) are not pushed to chat — they flood
	// it. They still appear in the event feed via the game log (describeLog); chat
	// only carries noble visits and game-lifecycle events (final round, game over,
	// player left).
	switch (move.action) {
		case "take":
			doTake(state, player, move);
			break;
		case "take2":
			doTake2(state, player, move);
			break;
		case "reserve":
			doReserve(state, player, move);
			break;
		case "buy":
			doBuy(state, player, move);
			break;
		case "swap":
			doSwap(state, player, move);
			break;
	}
	state.pendingNobles = pendingNoblesFor(state, playerIndex);
	if (state.pendingNobles.length === 1) {
		doNoble(state, player, { action: "noble", nobleId: state.pendingNobles[0] as number });
		state.pendingNobles = [];
		postAction(state);
	} else if (state.pendingNobles.length === 0) {
		postAction(state);
	}
	return state;
}

export function dropPlayer(state: GameState, playerIndex: number): GameState {
	const player = state.players[playerIndex];
	if (!player || player.dropped) {
		fail(`player ${playerIndex} is not in the game`);
	}
	player.dropped = true;
	state.log.push({ type: "drop", player: playerIndex });
	state.messages.push(`${playerName(state, playerIndex)} left the game`);

	if (state.pendingNobles.length > 0 && playerIndex === state.current) {
		doNoble(state, player, { action: "noble", nobleId: state.pendingNobles[0] as number });
		state.pendingNobles = [];
	}

	const active = activePlayers(state);
	if (active.length <= 1) {
		state.ended = true;
		const winner = active[0] ?? null;
		state.winner = winner;
		state.tied = null;
		state.log.push({ type: "end", scores: scores(state) });
		state.messages.push(
			winner !== null ? `${playerName(state, winner)} wins — all opponents left` : "Game over — no players left"
		);
		return state;
	}
	if (playerIndex === state.current) {
		endGameCheck(state);
		if (!state.ended) {
			advanceTurn(state);
		}
	}
	if (!state.ended && (state.players[state.lastPlayer]?.dropped ?? true)) {
		state.lastPlayer = Math.max(...active);
	}
	return state;
}

export function describeCard(cardId: number): string {
	const card = cardById(cardId);
	const cost = GEM_COLORS.filter((c) => card.cost[c] > 0)
		.map((c) => `${card.cost[c]} ${c}`)
		.join(", ");
	return `tier ${card.tier} ${card.bonus} card (${card.points} prestige, costs ${cost || "nothing"})`;
}

export { bonuses };
