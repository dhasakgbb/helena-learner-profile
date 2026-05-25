<script lang="ts">
	type Props = {
		steps: string[];
		current: number;
	};
	let { steps, current }: Props = $props();
</script>

<nav aria-label="Progress" class="w-full">
	<ol class="flex items-stretch gap-2 list-none p-0 m-0">
		{#each steps as label, i}
			{@const state = i < current ? 'done' : i === current ? 'now' : 'todo'}
			<li
				class="flex-1 flex flex-col gap-1.5"
				aria-current={state === 'now' ? 'step' : undefined}
			>
				<span
					class="block h-2 rounded-full transition-colors duration-300"
					style:background={state === 'done'
						? 'var(--color-rust)'
						: state === 'now'
							? 'var(--color-ochre)'
							: 'var(--color-line)'}
				></span>
				<span
					class="text-[0.7rem] uppercase tracking-[0.15em] font-bold text-center"
					style:color={state === 'todo' ? 'var(--color-ink-muted)' : 'var(--color-ink)'}
				>
					{label}
				</span>
			</li>
		{/each}
	</ol>
</nav>
