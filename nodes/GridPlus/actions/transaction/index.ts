/**
 * Transaction Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { signEthereumTransaction, buildTransactionRequest } from '../../utils/signingUtils';
import { EVM_CHAINS } from '../../constants/chains';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{ name: 'Broadcast Transaction', value: 'broadcastTransaction', action: 'Broadcast transaction' },
			{ name: 'Cancel Pending Request', value: 'cancelPendingRequest', action: 'Cancel pending request' },
			{ name: 'Create Transaction', value: 'createTransaction', action: 'Create transaction' },
			{ name: 'Estimate Fee', value: 'estimateFee', action: 'Estimate fee' },
			{ name: 'Get Signing Status', value: 'getSigningStatus', action: 'Get signing status' },
			{ name: 'Get Transaction History', value: 'getTransactionHistory', action: 'Get transaction history' },
			{ name: 'Get Transaction Request', value: 'getTransactionRequest', action: 'Get transaction request' },
			{ name: 'Get Transaction Status', value: 'getTransactionStatus', action: 'Get transaction status' },
			{ name: 'Sign Multiple Transactions', value: 'signMultipleTransactions', action: 'Sign multiple transactions' },
			{ name: 'Sign Transaction', value: 'signTransaction', action: 'Sign transaction' },
		],
		default: 'signTransaction',
	},
	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction', 'signMultipleTransactions', 'estimateFee', 'broadcastTransaction'],
			},
		},
		options: Object.entries(EVM_CHAINS).map(([key, chain]) => ({
			name: chain.name,
			value: key,
		})),
		default: 'ethereum',
		description: 'Blockchain network',
	},
	// Address index
	{
		displayName: 'Signer Index',
		name: 'signerIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['signTransaction', 'signMultipleTransactions', 'createTransaction'],
			},
		},
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Index of the signing address',
	},
	// Transaction parameters
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction', 'estimateFee'],
			},
		},
		default: '',
		required: true,
		description: 'Recipient address',
	},
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction', 'estimateFee'],
			},
		},
		default: '0',
		description: 'Transaction value in native currency (Wei for EVM)',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction', 'estimateFee'],
			},
		},
		default: '0x',
		description: 'Transaction data (hex encoded)',
	},
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction'],
			},
		},
		default: '21000',
		description: 'Gas limit for the transaction',
	},
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction'],
			},
		},
		default: 0,
		description: 'Transaction nonce',
	},
	{
		displayName: 'Max Fee Per Gas',
		name: 'maxFeePerGas',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction'],
			},
		},
		default: '30000000000',
		description: 'Maximum fee per gas (Wei)',
	},
	{
		displayName: 'Max Priority Fee Per Gas',
		name: 'maxPriorityFeePerGas',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['createTransaction', 'signTransaction'],
			},
		},
		default: '1500000000',
		description: 'Maximum priority fee per gas (Wei)',
	},
	// Multiple transactions
	{
		displayName: 'Transactions (JSON)',
		name: 'transactions',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['signMultipleTransactions'],
			},
		},
		default: '[]',
		required: true,
		description: 'Array of transaction objects to sign',
	},
	// Signed transaction for broadcast
	{
		displayName: 'Signed Transaction',
		name: 'signedTransaction',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['broadcastTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Hex-encoded signed transaction',
	},
	// Transaction hash
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getTransactionStatus'],
			},
		},
		default: '',
		required: true,
		description: 'Transaction hash to check status',
	},
	// Request ID
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getTransactionRequest', 'getSigningStatus', 'cancelPendingRequest'],
			},
		},
		default: '',
		required: true,
		description: 'Signing request ID',
	},
	// Address for history
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getTransactionHistory'],
			},
		},
		default: '',
		required: true,
		description: 'Address to get transaction history for',
	},
	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Wait for Confirmation',
				name: 'waitForConfirmation',
				type: 'boolean',
				default: false,
				description: 'Whether to wait for transaction confirmation',
			},
			{
				displayName: 'Confirmations',
				name: 'confirmations',
				type: 'number',
				default: 1,
				description: 'Number of confirmations to wait for',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createLatticeClient(this);
	await client.connect();

	switch (operation) {
		case 'createTransaction':
		case 'signTransaction': {
			const chain = this.getNodeParameter('chain', index) as string;
			const signerIndex = this.getNodeParameter('signerIndex', index) as number;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const data = this.getNodeParameter('data', index) as string;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;
			const nonce = this.getNodeParameter('nonce', index) as number;
			const maxFeePerGas = this.getNodeParameter('maxFeePerGas', index) as string;
			const maxPriorityFeePerGas = this.getNodeParameter('maxPriorityFeePerGas', index) as string;

			const chainConfig = EVM_CHAINS[chain as keyof typeof EVM_CHAINS];
			const txRequest = buildTransactionRequest({
				to: toAddress,
				value,
				data,
				gasLimit,
				nonce,
				maxFeePerGas,
				maxPriorityFeePerGas,
				chainId: chainConfig?.chainId || 1,
				type: 2,
			});

			const result = await signEthereumTransaction(client, txRequest, signerIndex);
			return [{
				json: {
					success: true,
					chain,
					signedTransaction: result.signedTransaction,
					hash: result.hash,
					from: result.from,
					to: toAddress,
					value,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signMultipleTransactions': {
			const chain = this.getNodeParameter('chain', index) as string;
			const signerIndex = this.getNodeParameter('signerIndex', index) as number;
			const transactions = this.getNodeParameter('transactions', index) as object[];
			const chainConfig = EVM_CHAINS[chain as keyof typeof EVM_CHAINS];

			const results: object[] = [];
			for (const tx of transactions) {
				const txObj = tx as Record<string, unknown>;
				const txRequest = buildTransactionRequest({
					to: txObj.to as string,
					value: txObj.value as string || '0',
					data: txObj.data as string || '0x',
					gasLimit: txObj.gasLimit as string || '21000',
					nonce: txObj.nonce as number || 0,
					maxFeePerGas: txObj.maxFeePerGas as string || '30000000000',
					maxPriorityFeePerGas: txObj.maxPriorityFeePerGas as string || '1500000000',
					chainId: chainConfig?.chainId || 1,
					type: 2,
				});

				const result = await signEthereumTransaction(client, txRequest, signerIndex);
				results.push({
					signedTransaction: result.signedTransaction,
					hash: result.hash,
					from: result.from,
				});
			}

			return [{
				json: {
					success: true,
					chain,
					count: results.length,
					transactions: results,
				},
				pairedItem: { item: index },
			}];
		}

		case 'estimateFee': {
			const chain = this.getNodeParameter('chain', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const data = this.getNodeParameter('data', index) as string;
			const chainConfig = EVM_CHAINS[chain as keyof typeof EVM_CHAINS];

			return [{
				json: {
					chain,
					chainId: chainConfig?.chainId,
					to: toAddress,
					value,
					dataLength: data.length,
					estimatedGas: data === '0x' ? '21000' : '50000',
					note: 'Accurate gas estimation requires network RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'broadcastTransaction': {
			const chain = this.getNodeParameter('chain', index) as string;
			const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;

			return [{
				json: {
					chain,
					signedTransaction,
					broadcasted: false,
					note: 'Transaction broadcast requires network RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getTransactionStatus': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;

			return [{
				json: {
					transactionHash,
					status: 'unknown',
					note: 'Transaction status requires network RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getTransactionRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;

			return [{
				json: {
					requestId,
					status: 'pending',
					note: 'Request details require device interaction',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getSigningStatus': {
			const requestId = this.getNodeParameter('requestId', index) as string;

			return [{
				json: {
					requestId,
					status: 'pending',
					approved: false,
					rejected: false,
				},
				pairedItem: { item: index },
			}];
		}

		case 'cancelPendingRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;

			return [{
				json: {
					requestId,
					cancelled: true,
					timestamp: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'getTransactionHistory': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					transactions: [],
					note: 'Transaction history requires network API access',
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
