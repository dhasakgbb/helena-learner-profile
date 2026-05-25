<script lang="ts">
	import {
		PREFERENCE_STRATEGIES,
		DOMAIN_STRATEGIES,
		PROFESSIONAL_HELP_LINKS
	} from '$lib/data/resources';
	import Disclaimer from '$lib/components/Disclaimer.svelte';
	import { PREF_MODES, DOMAINS } from '$lib/types';

	const MODE_TITLE: Record<string, string> = {
		visual: 'For visual learners',
		auditory: 'For auditory learners',
		read_write: 'For readers & writers',
		kinesthetic: 'For hands-on learners'
	};
	const DOMAIN_TITLE: Record<string, string> = {
		reading: 'Reading supports',
		writing: 'Writing supports',
		math: 'Math supports',
		attention: 'Attention supports'
	};
</script>

<svelte:head>
	<title>Strategies & resources — Helena's Learner Profile</title>
</svelte:head>

<main class="shell">
	<header class="flex flex-col gap-2 mb-6">
		<a
			href="/"
			class="font-display text-[1.1rem] no-underline text-[var(--color-ink)]"
			aria-label="Helena's Learner Profile home"
		>
			Helena<span class="text-[var(--color-rust)]">.</span>
		</a>
		<span class="eyebrow mt-3">Field guide</span>
		<h1 class="m-0 font-display">Strategies & resources</h1>
		<p class="m-0 text-[var(--color-ink-soft)]">
			Concrete things to try at home — sorted by how a kid likes to learn, by the kind of
			task that feels tricky, and by where to go for real professional help.
		</p>
	</header>

	<section class="flex flex-col gap-5 mb-8">
		<h2 class="m-0 font-display">By how you learn</h2>
		{#each PREF_MODES as mode}
			<div class="card flex flex-col gap-3">
				<h3 class="m-0 font-display text-[1.15rem]">{MODE_TITLE[mode]}</h3>
				<ul class="flex flex-col gap-3 list-none p-0 m-0">
					{#each PREFERENCE_STRATEGIES[mode] as card}
						<li
							class="p-3.5 rounded-[var(--radius-soft)] border-[1.5px]"
							style:border-color="var(--color-line)"
							style:background="var(--color-paper)"
						>
							<div class="font-display text-[1rem]">{card.title}</div>
							<p class="m-0 text-[0.93rem] text-[var(--color-ink-soft)]">{card.body}</p>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</section>

	<section class="flex flex-col gap-5 mb-8">
		<h2 class="m-0 font-display">By what feels tricky</h2>
		{#each DOMAINS as d}
			<div class="card flex flex-col gap-3">
				<h3 class="m-0 font-display text-[1.15rem]">{DOMAIN_TITLE[d]}</h3>
				<ul class="flex flex-col gap-3 list-none p-0 m-0">
					{#each DOMAIN_STRATEGIES[d] as card}
						<li
							class="p-3.5 rounded-[var(--radius-soft)] border-[1.5px]"
							style:border-color="var(--color-line)"
							style:background="var(--color-paper)"
						>
							<div class="font-display text-[1rem]">{card.title}</div>
							<p class="m-0 text-[0.93rem] text-[var(--color-ink-soft)]">{card.body}</p>
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
			</div>
		{/each}
	</section>

	<section class="card flex flex-col gap-4 mb-8">
		<span class="eyebrow">When to ask for more help</span>
		<h2 class="m-0 font-display">Professional resources</h2>
		<p class="text-[0.93rem] text-[var(--color-ink-soft)] m-0">
			These are starting points for talking with a teacher, school psychologist, or
			pediatrician. They are not affiliated with this app.
		</p>
		<ul class="flex flex-col gap-3 list-none p-0 m-0">
			{#each PROFESSIONAL_HELP_LINKS as link}
				<li
					class="p-3.5 rounded-[var(--radius-soft)] border-[1.5px]"
					style:border-color="var(--color-line)"
					style:background="var(--color-paper)"
				>
					<div class="font-display text-[1rem]">{link.title}</div>
					<p class="m-0 text-[0.93rem] text-[var(--color-ink-soft)]">{link.body}</p>
					{#if link.link}
						<a
							href={link.link.href}
							target="_blank"
							rel="noopener"
							class="text-[0.85rem] underline mt-1 inline-block"
							style:color="var(--color-rust)">{link.link.label} →</a
						>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<Disclaimer variant="full" />

	<div class="mt-6 flex justify-between">
		<a href="/" class="btn btn-ghost">Home</a>
		<a href="/parent/privacy" class="btn btn-quiet">Privacy & data</a>
	</div>
</main>
