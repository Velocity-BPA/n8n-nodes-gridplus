/**
 * Ethereum Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { getEthereumAddresses } from '../../utils/addressUtils';
import { signEthereumTransaction, signMessage, signTypedData, buildTransactionRequest } from '../../utils/signingUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ethereum'],
			},
		},
		options: [
			{ name: 'Broadcast Transaction', value: 'broadcastTransaction', action: 'Broadcast transaction' },
			{ name: 'Estimate Gas', value: 'estimateGas', action: 'Estimate gas' },
			{ name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
			{ name: 'Get Ethereum Address at Index', value: 'getAddressAtIndex', action: 'Get Ethereum address at index' },
			{ name: 'Get Ethereum Addresses', value: 'getAddresses', action: 'Get Ethereum addresses' },
			{ name: 'Get Nonce', value: 'getNonce', action: 'Get nonce' },
			{ name: 'Get Token Balances', value: 'getTokenBalances', action: 'Get token balances' },
			{ name: 'Sign EIP-1559 Transaction', value: 'signEip1559Transaction', action: 'Sign EIP-1559 transaction' },
			{ name: 'Sign Legacy Transaction', value: 'signLegacyTransaction', action: 'Sign legacy transaction' },
			{ name: 'Sign Message', value: 'signMessage', action: 'Sign message' },
			{ name: 'Sign Personal Message', value: 'signPersonalMessage', action: 'Sign personal message' },
			{ name: 'Sign Transaction', value: 'signTransaction', action: 'Sign transaction' },
			{ name: 'Sign Typed Data (EIP-712)', value: 'signTypedData', action: 'Sign typed data EIP 712' },
		],
		default: 'getAddresses',
	},
	// Address count
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['getAddresses'],
			},
		},
		default: 5,
		typeOptions: { minValue: 1, maxValue: 10 },
		description: 'Number of addresses to retrieve',
	},
	// Address index
	{
		displayName: 'Index',
		name: 'addressIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['getAddressAtIndex', 'signTransaction', 'signEip1559Transaction', 'signLegacyTransaction', 'signMessage', 'signPersonalMessage', 'signTypedData'],
			},
		},
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Address index for signing',
	},
	// Transaction To address
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559Transaction', 'signLegacyTransaction', 'estimateGas'],
			},
		},
		default: '',
		required: true,
		description: 'Recipient address',
	},
	// Transaction Value
	{
		displayName: 'Value (Wei)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559Transaction', 'signLegacyTransaction', 'estimateGas'],
			},
		},
		default: '0',
		description: 'Transaction value in Wei',
	},
	// Transaction Data
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559Transaction', 'signLegacyTransaction', 'estimateGas'],
			},
		},
		default: '0x',
		description: 'Transaction data (hex encoded)',
	},
	// Gas Limit
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559Transaction', 'signLegacyTransaction'],
			},
		},
		default: '21000',
		description: 'Gas limit for the transaction',
	},
	// Nonce
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559Transaction', 'signLegacyTransaction'],
			},
		},
		default: 0,
		description: 'Transaction nonce',
	},
	// Legacy gas price
	{
		displayName: 'Gas Price (Wei)',
		name: 'gasPrice',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signLegacyTransaction'],
			},
		},
		default: '20000000000',
		description: 'Gas price in Wei',
	},
	// EIP-1559 fees
	{
		displayName: 'Max Fee Per Gas (Wei)',
		name: 'maxFeePerGas',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signEip1559Transaction', 'signTransaction'],
			},
		},
		default: '30000000000',
		description: 'Maximum fee per gas in Wei',
	},
	{
		displayName: 'Max Priority Fee Per Gas (Wei)',
		name: 'maxPriorityFeePerGas',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signEip1559Transaction', 'signTransaction'],
			},
		},
		default: '1500000000',
		description: 'Maximum priority fee per gas in Wei',
	},
	// Chain ID
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559Transaction', 'signLegacyTransaction'],
			},
		},
		default: 1,
		description: 'Chain ID (1 for Ethereum mainnet)',
	},
	// Message to sign
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signMessage', 'signPersonalMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Message to sign',
	},
	// Typed data
	{
		displayName: 'Typed Data (JSON)',
		name: 'typedData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTypedData'],
			},
		},
		default: '{}',
		required: true,
		description: 'EIP-712 typed data structure',
	},
	// Signed transaction for broadcast
	{
		displayName: 'Signed Transaction',
		name: 'signedTransaction',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['broadcastTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Hex-encoded signed transaction',
	},
	// Address for balance/nonce
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['getBalance', 'getNonce', 'getTokenBalances'],
			},
		},
		default: '',
		required: true,
		description: 'Ethereum address',
	},
	// Token addresses
	{
		displayName: 'Token Addresses',
		name: 'tokenAddresses',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['getTokenBalances'],
			},
		},
		default: '',
		description: 'Comma-separated list of ERC20 token addresses',
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
		case 'getAddresses': {
			const count = this.getNodeParameter('count', index) as number;
			const addresses = await getEthereumAddresses(client, 0, count);
			return [{
				json: { addresses, count: addresses.length },
				pairedItem: { item: index },
			}];
		}

		case 'getAddressAtIndex': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const addresses = await getEthereumAddresses(client, addressIndex, 1);
			return [{
				json: { index: addressIndex, address: addresses[0] || null },
				pairedItem: { item: index },
			}];
		}

		case 'signTransaction':
		case 'signEip1559Transaction': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const data = this.getNodeParameter('data', index) as string;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;
			const nonce = this.getNodeParameter('nonce', index) as number;
			const maxFeePerGas = this.getNodeParameter('maxFeePerGas', index) as string;
			const maxPriorityFeePerGas = this.getNodeParameter('maxPriorityFeePerGas', index) as string;
			const chainId = this.getNodeParameter('chainId', index) as number;

			const txRequest = buildTransactionRequest({
				to: toAddress,
				value,
				data,
				gasLimit,
				nonce,
				maxFeePerGas,
				maxPriorityFeePerGas,
				chainId,
				type: 2,
			});

			const result = await signEthereumTransaction(client, txRequest, addressIndex);
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

		case 'signLegacyTransaction': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const data = this.getNodeParameter('data', index) as string;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;
			const nonce = this.getNodeParameter('nonce', index) as number;
			const gasPrice = this.getNodeParameter('gasPrice', index) as string;
			const chainId = this.getNodeParameter('chainId', index) as number;

			const txRequest = buildTransactionRequest({
				to: toAddress,
				value,
				data,
				gasLimit,
				nonce,
				gasPrice,
				chainId,
				type: 0,
			});

			const result = await signEthereumTransaction(client, txRequest, addressIndex);
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

		case 'signMessage':
		case 'signPersonalMessage': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const message = this.getNodeParameter('message', index) as string;
			const result = await signMessage(client, message, addressIndex);
			return [{
				json: {
					success: true,
					signature: result.signature,
					message,
					signer: result.signer,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signTypedData': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const typedDataJson = this.getNodeParameter('typedData', index) as object;
			const result = await signTypedData(client, typedDataJson, addressIndex);
			return [{
				json: {
					success: true,
					signature: result.signature,
					signer: result.signer,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			return [{
				json: {
					address,
					balance: '0',
					unit: 'wei',
					note: 'Balance retrieval requires network credentials',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getNonce': {
			const address = this.getNodeParameter('address', index) as string;
			return [{
				json: {
					address,
					nonce: 0,
					note: 'Nonce retrieval requires network credentials',
				},
				pairedItem: { item: index },
			}];
		}

		case 'estimateGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const data = this.getNodeParameter('data', index) as string;
			return [{
				json: {
					to: toAddress,
					value,
					data,
					estimatedGas: '21000',
					note: 'Gas estimation requires network credentials',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getTokenBalances': {
			const address = this.getNodeParameter('address', index) as string;
			const tokenAddresses = this.getNodeParameter('tokenAddresses', index) as string;
			const tokens = tokenAddresses.split(',').map(t => t.trim()).filter(t => t);
			return [{
				json: {
					address,
					tokens: tokens.map(t => ({ token: t, balance: '0' })),
					note: 'Token balance retrieval requires network credentials',
				},
				pairedItem: { item: index },
			}];
		}

		case 'broadcastTransaction': {
			const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
			return [{
				json: {
					signedTransaction,
					broadcasted: false,
					note: 'Transaction broadcast requires network credentials',
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
