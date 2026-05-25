<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let parentEmail = $state<string | null>(null);
	let confirmEmail = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);
	let done = $state(false);

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		if (res.ok) {
			const json = await res.json();
			parentEmail = json.parent.email;
		}
	});

	async function deleteAccount(e: Event) {
		e.preventDefault();
		error = null;
		busy = true;
		try {
			const res = await fetch('/api/parents/me', {
				method: 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ confirm_email: confirmEmail })
			});
			if (res.status === 204) {
				done = true;
				setTimeout(() => goto('/'), 2500);
			} else {
				error = 'Email did not match the account.';
			}
		} catch {
			error = 'Network error.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Privacy & data — Helena's Learner Profile</title>
</svelte:head>

<section class="flex flex-col gap-5">
	<header class="flex flex-col gap-1">
		<span class="eyebrow">Privacy & data</span>
		<h1 class="m-0 font-display">What we store, and how to remove it.</h1>
	</header>

	<article class="card flex flex-col gap-3">
		<h2 class="m-0 font-display">What is stored</h2>
		<ul class="flex flex-col gap-2 list-disc pl-5 m-0">
			<li>Your parent email + a bcrypt-hashed password.</li>
			<li>For each child profile you add: a display name and birth year. That's it.</li>
			<li>
				For each saved run: the answers and computed scores, attached to that child
				profile.
			</li>
			<li>
				Sessions are stored in an httpOnly cookie signed with a server secret — never
				readable by JavaScript.
			</li>
		</ul>
	</article>

	<article class="card flex flex-col gap-3">
		<h2 class="m-0 font-display">What is not stored</h2>
		<ul class="flex flex-col gap-2 list-disc pl-5 m-0">
			<li>No last names. No school. No date of birth — only birth year.</li>
			<li>No analytics, no tracking, no third-party scripts beyond a Google Fonts CSS link.</li>
			<li>
				If you never sign in, your run lives only in this browser tab — never sent to a
				server.
			</li>
		</ul>
	</article>

	{#if parentEmail}
		<article class="card flex flex-col gap-3">
			<h2 class="m-0 font-display">Delete my account</h2>
			<p class="text-[var(--color-ink-soft)] m-0">
				This removes the parent record, every child profile under it, and every saved run.
				Permanent. Cannot be undone.
			</p>
			{#if done}
				<p class="text-[var(--color-sage)] m-0" role="status">
					Account deleted. Redirecting home…
				</p>
			{:else}
				<form class="flex flex-col gap-3" onsubmit={deleteAccount}>
					<div>
						<label class="field-label" for="confirm">
							Type your email to confirm: <code>{parentEmail}</code>
						</label>
						<input
							id="confirm"
							class="field-input"
							type="email"
							bind:value={confirmEmail}
							required
						/>
					</div>
					{#if error}
						<p class="text-[var(--color-rust)] text-[0.92rem] m-0" role="alert">{error}</p>
					{/if}
					<button class="btn btn-primary self-start" type="submit" disabled={busy}>
						{busy ? 'Deleting…' : 'Delete everything'}
					</button>
				</form>
			{/if}
		</article>
	{:else}
		<article class="card">
			<p class="m-0 text-[var(--color-ink-soft)]">
				You're not signed in. Account deletion is only available while signed in.
			</p>
		</article>
	{/if}
</section>
