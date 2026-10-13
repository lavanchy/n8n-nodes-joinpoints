import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';
import { JOINPOINT_API_BASE_URL, getResourceLocatorId, joinpointResourceLocator } from './shared';

const RESOURCE = 'getStatistic';
const showOnlyForThisResource = { resource: [RESOURCE] };

export const getStatisticDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForThisResource },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get joinpoint statistics',
				description: 'Return runtime statistics of a joinpoint',
			},
		],
		default: 'get',
	},
	joinpointResourceLocator({
		name: 'joinpointId',
		displayName: 'Joinpoint',
		resource: RESOURCE,
		operation: ['get'],
		description: 'The joinpoint to get runtime statistics for',
	}),
];

export async function executeGetStatistic(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	accessToken: string,
): Promise<IDataObject> {
	if (operation === 'get') {
		const joinpointId = getResourceLocatorId.call(this, 'joinpointId', i);

		return (await this.helpers.httpRequest({
			method: 'GET',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/getJoinpointStatistic',
			qs: { access_token: accessToken, joinpoint_id: joinpointId },
			json: true,
		})) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "Get Statistic"`);
}
