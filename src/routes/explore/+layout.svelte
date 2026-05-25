<script lang="ts">
	import { page } from '$app/state';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import BreakButton from '$lib/components/BreakButton.svelte';
	import Disclaimer from '$lib/components/Disclaimer.svelte';

	let { children } = $props();

	const STEPS = ['Preferences', 'Tricky bits', 'Strengths', 'Your menu'];
	const current = $derived.by(() => {
		const path = page.url.pathname;
		if (path.includes('/preferences')) return 0;
		if (path.includes('/screening')) return 1;
		if (path.includes('/strengths')) return 2;
		if (path.includes('/results')) return 3;
		return 0;
	});
</script>

<main class="shell">
	<header class="flex flex-col gap-4 mb-6">
		<div class="flex items-center justify-between gap-2">
			<a
				href="/"
				class="font-display text-[1.1rem] no-underline text-[var(--color-ink)]"
				aria-label="Helena's Learner Profile home"
			>
				Helena<span class="text-[var(--color-rust)]">.</span>
			</a>
			<BreakButton />
		</div>
		<ProgressBar steps={STEPS} {current} />
		<Disclaimer variant="compact" />
	</header>

	{@render children()}
</main>
