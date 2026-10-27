import type { IExecuteFunctions, INode } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { fetchJoinpointAccessToken } from './GenericFunctions';

const FAKE_NODE = { name: 'Joinpoints', type: 'CUSTOM.joinpoint' } as INode;
const FAKE_CREDENTIALS = { appId: 'app-1', accessKey: 'key-1', secret: 'secret-1' };

function makeContext(httpRequest: ReturnType<typeof vi.fn>) {
	return {
		getCredentials: vi.fn().mockResolvedValue(FAKE_CREDENTIALS),
		getNode: () => FAKE_NODE,
		helpers: { httpRequest },
	} as unknown as IExecuteFunctions;
}

describe('fetchJoinpointAccessToken', () => {
	it('requests a token with the credential values and returns it', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ data: { access_token: 'token-123' } });
		const context = makeContext(httpRequest);

		const token = await fetchJoinpointAccessToken.call(context);

		expect(token).toBe('token-123');
		expect(httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: 'https://app.joinpoints.io/api/oauth/auth',
				qs: {
					app_id: FAKE_CREDENTIALS.appId,
					grant_type: 'implicit',
					access_key: FAKE_CREDENTIALS.accessKey,
					secret: FAKE_CREDENTIALS.secret,
				},
			}),
		);
	});

	it('throws when Joinpoints does not return an access token', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ data: {} });
		const context = makeContext(httpRequest);

		await expect(fetchJoinpointAccessToken.call(context)).rejects.toThrow(
			'Joinpoints did not return an access token',
		);
	});
});
