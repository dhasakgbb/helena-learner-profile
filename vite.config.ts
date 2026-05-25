import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		include: ['src/**/*.{test,spec}.{ts,svelte.ts}'],
		exclude: ['tests/e2e/**', 'node_modules/**']
	}
});
