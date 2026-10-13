import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

// Shared by execute() (once per run) and the searchJoinpoints listSearch
// method (resourceLocator dropdowns), which only gets an ILoadOptionsFunctions
// context. Both interfaces expose the members used below (getCredentials,
// helpers.httpRequest, getNode).
type JoinpointAuthContext = IExecuteFunctions | ILoadOptionsFunctions;

const AUTH_URL = 'https://app.joinpoints.io/api/oauth/auth';

export interface JoinpointApiCredentials {
	appId: string;
	accessKey: string;
	secret: string;
}

/**
 * Fetches a fresh Joinpoint access token for the Joinpoints API credential.
 * Tokens are valid for about 1h; this node fetches one per execution/call and
 * does not persist it anywhere, so every run gets its own fresh token.
 */
export async function fetchJoinpointAccessToken(this: JoinpointAuthContext): Promise<string> {
	const credentials = (await this.getCredentials('joinpointApi')) as unknown as JoinpointApiCredentials;

	// This *is* the request that turns the credential's App ID/Access Key/Secret
	// into a token, so there's nothing for httpRequestWithAuthentication to add
	// here (the credential has no `authenticate` block on purpose, see
	// credentials/JoinpointApi.credentials.ts).
	// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
	const response = (await this.helpers.httpRequest({
		method: 'GET',
		url: AUTH_URL,
		qs: {
			app_id: credentials.appId,
			grant_type: 'implicit',
			access_key: credentials.accessKey,
			secret: credentials.secret,
		},
		json: true,
	})) as { data?: { access_token?: string } };

	if (!response.data?.access_token) {
		throw new NodeOperationError(this.getNode(), 'Joinpoint did not return an access token', {
			description: 'Double-check the App ID, Access Key, and Secret in the Joinpoints API credential',
		});
	}

	return response.data.access_token;
}
