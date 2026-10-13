import type { IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { getResourceLocatorId, joinpointResourceLocator } from './shared';

describe('getResourceLocatorId', () => {
	it('extracts the resolved value of a resourceLocator parameter', () => {
		const getNodeParameter = vi.fn().mockReturnValue('52');
		const context = { getNodeParameter } as unknown as IExecuteFunctions;

		const result = getResourceLocatorId.call(context, 'joinpointId', 0);

		expect(result).toBe('52');
		expect(getNodeParameter).toHaveBeenCalledWith('joinpointId', 0, undefined, { extractValue: true });
	});
});

describe('joinpointResourceLocator', () => {
	it('builds a field scoped to the given resource and operations, defaulting to ID mode', () => {
		const field = joinpointResourceLocator({
			name: 'joinpointId',
			displayName: 'Joinpoint',
			resource: 'getInformation',
			operation: ['get', 'getAllDetails'],
		});

		expect(field.type).toBe('resourceLocator');
		expect(field.default).toEqual({ mode: 'id', value: '' });
		expect(field.displayOptions).toEqual({
			show: { resource: ['getInformation'], operation: ['get', 'getAllDetails'] },
		});
	});
});
