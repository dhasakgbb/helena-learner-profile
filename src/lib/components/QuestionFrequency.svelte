<script lang="ts">
	import type { ScreeningItem, FrequencyAnswer } from '$lib/types';
	import { FREQUENCY_LABELS } from '$lib/types';
	import AudioButton from './AudioButton.svelte';

	type Props = {
		item: ScreeningItem;
		index: number;
		total: number;
		view: 'kid' | 'parent';
		kidValue: FrequencyAnswer | null;
		parentValue: FrequencyAnswer | null;
		onchange: (view: 'kid' | 'parent', value: FrequencyAnswer | null) => void;
	};

	let { item, index, total, view, kidValue, parentValue, onchange }: Props = $props();

	const prompt = $derived(view === 'kid' ? item.kidPrompt : item.parentPrompt);
	const value = $derived(view === 'kid' ? kidValue : parentValue);

	function pick(v: FrequencyAnswer) {
		onchange(view, v);
	}
</script>

<article class="card flex flex-col gap-5">
	<header class="flex flex-col gap-1.5">
		<span class="eyebrow">
			Item {index + 1} of {total} · {view === 'kid' ? 'kid view' : 'parent view'}
		</span>
		<div class="flex items-start justify-between gap-3">
			<h3 class="m-0 leading-[1.25]">{prompt}</h3>
			<AudioButton text={prompt} />
		</div>
	</header>

	<div role="radiogroup" aria-label={prompt} class="grid grid-cols-1 sm:grid-cols-5 gap-2">
		{#each FREQUENCY_LABELS as label, i}
			{@const active = value === (i as FrequencyAnswer)}
			<button
				type="button"
				role="radio"
				aria-checked={active}
				class="px-2.5 py-2.5 rounded-[var(--radius-soft)] text-[0.92rem] font-semibold border-[1.5px] transition-colors min-h-[48px]"
				style:background={active ? 'var(--color-teal)' : 'var(--color-paper)'}
				style:color={active ? '#fff8ec' : 'var(--color-ink-soft)'}
				style:border-color={active ? 'var(--color-teal-deep)' : 'var(--color-line)'}
				onclick={() => pick(i as FrequencyAnswer)}
			>
				{label}
			</button>
		{/each}
	</div>
</article>
