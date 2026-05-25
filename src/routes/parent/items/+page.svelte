<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Disclaimer from '$lib/components/Disclaimer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Kind = 'preferences' | 'screening' | 'strengths';
	let activeKind = $state<Kind>('preferences');
	let editing = $state<{ id: string; row: typeof data.items[number] } | null>(null);
	let seeding = $state(false);
	let seedResult = $state<string | null>(null);
	let saveError = $state<string | null>(null);
	let saveBusy = $state(false);

	// Show only the latest active version per slug in the main list.
	const itemsByKind = $derived.by(() => {
		const out: Record<Kind, typeof data.items> = {
			preferences: [],
			screening: [],
			strengths: []
		};
		for (const row of data.items) {
			if (row.active) out[row.kind as Kind].push(row);
		}
		return out;
	});

	const KIND_LABELS: Record<Kind, string> = {
		preferences: 'Preferences (10 scenarios)',
		screening: 'Screening (12 items)',
		strengths: 'Strengths (6 items)'
	};

	async function seed() {
		seeding = true;
		seedResult = null;
		const res = await fetch('/api/items/seed', { method: 'POST' });
		if (res.ok) {
			const j = await res.json();
			seedResult = `Added: ${j.inserted.preferences} preferences, ${j.inserted.screening} screening, ${j.inserted.strengths} strengths.`;
			await invalidateAll();
		} else {
			seedResult = 'Seed failed.';
		}
		seeding = false;
	}

	async function retire(id: string) {
		if (!confirm('Retire this item? Old runs that referenced it will still render fine.'))
			return;
		await fetch(`/api/items/${id}`, { method: 'DELETE' });
		await invalidateAll();
	}

	function startEdit(row: typeof data.items[number]) {
		editing = { id: row.id, row: structuredClone(row) };
		saveError = null;
	}

	function cancelEdit() {
		editing = null;
	}

	async function saveEdit() {
		if (!editing) return;
		saveBusy = true;
		saveError = null;
		// Edits to payload create a new version (POST), not an update (PATCH),
		// so that history is preserved.
		const body = {
			kind: editing.row.kind,
			slug: editing.row.slug,
			payload: editing.row.payload,
			weight: editing.row.weight,
			parent_notes: editing.row.parentNotes ?? undefined
		};
		const res = await fetch('/api/items', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (res.ok) {
			editing = null;
			await invalidateAll();
		} else {
			const j = await res.json().catch(() => ({}));
			saveError = j.error ?? 'Save failed.';
		}
		saveBusy = false;
	}

	async function setWeight(row: typeof data.items[number], weight: number) {
		await fetch(`/api/items/${row.id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ weight })
		});
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Items — Helena's Learner Profile</title>
</svelte:head>

<section class="flex flex-col gap-6">
	<header class="flex flex-col gap-2">
		<span class="eyebrow">Editable question bank</span>
		<h1 class="m-0 font-display">Your items.</h1>
		<p class="m-0 text-[var(--color-ink-soft)]">
			This is the actual content the explore flow uses. Edit any wording you find confusing or
			retire items that don't fit. Edits create a new version — historic runs still render
			against the version they were taken with.
		</p>
	</header>

	<Disclaimer variant="parent" />

	{#if data.items.length === 0}
		<section class="card flex flex-col gap-4">
			<h2 class="m-0 font-display">No custom items yet</h2>
			<p class="m-0 text-[var(--color-ink-soft)]">
				Right now the explore flow uses a built-in starter bank. Import it to make your own
				editable copy.
			</p>
			<button class="btn btn-primary self-start" disabled={seeding} onclick={seed}>
				{seeding ? 'Importing…' : 'Import starter items'}
			</button>
			{#if seedResult}
				<p class="text-[var(--color-sage)] m-0">{seedResult}</p>
			{/if}
		</section>
	{:else}
		<nav class="flex flex-wrap gap-1 p-1 rounded-full self-start" style:background="var(--color-paper-deep)">
			{#each ['preferences', 'screening', 'strengths'] as Kind[] as kind}
				<button
					class="px-4 py-2 rounded-full text-[0.88rem] font-semibold transition-colors min-h-[40px]"
					style:background={activeKind === kind ? 'var(--color-card)' : 'transparent'}
					style:color={activeKind === kind ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
					onclick={() => (activeKind = kind)}
				>
					{KIND_LABELS[kind]}
				</button>
			{/each}
		</nav>

		<ul class="flex flex-col gap-3 list-none p-0 m-0">
			{#each itemsByKind[activeKind] as row}
				<li
					class="card-bordered flex flex-col gap-3"
					style:padding="1rem 1.1rem"
				>
					<div class="flex items-start justify-between gap-3 flex-wrap">
						<div class="flex flex-col gap-1">
							<span class="text-[0.78rem] uppercase tracking-wider text-[var(--color-ink-muted)]">
								{row.slug} · v{row.version}
								{#if row.kind === 'screening'}
									· {(row.payload as { domain: string }).domain}
								{/if}
							</span>
							{#if row.kind === 'preferences'}
								<span class="font-display text-[1rem]">
									{(row.payload as { prompt: string }).prompt}
								</span>
							{:else if row.kind === 'screening'}
								<span class="font-display text-[1rem]">
									{(row.payload as { kidPrompt: string }).kidPrompt}
								</span>
							{:else}
								<span class="font-display text-[1rem]">
									{(row.payload as { prompt: string }).prompt}
								</span>
							{/if}
						</div>
						<div class="flex gap-1">
							<button class="btn btn-quiet text-[0.85rem]" onclick={() => startEdit(row)}>
								Edit
							</button>
							<button
								class="btn btn-quiet text-[0.85rem]"
								style:color="var(--color-rust)"
								onclick={() => retire(row.id)}
							>
								Retire
							</button>
						</div>
					</div>
					<div class="flex items-center gap-3 text-[0.85rem] text-[var(--color-ink-muted)]">
						<label class="flex items-center gap-2 cursor-pointer">
							<span>Weight</span>
							<input
								type="range"
								min="0"
								max="3"
								step="0.5"
								value={row.weight}
								onchange={(e) =>
									setWeight(row, Number((e.target as HTMLInputElement).value))}
							/>
							<span class="font-mono">{row.weight.toFixed(1)}</span>
						</label>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if editing}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
		style:background="color-mix(in srgb, var(--color-ink) 38%, transparent)"
		role="dialog"
		aria-modal="true"
	>
		<div class="card max-w-xl w-full flex flex-col gap-4 my-4">
			<header class="flex items-center justify-between gap-3">
				<h2 class="m-0 font-display">Edit item</h2>
				<button class="btn btn-quiet" onclick={cancelEdit}>Cancel</button>
			</header>
			<p class="text-[0.85rem] text-[var(--color-ink-muted)] m-0">
				Saving creates v{editing.row.version + 1} and retires the current version. Old runs
				keep pointing at the version they used.
			</p>

			{#if editing.row.kind === 'preferences'}
				{@const p = editing.row.payload as {
					prompt: string;
					multiSelect: boolean;
					options: { tag: string; text: string }[];
				}}
				<div>
					<label class="field-label" for="ed-prompt">Prompt</label>
					<textarea
						id="ed-prompt"
						class="field-input"
						rows="2"
						bind:value={p.prompt}
					></textarea>
				</div>
				<label class="flex items-center gap-2 cursor-pointer text-[0.92rem]">
					<input type="checkbox" bind:checked={p.multiSelect} />
					Allow multi-select
				</label>
				<div class="flex flex-col gap-2">
					<span class="field-label">Options (one per tag)</span>
					{#each p.options as opt}
						<div class="flex items-center gap-2">
							<span class="text-[0.78rem] w-24 font-mono text-[var(--color-ink-muted)]">
								{opt.tag}
							</span>
							<input class="field-input flex-1" bind:value={opt.text} />
						</div>
					{/each}
				</div>
			{:else if editing.row.kind === 'screening'}
				{@const p = editing.row.payload as {
					domain: string;
					kidPrompt: string;
					parentPrompt: string;
				}}
				<div>
					<label class="field-label" for="ed-kid">Kid prompt (first-person, "I…")</label>
					<textarea
						id="ed-kid"
						class="field-input"
						rows="2"
						bind:value={p.kidPrompt}
					></textarea>
				</div>
				<div>
					<label class="field-label" for="ed-parent">Parent prompt (third-person, "She…")</label>
					<textarea
						id="ed-parent"
						class="field-input"
						rows="2"
						bind:value={p.parentPrompt}
					></textarea>
				</div>
				<p class="text-[0.85rem] text-[var(--color-ink-muted)] m-0">
					Domain: {p.domain} (immutable — make a new item to change domain)
				</p>
			{:else}
				{@const p = editing.row.payload as { prompt: string }}
				<div>
					<label class="field-label" for="ed-prompt-s">Strength prompt</label>
					<textarea
						id="ed-prompt-s"
						class="field-input"
						rows="2"
						bind:value={p.prompt}
					></textarea>
				</div>
			{/if}

			<div>
				<label class="field-label" for="ed-notes">Your notes (private)</label>
				<textarea
					id="ed-notes"
					class="field-input"
					rows="2"
					value={editing.row.parentNotes ?? ''}
					oninput={(e) =>
						(editing!.row.parentNotes =
							(e.target as HTMLTextAreaElement).value || null)}
					placeholder="Anything you want to remember about this item."
				></textarea>
			</div>

			{#if saveError}
				<p class="text-[var(--color-rust)] text-[0.92rem] m-0" role="alert">{saveError}</p>
			{/if}

			<div class="flex gap-3">
				<button class="btn btn-primary flex-1" disabled={saveBusy} onclick={saveEdit}>
					{saveBusy ? 'Saving…' : 'Save as new version'}
				</button>
				<button class="btn btn-ghost" onclick={cancelEdit}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
