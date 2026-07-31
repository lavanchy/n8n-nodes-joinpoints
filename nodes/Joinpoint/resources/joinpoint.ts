import type { INodeProperties } from 'n8n-workflow';

const showOnlyForJoinpoint = {
	resource: ['joinpoint'],
};

export const joinpointDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForJoinpoint,
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a joinpoint',
				description: 'Return basic details of a Joinpoint',
				routing: {
					request: {
						method: 'GET',
						url: '/get',
					},
				},
			},
			{
				name: 'Get Statistic',
				value: 'getStatistic',
				action: 'Get joinpoint statistic',
				description: 'Return runtime statistics of a Joinpoint',
				routing: {
					request: {
						method: 'GET',
						url: '/getJoinpointStatistic',
					},
				},
			},
			{
				name: 'List',
				value: 'list',
				action: 'List joinpoints',
				description: 'List joinpoints filtered by the optional set parameters',
				routing: {
					request: {
						method: 'GET',
						url: '/list',
					},
				},
			},
		],
		default: 'get',
	},
	{
		displayName: 'Access Token',
		name: 'accessToken',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		description: 'Token from the auth subworkflow (do not fetch directly from /auth, valid for 1h)',
		displayOptions: {
			show: showOnlyForJoinpoint,
		},
		routing: {
			request: {
				qs: {
					access_token: '={{$value}}',
				},
			},
		},
	},
	{
		displayName: 'Joinpoint ID',
		name: 'joinpointId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				...showOnlyForJoinpoint,
				operation: ['get', 'getStatistic'],
			},
		},
		routing: {
			request: {
				qs: {
					joinpoint_id: '={{$value}}',
				},
			},
		},
	},
	{
		displayName: 'Source',
		name: 'source',
		type: 'string',
		default: '',
		description: 'Return all children joinpoints of the source joinpoint ID',
		displayOptions: {
			show: {
				...showOnlyForJoinpoint,
				operation: ['list'],
			},
		},
		routing: {
			request: {
				qs: {
					source: '={{$value}}',
				},
			},
		},
	},
];