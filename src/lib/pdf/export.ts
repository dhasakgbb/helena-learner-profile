import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { RunPayload, PrefMode, Domain } from '$lib/types';
import { PREF_MODES, DOMAINS } from '$lib/types';
import { STRENGTHS_ITEMS, STRENGTHS_AFFIRMATIONS } from '$lib/data/strengths-items';

const PREF_LABEL: Record<PrefMode, string> = {
	visual: 'Visual',
	auditory: 'Auditory',
	read_write: 'Read / Write',
	kinesthetic: 'Hands-on'
};

const DOMAIN_LABEL: Record<Domain, string> = {
	reading: 'Reading',
	writing: 'Writing',
	math: 'Math',
	attention: 'Attention'
};

const PLAN_HEADLINE: Record<RunPayload['scores']['plan'], string> = {
	strengths: 'Strength-based experimentation plan',
	monitor: 'Monitor and add multisensory supports',
	schedule: 'Time for a conversation'
};

function wrapLines(text: string, maxChars: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let cur = '';
	for (const w of words) {
		if ((cur + ' ' + w).trim().length > maxChars) {
			lines.push(cur);
			cur = w;
		} else {
			cur = (cur + ' ' + w).trim();
		}
	}
	if (cur) lines.push(cur);
	return lines;
}

export async function exportRunToPdf(run: RunPayload, childName = 'Helena'): Promise<Blob> {
	const doc = await PDFDocument.create();
	const page = doc.addPage([595, 842]);
	const { width, height } = page.getSize();
	const margin = 50;
	const serif = await doc.embedFont(StandardFonts.TimesRoman);
	const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
	const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

	const ink = rgb(0.11, 0.1, 0.15);
	const muted = rgb(0.29, 0.27, 0.35);
	const rust = rgb(0.73, 0.3, 0.21);
	const teal = rgb(0.13, 0.36, 0.41);
	const paper = rgb(0.983, 0.962, 0.91);

	page.drawRectangle({ x: 0, y: 0, width, height, color: paper });

	let y = height - margin;

	page.drawText("Helena's Learner Profile", { x: margin, y, font: serifBold, size: 22, color: ink });
	y -= 26;
	page.drawText(
		`A learning exploration summary for ${childName} · ${new Date(run.taken_at).toLocaleDateString()}`,
		{ x: margin, y, font: serifItalic, size: 11, color: muted }
	);
	y -= 28;

	page.drawLine({
		start: { x: margin, y },
		end: { x: width - margin, y },
		thickness: 0.6,
		color: muted
	});
	y -= 24;

	page.drawText('Learning preferences', { x: margin, y, font: serifBold, size: 14, color: rust });
	y -= 18;
	for (const mode of PREF_MODES) {
		const pct = run.scores.preferences[mode] ?? 0;
		page.drawText(PREF_LABEL[mode], { x: margin, y, font: serif, size: 11, color: ink });
		const barX = margin + 110;
		const barW = 280;
		page.drawRectangle({ x: barX, y: y - 2, width: barW, height: 7, color: rgb(0.92, 0.88, 0.8) });
		page.drawRectangle({
			x: barX,
			y: y - 2,
			width: (barW * pct) / 100,
			height: 7,
			color: rust
		});
		page.drawText(`${pct}%`, {
			x: barX + barW + 8,
			y,
			font: serifBold,
			size: 11,
			color: ink
		});
		y -= 18;
	}
	y -= 6;

	page.drawText('Areas worth watching', {
		x: margin,
		y,
		font: serifBold,
		size: 14,
		color: teal
	});
	y -= 18;
	for (const d of DOMAINS) {
		const score = run.scores.screening[d];
		const dot =
			score.level === 'high'
				? '●'
				: score.level === 'medium'
					? '◐'
					: '○';
		const note = score.needs_corroboration ? ' (needs parent corroboration)' : '';
		page.drawText(`${dot}  ${DOMAIN_LABEL[d]} — ${score.level}${note}`, {
			x: margin,
			y,
			font: serif,
			size: 11,
			color: ink
		});
		y -= 16;
	}
	y -= 8;

	page.drawText('Strengths spotlight', {
		x: margin,
		y,
		font: serifBold,
		size: 14,
		color: rust
	});
	y -= 18;
	if (run.scores.strengths_spotlight.length === 0) {
		page.drawText('No strengths selected as "sounds like me" yet.', {
			x: margin,
			y,
			font: serifItalic,
			size: 11,
			color: muted
		});
		y -= 16;
	} else {
		for (const id of run.scores.strengths_spotlight) {
			const item = STRENGTHS_ITEMS.find((s) => s.id === id);
			const affirmation = STRENGTHS_AFFIRMATIONS[id] ?? '';
			if (item) {
				page.drawText(`• ${item.prompt}`, {
					x: margin,
					y,
					font: serifBold,
					size: 11,
					color: ink
				});
				y -= 14;
				for (const line of wrapLines(affirmation, 95)) {
					page.drawText(line, {
						x: margin + 12,
						y,
						font: serif,
						size: 10.5,
						color: muted
					});
					y -= 13;
				}
				y -= 4;
			}
		}
	}
	y -= 4;

	page.drawText('Recommended next step', {
		x: margin,
		y,
		font: serifBold,
		size: 14,
		color: teal
	});
	y -= 18;
	page.drawText(PLAN_HEADLINE[run.scores.plan], {
		x: margin,
		y,
		font: serif,
		size: 12,
		color: ink
	});
	y -= 22;

	page.drawLine({
		start: { x: margin, y },
		end: { x: width - margin, y },
		thickness: 0.6,
		color: muted
	});
	y -= 16;

	const disclaimerLines = wrapLines(
		'This is an informal exploration tool, not a diagnosis. It cannot identify learning disabilities. If results suggest a closer look, talk with her teacher and pediatrician.',
		90
	);
	for (const line of disclaimerLines) {
		page.drawText(line, { x: margin, y, font: serifItalic, size: 10, color: muted });
		y -= 13;
	}

	const bytes = await doc.save();
	return new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' });
}
