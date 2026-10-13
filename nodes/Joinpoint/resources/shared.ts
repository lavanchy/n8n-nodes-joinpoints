import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

export const JOINPOINT_API_BASE_URL = 'https://app.joinpoints.io/api-v1';

// INodePropertyMode (the real type of a `modes` entry) has no `default` field,
// but the n8n-nodes-base lint rule that requires one doesn't distinguish a
// resourceLocator mode from a full property. Typed and assigned via this
// widened type (rather than INodeProperties['modes'] directly) so the extra
// `default` satisfies the lint rule without tripping TypeScript's excess
// property check.
type ResourceLocatorMode = NonNullable<INodeProperties['modes']>[number] & { default?: string };

const RESOURCE_LOCATOR_MODES: ResourceLocatorMode[] = [
	{
		displayName: 'From List',
		name: 'list',
		type: 'list',
		default: '',
		typeOptions: {
			searchListMethod: 'searchJoinpoints',
			searchable: true,
			searchFilterRequired: true,
		},
	},
	{
		displayName: 'ID',
		name: 'id',
		type: 'string',
		default: '',
		placeholder: 'e.g. 12345',
	},
];

interface JoinpointResourceLocatorOptions {
	name: string;
	displayName: string;
	resource: string;
	operation: string[];
	required?: boolean;
	description?: string;
	/** Extra displayOptions.show conditions merged in alongside resource/operation, e.g. `{ type: ['deal'] }`. */
	extraShow?: Record<string, string[]>;
}

/** Top-level resourceLocator field for an operation, e.g. the target Joinpoint ID. */
export function joinpointResourceLocator(opts: JoinpointResourceLocatorOptions): INodeProperties {
	return {
		displayName: opts.displayName,
		name: opts.name,
		type: 'resourceLocator',
		// "From List" needs a resolvable Access Token to search - not available yet while just
		// configuring the node (no upstream execution/pinned data). Default to "By ID" so typing
		// a plain ID works immediately; switch to "From List" once the token can actually resolve.
		default: { mode: 'id', value: '' },
		required: opts.required ?? true,
		description: opts.description,
		displayOptions: {
			show: {
				resource: [opts.resource],
				operation: opts.operation,
				...opts.extraShow,
			},
		},
		modes: RESOURCE_LOCATOR_MODES,
	};
}

/**
 * resourceLocator "shape" for embedding inside a fixedCollection row (e.g. a
 * repeated Assigned User or relation Value), where displayOptions/routing are
 * driven by the parent field instead.
 */
export function joinpointResourceLocatorModes(
	name: string,
	displayName: string,
	description?: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		// "From List" needs a resolvable Access Token to search - not available yet while just
		// configuring the node (no upstream execution/pinned data). Default to "By ID" so typing
		// a plain ID works immediately; switch to "From List" once the token can actually resolve.
		default: { mode: 'id', value: '' },
		description,
		modes: RESOURCE_LOCATOR_MODES,
	};
}

/** Resolves a resourceLocator field's plain ID value for the given item. */
export function getResourceLocatorId(this: IExecuteFunctions, name: string, i: number): string {
	return this.getNodeParameter(name, i, undefined, { extractValue: true }) as string;
}
