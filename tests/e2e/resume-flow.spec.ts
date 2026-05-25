import { test, expect } from '@playwright/test';

test('answers persist across reload during preferences flow', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel(/I understand this is an exploration tool/i).check();
	await page.getByRole('button', { name: /Start exploring/i }).click();

	// Answer first 3 items
	for (let i = 0; i < 3; i++) {
		const firstOption = page.getByRole('radio').or(page.getByRole('checkbox')).first();
		await firstOption.check();
		await page.getByRole('button', { name: /Next/ }).click();
	}

	// Reload. We use sessionStorage so the same tab reload preserves state.
	await page.reload();

	// First option for the 4th question should still be enabled, but the previous 3 should be saved.
	// We can verify by going back and seeing answers retained.
	for (let i = 0; i < 3; i++) {
		await page.getByRole('button', { name: /^Back$/ }).click();
	}
	// The first item should still have a selected option from before.
	const checked = await page.locator('input:checked').count();
	expect(checked).toBeGreaterThan(0);
});
