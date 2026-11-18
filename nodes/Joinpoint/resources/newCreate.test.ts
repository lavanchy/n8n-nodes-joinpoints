import type { IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { encodeFileUploadBody, executeNewCreate } from './newCreate';

function makePostContext(opts: {
	params: Record<string, unknown>;
	httpRequest: ReturnType<typeof vi.fn>;
	binaries?: Record<string, { mimeType: string; fileName?: string; content: string }>;
}) {
	const binaries = opts.binaries ?? {};
	return {
		getNodeParameter: vi.fn((name: string, _i: number, fallback?: unknown, options?: { extractValue?: boolean }) => {
			const value = name in opts.params ? opts.params[name] : fallback;
			if (options?.extractValue && value && typeof value === 'object' && 'value' in value) {
				return (value as { value: unknown }).value;
			}
			return value;
		}),
		getNode: () => ({ name: 'Joinpoints' }),
		helpers: {
			httpRequest: opts.httpRequest,
			assertBinaryData: vi.fn((_i: number, prop: string) => binaries[prop]),
			getBinaryDataBuffer: vi.fn(async (_i: number, prop: string) => Buffer.from(binaries[prop].content)),
		},
	} as unknown as IExecuteFunctions;
}

const baseParams = {
	joinpointId: { __rl: true, mode: 'id', value: '42' },
	simpleType: 'default',
	raw: 'Report',
};

describe('encodeFileUploadBody', () => {
	it('repeats each key per file and URL-encodes values', () => {
		expect(
			encodeFileUploadBody({ files: ['a+b/c=', 'xyz'], fileTypes: ['application/pdf', 'text/plain'], fileNames: ['r 1.pdf', 'n.txt'] }),
		).toBe(
			'files=a%2Bb%2Fc%3D&files=xyz&fileTypes=application%2Fpdf&fileTypes=text%2Fplain&fileNames=r%201.pdf&fileNames=n.txt',
		);
	});
});

describe('executeNewCreate post', () => {
	it('sends files as form-urlencoded body', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ status: 'ok' });
		const context = makePostContext({
			params: { ...baseParams, 'files.file': [{ binaryPropertyName: 'data' }] },
			httpRequest,
			binaries: { data: { mimeType: 'application/pdf', fileName: 'report.pdf', content: '%PDF-1.4' } },
		});

		await executeNewCreate.call(context, 'post', 0, 'token-123');

		const call = httpRequest.mock.calls[0][0];
		expect(call.url).toBe('/post');
		expect(call.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
		expect(call.body).toBe(
			`files=${encodeURIComponent(Buffer.from('%PDF-1.4').toString('base64'))}&fileTypes=application%2Fpdf&fileNames=report.pdf`,
		);
		expect(call.qs).toMatchObject({ access_token: 'token-123', joinpoint_id: '42', simpleType: 'default', raw: 'Report' });
	});

	it('sends no body without files', async () => {
		const httpRequest = vi.fn().mockResolvedValue({ status: 'ok' });
		const context = makePostContext({ params: baseParams, httpRequest });

		await executeNewCreate.call(context, 'post', 0, 'token-123');

		const call = httpRequest.mock.calls[0][0];
		expect(call.body).toBeUndefined();
		expect(call.headers).toBeUndefined();
	});
});
