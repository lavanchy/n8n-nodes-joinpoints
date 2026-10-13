import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
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
export class Joinpoint implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Joinpoints',
		name: 'joinpoint',
		icon: 'file:joinpoint.svg',
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

				let responseData: IDataObject | IDataObject[];
				switch (resource) {
					case 'newCreate':
						responseData = await executeNewCreate.call(this, operation, i, accessToken);
						break;
					case 'change':
						responseData = await executeChange.call(this, operation, i, accessToken);
						break;
					case 'getInformation':
						responseData = await executeGetInformation.call(this, operation, i, accessToken);
						break;
					case 'getStatistic':
						responseData = await executeGetStatistic.call(this, operation, i, accessToken);
						break;
					case 'commercials':
						responseData = await executeCommercials.call(this, operation, i, accessToken);
						break;
					case 'structure':
						responseData = await executeStructure.call(this, operation, i, accessToken);
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
