import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';
import { JOINPOINT_API_BASE_URL, joinpointResourceLocator } from './shared';

const RESOURCE = 'structure';
const showOnlyForThisResource = { resource: [RESOURCE] };

export const structureDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForThisResource },
		options: [
			{
				name: 'List Directories',
				value: 'listDirectories',
				action: 'List directories',
				description: 'List all pipelines, archives and lists in the Joinpoints account',
			},
			{
				name: 'Get Template Meta',
				value: 'getTemplateMeta',
				action: 'Get template metadata',
				description:
					'Get metadata of a template, including its attributes (internal names, data types, required flags)',
			},
		],
		default: 'listDirectories',
	},
	{
		displayName:
			'Use this resource to discover valid values for other operations: List Directories shows each ' +
			"directory's template-id, and Get Template Meta lists a template's attributes (their exact " +
			"internal_name, e.g. for Change -> Update's Field Name) instead of guessing them.",
		name: 'structureNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: showOnlyForThisResource },
	},
	joinpointResourceLocator({
		name: 'templateId',
		displayName: 'Template',
		resource: RESOURCE,
		operation: ['getTemplateMeta'],
		required: false,
		description: 'The template to get metadata for (optional)',
	}),
	joinpointResourceLocator({
		name: 'source',
		displayName: 'Source',
		resource: RESOURCE,
		operation: ['getTemplateMeta'],
		required: false,
		description: 'A pipeline or list to get the template metadata for (optional)',
	}),
];

export async function executeStructure(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	accessToken: string,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'listDirectories') {
		const response = (await this.helpers.httpRequest({
			method: 'GET',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/listDirectories',
			qs: { access_token: accessToken },
			json: true,
		})) as IDataObject;

		// The live API nests the array under data.result, unlike the swagger doc (which documents
		// data as the array directly) - matches the shape used by /list, /listFull, /search.
		return (((response.data as IDataObject)?.result as IDataObject[]) ?? []) as IDataObject[];
	}

	if (operation === 'getTemplateMeta') {
		const templateId = this.getNodeParameter(
			'templateId',
			i,
			{ mode: 'id', value: '' },
			{ extractValue: true },
		) as string;
		const source = this.getNodeParameter('source', i, { mode: 'id', value: '' }, { extractValue: true }) as string;

		const qs: IDataObject = { access_token: accessToken };
		if (templateId) qs.template_id = templateId;
		if (source) qs.source = source;

		return (await this.helpers.httpRequest({
			method: 'GET',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/getJoinpointTemplateMeta',
			qs,
			json: true,
		})) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "Structure"`);
}
