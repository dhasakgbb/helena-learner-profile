<script lang="ts">
	import type { PrefMode } from '$lib/types';

	type Props = {
		scores: Record<PrefMode, number>;
	};
	let { scores }: Props = $props();

	const MODES: { key: PrefMode; label: string; color: string; icon: string }[] = [
		{
			key: 'visual',
			label: 'Visual',
			color: 'var(--color-rust)',
			icon: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
		},
		{
			key: 'auditory',
			label: 'Auditory',
			color: 'var(--color-teal)',
			icon: 'M11 5 6 9H2v6h4l5 4V5z M15.5 8.5a5 5 0 0 1 0 7'
		},
		{
			key: 'read_write',
			label: 'Read / Write',
			color: 'var(--color-ochre)',
			icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'
		},
		{
			key: 'kinesthetic',
			label: 'Hands-on',
			color: 'var(--color-sage)',
			icon: 'M6 11V5a2 2 0 0 1 4 0v6 M10 11V3.5a2 2 0 0 1 4 0V11 M14 11V5.5a2 2 0 0 1 4 0V14 M6 11a4 4 0 0 0 8 0 M18 14a4 4 0 0 1-8 0'
		}
	];

	const sorted = $derived(
		[...MODES].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
	);
</script>

<div class="flex flex-col gap-4" role="img" aria-label="Learning preferences bar chart">
	{#each sorted as mode}
		{@const pct = scores[mode.key] ?? 0}
		<div class="flex items-center gap-4">
			<div
				class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
				style:background="color-mix(in srgb, {mode.color} 12%, white)"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke={mode.color}
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d={mode.icon} />
				</svg>
			</div>
			<div class="flex-1 flex flex-col gap-1">
				<div class="flex items-baseline justify-between gap-2">
					<span class="font-display text-[1.1rem]">{mode.label}</span>
					<span class="font-display text-[1.3rem]" style:color={mode.color}>
						{pct}<span class="text-[0.8rem]">%</span>
					</span>
				</div>
				<div
					class="h-2.5 rounded-full overflow-hidden"
					style:background="var(--color-paper-deep)"
				>
					<div
						class="h-full rounded-full transition-[width] duration-[700ms]"
						style:width="{pct}%"
						style:background={mode.color}
					></div>
				</div>
			</div>
		</div>
	{/each}
</div>
