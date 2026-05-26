<script lang="ts">
	let { children } = $props();
</script>

<main class="shell">
	<header class="flex items-center justify-between gap-3 mb-6">
		<a
			href="/"
			class="font-display text-[1.1rem] no-underline text-[var(--color-ink)]"
			aria-label="Helena's Learner Profile home"
		>
			Helena<span class="text-[var(--color-rust)]">.</span>
		</a>
		<nav class="flex gap-1 text-[0.85rem]">
			<a class="btn btn-quiet" href="/parent/dashboard">Dashboard</a>
			<a class="btn btn-quiet" href="/activity">App activity</a>
			<a class="btn btn-quiet" href="/hub">Hub</a>
			<a class="btn btn-quiet" href="/parent/items">Items</a>
			<a class="btn btn-quiet" href="/parent/privacy">Privacy</a>
		</nav>
	</header>

	{@render children()}
</main>
