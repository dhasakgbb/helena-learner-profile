<script lang="ts">
	import { goto } from '$app/navigation';
	import Disclaimer from '$lib/components/Disclaimer.svelte';
	import DisclaimerAck from '$lib/components/DisclaimerAck.svelte';
	import { exploreStore } from '$lib/state/explore.svelte';

	let acked = $state(false);
	let includeParentView = $state(false);

	function start() {
		exploreStore.disclaimerAcked = true;
		exploreStore.parentViewRequested = includeParentView;
		goto('/explore/preferences');
	}
</script>

<svelte:head>
	<title>Astrid's Quiz — Welcome</title>
</svelte:head>

<main class="shell">
	<header class="flex flex-col gap-2 mb-8">
		<div class="flex items-center gap-3">
			<svg
				width="44"
				height="44"
				viewBox="0 0 64 64"
				fill="none"
				stroke="var(--color-rust)"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path
					d="M32 8c-9 0-16 7-16 16 0 5 2 9 4 11-2 2-4 5-4 9 0 7 6 12 13 12h6c7 0 13-5 13-12 0-4-2-7-4-9 2-2 4-6 4-11 0-9-7-16-16-16z"
				/>
				<path d="M22 28c2 3 6 4 10 4s8-1 10-4" />
				<path d="M12 22c-3 1-6 3-6 7" opacity="0.5" />
				<path d="M52 22c3 1 6 3 6 7" opacity="0.5" />
				<path d="M22 50c-1 3-1 6 0 8" opacity="0.5" />
				<path d="M42 50c1 3 1 6 0 8" opacity="0.5" />
			</svg>
			<div>
				<p class="eyebrow m-0">Astrid's</p>
				<h1 class="m-0 font-display">Quiz</h1>
			</div>
		</div>
	</header>

	<section class="card flex flex-col gap-5">
		<div class="flex flex-col gap-3">
			<h2 class="m-0 font-display">Welcome.</h2>
			<p class="m-0 text-[var(--color-ink-soft)] text-[1.05rem]">
				This is a small exploration about <em>how you learn best right now</em> — what
				feels easy, what feels tricky, and what makes you light up. It takes about ten
				minutes, you can pause whenever you want, and there are no wrong answers.
			</p>
		</div>

		<Disclaimer variant="full" />

		<DisclaimerAck checked={acked} onchange={(v) => (acked = v)} />

		<label class="flex items-start gap-3 px-1 cursor-pointer">
			<input
				type="checkbox"
				bind:checked={includeParentView}
				class="mt-1 w-5 h-5 accent-[var(--color-rust)] shrink-0"
			/>
			<span class="text-[0.95rem] text-[var(--color-ink-soft)]">
				A parent is sitting with me. Show parent-view items during screening so we can
				answer them together.
			</span>
		</label>

		<div class="flex flex-col sm:flex-row gap-3">
			<button class="btn btn-primary flex-1" disabled={!acked} onclick={start}>
				Start exploring
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<line x1="5" y1="12" x2="19" y2="12"></line>
					<polyline points="12 5 19 12 12 19"></polyline>
				</svg>
			</button>
			<a href="/parent/login" class="btn btn-ghost sm:w-auto">Parent? Sign in</a>
		</div>
	</section>

	<section class="mt-8 flex flex-col gap-4 px-2 text-[var(--color-ink-soft)] text-[0.95rem]">
		<p class="m-0">
			<strong class="font-display text-[var(--color-ink)]">What's inside:</strong> three short
			rounds — your <em>preferences</em>, things that sometimes feel <em>tricky</em>, and
			your <em>strengths</em>. At the end, a personal Learning Menu with ideas to try.
		</p>
		<p class="m-0 text-[0.88rem]">
			Nothing is saved to a server unless a parent signs in. Most of what happens here lives
			only in this browser tab.
		</p>
	</section>
</main>
