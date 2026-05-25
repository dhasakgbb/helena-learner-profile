import type { ScreeningItem } from '$lib/types';

export const SCREENING_ITEMS: ScreeningItem[] = [
	{
		id: 's-read-1',
		domain: 'reading',
		kidPrompt: 'I have to read a sentence more than once to understand it.',
		parentPrompt: 'She has to re-read a sentence to understand it.'
	},
	{
		id: 's-read-2',
		domain: 'reading',
		kidPrompt: 'Sounding out a long new word feels hard, even when I try.',
		parentPrompt: 'Decoding a long unfamiliar word is a struggle for her.'
	},
	{
		id: 's-read-3',
		domain: 'reading',
		kidPrompt: 'I try to avoid reading for fun.',
		parentPrompt: 'She avoids reading for pleasure.'
	},

	{
		id: 's-write-1',
		domain: 'writing',
		kidPrompt: 'When I write, my ideas come out faster than I can put them on the page.',
		parentPrompt: 'Her ideas seem to come faster than she can write them down.'
	},
	{
		id: 's-write-2',
		domain: 'writing',
		kidPrompt: 'My handwriting is hard for other people to read.',
		parentPrompt: 'Her handwriting is difficult for others to read.'
	},
	{
		id: 's-write-3',
		domain: 'writing',
		kidPrompt: 'I mix up letters like b and d, or p and q, when I write.',
		parentPrompt: 'She reverses letters like b/d or p/q in her writing.'
	},

	{
		id: 's-math-1',
		domain: 'math',
		kidPrompt: 'I mix up the steps in word problems.',
		parentPrompt: 'She gets the steps of word problems out of order.'
	},
	{
		id: 's-math-2',
		domain: 'math',
		kidPrompt: 'Remembering times tables is hard, even after lots of practice.',
		parentPrompt: 'Times-table recall is hard for her, even with repeated practice.'
	},
	{
		id: 's-math-3',
		domain: 'math',
		kidPrompt: 'I lose track of where I am in a math problem and have to start over.',
		parentPrompt: 'She loses her place in a math problem and has to restart.'
	},

	{
		id: 's-attn-1',
		domain: 'attention',
		kidPrompt: 'I lose my place when I am working on something for a long time.',
		parentPrompt: 'She loses focus on sustained tasks and gets off-track.'
	},
	{
		id: 's-attn-2',
		domain: 'attention',
		kidPrompt: 'Starting a big project feels overwhelming, so I put it off.',
		parentPrompt: 'She procrastinates on big projects because starting feels overwhelming.'
	},
	{
		id: 's-attn-3',
		domain: 'attention',
		kidPrompt: 'I forget what I was doing if someone interrupts me.',
		parentPrompt: 'An interruption causes her to forget what she was doing.'
	}
];
