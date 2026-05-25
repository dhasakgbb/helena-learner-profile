<script lang="ts">
	import type { StrengthsItem, LikertAnswer } from '$lib/types';
	import { LIKERT_LABELS } from '$lib/types';
	import AudioButton from './AudioButton.svelte';

	type Props = {
		item: StrengthsItem;
		index: number;
		total: number;
		value: LikertAnswer | null;
		onchange: (value: LikertAnswer) => void;
	};

	let { item, index, total, value, onchange }: Props = $props();
</script>

<article class="card flex flex-col gap-5">
	<header class="flex flex-col gap-1.5">
		<span class="eyebrow">Strength spotlight · {index + 1} of {total}</span>
		<div class="flex items-start justify-between gap-3">
			<h3 class="m-0 leading-[1.25] font-display">{item.prompt}</h3>
			<AudioButton text={item.prompt} />
		</div>
	</header>

	<div role="radiogroup" aria-label={item.prompt} class="grid grid-cols-1 sm:grid-cols-3 gap-2">
		{#each LIKERT_LABELS as label, i}
			{@const v = i as LikertAnswer}
			{@const active = value === v}
			<button
				type="button"
				role="radio"
				aria-checked={active}
				class="px-3 py-3 rounded-[var(--radius-soft)] text-[0.95rem] font-semibold border-[1.5px] transition-colors min-h-[52px]"
				style:background={active ? 'var(--color-sage)' : 'var(--color-paper)'}
				style:color={active ? '#fff8ec' : 'var(--color-ink-soft)'}
				style:border-color={active ? 'var(--color-sage)' : 'var(--color-line)'}
				onclick={() => onchange(v)}
			>
				{label}
			</button>
		{/each}
	</div>
</article>
