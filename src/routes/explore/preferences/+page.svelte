<script lang="ts">
	import { goto } from '$app/navigation';
	import { PREFERENCES_ITEMS } from '$lib/data/preferences-items';
	import QuestionScenario from '$lib/components/QuestionScenario.svelte';
	import { exploreStore } from '$lib/state/explore.svelte';
	import type { PrefMode } from '$lib/types';

	let index = $state(0);

	const item = $derived(PREFERENCES_ITEMS[index]);
	const selected = $derived.by(() => {
		const found = exploreStore.preferences.find((a) => a.itemId === item?.id);
		return found?.selectedTags ?? [];
	});

	function onChange(tags: PrefMode[]) {
		if (!item) return;
		exploreStore.setPreference(item.id, tags);
	}

	function next() {
		if (index < PREFERENCES_ITEMS.length - 1) {
			index += 1;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			goto('/explore/screening');
		}
	}

	function back() {
		if (index > 0) {
			index -= 1;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			goto('/');
		}
	}

	const canAdvance = $derived(selected.length > 0);
</script>

<svelte:head>
	<title>Preferences — Helena's Learner Profile</title>
</svelte:head>

<section class="flex flex-col gap-5">
	<div class="flex flex-col gap-1.5">
		<span class="eyebrow">Round 1 of 3</span>
		<h1 class="m-0 font-display">How you like to learn</h1>
		<p class="m-0 text-[var(--color-ink-soft)]">
			Ten quick scenarios. Pick whichever answer feels most like you. There are no wrong
			answers — your brain can use all of these.
		</p>
	</div>

	{#if item}
		<QuestionScenario
			{item}
			index={index}
			total={PREFERENCES_ITEMS.length}
			{selected}
			onchange={onChange}
		/>
	{/if}

	<div class="flex items-center justify-between gap-3">
		<button class="btn btn-ghost" onclick={back}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
			Back
		</button>
		<button class="btn btn-primary" disabled={!canAdvance} onclick={next}>
			{index < PREFERENCES_ITEMS.length - 1 ? 'Next' : 'Continue to tricky bits'}
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</div>
</section>
