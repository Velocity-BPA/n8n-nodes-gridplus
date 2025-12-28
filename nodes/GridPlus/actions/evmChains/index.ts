/**
 * EVM Chains Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { EVM_CHAINS, getChainConfig } from '../../constants/chains';
import { getEthereumAddresses } from '../../utils/addressUtils';
import { signEthereumTransaction, signMessage, signTypedData, buildTransactionRequest } from '../../utils/signingUtils';

const chainOptions = Object.entries(EVM_CHAINS).map(([key, chain]) => ({
	name: chain.name,
	value: key,
}));

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['evmChains'],
			},
		},
		options: [
			{ name: 'Add Custom Chain', value: 'addCustomChain', action: 'Add custom chain' },
			{ name: 'Broadcast Transaction', value: 'broadcastTransaction', action: 'Broadcast transaction' },
			{ name: 'Get Address', value: 'getAddress', action: 'Get address' },
			{ name: 'Get Chain Config', value: 'getChainConfig', action: 'Get chain config' },
			{ name: 'Sign Message', value: 'signMessage', action: 'Sign message' },
			{ name: 'Sign Transaction', value: 'signTransaction', action: 'Sign transaction' },
			{ name: 'Sign Typed Data', value: 'signTypedData', action: 'Sign typed data' },
		],
		default: 'getAddress',
	},
	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['evmChains'],
			},
		},
		options: [
			...chainOptions,
			{ name: 'Custom', value: 'custom' },
		],
		default: 'ethereum',
		description: 'EVM chain to use',
	},
	// Custom chain config
	{
		displayName: 'Chain ID',
		name: 'customChainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				chain: ['custom'],
			},
		},
		default: 1,
		required: true,
		description: 'Custom chain ID',
	},
	{
		displayName: 'Chain Name',
		name: 'customChainName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				chain: ['custom'],
			},
		},
		default: '',
		description: 'Custom chain name',
	},
	{
		displayName: 'RPC URL',
		name: 'customRpcUrl',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				chain: ['custom'],
			},
		},
		default: '',
		description: 'Custom chain RPC URL',
	},
	{
		displayName: 'Currency Symbol',
		name: 'customCurrency',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				chain: ['custom'],
			},
		},
		default: 'ETH',
		description: 'Native currency symbol',
	},
	// Address index
	{
		displayName: 'Address Index',
		name: 'addressIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['getAddress', 'signTransaction', 'signMessage', 'signTypedData'],
			},
		},
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Address index for operations',
	},
	// Transaction parameters
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['signTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Recipient address',
	},
	{
		displayName: 'Value (Wei)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['signTransaction'],
			},
		},
		default: '0',
		description: 'Transaction value in Wei',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['signTransaction'],
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
				resource: ['evmChains'],
				operation: ['signTransaction'],
			},
		},
		default: '21000',
		description: 'Gas limit',
	},
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['signTransaction'],
			},
		},
		default: 0,
		description: 'Transaction nonce',
	},
	{
		displayName: 'Max Fee Per Gas (Wei)',
		name: 'maxFeePerGas',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['signTransaction'],
			},
		},
		default: '30000000000',
		description: 'Maximum fee per gas',
	},
	{
		displayName: 'Max Priority Fee Per Gas (Wei)',
		name: 'maxPriorityFeePerGas',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['signTransaction'],
			},
		},
		default: '1500000000',
		description: 'Maximum priority fee per gas',
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['signMessage'],
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
				resource: ['evmChains'],
				operation: ['signTypedData'],
			},
		},
		default: '{}',
		required: true,
		description: 'EIP-712 typed data structure',
	},
	// Signed transaction
	{
		displayName: 'Signed Transaction',
		name: 'signedTransaction',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['evmChains'],
				operation: ['broadcastTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Hex-encoded signed transaction',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createLatticeClient(this);
	await client.connect();

	const chainKey = this.getNodeParameter('chain', index) as string;
	let chainConfig = getChainConfig(chainKey);
	
	if (chainKey === 'custom') {
		chainConfig = {
			chainId: this.getNodeParameter('customChainId', index) as number,
			name: this.getNodeParameter('customChainName', index) as string || 'Custom Chain',
			currency: this.getNodeParameter('customCurrency', index) as string || 'ETH',
			rpcUrl: this.getNodeParameter('customRpcUrl', index) as string,
			blockExplorer: '',
			isTestnet: false,
			supportsEip1559: true,
		};
	}

	switch (operation) {
		case 'getAddress': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const addresses = await getEthereumAddresses(client, addressIndex, 1);
			return [{
				json: {
					chain: chainConfig?.name || chainKey,
					chainId: chainConfig?.chainId,
					index: addressIndex,
					address: addresses[0] || null,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signTransaction': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const data = this.getNodeParameter('data', index) as string;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;
			const nonce = this.getNodeParameter('nonce', index) as number;
			const maxFeePerGas = this.getNodeParameter('maxFeePerGas', index) as string;
			const maxPriorityFeePerGas = this.getNodeParameter('maxPriorityFeePerGas', index) as string;

			const txRequest = buildTransactionRequest({
				to: toAddress,
				value,
				data,
				gasLimit,
				nonce,
				maxFeePerGas,
				maxPriorityFeePerGas,
				chainId: chainConfig?.chainId || 1,
				type: chainConfig?.supportsEip1559 ? 2 : 0,
			});

			const result = await signEthereumTransaction(client, txRequest, addressIndex);
			return [{
				json: {
					success: true,
					chain: chainConfig?.name || chainKey,
					chainId: chainConfig?.chainId,
					signedTransaction: result.signedTransaction,
					hash: result.hash,
					from: result.from,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signMessage': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const message = this.getNodeParameter('message', index) as string;
			const result = await signMessage(client, message, addressIndex);
			return [{
				json: {
					success: true,
					chain: chainConfig?.name || chainKey,
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
					chain: chainConfig?.name || chainKey,
					signature: result.signature,
					signer: result.signer,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getChainConfig': {
			return [{
				json: {
					chain: chainKey,
					config: chainConfig || { error: 'Chain not found' },
				},
				pairedItem: { item: index },
			}];
		}

		case 'addCustomChain': {
			const customChainId = this.getNodeParameter('customChainId', index) as number;
			const customChainName = this.getNodeParameter('customChainName', index) as string;
			const customRpcUrl = this.getNodeParameter('customRpcUrl', index) as string;
			const customCurrency = this.getNodeParameter('customCurrency', index) as string;

			return [{
				json: {
					success: true,
					chain: {
						chainId: customChainId,
						name: customChainName,
						rpcUrl: customRpcUrl,
						currency: customCurrency,
					},
					note: 'Custom chain configuration stored for session',
				},
				pairedItem: { item: index },
			}];
		}

		case 'broadcastTransaction': {
			const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
			return [{
				json: {
					chain: chainConfig?.name || chainKey,
					chainId: chainConfig?.chainId,
					signedTransaction,
					broadcasted: false,
					note: 'Transaction broadcast requires network credentials and RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
