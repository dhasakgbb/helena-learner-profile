<script lang="ts">
	import { page } from '$app/state';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import BreakButton from '$lib/components/BreakButton.svelte';
	import Disclaimer from '$lib/components/Disclaimer.svelte';
	import ResumePrompt from '$lib/components/ResumePrompt.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } =
		$props();

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
				aria-label="Astrid's Quiz home"
			>
				Astrid<span class="text-[var(--color-rust)]">.</span>
			</a>
			<BreakButton />
		</div>
		<ProgressBar steps={STEPS} {current} />
		<Disclaimer variant="compact" />
		{#if data.usedStaticFallback}
			<div
				class="banner-disclaimer"
				role="status"
				aria-live="polite"
				style:background="var(--color-coral-soft)"
				style:border-left-color="var(--color-coral)"
				style:color="var(--color-coral-deep)"
			>
				<p class="m-0">
					<strong>Heads up:</strong> we couldn't reach your customized question bank
					just now, so this run is using the built-in starter items. Your saved edits are
					safe in the dashboard — try again in a minute if you want this run to use
					them.
				</p>
			</div>
		{/if}
	</header>

	{@render children()}
</main>

<ResumePrompt />
