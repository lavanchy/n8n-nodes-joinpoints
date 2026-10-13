import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

/*
 * Joinpoint issues short-lived access tokens (valid ~1h) via
 * `GET /api/oauth/auth?app_id=...&grant_type=implicit&access_key=...&secret=...`
 * (docs: https://app.joinpoints.io/res/swagger/joinpoint-auth-api-1.json).
 * There is no `authenticate` block here on purpose: the Joinpoint node fetches
 * a fresh token itself at the start of each run (see
 * nodes/Joinpoint/GenericFunctions.ts) rather than having one injected into
 * every request the way a static API key would be.
 */
export class JoinpointApi implements ICredentialType {
	name = 'joinpointApi';
	displayName = 'Joinpoints API';
	documentationUrl = 'https://app.joinpoints.io/res/swagger/joinpoint-auth-api-1.json';
	icon = 'file:../nodes/Joinpoint/joinpoint.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			description: 'Joinpoint application ID',
		},
		{
			displayName: 'Access Key',
			name: 'accessKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Secret',
			name: 'secret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.joinpoints.io',
			url: '/api/oauth/auth',
			method: 'GET',
			qs: {
				app_id: '={{$credentials.appId}}',
				grant_type: 'implicit',
				access_key: '={{$credentials.accessKey}}',
				secret: '={{$credentials.secret}}',
			},
		},
	};
}
