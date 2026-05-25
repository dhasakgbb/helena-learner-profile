<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Disclaimer from '$lib/components/Disclaimer.svelte';
	import { DOMAINS } from '$lib/types';
	import type { PageData } from './$types';
	import type { RunPayload } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let showAddChild = $state(false);
	let newName = $state('');
	let newYear = $state(2015);
	let addBusy = $state(false);
	let addError = $state<string | null>(null);
	let openRunId = $state<string | null>(null);

	async function addChild(e: Event) {
		e.preventDefault();
		addBusy = true;
		addError = null;
		const res = await fetch('/api/children', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ display_name: newName, birth_year: Number(newYear) })
		});
		if (res.ok) {
			newName = '';
			newYear = 2015;
			showAddChild = false;
			await invalidateAll();
		} else {
			addError = 'Could not add child. Name 1–40 chars, birth year 2005–2025.';
		}
		addBusy = false;
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/');
	}

	async function deleteRun(id: string) {
		if (!confirm('Delete this run? This cannot be undone.')) return;
		const res = await fetch(`/api/runs/${id}`, { method: 'DELETE' });
		if (res.status === 204) await invalidateAll();
	}

	function planLabel(plan: string) {
		if (plan === 'schedule') return 'Conversation';
		if (plan === 'monitor') return 'Monitor';
		return 'Strengths plan';
	}
	function planTag(plan: string) {
		if (plan === 'schedule') return 'tag tag-high';
		if (plan === 'monitor') return 'tag tag-medium';
		return 'tag tag-low';
	}

	function flagFor(payload: RunPayload, d: (typeof DOMAINS)[number]) {
		return payload.scores.screening[d].level;
	}
</script>

<svelte:head>
	<title>Dashboard — Helena's Learner Profile</title>
</svelte:head>

<section class="flex flex-col gap-6">
	<header class="flex items-end justify-between gap-3 flex-wrap">
		<div class="flex flex-col gap-1">
			<span class="eyebrow">Signed in as {data.parent?.email}</span>
			<h1 class="m-0 font-display">Parent dashboard</h1>
		</div>
		<button class="btn btn-quiet" onclick={logout}>Sign out</button>
	</header>

	<Disclaimer variant="parent" />

	{#if data.children.length === 0}
		<section class="card flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<h2 class="m-0 font-display">Add a child profile</h2>
				<p class="m-0 text-[var(--color-ink-soft)]">
					Only a display name and birth year are stored. No last name, no school, no
					address.
				</p>
			</div>
			<form class="flex flex-col gap-3" onsubmit={addChild}>
				<div>
					<label class="field-label" for="cname">Display name</label>
					<input
						id="cname"
						class="field-input"
						type="text"
						bind:value={newName}
						maxlength="40"
						autocomplete="given-name"
						autocapitalize="words"
						required
					/>
				</div>
				<div>
					<label class="field-label" for="cyear">Birth year</label>
					<input
						id="cyear"
						class="field-input"
						type="number"
						bind:value={newYear}
						min="2005"
						max="2025"
						inputmode="numeric"
						pattern="[0-9]*"
						required
					/>
				</div>
				{#if addError}
					<p class="text-[var(--color-rust)] text-[0.92rem] m-0" role="alert">
						{addError}
					</p>
				{/if}
				<button class="btn btn-primary" type="submit" disabled={addBusy}>
					{addBusy ? 'Adding…' : 'Add child'}
				</button>
			</form>
		</section>
	{:else}
		{#each data.children as child}
			{@const runs = data.runsByChild[child.id] ?? []}
			<section class="card flex flex-col gap-4">
				<header class="flex items-end justify-between gap-3 flex-wrap">
					<div>
						<h2 class="m-0 font-display">{child.display_name}</h2>
						<p class="text-[0.88rem] text-[var(--color-ink-muted)] m-0">
							Birth year {child.birth_year}
						</p>
					</div>
					<a href="/" class="btn btn-ghost text-[0.9rem]">Start a new run</a>
				</header>

				{#if runs.length === 0}
					<div
						class="flex flex-col gap-3 p-4 rounded-[var(--radius-soft)] border-[1.5px] border-dashed"
						style:border-color="var(--color-line)"
						style:background="var(--color-paper-deep)"
					>
						<div class="flex items-start gap-3">
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--color-ochre)"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="mt-0.5 shrink-0"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<polyline points="12 6 12 12 16 14"></polyline>
							</svg>
							<p class="m-0 text-[var(--color-ink-soft)]">
								No runs yet for {child.display_name}. The first one takes about ten
								minutes — preferences, tricky bits, strengths — and lives here when
								it's done.
							</p>
						</div>
						<a href="/" class="btn btn-primary self-start">
							Start an exploration with {child.display_name}
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
						</a>
					</div>
				{:else}
					<ul class="flex flex-col gap-3 list-none p-0 m-0">
						{#each runs as run}
							<li
								class="flex flex-col gap-2 p-3.5 rounded-[var(--radius-soft)] border-[1.5px]"
								style:border-color="var(--color-line)"
								style:background="var(--color-paper)"
							>
								<div class="flex items-center justify-between gap-3 flex-wrap">
									<div class="flex items-center gap-2 flex-wrap">
										<span class="font-display text-[1rem]">
											{new Date(run.taken_at).toLocaleString()}
										</span>
										<span class={planTag(run.plan)}>{planLabel(run.plan)}</span>
									</div>
									<div class="flex gap-1">
										<button
											class="btn btn-quiet text-[0.85rem]"
											onclick={() =>
												(openRunId = openRunId === run.id ? null : run.id)}
										>
											{openRunId === run.id ? 'Hide' : 'View'}
										</button>
										<button
											class="btn btn-quiet text-[0.85rem]"
											style:color="var(--color-rust)"
											onclick={() => deleteRun(run.id)}
										>
											Delete
										</button>
									</div>
								</div>
								{#if openRunId === run.id}
									<div class="flex flex-col gap-2 mt-2">
										<div class="flex flex-wrap gap-3">
											{#each DOMAINS as d}
												{@const level = flagFor(run.payload, d)}
												<div
													class="flex flex-col items-start gap-0.5 px-3 py-2 rounded-[var(--radius-soft)] border-[1.5px]"
													style:border-color="var(--color-line)"
												>
													<span
														class="text-[0.75rem] uppercase tracking-wider text-[var(--color-ink-muted)]"
													>
														{d}
													</span>
													<span
														class="font-display text-[0.95rem]"
														style:color={level === 'high'
															? 'var(--color-rust)'
															: level === 'medium'
																? 'var(--color-ochre)'
																: 'var(--color-sage)'}
													>
														{level}
													</span>
												</div>
											{/each}
										</div>
										<div class="text-[0.88rem] text-[var(--color-ink-soft)]">
											Preferences:
											{Object.entries(run.payload.scores.preferences)
												.map(([k, v]) => `${k.replace('_', '/')} ${v}%`)
												.join(' · ')}
										</div>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/each}

		<section class="card flex flex-col gap-3">
			<button
				class="btn btn-ghost self-start"
				onclick={() => (showAddChild = !showAddChild)}
			>
				{showAddChild ? 'Cancel' : 'Add another child'}
			</button>
			{#if showAddChild}
				<form class="flex flex-col gap-3 mt-2" onsubmit={addChild}>
					<div>
						<label class="field-label" for="cname2">Display name</label>
						<input
							id="cname2"
							class="field-input"
							type="text"
							bind:value={newName}
							maxlength="40"
							autocomplete="given-name"
							autocapitalize="words"
							required
						/>
					</div>
					<div>
						<label class="field-label" for="cyear2">Birth year</label>
						<input
							id="cyear2"
							class="field-input"
							type="number"
							bind:value={newYear}
							min="2005"
							max="2025"
							inputmode="numeric"
							pattern="[0-9]*"
							required
						/>
					</div>
					{#if addError}
						<p class="text-[var(--color-rust)] text-[0.92rem] m-0" role="alert">
							{addError}
						</p>
					{/if}
					<button class="btn btn-primary self-start" type="submit" disabled={addBusy}>
						{addBusy ? 'Adding…' : 'Add child'}
					</button>
				</form>
			{/if}
		</section>
	{/if}
</section>
