import type { PreferencesItem } from '$lib/types';

export const PREFERENCES_ITEMS: PreferencesItem[] = [
	{
		id: 'p1-lego',
		prompt: 'You want to build a tricky LEGO set. You would rather…',
		multiSelect: false,
		options: [
			{ tag: 'visual', text: 'Look at the pictures and diagrams.' },
			{ tag: 'auditory', text: 'Have someone explain it step-by-step out loud.' },
			{ tag: 'read_write', text: 'Read the booklet front to back first.' },
			{ tag: 'kinesthetic', text: 'Just start building and figure it out by doing.' }
		]
	},
	{
		id: 'p2-states',
		prompt: 'You have to learn the names of all 50 states. The easiest way for you is…',
		multiSelect: false,
		options: [
			{ tag: 'visual', text: 'A map you can color in and look at.' },
			{ tag: 'auditory', text: 'A song that names every state.' },
			{ tag: 'read_write', text: 'A list you can read and rewrite a few times.' },
			{ tag: 'kinesthetic', text: 'A puzzle where you put each state in its place.' }
		]
	},
	{
		id: 'p3-story',
		prompt: 'A grown-up just told a long story. The thing that helps you remember it best is…',
		multiSelect: true,
		options: [
			{ tag: 'visual', text: 'Picturing the scenes in your head like a movie.' },
			{ tag: 'auditory', text: 'Saying the story back out loud.' },
			{ tag: 'read_write', text: 'Writing down the main parts.' },
			{ tag: 'kinesthetic', text: 'Acting out what happened.' }
		]
	},
	{
		id: 'p4-recipe',
		prompt: 'You are making pancakes for the first time. You would rather…',
		multiSelect: false,
		options: [
			{ tag: 'visual', text: 'Watch a quick video of someone doing it.' },
			{ tag: 'auditory', text: 'Have a grown-up tell you each step.' },
			{ tag: 'read_write', text: 'Read the recipe yourself.' },
			{ tag: 'kinesthetic', text: 'Get your hands in there and try it.' }
		]
	},
	{
		id: 'p5-game',
		prompt: 'A friend wants to teach you a new board game. The best way for you to learn is…',
		multiSelect: false,
		options: [
			{ tag: 'visual', text: 'Watch them play one round first.' },
			{ tag: 'auditory', text: 'Have them explain the rules.' },
			{ tag: 'read_write', text: 'Read the rule booklet.' },
			{ tag: 'kinesthetic', text: 'Jump in and learn as you play.' }
		]
	},
	{
		id: 'p6-spelling',
		prompt: 'When you are learning a hard new word, what helps it stick?',
		multiSelect: true,
		options: [
			{ tag: 'visual', text: 'Seeing the word in big letters.' },
			{ tag: 'auditory', text: 'Saying the word out loud a few times.' },
			{ tag: 'read_write', text: 'Writing it out a few times.' },
			{ tag: 'kinesthetic', text: 'Tracing the letters in the air or on your hand.' }
		]
	},
	{
		id: 'p7-instructions',
		prompt: 'A teacher just gave the class instructions. To make sure you got it, you would…',
		multiSelect: false,
		options: [
			{ tag: 'visual', text: 'Look at the example on the board.' },
			{ tag: 'auditory', text: 'Ask the teacher to say it again.' },
			{ tag: 'read_write', text: 'Read it from the handout.' },
			{ tag: 'kinesthetic', text: 'Just start and see if it feels right.' }
		]
	},
	{
		id: 'p8-explainer',
		prompt: 'You finally understand something tricky in math. To show a friend how to do it, you would…',
		multiSelect: false,
		options: [
			{ tag: 'visual', text: 'Draw a picture of it.' },
			{ tag: 'auditory', text: 'Explain it out loud.' },
			{ tag: 'read_write', text: 'Write down the steps in order.' },
			{ tag: 'kinesthetic', text: 'Use blocks or your fingers to show it.' }
		]
	},
	{
		id: 'p9-trip',
		prompt: 'You are visiting a new city. To get to know it, you would rather…',
		multiSelect: true,
		options: [
			{ tag: 'visual', text: 'Look at maps and pictures.' },
			{ tag: 'auditory', text: 'Have someone tell you fun stories about it.' },
			{ tag: 'read_write', text: 'Read about the cool places.' },
			{ tag: 'kinesthetic', text: 'Walk around and explore.' }
		]
	},
	{
		id: 'p10-quiet',
		prompt: 'When you have to think really hard, what helps the most?',
		multiSelect: false,
		options: [
			{ tag: 'visual', text: 'A clean space with nothing visually busy around me.' },
			{ tag: 'auditory', text: 'Music or background noise.' },
			{ tag: 'read_write', text: 'A notebook to write thoughts down.' },
			{ tag: 'kinesthetic', text: 'Being able to move, fidget, or stand up.' }
		]
	}
];
