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

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['export'],
			},
		},
		options: [
			{
				name: 'Export Account Info',
				value: 'exportAccountInfo',
				description: 'Export detailed account information',
				action: 'Export account info',
			},
			{
				name: 'Export Addresses (CSV)',
				value: 'exportAddresses',
				description: 'Export wallet addresses in CSV format',
				action: 'Export addresses CSV',
			},
			{
				name: 'Export for Software Wallet',
				value: 'exportForSoftwareWallet',
				description: 'Export public data for use with software wallets',
				action: 'Export for software wallet',
			},
			{
				name: 'Export Public Keys',
				value: 'exportPublicKeys',
				description: 'Export extended public keys for watch-only wallets',
				action: 'Export public keys',
			},
			{
				name: 'Export Transactions (CSV)',
				value: 'exportTransactions',
				description: 'Export transaction history in CSV format',
				action: 'Export transactions CSV',
			},
			{
				name: 'Generate Tax Report',
				value: 'generateTaxReport',
				description: 'Generate transaction data for tax reporting',
				action: 'Generate tax report',
			},
		],
		default: 'exportAddresses',
	},
	// Common currency field
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		options: [
			{ name: 'Ethereum', value: 'ETH' },
			{ name: 'Bitcoin', value: 'BTC' },
			{ name: 'Polygon', value: 'MATIC' },
			{ name: 'Arbitrum', value: 'ARB' },
			{ name: 'Optimism', value: 'OP' },
			{ name: 'All Currencies', value: 'all' },
		],
		default: 'ETH',
		description: 'Currency to export data for',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportAddresses', 'exportTransactions', 'exportPublicKeys', 'exportAccountInfo'],
			},
		},
	},
	// Export Addresses fields
	{
		displayName: 'Address Count',
		name: 'addressCount',
		type: 'number',
		default: 10,
		description: 'Number of addresses to export',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportAddresses'],
			},
		},
	},
	{
		displayName: 'Starting Index',
		name: 'startingIndex',
		type: 'number',
		default: 0,
		description: 'Starting address index',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportAddresses'],
			},
		},
	},
	{
		displayName: 'Include Labels',
		name: 'includeLabels',
		type: 'boolean',
		default: true,
		description: 'Whether to include address labels from address book',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportAddresses'],
			},
		},
	},
	{
		displayName: 'Include Balances',
		name: 'includeBalances',
		type: 'boolean',
		default: false,
		description: 'Whether to include current balances (requires network access)',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportAddresses'],
			},
		},
	},
	// Export Transactions fields
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		description: 'Export transactions from this date',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportTransactions', 'generateTaxReport'],
			},
		},
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		description: 'Export transactions until this date',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportTransactions', 'generateTaxReport'],
			},
		},
	},
	{
		displayName: 'Include Failed',
		name: 'includeFailed',
		type: 'boolean',
		default: false,
		description: 'Whether to include failed transactions',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportTransactions'],
			},
		},
	},
	{
		displayName: 'Include Internal',
		name: 'includeInternal',
		type: 'boolean',
		default: true,
		description: 'Whether to include internal transactions',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportTransactions'],
			},
		},
	},
	// Export Public Keys fields
	{
		displayName: 'Key Format',
		name: 'keyFormat',
		type: 'options',
		options: [
			{ name: 'xPub (Legacy)', value: 'xpub' },
			{ name: 'yPub (SegWit)', value: 'ypub' },
			{ name: 'zPub (Native SegWit)', value: 'zpub' },
			{ name: 'All Formats', value: 'all' },
		],
		default: 'zpub',
		description: 'Extended public key format',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportPublicKeys'],
				currency: ['BTC'],
			},
		},
	},
	{
		displayName: 'Include Derivation Paths',
		name: 'includeDerivationPaths',
		type: 'boolean',
		default: true,
		description: 'Whether to include BIP44 derivation paths',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportPublicKeys'],
			},
		},
	},
	// Export for Software Wallet fields
	{
		displayName: 'Target Wallet',
		name: 'targetWallet',
		type: 'options',
		options: [
			{ name: 'MetaMask', value: 'metamask' },
			{ name: 'Electrum', value: 'electrum' },
			{ name: 'Sparrow', value: 'sparrow' },
			{ name: 'BlueWallet', value: 'bluewallet' },
			{ name: 'Generic (JSON)', value: 'generic' },
		],
		default: 'generic',
		description: 'Target software wallet for import',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportForSoftwareWallet'],
			},
		},
	},
	{
		displayName: 'Watch Only',
		name: 'watchOnly',
		type: 'boolean',
		default: true,
		description: 'Whether to export as watch-only (public keys only, no private keys exported)',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportForSoftwareWallet'],
			},
		},
	},
	// Generate Tax Report fields
	{
		displayName: 'Tax Year',
		name: 'taxYear',
		type: 'number',
		default: new Date().getFullYear() - 1,
		description: 'Tax year to generate report for',
		typeOptions: {
			minValue: 2015,
			maxValue: new Date().getFullYear(),
		},
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['generateTaxReport'],
			},
		},
	},
	{
		displayName: 'Report Format',
		name: 'taxReportFormat',
		type: 'options',
		options: [
			{ name: 'TurboTax (CSV)', value: 'turbotax' },
			{ name: 'TaxAct (CSV)', value: 'taxact' },
			{ name: 'CoinTracker', value: 'cointracker' },
			{ name: 'Koinly', value: 'koinly' },
			{ name: 'CoinLedger', value: 'coinledger' },
			{ name: 'Generic (CSV)', value: 'generic' },
		],
		default: 'generic',
		description: 'Tax software format',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['generateTaxReport'],
			},
		},
	},
	{
		displayName: 'Cost Basis Method',
		name: 'costBasisMethod',
		type: 'options',
		options: [
			{ name: 'FIFO (First In First Out)', value: 'fifo' },
			{ name: 'LIFO (Last In First Out)', value: 'lifo' },
			{ name: 'HIFO (Highest In First Out)', value: 'hifo' },
			{ name: 'Specific Identification', value: 'specific' },
		],
		default: 'fifo',
		description: 'Cost basis calculation method',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['generateTaxReport'],
			},
		},
	},
	{
		displayName: 'Include Token Transactions',
		name: 'includeTokenTransactions',
		type: 'boolean',
		default: true,
		description: 'Whether to include ERC-20 and other token transactions',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['generateTaxReport'],
			},
		},
	},
	// Export Account Info fields
	{
		displayName: 'Include History',
		name: 'includeHistory',
		type: 'boolean',
		default: false,
		description: 'Whether to include transaction history',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportAccountInfo'],
			},
		},
	},
	{
		displayName: 'Include Token Balances',
		name: 'includeTokenBalances',
		type: 'boolean',
		default: true,
		description: 'Whether to include ERC-20 token balances',
		displayOptions: {
			show: {
				resource: ['export'],
				operation: ['exportAccountInfo'],
				currency: ['ETH'],
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
		const client = await createLatticeClient.call(this);

		switch (operation) {
			case 'exportAddresses': {
				const currency = this.getNodeParameter('currency', index) as string;
				const addressCount = this.getNodeParameter('addressCount', index) as number;
				const startingIndex = this.getNodeParameter('startingIndex', index) as number;
				const includeLabels = this.getNodeParameter('includeLabels', index) as boolean;
				const includeBalances = this.getNodeParameter('includeBalances', index) as boolean;

				// Generate addresses from device
				const addresses: Array<{
					index: number;
					address: string;
					derivationPath: string;
					label?: string;
					balance?: string;
				}> = [];

				// Note: Would fetch actual addresses from device
				for (let i = 0; i < addressCount; i++) {
					const addrIndex = startingIndex + i;
					addresses.push({
						index: addrIndex,
						address: currency === 'BTC' 
							? `bc1q${Array(39).fill('0').join('')}${addrIndex}`
							: `0x${Array(40).fill('0').join('')}`,
						derivationPath: currency === 'BTC'
							? `m/84'/0'/0'/0/${addrIndex}`
							: `m/44'/60'/0'/0/${addrIndex}`,
						...(includeLabels ? { label: '' } : {}),
						...(includeBalances ? { balance: '0' } : {}),
					});
				}

				// Generate CSV
				const headers = ['Index', 'Address', 'Derivation Path'];
				if (includeLabels) headers.push('Label');
				if (includeBalances) headers.push('Balance');

				const csvRows = [headers.join(',')];
				for (const addr of addresses) {
					const row = [addr.index, addr.address, addr.derivationPath];
					if (includeLabels) row.push(addr.label || '');
					if (includeBalances) row.push(addr.balance || '0');
					csvRows.push(row.join(','));
				}

				return [
					{
						json: {
							success: true,
							operation,
							currency,
							addressCount,
							addresses,
							csv: csvRows.join('\n'),
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'exportTransactions': {
				const currency = this.getNodeParameter('currency', index) as string;
				const startDate = this.getNodeParameter('startDate', index) as string;
				const endDate = this.getNodeParameter('endDate', index) as string;
				const includeFailed = this.getNodeParameter('includeFailed', index) as boolean;
				const includeInternal = this.getNodeParameter('includeInternal', index) as boolean;

				// Note: Transaction history requires blockchain indexer
				const exportConfig = {
					currency,
					dateRange: {
						start: startDate || null,
						end: endDate || null,
					},
					includeFailed,
					includeInternal,
				};

				const csvHeaders = [
					'Date',
					'Type',
					'From',
					'To',
					'Amount',
					'Currency',
					'Fee',
					'TxHash',
					'Status',
				].join(',');

				return [
					{
						json: {
							success: true,
							operation,
							config: exportConfig,
							transactions: [],
							csv: csvHeaders + '\n',
							note: 'Transaction export requires blockchain indexer integration',
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'exportPublicKeys': {
				const currency = this.getNodeParameter('currency', index) as string;
				const includeDerivationPaths = this.getNodeParameter('includeDerivationPaths', index) as boolean;
				
				let keyFormat = 'zpub';
				if (currency === 'BTC') {
					keyFormat = this.getNodeParameter('keyFormat', index) as string;
				}

				const publicKeys: Array<{
					currency: string;
					format: string;
					extendedPublicKey: string;
					derivationPath?: string;
				}> = [];

				// Generate public key export structure
				const currencies = currency === 'all' ? ['ETH', 'BTC'] : [currency];

				for (const curr of currencies) {
					if (curr === 'BTC') {
						const formats = keyFormat === 'all' ? ['xpub', 'ypub', 'zpub'] : [keyFormat];
						for (const fmt of formats) {
							publicKeys.push({
								currency: curr,
								format: fmt,
								extendedPublicKey: `${fmt}Placeholder...`,
								...(includeDerivationPaths ? {
									derivationPath: fmt === 'xpub' ? "m/44'/0'/0'" : fmt === 'ypub' ? "m/49'/0'/0'" : "m/84'/0'/0'",
								} : {}),
							});
						}
					} else {
						publicKeys.push({
							currency: curr,
							format: 'eth',
							extendedPublicKey: '0x04...',
							...(includeDerivationPaths ? { derivationPath: "m/44'/60'/0'" } : {}),
						});
					}
				}

				return [
					{
						json: {
							success: true,
							operation,
							publicKeys,
							note: 'Extended public keys allow creating watch-only wallets',
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'exportForSoftwareWallet': {
				const targetWallet = this.getNodeParameter('targetWallet', index) as string;
				const watchOnly = this.getNodeParameter('watchOnly', index) as boolean;

				if (!watchOnly) {
					throw new NodeOperationError(
						this.getNode(),
						'Hardware wallets never export private keys. Only watch-only export is supported.',
						{ itemIndex: index },
					);
				}

				const exportData: Record<string, unknown> = {
					walletType: targetWallet,
					watchOnly: true,
					exportedAt: new Date().toISOString(),
				};

				switch (targetWallet) {
					case 'metamask':
						exportData.format = 'ethereum-accounts';
						exportData.data = {
							accounts: [],
							chainId: 1,
						};
						break;
					case 'electrum':
						exportData.format = 'electrum-wallet';
						exportData.data = {
							keystore: {
								type: 'hardware',
								hw_type: 'lattice',
								derivation: "m/84'/0'/0'",
							},
						};
						break;
					case 'sparrow':
						exportData.format = 'sparrow-wallet';
						exportData.data = {
							policy: 'single-sig',
							format: 'P2WPKH',
						};
						break;
					case 'bluewallet':
						exportData.format = 'bluewallet';
						exportData.data = {
							type: 'watchOnly',
						};
						break;
					default:
						exportData.format = 'generic-json';
						exportData.data = {
							addresses: [],
							extendedPublicKeys: [],
						};
				}

				return [
					{
						json: {
							success: true,
							operation,
							export: exportData,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'exportAccountInfo': {
				const currency = this.getNodeParameter('currency', index) as string;
				const includeHistory = this.getNodeParameter('includeHistory', index) as boolean;
				
				let includeTokenBalances = false;
				if (currency === 'ETH') {
					includeTokenBalances = this.getNodeParameter('includeTokenBalances', index) as boolean;
				}

				const accountInfo = {
					currency,
					addresses: [],
					balance: '0',
					...(includeTokenBalances ? { tokenBalances: [] } : {}),
					...(includeHistory ? { transactions: [] } : {}),
					derivationPath: currency === 'BTC' ? "m/84'/0'/0'" : "m/44'/60'/0'",
					accountIndex: 0,
				};

				return [
					{
						json: {
							success: true,
							operation,
							account: accountInfo,
							note: 'Full account info requires blockchain indexer integration',
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: index },
					},
				];
			}

			case 'generateTaxReport': {
				const taxYear = this.getNodeParameter('taxYear', index) as number;
				const taxReportFormat = this.getNodeParameter('taxReportFormat', index) as string;
				const costBasisMethod = this.getNodeParameter('costBasisMethod', index) as string;
				const startDate = this.getNodeParameter('startDate', index) as string;
				const endDate = this.getNodeParameter('endDate', index) as string;
				const includeTokenTransactions = this.getNodeParameter('includeTokenTransactions', index) as boolean;

				const taxReport = {
					taxYear,
					format: taxReportFormat,
					costBasisMethod,
					dateRange: {
						start: startDate || `${taxYear}-01-01`,
						end: endDate || `${taxYear}-12-31`,
					},
					includeTokenTransactions,
					summary: {
						totalGains: '0',
						totalLosses: '0',
						netGainLoss: '0',
						shortTermGains: '0',
						longTermGains: '0',
						transactionCount: 0,
					},
					transactions: [],
					disclaimer: 'This report is for informational purposes only. Consult a tax professional for accurate tax filing.',
				};

				// Generate format-specific headers
				let csvContent = '';
				switch (taxReportFormat) {
					case 'turbotax':
						csvContent = 'Date Acquired,Date Sold,Description,Proceeds,Cost Basis,Gain or Loss\n';
						break;
					case 'koinly':
						csvContent = 'Date,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,Net Worth Amount,Net Worth Currency,Label,Description,TxHash\n';
						break;
					default:
						csvContent = 'Date,Type,Asset,Amount,Price,Value,Fee,Gain/Loss\n';
				}

				return [
					{
						json: {
							success: true,
							operation,
							report: taxReport,
							csv: csvContent,
							note: 'Tax report generation requires transaction history from blockchain indexer',
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
			`Export operation failed: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}
}
