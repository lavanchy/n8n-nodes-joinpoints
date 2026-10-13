import type { IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { executeGetStatistic } from './getStatistic';

function makeContext(opts: { joinpointId: string; httpRequest: ReturnType<typeof vi.fn> }) {
	return {
		getNodeParameter: vi.fn().mockReturnValue(opts.joinpointId),
		getNode: () => ({ name: 'Joinpoints' }),
		helpers: { httpRequest: opts.httpRequest },
	} as unknown as IExecuteFunctions;
}

describe('executeGetStatistic', () => {
	it('requests statistics for the given joinpoint on the "get" operation', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ amount: 3 });
		const context = makeContext({ joinpointId: '52', httpRequest });

		const result = await executeGetStatistic.call(context, 'get', 0, 'token-123');

		expect(result).toEqual({ amount: 3 });
		expect(httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: '/getJoinpointStatistic',
				qs: { access_token: 'token-123', joinpoint_id: '52' },
			}),
		);
	});

	it('throws on an unknown operation', async () => {
		const context = makeContext({ joinpointId: '52', httpRequest: vi.fn() });

		await expect(executeGetStatistic.call(context, 'bogus', 0, 'token-123')).rejects.toThrow(
			'Unknown operation "bogus" for resource "Get Statistic"',
		);
	});
});
