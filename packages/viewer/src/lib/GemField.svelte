<script lang="ts">
	interface GemSpec {
		id: string;
		x: number;
		y: number;
		size: number;
		rotate: number;
	}

	const gems: GemSpec[] = [
		{ id: "brilliant", x: 90, y: 120, size: 90, rotate: 8 },
		{ id: "pear", x: 320, y: 60, size: 70, rotate: -14 },
		{ id: "emerald", x: 560, y: 160, size: 84, rotate: 20 },
		{ id: "cushion", x: 800, y: 70, size: 66, rotate: 32 },
		{ id: "brilliant", x: 1080, y: 150, size: 110, rotate: -10 },
		{ id: "pear", x: 1330, y: 90, size: 78, rotate: 16 },
		{ id: "cushion", x: 1560, y: 170, size: 90, rotate: -24 },
		{ id: "emerald", x: 180, y: 420, size: 96, rotate: -28 },
		{ id: "brilliant", x: 480, y: 500, size: 74, rotate: 22 },
		{ id: "cushion", x: 760, y: 430, size: 100, rotate: 6 },
		{ id: "pear", x: 1040, y: 520, size: 84, rotate: -18 },
		{ id: "emerald", x: 1300, y: 440, size: 72, rotate: 12 },
		{ id: "brilliant", x: 1620, y: 520, size: 92, rotate: -16 },
		{ id: "pear", x: 60, y: 760, size: 104, rotate: 24 },
		{ id: "emerald", x: 360, y: 830, size: 68, rotate: -8 },
		{ id: "cushion", x: 640, y: 760, size: 84, rotate: -30 },
		{ id: "brilliant", x: 920, y: 850, size: 96, rotate: 14 },
		{ id: "pear", x: 1200, y: 780, size: 72, rotate: -20 },
		{ id: "emerald", x: 1480, y: 840, size: 100, rotate: 26 },
		{ id: "cushion", x: 1740, y: 790, size: 76, rotate: -12 },
	];
</script>

<svg class="gem-field" viewBox="0 0 1700 950" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
	<defs>
		<!-- Classic diamond, side view: flat crown, girdle line, and pointed
		     pavilion with facet lines — the instantly recognizable gem shape. -->
		<symbol id="brilliant" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path d="M25 35 L40 20 L60 20 L75 35 L50 78 Z" />
				<path d="M25 35 L75 35 M40 20 L46 35 L50 78 M60 20 L54 35 L50 78" />
			</g>
		</symbol>
		<!-- Cushion cut: rounded-square girdle, square table, radiating facets to
		     the corners and edge midpoints. -->
		<symbol id="cushion" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path d="M50 10 C70 10 90 30 90 50 C90 70 70 90 50 90 C30 90 10 70 10 50 C10 30 30 10 50 10 Z" />
				<path d="M50 28 L72 50 L50 72 L28 50 Z" />
				<path d="M50 10 L50 28 M90 50 L72 50 M50 90 L50 72 M10 50 L28 50" />
				<path d="M28 28 L40 40 M72 28 L60 40 M72 72 L60 60 M28 72 L40 60" />
			</g>
		</symbol>
		<!-- Pear cut: teardrop girdle, inner teardrop table, radiating facets. -->
		<symbol id="pear" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path d="M50 8 C66 8 80 24 80 44 C80 66 66 84 50 92 C34 84 20 66 20 44 C20 24 34 8 50 8 Z" />
				<path d="M50 26 C60 26 66 36 66 48 C66 62 58 74 50 78 C42 74 34 62 34 48 C34 36 40 26 50 26 Z" />
				<path d="M50 8 L50 26 M80 44 L66 48 M50 92 L50 78 M20 44 L34 48" />
				<path d="M63 16 L58 30 M37 16 L42 30 M74 66 L62 58 M26 66 L38 58" />
			</g>
		</symbol>
		<!-- Emerald step cut: beveled-corner octagon with concentric step facets
		     and corner facet lines (the classic "hall of mirrors"). -->
		<symbol id="emerald" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path d="M36 14 L64 14 L82 32 L82 68 L64 86 L36 86 L18 68 L18 32 Z" />
				<path d="M42 24 L58 24 L72 38 L72 62 L58 76 L42 76 L28 62 L28 38 Z" />
				<path d="M46 34 L54 34 L62 42 L62 58 L54 66 L46 66 L38 58 L38 42 Z" />
				<path
					d="M36 14 L42 24 M64 14 L58 24 M82 32 L72 38 M82 68 L72 62 M64 86 L58 76 M36 86 L42 76 M18 68 L28 62 M18 32 L28 38"
				/>
			</g>
		</symbol>
	</defs>
	{#each gems as gem (gem)}
		<use
			href="#{gem.id}"
			x={gem.x}
			y={gem.y}
			width={gem.size}
			height={gem.size}
			transform="rotate({gem.rotate} {gem.x + gem.size / 2} {gem.y + gem.size / 2})"
		/>
	{/each}
</svg>

<style>
	.gem-field {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 0;
	}
	/* fill/stroke inherit from <use> into the cloned symbol shadow tree, as long
	   as the symbol's own paths don't set them. */
	.gem-field use {
		fill: none;
		stroke: var(--gem-trace);
		stroke-width: 1.6;
		stroke-linejoin: round;
	}
</style>
