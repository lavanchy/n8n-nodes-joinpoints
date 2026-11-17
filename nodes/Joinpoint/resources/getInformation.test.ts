import type { IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { executeGetInformation } from './getInformation';

function makeContext(params: Record<string, unknown>, httpRequest: ReturnType<typeof vi.fn>) {
	return {
		getNodeParameter: vi.fn((name: string, _i: number, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		),
		getNode: () => ({ name: 'Joinpoints' }),
		helpers: { httpRequest },
	} as unknown as IExecuteFunctions;
}

describe('executeGetInformation - listFull custom filters', () => {
	it('sends an equals filter using the full internal_name', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ data: { result: [] } });
		const context = makeContext(
			{
				type: '',
				additionalFields: {},
				source: '',
				'customFilters.filter': [{ filterName: 'c_115', operator: 'equals', value: '2026-11-11' }],
			},
			httpRequest,
		);

		await executeGetInformation.call(context, 'listFull', 0, 'token-123');

		expect(httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/listFull',
				qs: expect.objectContaining({ _fc_c_115: '2026-11-11' }),
			}),
		);
	});

	it('strips the c_ prefix and appends _min for the Min operator', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ data: { result: [] } });
		const context = makeContext(
			{
				type: '',
				additionalFields: {},
				source: '',
				'customFilters.filter': [{ filterName: 'c_115', operator: 'min', value: '2026-11-11' }],
			},
			httpRequest,
		);

		await executeGetInformation.call(context, 'listFull', 0, 'token-123');

		expect(httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				qs: expect.objectContaining({ _fc_115_min: '2026-11-11' }),
			}),
		);
		const qs = httpRequest.mock.calls[0][0].qs;
		expect(qs).not.toHaveProperty('_fc_c_115_min');
	});

	it('appends _max for the Max operator without a c_ prefix to strip', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ data: { result: [] } });
		const context = makeContext(
			{
				type: '',
				additionalFields: {},
				source: '',
				'customFilters.filter': [{ filterName: '115', operator: 'max', value: '2026-11-11' }],
			},
			httpRequest,
		);

		await executeGetInformation.call(context, 'listFull', 0, 'token-123');

		expect(httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				qs: expect.objectContaining({ _fc_115_max: '2026-11-11' }),
			}),
		);
	});
});
