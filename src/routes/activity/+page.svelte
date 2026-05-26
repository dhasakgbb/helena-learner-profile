<script lang="ts">
	import { onMount } from 'svelte';
	import { exportedProfileSchema, type ExportedProfile } from '$lib/profile/schema';
	import {
		decodeProfileFragment,
		followRate,
		modesBy,
		prettyMode,
		readTelemetry,
		totalLaunches
	} from '$lib/profile/telemetry';

	// User-pasted JSON text. Validated on submit, not while typing — typing
	// validation would scream at every keystroke of a 20KB paste.
	let raw = $state('');
	let parseError = $state<string | null>(null);
	let profile = $state<ExportedProfile | null>(null);
	// Set to true when the page was auto-loaded from a URL fragment so the
	// header can say "loaded from your game" instead of acting like the
	// parent pasted it.
	let fromFragment = $state(false);

	function tryFragmentImport() {
		if (typeof window === 'undefined') return;
		const hash = window.location.hash;
		if (!hash || !hash.includes('profile=')) return;
		const params = new URLSearchParams(hash.slice(1));
		const token = params.get('profile');
		if (!token) return;
		const decoded = decodeProfileFragment(token);
		if (!decoded) {
			parseError =
				"The profile link couldn't be decoded. Try the Re-export button in the game instead.";
			return;
		}
		try {
			const parsed = exportedProfileSchema.safeParse(JSON.parse(decoded));
			if (!parsed.success) {
				parseError =
					"Profile link didn't validate (" +
					(parsed.error.issues[0]?.message ?? 'unknown') +
					').';
				return;
			}
			profile = parsed.data;
			fromFragment = true;
			// Scrub the fragment so reloads / back-navigation don't keep
			// re-loading the same profile and so the URL bar stays clean.
			try {
				history.replaceState(
					null,
					'',
					window.location.pathname + window.location.search
				);
			} catch {
				/* best-effort */
			}
		} catch {
			parseError = "Profile link wasn't valid JSON.";
		}
	}

	onMount(() => {
		tryFragmentImport();
		const onHash = () => tryFragmentImport();
		window.addEventListener('hashchange', onHash);
		return () => window.removeEventListener('hashchange', onHash);
	});

	// The three known consumer modules. Kept as a constant so the UI renders
	// the same cards even when a module hasn't been touched yet (zero state
	// is information too).
	const MODULES = [
		{ key: 'spelling', label: 'Spelling', accent: 'coral' },
		{ key: 'states', label: 'States', accent: 'sky' },
		{ key: 'math', label: 'Math', accent: 'leaf' }
	] as const;

	function handleSubmit(e: Event) {
		e.preventDefault();
		parseError = null;
		profile = null;
		const text = raw.trim();
		if (!text) {
			parseError = 'Paste the re-exported profile JSON above first.';
			return;
		}
		let json: unknown;
		try {
			json = JSON.parse(text);
		} catch {
			parseError = "That doesn't look like JSON. Copy the entire block from the consumer's Re-export button.";
			return;
		}
		const parsed = exportedProfileSchema.safeParse(json);
		if (!parsed.success) {
			const issue = parsed.error.issues[0]?.message ?? 'unknown validation error';
			parseError = "Doesn't look like a Helena profile (" + issue + ').';
			return;
		}
		profile = parsed.data;
	}

	function handleFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		file.text().then((text) => {
			raw = text;
		});
	}

	function reset() {
		raw = '';
		profile = null;
		fromFragment = false;
		parseError = null;
	}
</script>

<svelte:head>
	<title>App activity — Helena's Learner Profile</title>
</svelte:head>

<section class="flex flex-col gap-6">
	<header class="flex flex-col gap-1">
		<h1 class="m-0 font-display">App activity</h1>
		<p class="m-0 text-[var(--color-ink-soft)] max-w-prose">
			{#if fromFragment && profile}
				Loaded from {profile.child_label ?? 'your kid'}'s game. Below is what
				they've played and whether they followed the recommended mode. Nothing is sent
				to our server — everything happens in your browser.
			{:else}
				Paste a re-exported profile from Spelling, States, or Math to see what your
				kid actually played, and whether they followed the recommended mode or chose
				their own. Nothing is sent to our server — everything happens in your browser.
			{/if}
		</p>
	</header>

	{#if !profile}
		<form class="card flex flex-col gap-3" onsubmit={handleSubmit}>
			<label class="field-label" for="profile-json">Profile JSON</label>
			<textarea
				id="profile-json"
				class="field-input font-mono text-[0.85rem]"
				rows="10"
				bind:value={raw}
				placeholder={'Paste the JSON copied from the Re-export button…'}
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
			></textarea>

			<div class="flex flex-wrap items-center gap-3">
				<label class="btn btn-quiet text-[0.88rem] cursor-pointer">
					<input
						type="file"
						accept="application/json,.json"
						class="sr-only"
						onchange={handleFile}
					/>
					Or upload a .json file
				</label>
				<button type="submit" class="btn btn-primary">Show activity</button>
				{#if parseError}
					<span class="text-[var(--color-rust-deep)] text-[0.9rem]">{parseError}</span>
				{/if}
			</div>
		</form>
	{:else}
		<header class="card card-bordered flex flex-wrap items-end justify-between gap-3">
			<div class="flex flex-col gap-1">
				<span class="eyebrow">Profile loaded</span>
				<h2 class="m-0 font-display">
					{profile.child_label ?? 'Your kid'}
				</h2>
				<p class="m-0 text-[0.88rem] text-[var(--color-ink-muted)]">
					Generated {new Date(profile.generated_at).toLocaleDateString()} · expires
					{new Date(profile.expires_at).toLocaleDateString()}
				</p>
			</div>
			<button class="btn btn-quiet" onclick={reset}>Load another</button>
		</header>

		<div class="flex flex-col gap-4">
			{#each MODULES as mod}
				{@const t = readTelemetry(profile, mod.key)}
				<section class="card card-rail-{mod.accent} flex flex-col gap-3">
					<header class="flex items-end justify-between gap-3 flex-wrap">
						<h3 class="m-0 font-display text-[1.15rem]">{mod.label}</h3>
						{#if t}
							<span class="text-[0.85rem] text-[var(--color-ink-muted)]">
								{totalLaunches(t)} session{totalLaunches(t) === 1 ? '' : 's'} ·
								{followRate(t)}% followed recommendation
							</span>
						{/if}
					</header>

					{#if !t}
						<p class="m-0 text-[var(--color-ink-soft)] text-[0.92rem]">
							No activity yet. Open {mod.label} from the Hub to start logging
							sessions.
						</p>
					{:else}
						<ul class="m-0 p-0 list-none flex flex-col gap-2">
							{#each modesBy(t) as row}
								{@const total = row.followed + row.overrode}
								{@const pct = total > 0 ? Math.round((row.followed / total) * 100) : 0}
								<li class="flex items-center justify-between gap-3 flex-wrap">
									<span class="font-display text-[0.95rem]">{prettyMode(row.mode)}</span>
									<span class="text-[0.85rem] text-[var(--color-ink-muted)]">
										{total} session{total === 1 ? '' : 's'} ·
										<span class="tag tag-low">{row.followed} followed</span>
										{#if row.overrode > 0}
											<span class="tag tag-medium">{row.overrode} overrode</span>
										{/if}
										{#if total > 0}({pct}%){/if}
									</span>
								</li>
							{/each}
						</ul>

						{#if t.last_override_streak >= 3}
							<div
								class="rounded-[var(--radius-soft)] border-[1.5px] border-dashed p-3 text-[0.88rem]"
								style:border-color="var(--color-rust)"
								style:background="var(--color-rust-soft)"
								style:color="var(--color-rust-deep)"
							>
								<strong>{t.last_override_streak} overrides in a row.</strong>
								Their preferences may have shifted — consider re-taking the
								assessment.
							</div>
						{/if}

						{#if t.last_launches.length > 0}
							<div class="flex flex-wrap items-center gap-2 text-[0.85rem]">
								<span class="text-[var(--color-ink-muted)]">Recent:</span>
								{#each t.last_launches.slice(0, 8) as launch, i}
									<span class="tag" class:tag-low={i === 0}>
										{prettyMode(launch)}
									</span>
								{/each}
							</div>
						{/if}
					{/if}
				</section>
			{/each}
		</div>
	{/if}
</section>
