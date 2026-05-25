<script lang="ts">
	import type { PreferencesItem, PrefMode } from '$lib/types';
	import AudioButton from './AudioButton.svelte';

	type Props = {
		item: PreferencesItem;
		index: number;
		total: number;
		selected: PrefMode[];
		onchange: (tags: PrefMode[]) => void;
	};

	let { item, index, total, selected = [], onchange }: Props = $props();

	function toggle(tag: PrefMode) {
		if (item.multiSelect) {
			const next = selected.includes(tag)
				? selected.filter((t) => t !== tag)
				: [...selected, tag];
			onchange(next);
		} else {
			onchange([tag]);
		}
	}

	function isSelected(tag: PrefMode) {
		return selected.includes(tag);
	}
</script>

<article class="card flex flex-col gap-5">
	<header class="flex flex-col gap-1.5">
		<span class="eyebrow">
			Question {index + 1} of {total}{item.multiSelect ? ' · pick all that fit' : ''}
		</span>
		<div class="flex items-start justify-between gap-3">
			<h2 class="m-0 leading-[1.2]">{item.prompt}</h2>
			<AudioButton text={item.prompt} label="Hear this question read aloud" />
		</div>
	</header>

	<fieldset class="flex flex-col gap-2.5 border-0 p-0 m-0">
		<legend class="sr-only">Choose your answer to: {item.prompt}</legend>
		{#each item.options as opt}
			{@const active = isSelected(opt.tag)}
			<label
				class="flex items-start gap-3 cursor-pointer p-3.5 rounded-[var(--radius-soft)] border-[1.5px] transition-colors"
				style:background={active ? 'var(--color-rust-soft)' : 'var(--color-paper)'}
				style:border-color={active ? 'var(--color-rust)' : 'var(--color-line)'}
			>
				<input
					type={item.multiSelect ? 'checkbox' : 'radio'}
					name={item.id}
					value={opt.tag}
					checked={active}
					onchange={() => toggle(opt.tag)}
					class="mt-1 accent-[var(--color-rust)] w-5 h-5 shrink-0"
				/>
				<span class="text-[1.02rem] leading-relaxed">{opt.text}</span>
			</label>
		{/each}
	</fieldset>
</article>
