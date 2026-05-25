<script lang="ts">
	let open = $state(false);

	function close() {
		open = false;
	}

	function onKey(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			e.preventDefault();
			close();
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<button
	type="button"
	class="btn btn-quiet text-[0.85rem]"
	aria-haspopup="dialog"
	aria-expanded={open}
	onclick={() => (open = true)}
>
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="10"></circle>
		<polyline points="12 6 12 12 16 14"></polyline>
	</svg>
	I need a break
</button>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style:background="color-mix(in srgb, var(--color-ink) 35%, transparent)"
		role="dialog"
		aria-modal="true"
		aria-labelledby="break-title"
	>
		<div class="card max-w-md w-full flex flex-col gap-4 text-center">
			<h2 id="break-title" class="m-0">Take your time.</h2>
			<p class="m-0 text-[var(--color-ink-soft)]">
				Your answers are safe on this device. Step away as long as you need — when you come
				back, everything will be right where you left it.
			</p>
			<!-- svelte-ignore a11y_autofocus -->
			<button type="button" class="btn btn-primary w-full" autofocus onclick={close}>
				I'm ready to keep going
			</button>
		</div>
	</div>
{/if}
