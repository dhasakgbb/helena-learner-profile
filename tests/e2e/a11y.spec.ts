import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/resources', '/parent/login', '/parent/signup'];

for (const route of ROUTES) {
	test(`a11y: ${route} has no WCAG AA violations`, async ({ page }) => {
		await page.goto(route);
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();
		const violations = results.violations.filter(
			(v) => !['color-contrast'].includes(v.id) || v.nodes.length > 0
		);
		expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
	});
}

test('a11y: explore preferences page', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel(/I understand this is an exploration tool/i).check();
	await page.getByRole('button', { name: /Start exploring/i }).click();
	await expect(page).toHaveURL(/preferences/);
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
