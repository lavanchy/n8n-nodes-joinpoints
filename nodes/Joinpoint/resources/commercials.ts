import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';
import { JOINPOINT_API_BASE_URL, joinpointResourceLocator } from './shared';

const RESOURCE = 'commercials';
const showOnlyForThisResource = { resource: [RESOURCE] };

export const commercialsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForThisResource },
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List commercial documents',
				description: 'List commercial documents like invoices and offers',
			},
		],
		default: 'list',
	},
	joinpointResourceLocator({
		name: 'joinpointId',
		displayName: 'Joinpoint',
		resource: RESOURCE,
		operation: ['list'],
		required: false,
		description: 'Only return commercial documents of this joinpoint (optional)',
	}),
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: '',
		description: 'Only return documents of this type (optional)',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['list'] } },
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Invoice', value: 'invoice' },
			{ name: 'Offer', value: 'offer' },
		],
	},
	{
		displayName: 'From',
		name: 'from',
		type: 'dateTime',
		default: '',
		description: 'Only return documents dated on or after this date',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['list'] } },
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'dateTime',
		default: '',
		description: 'Only return documents dated on or before this date',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['list'] } },
	},
];

export async function executeCommercials(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	accessToken: string,
): Promise<IDataObject> {
	if (operation === 'list') {
		const joinpointId = this.getNodeParameter(
			'joinpointId',
			i,
			{ mode: 'id', value: '' },
			{ extractValue: true },
		) as string;
		const type = this.getNodeParameter('type', i, '') as string;
		const from = this.getNodeParameter('from', i, '') as string;
		const to = this.getNodeParameter('to', i, '') as string;

		const qs: IDataObject = { access_token: accessToken };
		if (joinpointId) qs.joinpoint_id = joinpointId;
		if (type) qs.type = type;
		// API accepts 'yyyy-mm-dd hh:MM' or a millisecond timestamp; epoch ms sidesteps string-format ambiguity.
		if (from) qs.from = new Date(from).getTime();
		if (to) qs.to = new Date(to).getTime();

		return (await this.helpers.httpRequest({
			method: 'GET',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/listCommercialDocs',
			qs,
			json: true,
		})) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "Commercials"`);
}
