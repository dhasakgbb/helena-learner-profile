<script lang="ts">
	import { goto } from '$app/navigation';
	import QuestionFrequency from '$lib/components/QuestionFrequency.svelte';
	import { exploreStore } from '$lib/state/explore.svelte';
	import type { FrequencyAnswer } from '$lib/types';
	import type { LayoutData } from '../$types';

	const { data }: { data: LayoutData } = $props();
	const SCREENING_ITEMS = $derived(data.items.screening);

	let index = $state(0);
	let view = $state<'kid' | 'parent'>('kid');

	const showParentToggle = $derived(exploreStore.parentViewRequested);
	const item = $derived(SCREENING_ITEMS[index]);

	const current = $derived.by(() => {
		const found = exploreStore.screening.find((a) => a.itemId === item?.id);
		return found ?? { itemId: item?.id ?? '', kid: null, parent: null };
	});

	function onChange(v: 'kid' | 'parent', value: FrequencyAnswer | null) {
		if (!item) return;
		exploreStore.setScreening(item.id, v, value);
	}

	function next() {
		if (index < SCREENING_ITEMS.length - 1) {
			index += 1;
			view = 'kid';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			goto('/explore/strengths');
		}
	}

	function back() {
		if (index > 0) {
			index -= 1;
			view = 'kid';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			goto('/explore/preferences');
		}
	}

	const kidAnswered = $derived(current.kid !== null && current.kid !== undefined);
</script>

<svelte:head>
	<title>Tricky bits — Helena's Learner Profile</title>
</svelte:head>

<section class="flex flex-col gap-5">
	<div class="flex flex-col gap-1.5">
		<span class="eyebrow">Round 2 of 3</span>
		<h1 class="m-0 font-display">Things that sometimes feel tricky</h1>
		<p class="m-0 text-[var(--color-ink-soft)]">
			These are about how often something happens, not whether you are good or bad at it.
			Honest answers help the most.
		</p>
	</div>

	{#if showParentToggle}
		<div
			class="card-bordered flex items-center justify-between gap-3"
			style:padding="0.75rem 1rem"
		>
			<span class="text-[0.92rem] font-semibold">Whose view?</span>
			<div role="tablist" class="flex gap-1 p-1 rounded-full" style:background="var(--color-paper-deep)">
				<button
					role="tab"
					aria-selected={view === 'kid'}
					class="px-3 py-1 rounded-full text-[0.85rem] font-semibold"
					style:background={view === 'kid' ? 'var(--color-card)' : 'transparent'}
					style:color={view === 'kid' ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
					onclick={() => (view = 'kid')}
				>
					Kid
				</button>
				<button
					role="tab"
					aria-selected={view === 'parent'}
					class="px-3 py-1 rounded-full text-[0.85rem] font-semibold"
					style:background={view === 'parent' ? 'var(--color-card)' : 'transparent'}
					style:color={view === 'parent' ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
					onclick={() => (view = 'parent')}
				>
					Parent
				</button>
			</div>
		</div>
	{/if}

	{#if item}
		<QuestionFrequency
			{item}
			index={index}
			total={SCREENING_ITEMS.length}
			view={view}
			kidValue={current.kid as FrequencyAnswer | null}
			parentValue={current.parent as FrequencyAnswer | null}
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
		<button class="btn btn-primary" disabled={!kidAnswered} onclick={next}>
			{index < SCREENING_ITEMS.length - 1 ? 'Next' : 'Continue to strengths'}
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</div>
</section>
