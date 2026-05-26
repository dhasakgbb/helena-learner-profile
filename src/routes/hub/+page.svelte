<script lang="ts">
	import Disclaimer from '$lib/components/Disclaimer.svelte';
	import { formatProfile, type ExportedProfile } from '$lib/profile/schema';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * Build a URL fragment containing the URL-safe base64-encoded profile.
	 * Fragments are kept entirely client-side — never sent to a server, never
	 * logged in access logs, never in Referer headers. The destination module
	 * reads the fragment via window.location.hash, decodes, imports, and
	 * scrubs the hash from the URL.
	 */
	function profileLaunchUrl(base: string, profile: ExportedProfile): string {
		const json = formatProfile(profile);
		// btoa needs Latin-1; the profile is ASCII-safe (JSON of numbers + ASCII text),
		// but encodeURIComponent first lets us survive any extended characters in
		// strengths text or child label.
		const encoded = btoa(encodeURIComponent(json));
		// URL-safe variant: '+/=' → '-_~' so it round-trips through URL parsers.
		const safe = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
		return `${base}#profile=${safe}`;
	}

	type GameLink = {
		id: string;
		name: string;
		url: string;
		blurb: string;
		ready: boolean;
		accent: string;
	};

	const games: GameLink[] = $derived(
		data.profile
			? [
					{
						id: 'spelling',
						name: 'Spelling',
						url: profileLaunchUrl('https://helena-spelling.vercel.app/', data.profile),
						blurb: 'Letter Drop, Speed Spell, Word Sort, Word Wheel — picks the mode that fits how you learn.',
						ready: true,
						accent: 'rust'
					},
					{
						id: 'states',
						name: 'States & Capitals',
						url: profileLaunchUrl('https://helena-states.vercel.app/', data.profile),
						blurb: 'Road Trip, Quest, Quiz — Road Trip for visual/kinesthetic, Quiz for read-and-write.',
						ready: true,
						accent: 'sky'
					},
					{
						id: 'math',
						name: 'Math practice',
						url: '#',
						blurb: 'Coming soon — concrete-first or symbolic, paced for attention level.',
						ready: false,
						accent: 'leaf'
					}
				]
			: []
	);
</script>

<svelte:head>
	<title>Hub — Helena's Learner Profile</title>
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
		<span class="eyebrow mt-3">Helena's hub</span>
		<h1 class="m-0 font-display">Pick a game.</h1>
		<p class="m-0 text-[var(--color-ink-soft)]">
			Each game will set sensible defaults based on your most recent learner profile. You can
			always switch modes inside any game.
		</p>
	</header>

	{#if !data.child}
		<section class="card flex flex-col gap-3">
			<h2 class="m-0 font-display">No child profile yet.</h2>
			<p class="m-0 text-[var(--color-ink-soft)]">
				Add a child from the parent dashboard, then take the intake to generate a profile.
			</p>
			<a href="/parent/dashboard" class="btn btn-primary self-start">Open dashboard</a>
		</section>
	{:else if !data.profile}
		<section class="card flex flex-col gap-3">
			<h2 class="m-0 font-display">No saved profile for {data.child.display_name} yet.</h2>
			<p class="m-0 text-[var(--color-ink-soft)]">
				Take the 10-minute intake and save the result — then the games can read it.
			</p>
			<a href="/" class="btn btn-primary self-start">Start intake</a>
		</section>
	{:else}
		<section class="card flex flex-col gap-2 mb-6 card-rail-sky">
			<span class="eyebrow eyebrow-sky">Profile-aware launching</span>
			<p class="m-0 text-[0.95rem] text-[var(--color-ink-soft)]">
				These links carry {data.child.display_name}'s profile to each game via a URL
				<code>#fragment</code> — kept entirely on this device, never sent to a server.
				When the game opens, it reads the profile, sets a recommended mode, and clears
				the fragment from the address bar.
			</p>
		</section>

		<section class="flex flex-col gap-4">
			{#each games as game}
				{#if game.ready}
					<a
						href={game.url}
						target="_blank"
						rel="noopener"
						class="card flex flex-col gap-2 no-underline text-[var(--color-ink)]"
						style:--accent="var(--color-{game.accent})"
					>
						<div class="flex items-center justify-between gap-3 flex-wrap">
							<h2 class="m-0 font-display">{game.name}</h2>
							<span class="tag tag-low" style:background="var(--color-{game.accent}-soft)" style:color="var(--color-{game.accent}-deep)">
								Open →
							</span>
						</div>
						<p class="m-0 text-[var(--color-ink-soft)]">{game.blurb}</p>
					</a>
				{:else}
					<div class="card-bordered flex flex-col gap-2 opacity-60">
						<div class="flex items-center justify-between gap-3 flex-wrap">
							<h2 class="m-0 font-display">{game.name}</h2>
							<span class="tag tag-medium">Soon</span>
						</div>
						<p class="m-0 text-[var(--color-ink-soft)]">{game.blurb}</p>
					</div>
				{/if}
			{/each}
		</section>
	{/if}

	<Disclaimer variant="full" />
</main>
