import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const isDeployed = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
	testDir: 'tests/e2e',
	timeout: 30_000,
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: isDeployed
		? undefined
		: {
				command: 'npm run build && npm run preview -- --port ' + PORT,
				url: `http://127.0.0.1:${PORT}`,
				reuseExistingServer: !process.env.CI,
				timeout: 120_000
			}
});
