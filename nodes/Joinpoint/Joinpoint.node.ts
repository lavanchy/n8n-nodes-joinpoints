import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { joinpointDescription } from './resources/joinpoint';
/*
 * Source for the API docs:
 * - https://app.joinpoints.io/res/swagger/joinpoints-JoinpointsAPI-1-1-swagger.json
 *
 * Built on
 * openapi "3.0.0"
 * info
 * version "1.1"
 * title "Joinpoints File API 1.0" description ""
 */
export class Joinpoint implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Joinpoint',
		name: 'joinpoint',
		icon: 'file:../../icons/joinpoint.png',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Access Joinpoint via REST API, version 1.1',
		defaults: {
			name: 'Joinpoint',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		requestDefaults: {
			baseURL: 'https://app.joinpoints.io/api-v1',
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Joinpoint',
						value: 'joinpoint',
					},
				],
				default: 'joinpoint',
			},
			...joinpointDescription,
		],
	};
}