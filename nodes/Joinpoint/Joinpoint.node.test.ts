import type { IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { withRequestTimeout } from './Joinpoint.node';

describe('withRequestTimeout', () => {
	it('adds the timeout to requests that do not set their own and delegates everything else', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ ok: true });
		const getNodeParameter = vi.fn().mockReturnValue('x');
		const context = {
			helpers: { httpRequest, other: vi.fn().mockReturnValue(5) },
			getNodeParameter,
		} as unknown as IExecuteFunctions;

		const wrapped = withRequestTimeout(context, 20000);
		await wrapped.helpers.httpRequest({ url: '/create' });
		await wrapped.helpers.httpRequest({ url: '/post', timeout: 1000 });

		expect(httpRequest).toHaveBeenNthCalledWith(1, { url: '/create', timeout: 20000 });
		expect(httpRequest).toHaveBeenNthCalledWith(2, { url: '/post', timeout: 1000 });
		expect(wrapped.getNodeParameter('a', 0)).toBe('x');
		expect((wrapped.helpers as unknown as { other: () => number }).other()).toBe(5);
	});
});
