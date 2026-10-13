import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';
import { JOINPOINT_API_BASE_URL, getResourceLocatorId, joinpointResourceLocator, joinpointResourceLocatorModes } from './shared';

const RESOURCE = 'change';
const showOnlyForThisResource = { resource: [RESOURCE] };

const ADD_REMOVE_OPTIONS = [
	{ name: 'Add', value: 'add' },
	{ name: 'Remove', value: 'remove' },
];

export const changeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForThisResource },
		options: [
			{
				name: 'Assign Team',
				value: 'assignTeam',
				action: 'Assign a team to a joinpoint',
				description: 'Assign a team of a joinpoint',
			},
			{
				name: 'Assign User',
				value: 'assignUser',
				action: 'Assign or remove a user from a joinpoint',
				description: 'Assign or remove a user of a joinpoint',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a joinpoint',
				description: 'Update one or more joinpoint properties with new values',
			},
			{
				name: 'Update Relation',
				value: 'updateRelation',
				action: 'Update a joinpoint relation',
				description: 'Update a multi-joinpoint relation attribute',
			},
		],
		default: 'update',
	},

	joinpointResourceLocator({
		name: 'joinpointId',
		displayName: 'Joinpoint',
		resource: RESOURCE,
		operation: ['assignUser', 'assignTeam', 'update', 'updateRelation'],
		description: 'The joinpoint to update',
	}),

	// ---- Assign User ----
	joinpointResourceLocator({
		name: 'userId',
		displayName: 'User',
		resource: RESOURCE,
		operation: ['assignUser'],
		description: 'The user joinpoint to assign or remove',
	}),
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		default: 'add',
		description: 'Whether to add or remove this user from the joinpoint',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['assignUser'] } },
		options: ADD_REMOVE_OPTIONS,
	},

	// ---- Assign Team ----
	joinpointResourceLocator({
		name: 'teamId',
		displayName: 'Team',
		resource: RESOURCE,
		operation: ['assignTeam'],
		description: 'The team joinpoint to assign',
	}),

	// ---- Update ----
	{
		displayName:
			'The exact internal_name of a field (e.g. "title" or "c_123") can be found via Structure -> Get Template ' +
			"Meta, in that template's attributes list. Use the internal_name as-is, with no added prefix - default " +
			"properties are unprefixed (e.g. \"title\", \"company\") and custom attributes already include their own " +
			'"c_" prefix (e.g. "c_123").',
		name: 'updateNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['update'] } },
	},
	{
		displayName: 'Fields To Update',
		name: 'fieldsToUpdate',
		type: 'fixedCollection',
		placeholder: 'Add Field',
		default: {},
		typeOptions: { multipleValues: true },
		description: 'One or more joinpoint properties to set to a new value',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['update'] } },
		options: [
			{
				name: 'field',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name',
						name: 'fieldName',
						type: 'string',
						default: '',
						placeholder: 'title or c_myCustomField',
						description:
							"The field's internal_name, unprefixed (e.g. 'title'). Custom attribute internal_name values " +
							"already include the 'c_' prefix - see Structure -> Get Template Meta for the exact names " +
							'available on a given template.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},

	// ---- Update Relation ----
	{
		displayName:
			'Attribute must already exist as a custom multi-joinpoint relation on the target\'s template - it is not ' +
			'created here. Each row in Values is sent as a separate joinpoint to add or remove from that relation.',
		name: 'updateRelationNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['updateRelation'] } },
	},
	{
		displayName: 'Attribute',
		name: 'attribute',
		type: 'string',
		default: '',
		required: true,
		description:
			'Name of the custom relation attribute to update - discoverable via Structure -> Get Template Meta',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['updateRelation'] } },
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		default: 'add',
		description: 'Whether to add or remove the given joinpoints from the relation',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['updateRelation'] } },
		options: ADD_REMOVE_OPTIONS,
	},
	{
		displayName: 'Values',
		name: 'values',
		type: 'fixedCollection',
		placeholder: 'Add Joinpoint',
		default: {},
		typeOptions: { multipleValues: true },
		description: 'Joinpoints to add to or remove from the relation attribute',
		displayOptions: { show: { ...showOnlyForThisResource, operation: ['updateRelation'] } },
		options: [
			{
				name: 'joinpoint',
				displayName: 'Joinpoint',
				values: [joinpointResourceLocatorModes('value', 'Joinpoint', 'Joinpoint to add or remove from the relation')],
			},
		],
	},
];

export async function executeChange(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	accessToken: string,
): Promise<IDataObject> {
	const joinpointId = getResourceLocatorId.call(this, 'joinpointId', i);

	if (operation === 'assignUser') {
		const userId = getResourceLocatorId.call(this, 'userId', i);
		const mode = this.getNodeParameter('mode', i) as string;

		return (await this.helpers.httpRequest({
			method: 'POST',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/assignUser',
			qs: { access_token: accessToken, joinpoint_id: joinpointId, user_id: userId, mode },
			json: true,
		})) as IDataObject;
	}

	if (operation === 'assignTeam') {
		const teamId = getResourceLocatorId.call(this, 'teamId', i);

		return (await this.helpers.httpRequest({
			method: 'POST',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/assignTeam',
			qs: { access_token: accessToken, joinpoint_id: joinpointId, team_id: teamId },
			json: true,
		})) as IDataObject;
	}

	if (operation === 'update') {
		const rows = this.getNodeParameter('fieldsToUpdate.field', i, []) as Array<{
			fieldName: string;
			value: string;
		}>;

		const qs: IDataObject = { access_token: accessToken, joinpoint_id: joinpointId };
		for (const row of rows) {
			if (row.fieldName) qs[row.fieldName] = row.value;
		}

		return (await this.helpers.httpRequest({
			method: 'POST',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/update',
			qs,
			json: true,
		})) as IDataObject;
	}

	if (operation === 'updateRelation') {
		const attribute = this.getNodeParameter('attribute', i) as string;
		const mode = this.getNodeParameter('mode', i) as string;
		const rows = this.getNodeParameter('values.joinpoint', i, []) as Array<{ value: { value: string } }>;

		return (await this.helpers.httpRequest({
			method: 'POST',
			baseURL: JOINPOINT_API_BASE_URL,
			url: '/updateJoinpointRelation',
			qs: {
				access_token: accessToken,
				joinpoint_id: joinpointId,
				attribute,
				mode,
				value: rows.map((row) => row.value.value),
			},
			arrayFormat: 'repeat',
			json: true,
		})) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "Change"`);
}
