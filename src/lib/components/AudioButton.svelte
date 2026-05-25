<script lang="ts">
	import { onMount } from 'svelte';

	let { text, label = 'Read this aloud' }: { text: string; label?: string } = $props();
	let speaking = $state(false);
	let supported = $state(false);

	onMount(() => {
		supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
	});

	function toggle() {
		if (!supported) return;
		const synth = window.speechSynthesis;
		if (speaking) {
			synth.cancel();
			speaking = false;
			return;
		}
		synth.cancel();
		const utter = new SpeechSynthesisUtterance(text);
		utter.rate = 0.95;
		utter.pitch = 1.05;
		utter.onend = () => (speaking = false);
		utter.onerror = () => (speaking = false);
		synth.speak(utter);
		speaking = true;
	}
</script>

{#if supported}
	<button
		type="button"
		class="btn btn-quiet inline-flex items-center gap-1.5 text-[0.85rem]"
		aria-label={label}
		aria-pressed={speaking}
		data-testid="audio-button"
		onclick={toggle}
	>
		{#if speaking}
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<rect x="6" y="4" width="4" height="16"></rect>
				<rect x="14" y="4" width="4" height="16"></rect>
			</svg>
			<span>Stop</span>
		{:else}
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
				<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
				<path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
			</svg>
			<span>Hear it</span>
		{/if}
	</button>
{/if}
