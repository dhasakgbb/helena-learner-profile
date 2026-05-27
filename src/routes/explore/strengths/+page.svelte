<script lang="ts">
	import { goto } from '$app/navigation';
	import QuestionLikert from '$lib/components/QuestionLikert.svelte';
	import { exploreStore } from '$lib/state/explore.svelte';
	import type { LikertAnswer } from '$lib/types';
	import type { LayoutData } from '../$types';

	const { data }: { data: LayoutData } = $props();
	const STRENGTHS_ITEMS = $derived(data.items.strengths);

	let index = $state(0);

	const item = $derived(STRENGTHS_ITEMS[index]);
	const value = $derived.by(() => {
		const found = exploreStore.strengths.find((a) => a.itemId === item?.id);
		return found?.value ?? null;
	});

	function onChange(v: LikertAnswer) {
		if (!item) return;
		exploreStore.setStrength(item.id, v);
	}

	function next() {
		if (index < STRENGTHS_ITEMS.length - 1) {
			index += 1;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			goto('/explore/results');
		}
	}

	function back() {
		if (index > 0) {
			index -= 1;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			goto('/explore/screening');
		}
	}

	const answered = $derived(value !== null);
</script>

<svelte:head>
	<title>Strengths — Astrid's Quiz</title>
</svelte:head>

<section class="flex flex-col gap-5">
	<div class="flex flex-col gap-1.5">
		<span class="eyebrow">Round 3 of 3</span>
		<h1 class="m-0 font-display">Your strengths</h1>
		<p class="m-0 text-[var(--color-ink-soft)]">
			Six quick ones. These help spotlight what you bring to the table.
		</p>
	</div>

	{#if STRENGTHS_ITEMS.length === 0}
		<div class="card flex flex-col gap-3">
			<h2 class="m-0 font-display">No strengths questions active.</h2>
			<p class="m-0 text-[var(--color-ink-soft)]">
				A grown-up can bring strengths items back from the items page.
			</p>
			<a href="/parent/items" class="btn btn-ghost self-start">Manage items</a>
		</div>
	{:else if item}
		<QuestionLikert
			{item}
			index={index}
			total={STRENGTHS_ITEMS.length}
			{value}
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
		<button class="btn btn-primary" disabled={!answered} onclick={next}>
			{index < STRENGTHS_ITEMS.length - 1 ? 'Next' : 'See your menu'}
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</div>
</section>
