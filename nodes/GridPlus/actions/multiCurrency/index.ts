/**
 * Multi-Currency Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { EVM_CHAINS, SUPPORTED_CURRENCIES, BITCOIN_NETWORKS } from '../../constants/chains';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
			},
		},
		options: [
			{ name: 'Add Custom Token', value: 'addCustomToken', action: 'Add custom token' },
			{ name: 'Get All Balances', value: 'getAllBalances', action: 'Get all balances' },
			{ name: 'Get Exchange Rates', value: 'getExchangeRates', action: 'Get exchange rates' },
			{ name: 'Get Portfolio Value', value: 'getPortfolioValue', action: 'Get portfolio value' },
			{ name: 'Get Supported Currencies', value: 'getSupportedCurrencies', action: 'Get supported currencies' },
			{ name: 'Get Token Info', value: 'getTokenInfo', action: 'Get token info' },
			{ name: 'Get Transaction History', value: 'getTransactionHistory', action: 'Get transaction history' },
		],
		default: 'getSupportedCurrencies',
	},
	// Address
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['getAllBalances', 'getPortfolioValue', 'getTransactionHistory'],
			},
		},
		default: '',
		required: true,
		description: 'Wallet address',
	},
	// Token contract address
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['addCustomToken', 'getTokenInfo'],
			},
		},
		default: '',
		required: true,
		description: 'Token contract address',
	},
	// Token details for custom token
	{
		displayName: 'Token Symbol',
		name: 'tokenSymbol',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['addCustomToken'],
			},
		},
		default: '',
		description: 'Token symbol (e.g., USDC)',
	},
	{
		displayName: 'Token Name',
		name: 'tokenName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['addCustomToken'],
			},
		},
		default: '',
		description: 'Token name (e.g., USD Coin)',
	},
	{
		displayName: 'Decimals',
		name: 'tokenDecimals',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['addCustomToken'],
			},
		},
		default: 18,
		description: 'Token decimals',
	},
	// Chain for token
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['addCustomToken', 'getTokenInfo', 'getAllBalances', 'getTransactionHistory'],
			},
		},
		options: [
			{ name: 'All Chains', value: 'all' },
			...Object.entries(EVM_CHAINS).map(([key, chain]) => ({
				name: chain.name,
				value: key,
			})),
		],
		default: 'all',
		description: 'Blockchain network',
	},
	// Currencies for exchange rates
	{
		displayName: 'Currencies',
		name: 'currencies',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['getExchangeRates'],
			},
		},
		default: 'ETH,BTC,MATIC',
		description: 'Comma-separated list of currencies',
	},
	// Fiat currency
	{
		displayName: 'Fiat Currency',
		name: 'fiatCurrency',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['multiCurrency'],
				operation: ['getPortfolioValue', 'getExchangeRates'],
			},
		},
		options: [
			{ name: 'USD', value: 'usd' },
			{ name: 'EUR', value: 'eur' },
			{ name: 'GBP', value: 'gbp' },
			{ name: 'JPY', value: 'jpy' },
		],
		default: 'usd',
		description: 'Fiat currency for valuation',
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
		case 'getSupportedCurrencies': {
			const evmChains = Object.entries(EVM_CHAINS).map(([key, chain]) => ({
				id: key,
				name: chain.name,
				currency: chain.currency,
				chainId: chain.chainId,
				type: 'evm',
			}));

			const bitcoinNetworks = Object.entries(BITCOIN_NETWORKS).map(([key, network]) => ({
				id: key,
				name: network.name,
				currency: 'BTC',
				type: 'bitcoin',
			}));

			return [{
				json: {
					evmChains,
					bitcoinNetworks,
					tokens: SUPPORTED_CURRENCIES,
					totalChains: evmChains.length + bitcoinNetworks.length,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAllBalances': {
			const address = this.getNodeParameter('address', index) as string;
			const chain = this.getNodeParameter('chain', index) as string;

			return [{
				json: {
					address,
					chain: chain === 'all' ? 'All Chains' : chain,
					balances: [],
					note: 'Balance retrieval requires network RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getPortfolioValue': {
			const address = this.getNodeParameter('address', index) as string;
			const fiatCurrency = this.getNodeParameter('fiatCurrency', index) as string;

			return [{
				json: {
					address,
					fiatCurrency,
					totalValue: '0',
					assets: [],
					note: 'Portfolio valuation requires price API access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'addCustomToken': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const tokenSymbol = this.getNodeParameter('tokenSymbol', index) as string;
			const tokenName = this.getNodeParameter('tokenName', index) as string;
			const tokenDecimals = this.getNodeParameter('tokenDecimals', index) as number;
			const chain = this.getNodeParameter('chain', index) as string;

			return [{
				json: {
					success: true,
					token: {
						address: tokenAddress,
						symbol: tokenSymbol,
						name: tokenName,
						decimals: tokenDecimals,
						chain,
					},
					addedAt: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'getTokenInfo': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const chain = this.getNodeParameter('chain', index) as string;

			return [{
				json: {
					tokenAddress,
					chain,
					info: null,
					note: 'Token info requires network RPC access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getExchangeRates': {
			const currenciesStr = this.getNodeParameter('currencies', index) as string;
			const fiatCurrency = this.getNodeParameter('fiatCurrency', index) as string;
			const currencies = currenciesStr.split(',').map(c => c.trim()).filter(c => c);

			return [{
				json: {
					currencies,
					fiatCurrency,
					rates: currencies.map(c => ({ currency: c, rate: null })),
					note: 'Exchange rates require price API access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getTransactionHistory': {
			const address = this.getNodeParameter('address', index) as string;
			const chain = this.getNodeParameter('chain', index) as string;

			return [{
				json: {
					address,
					chain: chain === 'all' ? 'All Chains' : chain,
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
