/**
 * DeFi Resource Actions
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
				resource: ['defi'],
			},
		},
		options: [
			{ name: 'Decode Transaction', value: 'decodeTransaction', action: 'Decode transaction' },
			{ name: 'Get Contract Info', value: 'getContractInfo', action: 'Get contract info' },
			{ name: 'Get DeFi Positions', value: 'getDefiPositions', action: 'Get DeFi positions' },
			{ name: 'Get Token Approval', value: 'getTokenApproval', action: 'Get token approval' },
			{ name: 'Revoke Approval', value: 'revokeApproval', action: 'Revoke approval' },
			{ name: 'Sign DeFi Transaction', value: 'signDefiTransaction', action: 'Sign DeFi transaction' },
			{ name: 'Simulate Transaction', value: 'simulateTransaction', action: 'Simulate transaction' },
			{ name: 'Verify Contract', value: 'verifyContract', action: 'Verify contract' },
		],
		default: 'getDefiPositions',
	},
	// Chain
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['defi'],
			},
		},
		options: Object.entries(EVM_CHAINS).map(([key, chain]) => ({
			name: chain.name,
			value: key,
		})),
		default: 'ethereum',
		description: 'Blockchain network',
	},
	// Address
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getDefiPositions', 'getTokenApproval'],
			},
		},
		default: '',
		required: true,
		description: 'Wallet address',
	},
	// Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getContractInfo', 'verifyContract', 'revokeApproval'],
			},
		},
		default: '',
		required: true,
		description: 'Smart contract address',
	},
	// Token address for approvals
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getTokenApproval', 'revokeApproval'],
			},
		},
		default: '',
		required: true,
		description: 'ERC20 token address',
	},
	// Spender address
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getTokenApproval', 'revokeApproval'],
			},
		},
		default: '',
		required: true,
		description: 'Spender (protocol) address',
	},
	// Transaction data for decode/simulate
	{
		displayName: 'Transaction Data',
		name: 'transactionData',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['decodeTransaction', 'simulateTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Hex-encoded transaction data',
	},
	// To address for simulation
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['simulateTransaction', 'signDefiTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Contract or recipient address',
	},
	// Value for transaction
	{
		displayName: 'Value (Wei)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['simulateTransaction', 'signDefiTransaction'],
			},
		},
		default: '0',
		description: 'Transaction value in Wei',
	},
	// Signer index
	{
		displayName: 'Signer Index',
		name: 'signerIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['signDefiTransaction', 'revokeApproval'],
			},
		},
		default: 0,
		description: 'Index of the signing address',
	},
	// Gas parameters
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['signDefiTransaction', 'revokeApproval'],
			},
		},
		default: '100000',
		description: 'Gas limit',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createLatticeClient(this);
	await client.connect();

	const chain = this.getNodeParameter('chain', index) as string;
	const chainConfig = EVM_CHAINS[chain as keyof typeof EVM_CHAINS];

	switch (operation) {
		case 'getDefiPositions': {
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;

			return [{
				json: {
					chain,
					walletAddress,
					positions: [],
					totalValue: '0',
					note: 'DeFi position tracking requires external API integration',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getContractInfo': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			return [{
				json: {
					chain,
					contractAddress,
					info: null,
					note: 'Contract info requires network RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'verifyContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			return [{
				json: {
					chain,
					contractAddress,
					verified: false,
					note: 'Contract verification requires block explorer API',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getTokenApproval': {
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;

			return [{
				json: {
					chain,
					walletAddress,
					tokenAddress,
					spenderAddress,
					allowance: '0',
					note: 'Approval check requires network RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'revokeApproval': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			const signerIndex = this.getNodeParameter('signerIndex', index) as number;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;

			// ERC20 approve(spender, 0) to revoke
			const approveData = `0x095ea7b3${spenderAddress.slice(2).padStart(64, '0')}${'0'.repeat(64)}`;

			const txRequest = buildTransactionRequest({
				to: tokenAddress,
				value: '0',
				data: approveData,
				gasLimit,
				nonce: 0,
				maxFeePerGas: '30000000000',
				maxPriorityFeePerGas: '1500000000',
				chainId: chainConfig?.chainId || 1,
				type: 2,
			});

			const result = await signEthereumTransaction(client, txRequest, signerIndex);

			return [{
				json: {
					success: true,
					chain,
					tokenAddress,
					spenderAddress,
					signedTransaction: result.signedTransaction,
					hash: result.hash,
				},
				pairedItem: { item: index },
			}];
		}

		case 'decodeTransaction': {
			const transactionData = this.getNodeParameter('transactionData', index) as string;

			// Basic function selector extraction
			const functionSelector = transactionData.slice(0, 10);

			return [{
				json: {
					chain,
					transactionData,
					functionSelector,
					decoded: null,
					note: 'Full decoding requires ABI lookup',
				},
				pairedItem: { item: index },
			}];
		}

		case 'simulateTransaction': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const transactionData = this.getNodeParameter('transactionData', index) as string;

			return [{
				json: {
					chain,
					to: toAddress,
					value,
					data: transactionData,
					simulation: null,
					note: 'Transaction simulation requires trace API',
				},
				pairedItem: { item: index },
			}];
		}

		case 'signDefiTransaction': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index) as string;
			const transactionData = this.getNodeParameter('transactionData', index) as string;
			const signerIndex = this.getNodeParameter('signerIndex', index) as number;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;

			const txRequest = buildTransactionRequest({
				to: toAddress,
				value,
				data: transactionData,
				gasLimit,
				nonce: 0,
				maxFeePerGas: '30000000000',
				maxPriorityFeePerGas: '1500000000',
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
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
