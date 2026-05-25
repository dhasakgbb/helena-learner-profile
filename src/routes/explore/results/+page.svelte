<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import confetti from 'canvas-confetti';
	import { exploreStore } from '$lib/state/explore.svelte';
	import { buildRun } from '$lib/scoring/build-run';
	import { snapshotVersions } from '$lib/services/items-shared';
	import { STRENGTHS_ITEMS, STRENGTHS_AFFIRMATIONS } from '$lib/data/strengths-items';
	import { PREFERENCE_STRATEGIES, DOMAIN_STRATEGIES } from '$lib/data/resources';
	import ResultsChart from '$lib/components/ResultsChart.svelte';
	import Disclaimer from '$lib/components/Disclaimer.svelte';
	import { exportRunToPdf } from '$lib/pdf/export';
	import { PREF_MODES, DOMAINS, type PrefMode, type Domain } from '$lib/types';
	import type { LayoutData } from '../$types';

	const { data }: { data: LayoutData } = $props();
	const APP_VERSION = '0.1.0';

	const run = $derived(
		buildRun({
			appVersion: APP_VERSION,
			screeningItems: data.items.screening,
			preferences: exploreStore.preferences,
			screening: exploreStore.screening,
			strengths: exploreStore.strengths
		})
	);

	const itemVersions = $derived({
		preferences: snapshotVersions(data.items.preferences),
		screening: snapshotVersions(data.items.screening),
		strengths: snapshotVersions(data.items.strengths)
	});

	const topMode = $derived.by(() => {
		const scores = run.scores.preferences;
		const sorted = PREF_MODES.slice().sort((a, b) => scores[b] - scores[a]);
		return sorted[0]!;
	});

	const flaggedDomains = $derived.by(() => {
		return DOMAINS.filter(
			(d) =>
				run.scores.screening[d].level === 'medium' || run.scores.screening[d].level === 'high'
		);
	});

	const planCopy: Record<typeof run.scores.plan, { title: string; body: string }> = {
		strengths: {
			title: 'A strength-based experimentation plan.',
			body: 'Pick one strategy from your top preference this week and try it once on a school task. Notice what changes. Mix in a different mode the following week to keep things flexible.'
		},
		monitor: {
			title: 'Monitor and add multisensory supports.',
			body: 'One area showed up as worth watching. Try a multisensory strategy for that domain over the next three to four weeks, then come back and do this exploration again. If nothing changes, that is useful information for a teacher conversation.'
		},
		schedule: {
			title: 'Time for a conversation.',
			body: 'Multiple areas flagged, or one flagged strongly. The next step is not another quiz — it is a real conversation. Start with her teacher this week, then bring observations to a pediatrician. Ask about a formal evaluation if patterns persist.'
		}
	};

	let parentViewOpen = $state(false);
	let saving = $state(false);
	let saveStatus = $state<'idle' | 'saved' | 'error' | 'unauthorized'>('idle');
	let parentSignedIn = $state(false);
	let childId = $state<string | null>(null);
	let children: { id: string; display_name: string; birth_year: number }[] = $state([]);
	let pdfBusy = $state(false);

	onMount(async () => {
		try {
			confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 } });
		} catch {
			// confetti can fail on some envs; skip silently
		}
		try {
			const res = await fetch('/api/auth/me');
			if (res.ok) {
				const json = await res.json();
				if (json.parent) {
					parentSignedIn = true;
					parentViewOpen = true;
					const cres = await fetch('/api/children');
					if (cres.ok) {
						const cjson = await cres.json();
						children = cjson.children ?? [];
						if (children.length > 0 && children[0]) childId = children[0].id;
					}
				}
			}
		} catch {
			// offline / no API — okay
		}
	});

	async function downloadPdf() {
		pdfBusy = true;
		try {
			const blob = await exportRunToPdf(run);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `helena-learner-profile-${new Date().toISOString().slice(0, 10)}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 4000);
		} finally {
			pdfBusy = false;
		}
	}

	async function saveRun() {
		if (!childId) {
			saveStatus = 'error';
			return;
		}
		saving = true;
		saveStatus = 'idle';
		try {
			const res = await fetch('/api/runs', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					child_id: childId,
					payload: run,
					item_versions: itemVersions
				})
			});
			if (res.status === 401) {
				saveStatus = 'unauthorized';
			} else if (res.ok) {
				saveStatus = 'saved';
			} else {
				saveStatus = 'error';
			}
		} catch {
			saveStatus = 'error';
		} finally {
			saving = false;
		}
	}

	function restart() {
		if (confirm('Start over? Your current answers will be cleared.')) {
			exploreStore.reset();
			goto('/');
		}
	}

	function flagTagClass(level: 'low' | 'medium' | 'high') {
		return `tag tag-${level}`;
	}
</script>

<svelte:head>
	<title>Your Learning Menu — Helena's Learner Profile</title>
</svelte:head>

<section class="flex flex-col gap-6">
	<header class="flex flex-col gap-2 reveal" style:--i="0">
		<span class="eyebrow">Your menu</span>
		<h1 class="m-0 font-display">Here is what stood out today.</h1>
		<p class="m-0 text-[var(--color-ink-soft)]">
			A snapshot, not a label. Things change as you grow — this is a starting point you can
			come back to.
		</p>
	</header>

	<article class="card flex flex-col gap-5 reveal" style:--i="1">
		<div class="flex flex-col gap-1">
			<span class="eyebrow">How you like to learn</span>
			<h2 class="m-0 font-display">Top preference: {topMode.replace('_', ' / ')}</h2>
		</div>
		<ResultsChart scores={run.scores.preferences} />
		<p class="m-0 text-[0.95rem] text-[var(--color-ink-soft)]">
			Your brain can use all of these — the percentages just show what felt easiest today.
			Mixing modes is one of the most powerful learning moves you can make.
		</p>
	</article>

	{#if run.scores.strengths_spotlight.length > 0}
		<article class="card flex flex-col gap-3 reveal" style:--i="2">
			<div class="flex flex-col gap-1">
				<span class="eyebrow">Spotlight</span>
				<h2 class="m-0 font-display">Things you are great at.</h2>
			</div>
			<ul class="flex flex-col gap-3 list-none p-0 m-0">
				{#each run.scores.strengths_spotlight as id}
					{@const item = STRENGTHS_ITEMS.find((s) => s.id === id)}
					{@const affirmation = STRENGTHS_AFFIRMATIONS[id]}
					{#if item}
						<li class="flex gap-3">
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--color-ochre)"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="mt-1 shrink-0"
								aria-hidden="true"
							>
								<polygon
									points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
								></polygon>
							</svg>
							<div>
								<p class="m-0 font-display text-[1.05rem]">{item.prompt}</p>
								<p class="m-0 text-[0.92rem] text-[var(--color-ink-soft)]">
									{affirmation}
								</p>
							</div>
						</li>
					{/if}
				{/each}
			</ul>
		</article>
	{/if}

	<article
		class="card flex flex-col gap-4 reveal"
		style:--i="3"
		style:background="var(--color-teal-soft)"
	>
		<div class="flex flex-col gap-1">
			<span class="eyebrow">Next step</span>
			<h2 class="m-0 font-display">{planCopy[run.scores.plan].title}</h2>
		</div>
		<p class="m-0 text-[1rem]">{planCopy[run.scores.plan].body}</p>
	</article>

	<article class="card flex flex-col gap-4 reveal" style:--i="4">
		<div class="flex flex-col gap-1">
			<span class="eyebrow">Try this week</span>
			<h2 class="m-0 font-display">Strategies that match how you learn.</h2>
		</div>
		<div class="flex flex-col gap-3">
			{#each PREFERENCE_STRATEGIES[topMode] as card}
				<div
					class="p-4 rounded-[var(--radius-soft)] border-[1.5px]"
					style:border-color="var(--color-line)"
					style:background="var(--color-paper)"
				>
					<h3 class="m-0 mb-1 font-display text-[1.08rem]">{card.title}</h3>
					<p class="m-0 text-[0.95rem] text-[var(--color-ink-soft)]">{card.body}</p>
				</div>
			{/each}
		</div>
	</article>

	{#if parentSignedIn || exploreStore.parentViewRequested}
		<article class="card flex flex-col gap-4 reveal" style:--i="5">
			<button
				class="flex items-center justify-between w-full text-left bg-transparent border-0 p-0 cursor-pointer"
				onclick={() => (parentViewOpen = !parentViewOpen)}
				aria-expanded={parentViewOpen}
			>
				<div class="flex flex-col gap-1">
					<span class="eyebrow">Parent view</span>
					<h2 class="m-0 font-display">Areas worth watching</h2>
				</div>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					style:transform={parentViewOpen ? 'rotate(180deg)' : ''}
					style:transition="transform 200ms"
					aria-hidden="true"
				>
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			</button>

			{#if parentViewOpen}
				<Disclaimer variant="parent" />
				<div class="flex flex-col gap-3">
					{#each DOMAINS as d}
						{@const score = run.scores.screening[d]}
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-display text-[1.05rem] capitalize">{d}</span>
									<span class={flagTagClass(score.level)}>{score.level}</span>
									{#if score.needs_corroboration}
										<span class="text-[0.78rem] italic text-[var(--color-ink-muted)]">
											needs parent corroboration
										</span>
									{/if}
								</div>
								{#if score.level !== 'low'}
									<ul class="mt-2 flex flex-col gap-2 list-none p-0 m-0">
										{#each DOMAIN_STRATEGIES[d] as card}
											<li
												class="p-3 rounded-[var(--radius-soft)] border-[1.5px]"
												style:border-color="var(--color-line)"
												style:background="var(--color-paper)"
											>
												<div class="font-display text-[0.98rem]">{card.title}</div>
												<div class="text-[0.9rem] text-[var(--color-ink-soft)]">
													{card.body}
												</div>
												{#if card.link}
													<a
														href={card.link.href}
														target="_blank"
														rel="noopener"
														class="text-[0.85rem] underline mt-1 inline-block"
														style:color="var(--color-rust)">{card.link.label} →</a
													>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</article>
	{/if}

	<article class="card flex flex-col gap-4 reveal" style:--i="6" data-no-print>
		<div class="flex flex-col gap-1">
			<span class="eyebrow">Take it with you</span>
			<h2 class="m-0 font-display">Keep this snapshot.</h2>
		</div>
		<div class="flex flex-col sm:flex-row gap-3">
			<button class="btn btn-primary flex-1" disabled={pdfBusy} onclick={downloadPdf}>
				{pdfBusy ? 'Preparing…' : 'Download PDF summary'}
			</button>
			{#if parentSignedIn}
				<button class="btn btn-ghost flex-1" disabled={saving || !childId} onclick={saveRun}>
					{saving ? 'Saving…' : 'Save to dashboard'}
				</button>
			{:else}
				<a href="/parent/signup" class="btn btn-ghost flex-1">Save runs over time</a>
			{/if}
		</div>
		{#if parentSignedIn && children.length === 0}
			<p class="text-[0.88rem] text-[var(--color-ink-muted)] m-0">
				Add a child profile from the
				<a class="underline" style:color="var(--color-rust)" href="/parent/dashboard">
					parent dashboard
				</a> to save runs.
			</p>
		{/if}
		{#if saveStatus === 'saved'}
			<p class="text-[0.92rem] text-[var(--color-sage)] m-0">
				Saved. It is in the parent dashboard.
			</p>
		{:else if saveStatus === 'unauthorized'}
			<p class="text-[0.92rem] text-[var(--color-rust)] m-0">
				Your session expired. <a class="underline" href="/parent/login">Sign in</a> and try
				again.
			</p>
		{:else if saveStatus === 'error'}
			<p class="text-[0.92rem] text-[var(--color-rust)] m-0">
				Couldn't save right now. You can still download the PDF.
			</p>
		{/if}
	</article>

	<Disclaimer variant="full" />

	<div class="flex items-center justify-between gap-3">
		<a href="/resources" class="btn btn-ghost">Browse all strategies</a>
		<button class="btn btn-quiet" onclick={restart}>Start over</button>
	</div>
</section>
