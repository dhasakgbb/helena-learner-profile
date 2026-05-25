<script lang="ts">
	type Props = {
		message: string | null;
		size?: 'sm' | 'md';
	};
	let { message, size = 'md' }: Props = $props();
	const className = $derived(
		size === 'sm'
			? 'text-[0.85rem] text-[var(--color-rust)] m-0'
			: 'text-[0.92rem] text-[var(--color-rust)] m-0'
	);
</script>

{#if message}
	<p class={className} role="alert" aria-live="polite">{message}</p>
{/if}
