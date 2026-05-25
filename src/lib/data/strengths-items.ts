import type { StrengthsItem } from '$lib/types';

export const STRENGTHS_ITEMS: StrengthsItem[] = [
	{ id: 'st-1', prompt: 'I notice patterns that other people miss.' },
	{ id: 'st-2', prompt: 'I can stick with a tricky problem until I figure it out.' },
	{ id: 'st-3', prompt: 'I come up with ideas that other kids think are cool.' },
	{ id: 'st-4', prompt: 'I am good at explaining things to other people.' },
	{ id: 'st-5', prompt: 'I feel proud when I figure out something hard on my own.' },
	{ id: 'st-6', prompt: 'I am curious about how things work.' }
];

export const STRENGTHS_AFFIRMATIONS: Record<string, string> = {
	'st-1': 'You spot patterns. That is a real superpower in math, science, music, and writing.',
	'st-2': 'You stick with hard things. Persistence is one of the most powerful learning skills.',
	'st-3': 'You think creatively. Original ideas are how the world gets better.',
	'st-4': 'You can explain things. Teaching others is the deepest way to know something.',
	'st-5':
		'You take pride in your own effort. That sense of "I did this myself" fuels every future challenge.',
	'st-6': 'You are curious. Curious kids learn the most over a lifetime, not just one test.'
};
