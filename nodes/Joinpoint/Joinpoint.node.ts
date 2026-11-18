import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodeListSearchResult,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';
import { fetchJoinpointAccessToken } from './GenericFunctions';
import { changeDescription, executeChange } from './resources/change';
import { commercialsDescription, executeCommercials } from './resources/commercials';
import { executeGetInformation, getInformationDescription } from './resources/getInformation';
import { executeGetStatistic, getStatisticDescription } from './resources/getStatistic';
import { executeNewCreate, newCreateDescription } from './resources/newCreate';
import { JOINPOINT_API_BASE_URL } from './resources/shared';
import { executeStructure, structureDescription } from './resources/structure';

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
/**
 * Returns a view of the execute context whose httpRequest applies the given timeout
 * (unless a request sets its own). All other members are delegated to the original context.
 */
export function withRequestTimeout(context: IExecuteFunctions, timeout: number): IExecuteFunctions {
	const helpers = new Proxy(context.helpers, {
		get(target, prop, receiver) {
			if (prop === 'httpRequest') {
				return async (options: IHttpRequestOptions) =>
					await target.httpRequest({ ...options, timeout: options.timeout ?? timeout });
			}
			const value = Reflect.get(target, prop, receiver) as unknown;
			return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
		},
	});
	return new Proxy(context, {
		get(target, prop) {
			if (prop === 'helpers') return helpers;
			const value = Reflect.get(target, prop, target) as unknown;
			return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
		},
	});
}

export class Joinpoint implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Joinpoints',
		name: 'joinpoint',
		// joinpoint.dark.svg is a duplicate, not a recolor: the icon's only
		// visible colors (brand red + white) already read fine on both themes.
		icon: { light: 'file:joinpoint.svg', dark: 'file:joinpoint.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Access Joinpoints via REST API, version 1.1',
		defaults: {
			name: 'Joinpoints',
		},
		usableAsTool: true,
		credentials: [{ name: 'joinpointApi', required: true }],
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				description: 'Which part of the Joinpoints API to work with',
				options: [
					{ name: 'Change', value: 'change' },
					{ name: 'Commercial Document', value: 'commercials' },
					{ name: 'Get Information', value: 'getInformation' },
					{ name: 'Get Statistic', value: 'getStatistic' },
					{ name: 'New / Create', value: 'newCreate' },
					{ name: 'Structure', value: 'structure' },
				],
				default: 'getInformation',
			},
			...newCreateDescription,
			...changeDescription,
			...getInformationDescription,
			...getStatisticDescription,
			...commercialsDescription,
			...structureDescription,
			{
				displayName: 'Request Options',
				name: 'requestOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 0 },
						default: 0,
						description:
							'Abort the Joinpoints request after this many milliseconds (0 = no limit). Useful because some calls, ' +
							"e.g. creating a contact whose email contains '+', can hang although Joinpoints still creates it.",
					},
				],
			},
		],
	};

	methods = {
		listSearch: {
			async searchJoinpoints(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				const accessToken = await fetchJoinpointAccessToken.call(this);

				const response = (await this.helpers.httpRequest({
					method: 'GET',
					baseURL: JOINPOINT_API_BASE_URL,
					url: '/search',
					qs: { access_token: accessToken, property: 'title', q: filter ?? '' },
					json: true,
				})) as IDataObject;

				const results = (((response.data as IDataObject)?.result as IDataObject[]) ?? []) as IDataObject[];

				return {
					results: results.map((result) => ({
						name: result.title as string,
						value: result.id as number,
					})),
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Fetched once per run and reused for every item below: the Joinpoints
		// API has no way to validate/refresh a token, so each execution simply
		// gets its own fresh one instead of sharing a cached token across runs.
		const accessToken = await fetchJoinpointAccessToken.call(this);

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				const timeout = this.getNodeParameter('requestOptions.timeout', i, 0) as number;
				const context = timeout > 0 ? withRequestTimeout(this, timeout) : this;

				let responseData: IDataObject | IDataObject[];
				switch (resource) {
					case 'newCreate':
						responseData = await executeNewCreate.call(context, operation, i, accessToken);
						break;
					case 'change':
						responseData = await executeChange.call(context, operation, i, accessToken);
						break;
					case 'getInformation':
						responseData = await executeGetInformation.call(context, operation, i, accessToken);
						break;
					case 'getStatistic':
						responseData = await executeGetStatistic.call(context, operation, i, accessToken);
						break;
					case 'commercials':
						responseData = await executeCommercials.call(context, operation, i, accessToken);
						break;
					case 'structure':
						responseData = await executeStructure.call(context, operation, i, accessToken);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown resource "${resource}"`, { itemIndex: i });
				}

				if (Array.isArray(responseData)) {
					for (const result of responseData) {
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else {
					returnData.push({ json: responseData, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
