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
		{ id: "trilliant", x: 800, y: 70, size: 72, rotate: 32 },
		{ id: "brilliant", x: 1080, y: 150, size: 110, rotate: -10 },
		{ id: "pear", x: 1330, y: 90, size: 78, rotate: 16 },
		{ id: "round", x: 1560, y: 170, size: 84, rotate: -24 },
		{ id: "emerald", x: 180, y: 420, size: 96, rotate: -28 },
		{ id: "trilliant", x: 480, y: 500, size: 80, rotate: 22 },
		{ id: "round", x: 760, y: 430, size: 92, rotate: 6 },
		{ id: "pear", x: 1040, y: 520, size: 84, rotate: -18 },
		{ id: "trilliant", x: 1300, y: 440, size: 78, rotate: 12 },
		{ id: "brilliant", x: 1620, y: 520, size: 92, rotate: -16 },
		{ id: "pear", x: 60, y: 760, size: 104, rotate: 24 },
		{ id: "emerald", x: 360, y: 830, size: 68, rotate: -8 },
		{ id: "round", x: 640, y: 760, size: 78, rotate: -30 },
		{ id: "brilliant", x: 920, y: 850, size: 96, rotate: 14 },
		{ id: "trilliant", x: 1200, y: 780, size: 78, rotate: -20 },
		{ id: "emerald", x: 1480, y: 840, size: 100, rotate: 26 },
		{ id: "round", x: 1740, y: 790, size: 70, rotate: -12 },
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
		<!-- Round brilliant, top view: 16-sided girdle, octagon table, star facets
		     around the table and spokes out to the girdle. -->
		<symbol id="round" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path
					d="M50 5 L67.2 8.4 L81.8 18.2 L91.6 32.8 L95 50 L91.6 67.2 L81.8 81.8 L67.2 91.6 L50 95 L32.8 91.6 L18.2 81.8 L8.4 67.2 L5 50 L8.4 32.8 L18.2 18.2 L32.8 8.4 Z"
				/>
				<path d="M59.2 27.8 L72.2 40.8 L72.2 59.2 L59.2 72.2 L40.8 72.2 L27.8 59.2 L27.8 40.8 L40.8 27.8 Z" />
				<path
					d="M59.2 27.8 L50 17 M59.2 27.8 L73.3 26.7 M72.2 40.8 L73.3 26.7 M72.2 40.8 L83 50 M72.2 59.2 L83 50 M72.2 59.2 L73.3 73.3 M59.2 72.2 L73.3 73.3 M59.2 72.2 L50 83 M40.8 72.2 L50 83 M40.8 72.2 L26.7 73.3 M27.8 59.2 L26.7 73.3 M27.8 59.2 L17 50 M27.8 40.8 L17 50 M27.8 40.8 L26.7 26.7 M40.8 27.8 L26.7 26.7 M40.8 27.8 L50 17"
				/>
				<path
					d="M50 17 L50 5 M73.3 26.7 L81.8 18.2 M83 50 L95 50 M73.3 73.3 L81.8 81.8 M50 83 L50 95 M26.7 73.3 L18.2 81.8 M17 50 L5 50 M26.7 26.7 L18.2 18.2"
				/>
			</g>
		</symbol>
		<!-- Pear cut: teardrop girdle and table, star facets around the table and
		     spokes out to the girdle. -->
		<symbol id="pear" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path d="M50 8 C66 8 80 24 80 44 C80 66 66 84 50 92 C34 84 20 66 20 44 C20 24 34 8 50 8 Z" />
				<path d="M50 26 C60 26 66 36 66 48 C66 62 58 74 50 78 C42 74 34 62 34 48 C34 36 40 26 50 26 Z" />
				<path
					d="M50 26 L58.7 20 M61.8 32.5 L58.7 20 M61.8 32.5 L70.7 35.1 M66 48 L70.7 35.1 M66 48 L70.5 58.5 M61 66.8 L70.5 58.5 M61 66.8 L58.5 78.3 M50 78 L58.5 78.3 M50 78 L41.5 78.3 M39 66.8 L41.5 78.3 M39 66.8 L29.5 58.5 M34 48 L29.5 58.5 M34 48 L29.3 35.1 M38.2 32.5 L29.3 35.1 M38.2 32.5 L41.3 20 M50 26 L41.3 20"
				/>
				<path
					d="M58.7 20 L61.4 10.8 M70.7 35.1 L77.6 29.9 M70.5 58.5 L77.6 59.7 M58.5 78.3 L61.4 84.2 M41.5 78.3 L38.6 84.2 M29.5 58.5 L22.4 59.7 M29.3 35.1 L22.4 29.9 M41.3 20 L38.6 10.8"
				/>
			</g>
		</symbol>
		<!-- Trilliant cut: beveled triangular girdle, matching inner table, corner facets. -->
		<symbol id="trilliant" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path d="M54 20 L88 80 L83 88 L17 88 L12 80 L46 20 Z" />
				<path d="M52.5 36 L73.5 73.5 L70.5 78.5 L29.5 78.5 L26.5 73.5 L47.5 36 Z" />
				<path
					d="M54 20 L52.5 36 M88 80 L73.5 73.5 M83 88 L70.5 78.5 M17 88 L29.5 78.5 M12 80 L26.5 73.5 M46 20 L47.5 36"
				/>
			</g>
		</symbol>
		<!-- Emerald step cut: cut-corner rectangle with two concentric step facets
		     and the corner lines where the steps meet. -->
		<symbol id="emerald" viewBox="0 0 100 100" overflow="visible">
			<g>
				<path d="M33 10 L67 10 L80 23 L80 77 L67 90 L33 90 L20 77 L20 23 Z" />
				<path d="M36.4 18 L63.6 18 L74 28.4 L74 71.6 L63.6 82 L36.4 82 L26 71.6 L26 28.4 Z" />
				<path d="M39.8 26 L60.2 26 L68 33.8 L68 66.2 L60.2 74 L39.8 74 L32 66.2 L32 33.8 Z" />
				<path
					d="M33 10 L36.4 18 M67 10 L63.6 18 M80 23 L74 28.4 M80 77 L74 71.6 M67 90 L63.6 82 M33 90 L36.4 82 M20 77 L26 71.6 M20 23 L26 28.4 M36.4 18 L39.8 26 M63.6 18 L60.2 26 M74 28.4 L68 33.8 M74 71.6 L68 66.2 M63.6 82 L60.2 74 M36.4 82 L39.8 74 M26 71.6 L32 66.2 M26 28.4 L32 33.8"
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
