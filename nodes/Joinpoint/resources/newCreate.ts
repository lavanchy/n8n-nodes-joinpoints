import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';
import { JOINPOINT_API_BASE_URL, getResourceLocatorId, joinpointResourceLocator, joinpointResourceLocatorModes } from './shared';

const RESOURCE = 'newCreate';
const showOnlyForThisResource = { resource: [RESOURCE] };

const JOINPOINT_TYPE_OPTIONS = [
	{ name: 'Point (Generic)', value: 'point' },
	{ name: 'Contact', value: 'contact' },
	{ name: 'Company', value: 'company' },
	{ name: 'Deal', value: 'deal' },
	{ name: 'Task', value: 'task' },
	{ name: 'Template', value: 'template' },
	{ name: 'User', value: 'user' },
	{ name: 'Team', value: 'team' },
];

export const newCreateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForThisResource },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a joinpoint',
				description: 'Create a new joinpoint',
			},
			{
				name: 'Post',
				value: 'post',
				action: 'Post to a joinpoint timeline',
				description: "Add information into a joinpoint's timeline (or create a new joinpoint within it)",
			},
		],
		default: 'create',
	},

	// ---- Post ----
	joinpointResourceLocator({
		name: 'joinpointId',
		displayName: 'Joinpoint',
		resource: RESOURCE,
		operation: ['post'],
		description: 'The joinpoint to post the timeline entry into',
	}),
	{
		displayName: 'Simple Type',
		name: 'simpleType',
		type: 'options',
		default: 'default',
		description: 'Type of the new timeline entry. Use a joinpoint type to create a new joinpoint within the timeline.',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['post'] } },
		options: [{ name: 'Default (Plain Timeline Entry)', value: 'default' }, ...JOINPOINT_TYPE_OPTIONS],
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		description: 'Title of the new joinpoint',
		displayOptions: {
			show: { ...showOnlyForThisResource, operation: ['post'] },
			hide: { simpleType: ['default'] },
		},
	},
	{
		displayName: 'Raw Text',
		name: 'raw',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Raw text of the timeline entry',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['post'] } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['post'] } },
		options: [
			joinpointResourceLocatorModes(
				'contact',
				'Contact / Company',
				'Contact or company joinpoint to relate to the new entry (optional)',
			),
			joinpointResourceLocatorModes(
				'related',
				'Related Project/Deal',
				'Related root joinpoint, e.g. a project or deal (optional)',
			),
			joinpointResourceLocatorModes('team', 'Team', 'Team joinpoint to relate to the new entry (optional)'),
			joinpointResourceLocatorModes('template', 'Template', 'Template joinpoint for the new joinpoint (optional)'),
		],
	},
	{
		displayName: 'Assigned Users',
		name: 'assignedUsers',
		type: 'fixedCollection',
		placeholder: 'Add User',
		default: {},
		typeOptions: { multipleValues: true },
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['post'] } },
		options: [
			{
				name: 'user',
				displayName: 'User',
				values: [joinpointResourceLocatorModes('value', 'User', 'User joinpoint to assign to the new joinpoint')],
			},
		],
	},
	{
		displayName: 'Files',
		name: 'files',
		type: 'fixedCollection',
		placeholder: 'Add File',
		default: {},
		typeOptions: { multipleValues: true },
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['post'] } },
		options: [
			{
				name: 'file',
				displayName: 'File',
				values: [
					{
						displayName: 'Input Binary Field',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						description: 'Name of the input binary property containing the file to upload',
					},
				],
			},
		],
	},

	// ---- Create ----
	{
		displayName:
			'Fields below change based on the selected Type. When Type Mode is "Template", find the right template ' +
			'and its available attributes via the Structure resource\'s "List Directories" and "Get Template Meta" ' +
			'operations first.',
		name: 'createNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'] } },
	},
	joinpointResourceLocator({
		name: 'destination',
		displayName: 'Destination',
		resource: RESOURCE,
		operation: ['create'],
		description: 'The joinpoint to create the new joinpoint under',
	}),
	{
		displayName: 'Type Mode',
		name: 'typeMode',
		type: 'options',
		default: 'new',
		description: 'Use "New" for a plain joinpoint type, or "Template" for a pipeline/database entry template',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'] } },
		options: [
			{ name: 'New (Plain Joinpoint Type)', value: 'new' },
			{ name: 'Template', value: 'template' },
		],
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: 'point',
		description:
			'Type of the new joinpoint. Use Structure -> List Directories to see which types are actually used in your account.',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'], typeMode: ['new'] } },
		options: JOINPOINT_TYPE_OPTIONS,
	},
	joinpointResourceLocator({
		name: 'type',
		displayName: 'Type (Template)',
		resource: RESOURCE,
		operation: ['create'],
		description:
			'Template joinpoint to base the new joinpoint on. Find template IDs via Structure -> List Directories ' +
			'(the template-id column) or Structure -> Get Template Meta.',
		extraShow: { typeMode: ['template'] },
	}),
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Name of the new joinpoint',
		displayOptions: {
			show: { ...showOnlyForThisResource, operation: ['create'] },
			hide: { type: ['contact'] },
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		description: 'Used as the name of the new contact',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'], type: ['contact'] } },
	},
	{
		displayName: 'Website',
		name: 'website',
		type: 'string',
		default: '',
		description: 'The domain or website of the new company joinpoint',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'], type: ['company'] } },
	},
	{
		displayName: 'Website Crawling',
		name: 'websiteCrawling',
		type: 'boolean',
		default: false,
		description: "Whether Joinpoint should crawl the company's website for extra information (e.g. its image)",
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'], type: ['company'] } },
	},
	{
		displayName: 'Department',
		name: 'department',
		type: 'string',
		default: '',
		description: 'Department of the new company (optional)',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'], type: ['company'] } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'], type: ['contact'] } },
		options: [
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				description: 'First name of the new contact (optional)',
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'options',
				default: '',
				description: 'Optional - the API documents no default',
				options: [
					{ name: 'Not Set', value: '' },
					{ name: 'Male', value: 'male' },
					{ name: 'Female', value: 'female' },
				],
			},
			{
				displayName: 'Job Title',
				name: 'jobTitle',
				type: 'string',
				default: '',
				description: 'Job title of the new contact (optional)',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				description: 'Last name of the new contact (optional)',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				description: 'Phone number of the new contact (optional)',
			},
			joinpointResourceLocatorModes(
				'salesCustomerBoxlistVal',
				'Related Company',
				'Company joinpoint related to this contact (optional)',
			),
		],
	},
	joinpointResourceLocator({
		name: 'salesCustomerBoxlistVal',
		displayName: 'Related Customer',
		resource: RESOURCE,
		operation: ['create'],
		required: false,
		description: 'Customer joinpoint related to this deal (optional)',
		extraShow: { type: ['deal'] },
	}),
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		default: '',
		description: 'Planned amount of the new deal (optional)',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['create'], type: ['deal'] } },
	},
];

export async function executeNewCreate(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	accessToken: string,
): Promise<IDataObject> {
	if (operation === 'post') {
		const joinpointId = getResourceLocatorId.call(this, 'joinpointId', i);
		const simpleType = this.getNodeParameter('simpleType', i) as string;
		const title = this.getNodeParameter('title', i, '') as string;
		const raw = this.getNodeParameter('raw', i, '') as string;

		const qs: IDataObject = { access_token: accessToken, joinpoint_id: joinpointId, simpleType };
		if (title) qs.title = title;
		if (raw) qs.raw = raw;

		for (const field of ['team', 'contact', 'related', 'template'] as const) {
			const value = this.getNodeParameter(`options.${field}`, i, { mode: 'id', value: '' }, { extractValue: true }) as string;
			if (value) qs[field] = value;
		}

		const assignedUsers = this.getNodeParameter('assignedUsers.user', i, []) as Array<{
			value: { value: string };
		}>;
		if (assignedUsers.length) {
			qs.assign_user = assignedUsers.map((row) => row.value.value);
		}

		const fileRows = this.getNodeParameter('files.file', i, []) as Array<{ binaryPropertyName: string }>;
		let body: IDataObject | undefined;
		if (fileRows.length) {
			const files: string[] = [];
			const fileTypes: string[] = [];
			const fileNames: string[] = [];
			for (const row of fileRows) {
				const binaryData = this.helpers.assertBinaryData(i, row.binaryPropertyName);
				const buffer = await this.helpers.getBinaryDataBuffer(i, row.binaryPropertyName);
				files.push(buffer.toString('base64'));
				fileTypes.push(binaryData.mimeType);
				fileNames.push(binaryData.fileName ?? row.binaryPropertyName);
			}
			body = { files, fileTypes, fileNames };
		}

		return (await this.helpers.httpRequest({
			method: 'POST',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/post',
			qs,
			body,
			arrayFormat: 'repeat',
			json: true,
		})) as IDataObject;
	}

	if (operation === 'create') {
		const destination = getResourceLocatorId.call(this, 'destination', i);
		const typeMode = this.getNodeParameter('typeMode', i) as string;
		const type =
			typeMode === 'template'
				? getResourceLocatorId.call(this, 'type', i)
				: (this.getNodeParameter('type', i) as string);

		const qs: IDataObject = { access_token: accessToken, destination, typeMode, type };

		if (type === 'contact') {
			qs.email = this.getNodeParameter('email', i, '') as string;
			const gender = this.getNodeParameter('options.gender', i, '') as string;
			if (gender) qs.gender = gender;
			qs.firstName = this.getNodeParameter('options.firstName', i, '') as string;
			qs.lastName = this.getNodeParameter('options.lastName', i, '') as string;
			qs.jobTitle = this.getNodeParameter('options.jobTitle', i, '') as string;
			qs.phoneNumber = this.getNodeParameter('options.phoneNumber', i, '') as string;
		} else {
			const name = this.getNodeParameter('name', i, '') as string;
			if (name) qs.name = name;
		}

		if (type === 'company') {
			qs.website = this.getNodeParameter('website', i, '') as string;
			qs.websiteCrawling = this.getNodeParameter('websiteCrawling', i, false) as boolean;
			const department = this.getNodeParameter('department', i, '') as string;
			if (department) qs.department = department;
		}

		if (type === 'contact' || type === 'deal') {
			const salesCustomerBoxlistVal =
				type === 'contact'
					? (this.getNodeParameter(
							'options.salesCustomerBoxlistVal',
							i,
							{ mode: 'id', value: '' },
							{ extractValue: true },
						) as string)
					: getResourceLocatorId.call(this, 'salesCustomerBoxlistVal', i);
			if (salesCustomerBoxlistVal) qs.sales_customer_boxlist_val = salesCustomerBoxlistVal;
		}

		if (type === 'deal') {
			const amount = this.getNodeParameter('amount', i, '') as string;
			if (amount) qs.amount = amount;
		}

		return (await this.helpers.httpRequest({
			method: 'POST',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/create',
			qs,
			json: true,
		})) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "New / Create"`);
}
