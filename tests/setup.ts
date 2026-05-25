import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof globalThis.crypto === 'undefined') {
	const { webcrypto } = await import('node:crypto');
	Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
	Object.defineProperty(window, 'speechSynthesis', {
		value: { speak: vi.fn(), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(), getVoices: () => [] }
	});
}
