<script lang="ts">
	import { goto } from '$app/navigation';
	import { credentialsSchema } from '$lib/schemas/auth';

	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let emailError = $state<string | null>(null);
	let passwordError = $state<string | null>(null);
	let formError = $state<string | null>(null);

	function validate(): boolean {
		emailError = null;
		passwordError = null;
		formError = null;
		const result = credentialsSchema.safeParse({ email, password });
		if (result.success) return true;
		for (const issue of result.error.issues) {
			const field = issue.path[0];
			if (field === 'email' && !emailError) emailError = issue.message;
			if (field === 'password' && !passwordError) passwordError = issue.message;
		}
		return false;
	}

	async function submit(e: Event) {
		e.preventDefault();
		if (!validate()) return;
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
				formError = 'Too many sign-in attempts. Take a short break and try again.';
			} else {
				formError = 'Email or password did not match.';
			}
		} catch {
			formError = 'Network error. Try again.';
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

	<form class="flex flex-col gap-4" onsubmit={submit} novalidate>
		<div>
			<label class="field-label" for="email">Email</label>
			<input
				id="email"
				class="field-input"
				type="email"
				bind:value={email}
				autocomplete="email"
				aria-invalid={emailError ? 'true' : undefined}
				aria-describedby={emailError ? 'email-error' : undefined}
				required
			/>
			{#if emailError}
				<p
					id="email-error"
					class="text-[0.85rem] text-[var(--color-rust)] mt-1.5 m-0"
					role="alert"
				>
					{emailError}
				</p>
			{/if}
		</div>
		<div>
			<label class="field-label" for="password">Password</label>
			<input
				id="password"
				class="field-input"
				type="password"
				bind:value={password}
				autocomplete="current-password"
				aria-invalid={passwordError ? 'true' : undefined}
				aria-describedby={passwordError ? 'password-error' : undefined}
				required
			/>
			{#if passwordError}
				<p
					id="password-error"
					class="text-[0.85rem] text-[var(--color-rust)] mt-1.5 m-0"
					role="alert"
				>
					{passwordError}
				</p>
			{/if}
		</div>
		{#if formError}
			<p class="text-[0.92rem] text-[var(--color-rust)] m-0" role="alert">{formError}</p>
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
