<script lang="ts">
	type Props = {
		href: string;
		label: string;
	};
	let { href, label }: Props = $props();
</script>

<a
	{href}
	target="_blank"
	rel="noopener noreferrer"
	class="inline-flex items-center gap-1 text-[0.85rem] underline mt-1"
	style:color="var(--color-rust)"
>
	{label}
	<svg
		width="13"
		height="13"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-label="opens in a new tab"
		role="img"
	>
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
		<polyline points="15 3 21 3 21 9"></polyline>
		<line x1="10" y1="14" x2="21" y2="3"></line>
	</svg>
</a>
