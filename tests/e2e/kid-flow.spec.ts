import { test, expect } from '@playwright/test';

test.describe('kid happy path', () => {
	test('welcome → preferences → screening → strengths → results', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'Learner Profile' })).toBeVisible();

		await page.getByLabel(/I understand this is an exploration tool/i).check();
		await page.getByRole('button', { name: /Start exploring/i }).click();
		await expect(page).toHaveURL(/\/explore\/preferences/);

		// 10 preference items
		for (let i = 0; i < 10; i++) {
			const firstOption = page.getByRole('radio').or(page.getByRole('checkbox')).first();
			await firstOption.check();
			await page.getByRole('button', { name: /(Next|Continue to tricky bits)/ }).click();
		}
		await expect(page).toHaveURL(/\/explore\/screening/);

		// 12 screening items (kid view only - "Never" each)
		for (let i = 0; i < 12; i++) {
			await page.getByRole('radio', { name: 'Never' }).click();
			await page.getByRole('button', { name: /(Next|Continue to strengths)/ }).click();
		}
		await expect(page).toHaveURL(/\/explore\/strengths/);

		// 6 strengths (Sounds like me each)
		for (let i = 0; i < 6; i++) {
			await page.getByRole('radio', { name: 'Sounds like me' }).click();
			await page.getByRole('button', { name: /(Next|See your menu)/ }).click();
		}
		await expect(page).toHaveURL(/\/explore\/results/);

		await expect(page.getByText('Top preference', { exact: false })).toBeVisible();
		await expect(page.getByText('Recommended next step').or(page.getByText('Next step'))).toBeVisible();
	});

	test('PDF download produces a non-empty file', async ({ page }) => {
		await page.goto('/');
		await page.getByLabel(/I understand this is an exploration tool/i).check();
		await page.getByRole('button', { name: /Start exploring/i }).click();

		for (let i = 0; i < 10; i++) {
			const firstOption = page.getByRole('radio').or(page.getByRole('checkbox')).first();
			await firstOption.check();
			await page.getByRole('button', { name: /(Next|Continue to tricky bits)/ }).click();
		}
		for (let i = 0; i < 12; i++) {
			await page.getByRole('radio', { name: 'Never' }).click();
			await page.getByRole('button', { name: /(Next|Continue to strengths)/ }).click();
		}
		for (let i = 0; i < 6; i++) {
			await page.getByRole('radio', { name: 'Sounds like me' }).click();
			await page.getByRole('button', { name: /(Next|See your menu)/ }).click();
		}

		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: /Download PDF summary/i }).click();
		const download = await downloadPromise;
		const stream = await download.createReadStream();
		const chunks: Buffer[] = [];
		for await (const c of stream) chunks.push(c as Buffer);
		const buf = Buffer.concat(chunks);
		expect(buf.length).toBeGreaterThan(1000);
		expect(buf.slice(0, 4).toString()).toBe('%PDF');
	});
});
