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
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (res.ok) {
				goto('/parent/dashboard');
			} else if (res.status === 429) {
				error = 'Too many sign-in attempts. Take a short break and try again.';
			} else {
				error = 'Email or password did not match.';
			}
		} catch {
			error = 'Network error. Try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Helena's Learner Profile</title>
</svelte:head>

<section class="card max-w-md mx-auto flex flex-col gap-5">
	<header class="flex flex-col gap-1">
		<span class="eyebrow">Parent account</span>
		<h1 class="m-0 font-display">Welcome back.</h1>
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
			<label class="field-label" for="password">Password</label>
			<input
				id="password"
				class="field-input"
				type="password"
				bind:value={password}
				autocomplete="current-password"
				required
			/>
		</div>
		{#if error}
			<p class="text-[0.92rem] text-[var(--color-rust)] m-0" role="alert">{error}</p>
		{/if}
		<button class="btn btn-primary" type="submit" disabled={busy}>
			{busy ? 'Signing in…' : 'Sign in'}
		</button>
	</form>

	<p class="text-[0.9rem] text-[var(--color-ink-soft)] m-0">
		No account yet? <a href="/parent/signup" class="underline" style:color="var(--color-rust)">
			Create one
		</a>
	</p>
</section>
