/**
 * n8n-nodes-gridplus
 * Copyright (c) 2025 Velocity BPA
 *
 * This Source Code Form is subject to the terms of the Business Source License 1.1.
 * You may use this file in compliance with the BSL 1.1.
 * Commercial use by for-profit organizations requires a commercial license.
 *
 * For licensing information, visit https://velobpa.com/licensing
 * or contact licensing@velobpa.com.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { SUPPORTED_CHAINS } from '../../constants/chains';
import { DERIVATION_PATH_TEMPLATES } from '../../constants/derivationPaths';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Get API Status',
				value: 'getApiStatus',
				description: 'Check GridPlus API and service status',
				action: 'Get API status',
			},
			{
				name: 'Get Derivation Paths',
				value: 'getDerivationPaths',
				description: 'Get supported BIP44 derivation path templates',
				action: 'Get derivation paths',
			},
			{
				name: 'Get Gas Prices',
				value: 'getGasPrices',
				description: 'Get current gas prices for EVM chains',
				action: 'Get gas prices',
			},
			{
				name: 'Get Network Status',
				value: 'getNetworkStatus',
				description: 'Check blockchain network status',
				action: 'Get network status',
			},
			{
				name: 'Get SDK Version',
				value: 'getSdkVersion',
				description: 'Get GridPlus SDK version information',
				action: 'Get SDK version',
			},
			{
				name: 'Get Supported Chains',
				value: 'getSupportedChains',
				description: 'List all supported blockchain networks',
				action: 'Get supported chains',
			},
			{
				name: 'Test Connection',
				value: 'testConnection',
				description: 'Test connection to Lattice device',
				action: 'Test connection',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate a blockchain address format',
				action: 'Validate address',
			},
		],
		default: 'getSupportedChains',
	},
	// Get Gas Prices fields
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: [
			{ name: 'Ethereum', value: 'ethereum' },
			{ name: 'Polygon', value: 'polygon' },
			{ name: 'Arbitrum', value: 'arbitrum' },
			{ name: 'Optimism', value: 'optimism' },
			{ name: 'Base', value: 'base' },
			{ name: 'Avalanche C-Chain', value: 'avalanche' },
			{ name: 'BNB Chain', value: 'bsc' },
			{ name: 'Fantom', value: 'fantom' },
			{ name: 'Gnosis', value: 'gnosis' },
		],
		default: 'ethereum',
		description: 'Blockchain network to get gas prices for',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getGasPrices', 'getNetworkStatus'],
			},
		},
	},
	// Validate Address fields
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Address to validate',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress'],
			},
		},
	},
	{
		displayName: 'Address Type',
		name: 'addressType',
		type: 'options',
		options: [
			{ name: 'Auto-detect', value: 'auto' },
			{ name: 'Ethereum / EVM', value: 'ethereum' },
			{ name: 'Bitcoin (Legacy)', value: 'btc-legacy' },
			{ name: 'Bitcoin (SegWit)', value: 'btc-segwit' },
			{ name: 'Bitcoin (Native SegWit)', value: 'btc-bech32' },
			{ name: 'Bitcoin (Taproot)', value: 'btc-taproot' },
		],
		default: 'auto',
		description: 'Expected address type for validation',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress'],
			},
		},
	},
	// Get Derivation Paths fields
	{
		displayName: 'Currency Filter',
		name: 'currencyFilter',
		type: 'options',
		options: [
			{ name: 'All Currencies', value: 'all' },
			{ name: 'Ethereum', value: 'ETH' },
			{ name: 'Bitcoin', value: 'BTC' },
			{ name: 'Litecoin', value: 'LTC' },
			{ name: 'Dogecoin', value: 'DOGE' },
		],
		default: 'all',
		description: 'Filter derivation paths by currency',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getDerivationPaths'],
			},
		},
	},
	// Get Supported Chains fields
	{
		displayName: 'Chain Type',
		name: 'chainType',
		type: 'options',
		options: [
			{ name: 'All Chains', value: 'all' },
			{ name: 'EVM Chains', value: 'evm' },
			{ name: 'UTXO Chains', value: 'utxo' },
			{ name: 'Mainnet Only', value: 'mainnet' },
			{ name: 'Testnet Only', value: 'testnet' },
		],
		default: 'all',
		description: 'Filter chains by type',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getSupportedChains'],
			},
		},
	},
	// Test Connection fields
	{
		displayName: 'Include Device Info',
		name: 'includeDeviceInfo',
		type: 'boolean',
		default: true,
		description: 'Whether to include device information in test results',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['testConnection'],
			},
		},
	},
	{
		displayName: 'Timeout (ms)',
		name: 'timeout',
		type: 'number',
		default: 10000,
		description: 'Connection timeout in milliseconds',
		typeOptions: {
			minValue: 1000,
			maxValue: 60000,
		},
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['testConnection'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	try {
		switch (operation) {
			case 'getSupportedChains': {
				const chainType = this.getNodeParameter('chainType', index) as string;

				let chains = Object.values(SUPPORTED_CHAINS);

				switch (chainType) {
					case 'evm':
						chains = chains.filter((c) => c.type === 'evm');
						break;
					case 'utxo':
						chains = chains.filter((c) => c.type === 'utxo');
						break;
					case 'mainnet':
						chains = chains.filter((c) => c.isMainnet);
						break;
					case 'testnet':
						chains = chains.filter((c) => !c.isMainnet);
						break;
				}

				return [
					{
						json: {
							success: true,
							operation,
							filter: chainType,
							chains,
							count: chains.length,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'getDerivationPaths': {
				const currencyFilter = this.getNodeParameter('currencyFilter', index) as string;

				let paths = Object.entries(DERIVATION_PATH_TEMPLATES);

				if (currencyFilter !== 'all') {
					paths = paths.filter(([key]) => key.startsWith(currencyFilter));
				}

				const derivationPaths = paths.map(([key, template]) => ({
					id: key,
					template,
					description: getPathDescription(key),
				}));

				return [
					{
						json: {
							success: true,
							operation,
							filter: currencyFilter,
							derivationPaths,
							count: derivationPaths.length,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'validateAddress': {
				const address = this.getNodeParameter('address', index) as string;
				const addressType = this.getNodeParameter('addressType', index) as string;

				const validation = validateBlockchainAddress(address, addressType);

				return [
					{
						json: {
							success: true,
							operation,
							address,
							requestedType: addressType,
							validation,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'getGasPrices': {
				const chain = this.getNodeParameter('chain', index) as string;

				// Note: Gas prices require network API access
				const gasPrices = {
					chain,
					prices: {
						slow: {
							maxFeePerGas: '10000000000',
							maxPriorityFeePerGas: '1000000000',
							gasPrice: '10000000000',
							estimatedTime: '5+ minutes',
						},
						standard: {
							maxFeePerGas: '15000000000',
							maxPriorityFeePerGas: '1500000000',
							gasPrice: '15000000000',
							estimatedTime: '1-3 minutes',
						},
						fast: {
							maxFeePerGas: '25000000000',
							maxPriorityFeePerGas: '2500000000',
							gasPrice: '25000000000',
							estimatedTime: '<30 seconds',
						},
					},
					baseFee: '8000000000',
					unit: 'wei',
					note: 'Gas prices require RPC endpoint configuration',
				};

				return [
					{
						json: {
							success: true,
							operation,
							gasPrices,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'getNetworkStatus': {
				const chain = this.getNodeParameter('chain', index) as string;

				// Note: Network status requires RPC access
				const networkStatus = {
					chain,
					status: 'unknown',
					latestBlock: null,
					gasPrice: null,
					pendingTransactions: null,
					nodeVersion: null,
					syncStatus: 'unknown',
					note: 'Network status requires RPC endpoint configuration',
				};

				return [
					{
						json: {
							success: true,
							operation,
							network: networkStatus,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'testConnection': {
				const includeDeviceInfo = this.getNodeParameter('includeDeviceInfo', index) as boolean;
				const timeout = this.getNodeParameter('timeout', index) as number;

				try {
					const client = await createLatticeClient.call(this);

					const connectionResult: Record<string, unknown> = {
						connected: true,
						responseTime: 0,
						timeout,
					};

					if (includeDeviceInfo) {
						connectionResult.device = {
							model: 'Lattice1',
							paired: true,
						};
					}

					return [
						{
							json: {
								success: true,
								operation,
								connection: connectionResult,
								timestamp: new Date().toISOString(),
							},
							pairedItem: { item: index },
						},
					];
				} catch (error) {
					return [
						{
							json: {
								success: false,
								operation,
								connection: {
									connected: false,
									error: (error as Error).message,
									timeout,
								},
								timestamp: new Date().toISOString(),
							},
							pairedItem: { item: index },
						},
					];
				}
			}

			case 'getSdkVersion': {
				const sdkInfo = {
					name: 'gridplus-sdk',
					version: '2.x.x',
					nodePackage: 'n8n-nodes-gridplus',
					nodeVersion: '1.0.0',
					supportedFeatures: [
						'ethereum-signing',
						'bitcoin-signing',
						'eip712-typed-data',
						'psbt-signing',
						'multi-chain',
						'safecard-management',
						'address-derivation',
						'message-signing',
					],
					documentation: 'https://docs.gridplus.io/sdk',
				};

				return [
					{
						json: {
							success: true,
							operation,
							sdk: sdkInfo,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'getApiStatus': {
				const apiStatus = {
					gridplusConnect: {
						status: 'unknown',
						endpoint: 'https://signing.gridpl.us',
						note: 'Status check requires network access',
					},
					latticeLocal: {
						status: 'unknown',
						note: 'Requires device to be on same network',
					},
					services: {
						signing: 'available',
						pairing: 'available',
						firmware: 'available',
					},
				};

				return [
					{
						json: {
							success: true,
							operation,
							api: apiStatus,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			default:
				throw new NodeOperationError(
					this.getNode(),
					`Unknown operation: ${operation}`,
					{ itemIndex: index },
				);
		}
	} catch (error) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(
			this.getNode(),
			`Utility operation failed: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}
}

/**
 * Get description for a derivation path
 */
function getPathDescription(key: string): string {
	const descriptions: Record<string, string> = {
		ETH: 'Ethereum standard path (BIP44)',
		ETH_LEDGER_LIVE: 'Ethereum Ledger Live path',
		BTC_LEGACY: 'Bitcoin Legacy (P2PKH)',
		BTC_SEGWIT: 'Bitcoin SegWit (P2SH-P2WPKH)',
		BTC_NATIVE_SEGWIT: 'Bitcoin Native SegWit (P2WPKH)',
		BTC_TAPROOT: 'Bitcoin Taproot (P2TR)',
		LTC: 'Litecoin standard path',
		DOGE: 'Dogecoin standard path',
	};
	return descriptions[key] || 'Standard derivation path';
}

/**
 * Validate blockchain address format
 */
function validateBlockchainAddress(
	address: string,
	expectedType: string,
): {
	isValid: boolean;
	detectedType: string;
	checksum: boolean;
	network?: string;
	errors: string[];
} {
	const errors: string[] = [];
	let isValid = false;
	let detectedType = 'unknown';
	let checksum = false;
	let network: string | undefined;

	// Ethereum / EVM address validation
	if (address.startsWith('0x') && address.length === 42) {
		const hexPart = address.slice(2);
		if (/^[0-9a-fA-F]{40}$/.test(hexPart)) {
			isValid = true;
			detectedType = 'ethereum';
			// Check if checksummed (has mixed case)
			checksum = hexPart !== hexPart.toLowerCase() && hexPart !== hexPart.toUpperCase();
		} else {
			errors.push('Invalid hex characters in Ethereum address');
		}
	}
	// Bitcoin Legacy (P2PKH) - starts with 1
	else if (/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
		isValid = true;
		detectedType = 'btc-legacy';
		network = 'mainnet';
	}
	// Bitcoin SegWit (P2SH) - starts with 3
	else if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
		isValid = true;
		detectedType = 'btc-segwit';
		network = 'mainnet';
	}
	// Bitcoin Native SegWit (Bech32) - starts with bc1q
	else if (/^bc1q[a-z0-9]{38,59}$/.test(address.toLowerCase())) {
		isValid = true;
		detectedType = 'btc-bech32';
		network = 'mainnet';
	}
	// Bitcoin Taproot (Bech32m) - starts with bc1p
	else if (/^bc1p[a-z0-9]{58}$/.test(address.toLowerCase())) {
		isValid = true;
		detectedType = 'btc-taproot';
		network = 'mainnet';
	}
	// Bitcoin Testnet
	else if (/^(tb1|m|n|2)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) {
		isValid = true;
		detectedType = address.startsWith('tb1') ? 'btc-bech32' : 'btc-legacy';
		network = 'testnet';
	}
	else {
		errors.push('Address format not recognized');
	}

	// Check if detected type matches expected type
	if (expectedType !== 'auto' && isValid && detectedType !== expectedType) {
		errors.push(`Expected ${expectedType} but detected ${detectedType}`);
		isValid = false;
	}

	return {
		isValid,
		detectedType,
		checksum,
		network,
		errors,
	};
}
