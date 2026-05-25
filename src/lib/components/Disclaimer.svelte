<script lang="ts">
	type Variant = 'compact' | 'full' | 'parent';
	let { variant = 'compact' as Variant }: { variant?: Variant } = $props();
</script>

{#if variant === 'full'}
	<div class="banner-disclaimer" role="note">
		<p class="m-0">
			<strong>A quick, important note.</strong> This is an
			<em>informal exploration tool</em>, not a diagnosis. It cannot identify learning
			disabilities. If results suggest a closer look, that is a conversation to have with a
			teacher and pediatrician — never with a quiz.
		</p>
	</div>
{:else if variant === 'parent'}
	<div class="banner-disclaimer" role="note">
		<p class="m-0">
			Results here are observations, not labels. Treat any flag as a prompt for a conversation,
			not a clinical finding. The most useful next step is almost always: teacher first,
			pediatrician second.
		</p>
	</div>
{:else}
	<p class="text-[0.85rem] text-[var(--color-ink-muted)] italic m-0">
		An informal exploration tool — not a diagnosis.
	</p>
{/if}
