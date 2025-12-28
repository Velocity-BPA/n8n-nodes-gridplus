/**
 * Signing Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { signEthereumTransaction, signMessage, signTypedData, signPsbt, batchSign, buildTransactionRequest } from '../../utils/signingUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['signing'],
			},
		},
		options: [
			{ name: 'Approve Request', value: 'approveRequest', action: 'Approve request' },
			{ name: 'Batch Sign', value: 'batchSign', action: 'Batch sign' },
			{ name: 'Get Pending Requests', value: 'getPendingRequests', action: 'Get pending requests' },
			{ name: 'Reject Request', value: 'rejectRequest', action: 'Reject request' },
			{ name: 'Sign Arbitrary Data', value: 'signArbitraryData', action: 'Sign arbitrary data' },
			{ name: 'Sign Hash', value: 'signHash', action: 'Sign hash' },
			{ name: 'Sign Message', value: 'signMessage', action: 'Sign message' },
			{ name: 'Sign Personal Message', value: 'signPersonalMessage', action: 'Sign personal message' },
			{ name: 'Sign PSBT', value: 'signPsbt', action: 'Sign PSBT' },
			{ name: 'Sign Transaction', value: 'signTransaction', action: 'Sign transaction' },
			{ name: 'Sign Typed Data', value: 'signTypedData', action: 'Sign typed data' },
		],
		default: 'signMessage',
	},
	// Signer index
	{
		displayName: 'Signer Index',
		name: 'signerIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['signing'],
			},
		},
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Index of the signing address',
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signMessage', 'signPersonalMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Message to sign',
	},
	// Hash
	{
		displayName: 'Hash',
		name: 'hash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signHash'],
			},
		},
		default: '',
		required: true,
		description: '32-byte hash to sign (hex encoded)',
	},
	// Arbitrary data
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signArbitraryData'],
			},
		},
		default: '',
		required: true,
		description: 'Arbitrary data to sign (hex encoded)',
	},
	// Typed data
	{
		displayName: 'Typed Data (JSON)',
		name: 'typedData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signTypedData'],
			},
		},
		default: '{}',
		required: true,
		description: 'EIP-712 typed data structure',
	},
	// Transaction JSON
	{
		displayName: 'Transaction (JSON)',
		name: 'transaction',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signTransaction'],
			},
		},
		default: '{"to": "", "value": "0", "data": "0x", "gasLimit": "21000", "nonce": 0}',
		required: true,
		description: 'Transaction object to sign',
	},
	// Chain ID
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signTransaction'],
			},
		},
		default: 1,
		description: 'Chain ID for transaction signing',
	},
	// PSBT
	{
		displayName: 'PSBT (Base64)',
		name: 'psbt',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signPsbt'],
			},
		},
		default: '',
		required: true,
		description: 'Partially Signed Bitcoin Transaction',
	},
	// Batch items
	{
		displayName: 'Items (JSON)',
		name: 'batchItems',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['batchSign'],
			},
		},
		default: '[]',
		required: true,
		description: 'Array of items to sign (messages, transactions, or typed data)',
	},
	// Request ID
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['approveRequest', 'rejectRequest'],
			},
		},
		default: '',
		required: true,
		description: 'ID of the pending signing request',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createLatticeClient(this);
	await client.connect();

	const signerIndex = this.getNodeParameter('signerIndex', index) as number;

	switch (operation) {
		case 'signMessage':
		case 'signPersonalMessage': {
			const message = this.getNodeParameter('message', index) as string;
			const result = await signMessage(client, message, signerIndex);
			return [{
				json: {
					success: true,
					signature: result.signature,
					message,
					signer: result.signer,
					type: operation === 'signPersonalMessage' ? 'personal_sign' : 'eth_sign',
				},
				pairedItem: { item: index },
			}];
		}

		case 'signHash': {
			const hash = this.getNodeParameter('hash', index) as string;
			// Validate hash format
			if (!hash.match(/^0x[0-9a-fA-F]{64}$/)) {
				throw new Error('Hash must be a 32-byte hex string (0x + 64 hex characters)');
			}
			const result = await signMessage(client, hash, signerIndex);
			return [{
				json: {
					success: true,
					signature: result.signature,
					hash,
					signer: result.signer,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signArbitraryData': {
			const data = this.getNodeParameter('data', index) as string;
			const result = await signMessage(client, data, signerIndex);
			return [{
				json: {
					success: true,
					signature: result.signature,
					data,
					signer: result.signer,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signTypedData': {
			const typedDataJson = this.getNodeParameter('typedData', index) as object;
			const result = await signTypedData(client, typedDataJson, signerIndex);
			return [{
				json: {
					success: true,
					signature: result.signature,
					signer: result.signer,
					typedData: typedDataJson,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signTransaction': {
			const transaction = this.getNodeParameter('transaction', index) as Record<string, unknown>;
			const chainId = this.getNodeParameter('chainId', index) as number;

			const txRequest = buildTransactionRequest({
				to: transaction.to as string,
				value: transaction.value as string || '0',
				data: transaction.data as string || '0x',
				gasLimit: transaction.gasLimit as string || '21000',
				nonce: transaction.nonce as number || 0,
				maxFeePerGas: transaction.maxFeePerGas as string || '30000000000',
				maxPriorityFeePerGas: transaction.maxPriorityFeePerGas as string || '1500000000',
				chainId,
				type: 2,
			});

			const result = await signEthereumTransaction(client, txRequest, signerIndex);
			return [{
				json: {
					success: true,
					signedTransaction: result.signedTransaction,
					hash: result.hash,
					from: result.from,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signPsbt': {
			const psbt = this.getNodeParameter('psbt', index) as string;
			const result = await signPsbt(client, psbt, signerIndex);
			return [{
				json: {
					success: true,
					signedPsbt: result.signedPsbt,
					complete: result.complete,
				},
				pairedItem: { item: index },
			}];
		}

		case 'batchSign': {
			const batchItems = this.getNodeParameter('batchItems', index) as object[];
			const results = await batchSign(client, batchItems, signerIndex);
			return [{
				json: {
					success: true,
					count: results.length,
					results,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getPendingRequests': {
			return [{
				json: {
					requests: [],
					count: 0,
					note: 'Pending requests are managed on the Lattice device',
				},
				pairedItem: { item: index },
			}];
		}

		case 'approveRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;
			return [{
				json: {
					requestId,
					approved: true,
					note: 'Request approval requires device interaction',
				},
				pairedItem: { item: index },
			}];
		}

		case 'rejectRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;
			return [{
				json: {
					requestId,
					rejected: true,
					timestamp: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
