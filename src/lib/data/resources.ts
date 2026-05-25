import type { Domain, PrefMode } from '$lib/types';

export type ResourceCard = {
	id: string;
	title: string;
	body: string;
	link?: { label: string; href: string };
};

export const PREFERENCE_STRATEGIES: Record<PrefMode, ResourceCard[]> = {
	visual: [
		{
			id: 'v-1',
			title: 'Turn it into a picture',
			body: 'When something is confusing, sketch it. Stick figures, arrows, and bubbles count. Drawing the problem is half of solving it.'
		},
		{
			id: 'v-2',
			title: 'Color-code your notes',
			body: 'Use one color for definitions, another for examples, a third for questions. Your brain spots the colors before it reads the words.'
		}
	],
	auditory: [
		{
			id: 'a-1',
			title: 'Teach the wall',
			body: 'Say what you are learning out loud, like you are teaching it to a wall. If you can explain it, you know it.'
		},
		{
			id: 'a-2',
			title: 'Make it a song',
			body: 'Rhymes and tunes stick way longer than lists. Set what you need to remember to a melody you already know.'
		}
	],
	read_write: [
		{
			id: 'r-1',
			title: 'Rewrite, do not just reread',
			body: 'Reading a page twice is much less powerful than rewriting it once in your own words.'
		},
		{
			id: 'r-2',
			title: 'Question journal',
			body: 'Keep a small notebook just for questions that pop up. Writing the question helps you spot the answer when it appears.'
		}
	],
	kinesthetic: [
		{
			id: 'k-1',
			title: 'Move while you learn',
			body: 'Pace, stand, fidget. Many brains think better when the body has something low-key to do.'
		},
		{
			id: 'k-2',
			title: 'Build it',
			body: 'Use blocks, paper, hands, or your own body to act out what you are trying to learn.'
		}
	]
};

export const DOMAIN_STRATEGIES: Record<Domain, ResourceCard[]> = {
	reading: [
		{
			id: 'rd-1',
			title: 'Audio plus eyes',
			body: 'Try listening to a book while following along in the text. The two channels reinforce each other.',
			link: { label: 'Learning Ally for kids', href: 'https://learningally.org/Students-Parents' }
		},
		{
			id: 'rd-2',
			title: 'Decodable text bridge',
			body: 'Short books written with sounds she already knows can rebuild confidence. Ask the school librarian about decodable readers.'
		}
	],
	writing: [
		{
			id: 'wr-1',
			title: 'Talk-then-write',
			body: 'Let her say her ideas out loud (or into a recorder) before writing. Getting the idea out first separates "knowing it" from "writing it."'
		},
		{
			id: 'wr-2',
			title: 'Lined paper plus a finger guide',
			body: 'Wider lines and a finger as a guide reduce the load while letter formation is still developing.'
		}
	],
	math: [
		{
			id: 'mt-1',
			title: 'Concrete first, symbols later',
			body: 'Use coins, blocks, or drawings before jumping to numbers. The number "12" is meaningless until you can see what 12 of something looks like.'
		},
		{
			id: 'mt-2',
			title: 'Times tables as patterns',
			body: 'Stop drilling random rows. Learn the patterns: 5s, 10s, 9s, doubles. Each pattern unlocks a chunk of the grid.'
		}
	],
	attention: [
		{
			id: 'at-1',
			title: 'Shorter sprints',
			body: 'A 12-minute focused chunk with a 3-minute break beats a 60-minute slog. Use a visible timer.'
		},
		{
			id: 'at-2',
			title: 'One thing at a time',
			body: 'Clear the desk of everything except the one task. Visible stuff steals attention even when she is not looking at it.'
		}
	]
};

export const PROFESSIONAL_HELP_LINKS: ResourceCard[] = [
	{
		id: 'help-ida',
		title: 'International Dyslexia Association',
		body: 'Plain-language fact sheets, screening tools, and a directory of trained tutors.',
		link: { label: 'dyslexiaida.org', href: 'https://dyslexiaida.org/fact-sheets/' }
	},
	{
		id: 'help-understood',
		title: 'Understood.org',
		body: 'Family-friendly explanations of learning differences, ADHD, and how to ask the school for support.',
		link: { label: 'understood.org', href: 'https://www.understood.org/' }
	},
	{
		id: 'help-cdc',
		title: 'CDC — Learn the Signs',
		body: 'Federal milestone information by age. Useful for ruling things in and out.',
		link: {
			label: 'cdc.gov/learn-the-signs',
			href: 'https://www.cdc.gov/ncbddd/actearly/index.html'
		}
	}
];
