/**
 * NFT Resource Actions
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
				resource: ['nft'],
			},
		},
		options: [
			{ name: 'Approve NFT', value: 'approveNft', action: 'Approve NFT' },
			{ name: 'Get Floor Price', value: 'getFloorPrice', action: 'Get floor price' },
			{ name: 'Get NFT Collections', value: 'getNftCollections', action: 'Get NFT collections' },
			{ name: 'Get NFT Info', value: 'getNftInfo', action: 'Get NFT info' },
			{ name: 'Get NFTs', value: 'getNfts', action: 'Get NFTs' },
			{ name: 'Sign NFT Transaction', value: 'signNftTransaction', action: 'Sign NFT transaction' },
			{ name: 'Transfer NFT', value: 'transferNft', action: 'Transfer NFT' },
		],
		default: 'getNfts',
	},
	// Chain
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['nft'],
			},
		},
		options: Object.entries(EVM_CHAINS).map(([key, chain]) => ({
			name: chain.name,
			value: key,
		})),
		default: 'ethereum',
		description: 'Blockchain network',
	},
	// Wallet address
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNfts', 'getNftCollections'],
			},
		},
		default: '',
		required: true,
		description: 'Wallet address to query NFTs for',
	},
	// Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftInfo', 'getFloorPrice', 'transferNft', 'approveNft', 'signNftTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'NFT contract address',
	},
	// Token ID
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftInfo', 'transferNft', 'approveNft'],
			},
		},
		default: '',
		required: true,
		description: 'NFT token ID',
	},
	// NFT Standard
	{
		displayName: 'NFT Standard',
		name: 'nftStandard',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft', 'approveNft', 'signNftTransaction'],
			},
		},
		options: [
			{ name: 'ERC-721', value: 'erc721' },
			{ name: 'ERC-1155', value: 'erc1155' },
		],
		default: 'erc721',
		description: 'NFT token standard',
	},
	// Recipient address
	{
		displayName: 'Recipient Address',
		name: 'recipientAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft'],
			},
		},
		default: '',
		required: true,
		description: 'Address to transfer NFT to',
	},
	// Operator address for approvals
	{
		displayName: 'Operator Address',
		name: 'operatorAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['approveNft'],
			},
		},
		default: '',
		required: true,
		description: 'Address to approve for NFT operations',
	},
	// Amount for ERC-1155
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft'],
				nftStandard: ['erc1155'],
			},
		},
		default: 1,
		description: 'Amount of tokens to transfer (for ERC-1155)',
	},
	// Signer index
	{
		displayName: 'Signer Index',
		name: 'signerIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft', 'approveNft', 'signNftTransaction'],
			},
		},
		default: 0,
		description: 'Index of the signing address',
	},
	// Transaction data for custom NFT tx
	{
		displayName: 'Transaction Data',
		name: 'transactionData',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['signNftTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Hex-encoded transaction data',
	},
	// Gas limit
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft', 'approveNft', 'signNftTransaction'],
			},
		},
		default: '100000',
		description: 'Gas limit for the transaction',
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
		case 'getNfts': {
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;

			return [{
				json: {
					chain,
					walletAddress,
					nfts: [],
					note: 'NFT retrieval requires indexer API access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getNftInfo': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const tokenId = this.getNodeParameter('tokenId', index) as string;

			return [{
				json: {
					chain,
					contractAddress,
					tokenId,
					metadata: null,
					note: 'NFT metadata requires IPFS/API access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getNftCollections': {
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;

			return [{
				json: {
					chain,
					walletAddress,
					collections: [],
					note: 'Collection data requires indexer API',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getFloorPrice': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			return [{
				json: {
					chain,
					contractAddress,
					floorPrice: null,
					currency: chainConfig?.currency || 'ETH',
					note: 'Floor price requires marketplace API',
				},
				pairedItem: { item: index },
			}];
		}

		case 'transferNft': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const recipientAddress = this.getNodeParameter('recipientAddress', index) as string;
			const nftStandard = this.getNodeParameter('nftStandard', index) as string;
			const signerIndex = this.getNodeParameter('signerIndex', index) as number;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;

			let data: string;
			if (nftStandard === 'erc721') {
				// transferFrom(from, to, tokenId)
				const fromPlaceholder = '0'.repeat(64);
				const toHex = recipientAddress.slice(2).padStart(64, '0');
				const tokenIdHex = BigInt(tokenId).toString(16).padStart(64, '0');
				data = `0x23b872dd${fromPlaceholder}${toHex}${tokenIdHex}`;
			} else {
				// safeTransferFrom(from, to, id, amount, data)
				const amount = this.getNodeParameter('amount', index) as number;
				const fromPlaceholder = '0'.repeat(64);
				const toHex = recipientAddress.slice(2).padStart(64, '0');
				const tokenIdHex = BigInt(tokenId).toString(16).padStart(64, '0');
				const amountHex = BigInt(amount).toString(16).padStart(64, '0');
				data = `0xf242432a${fromPlaceholder}${toHex}${tokenIdHex}${amountHex}${'00'.repeat(32)}`;
			}

			const txRequest = buildTransactionRequest({
				to: contractAddress,
				value: '0',
				data,
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
					contractAddress,
					tokenId,
					recipient: recipientAddress,
					signedTransaction: result.signedTransaction,
					hash: result.hash,
				},
				pairedItem: { item: index },
			}];
		}

		case 'approveNft': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const operatorAddress = this.getNodeParameter('operatorAddress', index) as string;
			const nftStandard = this.getNodeParameter('nftStandard', index) as string;
			const signerIndex = this.getNodeParameter('signerIndex', index) as number;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;

			let data: string;
			if (nftStandard === 'erc721') {
				// approve(to, tokenId)
				const toHex = operatorAddress.slice(2).padStart(64, '0');
				const tokenIdHex = BigInt(tokenId).toString(16).padStart(64, '0');
				data = `0x095ea7b3${toHex}${tokenIdHex}`;
			} else {
				// setApprovalForAll(operator, approved)
				const operatorHex = operatorAddress.slice(2).padStart(64, '0');
				const approved = '1'.padStart(64, '0');
				data = `0xa22cb465${operatorHex}${approved}`;
			}

			const txRequest = buildTransactionRequest({
				to: contractAddress,
				value: '0',
				data,
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
					contractAddress,
					tokenId,
					operator: operatorAddress,
					signedTransaction: result.signedTransaction,
					hash: result.hash,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signNftTransaction': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const transactionData = this.getNodeParameter('transactionData', index) as string;
			const signerIndex = this.getNodeParameter('signerIndex', index) as number;
			const gasLimit = this.getNodeParameter('gasLimit', index) as string;

			const txRequest = buildTransactionRequest({
				to: contractAddress,
				value: '0',
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
					contractAddress,
					signedTransaction: result.signedTransaction,
					hash: result.hash,
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
