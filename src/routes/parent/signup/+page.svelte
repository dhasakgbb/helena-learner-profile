<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);

	async function submit(e: Event) {
		e.preventDefault();
		error = null;
		busy = true;
		try {
			const res = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (res.status === 201) {
				goto('/parent/dashboard');
			} else if (res.status === 409) {
				error = 'That email is already used. Try signing in instead.';
			} else if (res.status === 400) {
				error = 'Email must be valid and password must be at least 10 characters.';
			} else {
				error = "Something went wrong. Try again.";
			}
		} catch {
			error = 'Network error. Try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign up — Helena's Learner Profile</title>
</svelte:head>

<section class="card max-w-md mx-auto flex flex-col gap-5">
	<header class="flex flex-col gap-1">
		<span class="eyebrow">Parent account</span>
		<h1 class="m-0 font-display">Save runs over time.</h1>
		<p class="text-[0.92rem] text-[var(--color-ink-soft)] m-0">
			An account lets you save runs and revisit them later. Only your email is stored — no
			child last names, no school, no address.
		</p>
	</header>

	<form class="flex flex-col gap-4" onsubmit={submit}>
		<div>
			<label class="field-label" for="email">Email</label>
			<input
				id="email"
				class="field-input"
				type="email"
				bind:value={email}
				autocomplete="email"
				required
			/>
		</div>
		<div>
			<label class="field-label" for="password">Password (10+ characters)</label>
			<input
				id="password"
				class="field-input"
				type="password"
				bind:value={password}
				autocomplete="new-password"
				minlength="10"
				required
			/>
		</div>
		{#if error}
			<p class="text-[0.92rem] text-[var(--color-rust)] m-0" role="alert">{error}</p>
		{/if}
		<button class="btn btn-primary" type="submit" disabled={busy}>
			{busy ? 'Creating account…' : 'Create account'}
		</button>
	</form>

	<p class="text-[0.9rem] text-[var(--color-ink-soft)] m-0">
		Already have one? <a href="/parent/login" class="underline" style:color="var(--color-rust)">
			Sign in
		</a>
	</p>
</section>
