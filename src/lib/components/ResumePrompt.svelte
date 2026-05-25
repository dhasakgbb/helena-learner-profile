<script lang="ts">
	import { exploreStore } from '$lib/state/explore.svelte';
	import { goto } from '$app/navigation';

	const open = $derived(exploreStore.resumePromptPending);

	function resume() {
		exploreStore.acknowledgeResume();
	}

	function startOver() {
		exploreStore.reset();
		goto('/');
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style:background="color-mix(in srgb, var(--color-ink) 38%, transparent)"
		role="dialog"
		aria-modal="true"
		aria-labelledby="resume-title"
	>
		<div class="card max-w-md w-full flex flex-col gap-4">
			<header class="flex flex-col gap-1">
				<span class="eyebrow">Welcome back</span>
				<h2 id="resume-title" class="m-0 font-display">You left something in progress.</h2>
			</header>
			<p class="m-0 text-[var(--color-ink-soft)]">
				Your earlier answers are saved on this device. You can pick up where you left off, or
				start a fresh exploration from the welcome screen.
			</p>
			<div class="flex flex-col sm:flex-row gap-3">
				<button class="btn btn-primary flex-1" onclick={resume}>Resume</button>
				<button class="btn btn-ghost flex-1" onclick={startOver}>Start over</button>
			</div>
		</div>
	</div>
{/if}
