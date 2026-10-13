import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';
import { JOINPOINT_API_BASE_URL, getResourceLocatorId, joinpointResourceLocator, joinpointResourceLocatorModes } from './shared';

const RESOURCE = 'getInformation';
const showOnlyForThisResource = { resource: [RESOURCE] };
const listOperations = ['list', 'listFull'];

const SEARCH_TYPE_OPTIONS = [
	{ name: 'Task', value: 'task' },
	{ name: 'Contact', value: 'contact' },
	{ name: 'Company', value: 'company' },
	{ name: 'Deal', value: 'deal' },
];

const additionalFieldsOptions: INodeProperties[] = [
	{ displayName: 'Created At Min', name: 'createdAtMin', type: 'dateTime', default: '', description: 'Only joinpoints created on or after this date' },
	{ displayName: 'Created At Max', name: 'createdAtMax', type: 'dateTime', default: '', description: 'Only joinpoints created on or before this date' },
	{ displayName: 'Priority Min', name: 'priorityMin', type: 'number', default: 0, description: 'Task joinpoints only' },
	{ displayName: 'Priority Max', name: 'priorityMax', type: 'number', default: 0, description: 'Task joinpoints only' },
	{
		displayName: 'Complexity Min',
		name: 'complexityMin',
		type: 'number',
		default: 0,
		description: 'Task joinpoints only',
	},
	{
		displayName: 'Complexity Max',
		name: 'complexityMax',
		type: 'number',
		default: 0,
		description: 'Task joinpoints only',
	},
	{
		displayName: 'Planned Start Min',
		name: 'planedStartMin',
		type: 'dateTime',
		default: '',
		description: 'Task joinpoints only',
	},
	{
		displayName: 'Planned Start Max',
		name: 'planedStartMax',
		type: 'dateTime',
		default: '',
		description: 'Task joinpoints only',
	},
	{ displayName: 'Deadline Min', name: 'deadlineMin', type: 'dateTime', default: '', description: 'Task joinpoints only' },
	{ displayName: 'Deadline Max', name: 'deadlineMax', type: 'dateTime', default: '', description: 'Task joinpoints only' },
	{ displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Task joinpoints only' },
	{ displayName: 'Amount Min', name: 'amountMin', type: 'string', default: '', description: 'Sales joinpoints only' },
	{ displayName: 'Amount Max', name: 'amountMax', type: 'string', default: '', description: 'Sales joinpoints only' },
	joinpointResourceLocatorModes('customer', 'Customer', 'Customerable joinpoints only'),
	joinpointResourceLocatorModes('currentProcessPhase', 'Current Process Phase', 'Filter by the joinpoint\'s current process phase'),
	{ displayName: 'Zip', name: 'zip', type: 'string', default: '', description: 'Company or contact joinpoints only' },
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: '',
		description: 'Company or contact joinpoints only',
	},
	{
		displayName: 'Last Contact Min',
		name: 'lastContactMin',
		type: 'dateTime',
		default: '',
		description: 'Company or contact joinpoints only',
	},
	{
		displayName: 'Last Contact Max',
		name: 'lastContactMax',
		type: 'dateTime',
		default: '',
		description: 'Company or contact joinpoints only',
	},
	{
		displayName: 'Next Contact Min',
		name: 'nextContactMin',
		type: 'dateTime',
		default: '',
		description: 'Company or contact joinpoints only',
	},
	{
		displayName: 'Next Contact Max',
		name: 'nextContactMax',
		type: 'dateTime',
		default: '',
		description: 'Company or contact joinpoints only',
	},
];

// qs key for each Additional Fields option, where it differs from a simple camelCase -> snake_case-ish rename.
const ADDITIONAL_FIELD_QS_KEYS: Record<string, string> = {
	createdAtMin: 'createdAt_min',
	createdAtMax: 'createdAt_max',
	priorityMin: 'priority_min',
	priorityMax: 'priority_max',
	complexityMin: 'complexity_min',
	complexityMax: 'complexity_max',
	planedStartMin: 'planedStart_min',
	planedStartMax: 'planedStart_max',
	deadlineMin: 'deadline_min',
	deadlineMax: 'deadline_max',
	status: 'status',
	amountMin: 'amount_min',
	amountMax: 'amount_max',
	customer: 'customer',
	currentProcessPhase: 'currentProcessPhase',
	zip: 'zip',
	country: 'country',
	lastContactMin: 'lastContact_min',
	lastContactMax: 'lastContact_max',
	nextContactMin: 'nextContact_min',
	nextContactMax: 'nextContact_max',
};

export const getInformationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForThisResource },
		options: [
			{ name: 'Get', value: 'get', action: 'Get a joinpoint', description: 'Return basic details of a joinpoint' },
			{
				name: 'Get All Details',
				value: 'getAllDetails',
				action: 'Get all details of a joinpoint',
				description: 'Return all details of a joinpoint',
			},
			{
				name: 'List',
				value: 'list',
				action: 'List joinpoints',
				description: 'List joinpoints with basic details, filtered by optional parameters',
			},
			{
				name: 'List Content',
				value: 'listContent',
				action: 'List joinpoint timeline content',
				description: 'Return all timeline entries of a joinpoint',
			},
			{
				name: 'List Full',
				value: 'listFull',
				action: 'List joinpoints with full details',
				description: 'List joinpoints filtered by optional parameters, with more details per joinpoint',
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search joinpoints',
				description: 'Search joinpoints by a query string in a given property',
			},
		],
		default: 'get',
	},

	// ---- Get / Get All Details / List Content ----
	joinpointResourceLocator({
		name: 'joinpointId',
		displayName: 'Joinpoint',
		resource: RESOURCE,
		operation: ['get', 'getAllDetails', 'listContent'],
		description: 'The joinpoint to get information about',
	}),

	// ---- Search ----
	{
		displayName: 'Property',
		name: 'property',
		type: 'string',
		required: true,
		default: 'title',
		description: 'Field to search in',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['search'] } },
	},
	{
		displayName: 'Query',
		name: 'q',
		type: 'string',
		required: true,
		default: '',
		description: 'Value to search for',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['search'] } },
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: '',
		description: 'Only search joinpoints of this type (optional)',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['search'] } },
		options: [{ name: 'Any', value: '' }, ...SEARCH_TYPE_OPTIONS],
	},
	{
		displayName: 'Start With Match',
		name: 'enableStartwith',
		type: 'boolean',
		default: false,
		description: 'Whether the value must start with the given query value, instead of matching anywhere',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['search'] } },
	},

	// ---- List / List Full ----
	joinpointResourceLocator({
		name: 'source',
		displayName: 'Source',
		resource: RESOURCE,
		operation: listOperations,
		required: false,
		description: 'Return all children joinpoints of this source joinpoint (optional)',
	}),
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: '',
		description: 'Only list joinpoints of this type (optional)',
		displayOptions: { show: { ...showOnlyForThisResource, operation: listOperations } },
		options: [{ name: 'Any', value: '' }, ...SEARCH_TYPE_OPTIONS],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional filters, most only relevant for specific joinpoint types (see each field)',
		displayOptions: { show: { ...showOnlyForThisResource, operation: listOperations } },
		options: additionalFieldsOptions,
	},
	{
		displayName: 'Custom Filters',
		name: 'customFilters',
		type: 'fixedCollection',
		placeholder: 'Add Filter',
		default: {},
		typeOptions: { multipleValues: true },
		description: "Filter by custom attributes, e.g. 'test_attribute_1' filters on '_fc_test_attribute_1'",
		displayOptions: { show: { ...showOnlyForThisResource, operation: listOperations } },
		options: [
			{
				name: 'filter',
				displayName: 'Filter',
				values: [
					{ displayName: 'Filter Name', name: 'filterName', type: 'string', default: '' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	},
];

export async function executeGetInformation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	accessToken: string,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get' || operation === 'getAllDetails' || operation === 'listContent') {
		const joinpointId = getResourceLocatorId.call(this, 'joinpointId', i);

		return (await this.helpers.httpRequest({
			method: 'GET',
			baseURL: JOINPOINT_API_BASE_URL,
			url: operation === 'get' ? '/get' : operation === 'getAllDetails' ? '/getV2' : '/listContent',
			qs: { access_token: accessToken, joinpoint_id: joinpointId },
			json: true,
		})) as IDataObject;
	}

	if (operation === 'search') {
		const property = this.getNodeParameter('property', i) as string;
		const q = this.getNodeParameter('q', i) as string;
		const type = this.getNodeParameter('type', i, '') as string;
		const enableStartwith = this.getNodeParameter('enableStartwith', i, false) as boolean;

		const qs: IDataObject = { access_token: accessToken, property, q };
		if (type) qs.type = type;
		if (enableStartwith) qs.enable_startwith = true;

		const response = (await this.helpers.httpRequest({
			method: 'GET',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/search',
			qs,
			json: true,
		})) as IDataObject;

		return ((response.data as IDataObject)?.result as IDataObject[]) ?? [];
	}

	if (operation === 'list' || operation === 'listFull') {
		const type = this.getNodeParameter('type', i, '') as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const customFilterRows = this.getNodeParameter('customFilters.filter', i, []) as Array<{
			filterName: string;
			value: string;
		}>;

		const qs: IDataObject = { access_token: accessToken };
		const source = this.getNodeParameter('source', i, { mode: 'id', value: '' }, { extractValue: true }) as string;
		if (source) qs.source = source;
		if (type) qs.type = type;

		for (const [key, value] of Object.entries(additionalFields)) {
			if (value === '' || value === undefined || value === null) continue;
			const qsKey = ADDITIONAL_FIELD_QS_KEYS[key] ?? key;
			if (key === 'customer' || key === 'currentProcessPhase') {
				const extracted = this.getNodeParameter(
					`additionalFields.${key}`,
					i,
					{ mode: 'id', value: '' },
					{ extractValue: true },
				) as string;
				if (extracted) qs[qsKey] = extracted;
			} else {
				qs[qsKey] = value;
			}
		}

		for (const row of customFilterRows) {
			if (row.filterName) qs[`_fc_${row.filterName}`] = row.value;
		}

		const response = (await this.helpers.httpRequest({
			method: 'GET',
			baseURL: JOINPOINT_API_BASE_URL,
			url: operation === 'list' ? '/list' : '/listFull',
			qs,
			json: true,
		})) as IDataObject;

		return ((response.data as IDataObject)?.result as IDataObject[]) ?? [];
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "Get Information"`);
}
