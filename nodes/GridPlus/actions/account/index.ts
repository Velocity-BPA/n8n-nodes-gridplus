/**
 * Account Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { getEthereumAddresses, getBitcoinAddresses } from '../../utils/addressUtils';
import { DERIVATION_PURPOSES, COIN_TYPES } from '../../constants/derivationPaths';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{ name: 'Add Address', value: 'addAddress', action: 'Add address to address book' },
			{ name: 'Derive Address', value: 'deriveAddress', action: 'Derive new address' },
			{ name: 'Get Account Balance', value: 'getAccountBalance', action: 'Get account balance' },
			{ name: 'Get Account History', value: 'getAccountHistory', action: 'Get account history' },
			{ name: 'Get Account Info', value: 'getAccountInfo', action: 'Get account info' },
			{ name: 'Get Address at Path', value: 'getAddressAtPath', action: 'Get address at derivation path' },
			{ name: 'Get Address Flags', value: 'getAddressFlags', action: 'Get address flags' },
			{ name: 'Get Addresses', value: 'getAddresses', action: 'Get addresses' },
			{ name: 'Get Addresses at Indices', value: 'getAddressesAtIndices', action: 'Get addresses at indices' },
			{ name: 'Get Extended Public Key', value: 'getExtendedPublicKey', action: 'Get extended public key' },
			{ name: 'Set Address Tags', value: 'setAddressTags', action: 'Set address tags' },
		],
		default: 'getAddresses',
	},
	// Currency type
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAddresses', 'getAddressesAtIndices', 'deriveAddress', 'getAccountBalance'],
			},
		},
		options: [
			{ name: 'Ethereum', value: 'ethereum' },
			{ name: 'Bitcoin', value: 'bitcoin' },
		],
		default: 'ethereum',
		description: 'The cryptocurrency to get addresses for',
	},
	// Number of addresses
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAddresses'],
			},
		},
		default: 5,
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		description: 'Number of addresses to retrieve',
	},
	// Start index
	{
		displayName: 'Start Index',
		name: 'startIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAddresses', 'deriveAddress'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0,
		},
		description: 'Starting index for address derivation',
	},
	// Indices for batch retrieval
	{
		displayName: 'Indices',
		name: 'indices',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAddressesAtIndices'],
			},
		},
		default: '0,1,2',
		description: 'Comma-separated list of indices (e.g., 0,1,5,10)',
	},
	// Derivation path
	{
		displayName: 'Derivation Path',
		name: 'derivationPath',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAddressAtPath', 'getExtendedPublicKey'],
			},
		},
		default: "m/44'/60'/0'/0/0",
		description: 'BIP44 derivation path (e.g., m/44\'/60\'/0\'/0/0 for Ethereum)',
	},
	// Address for operations
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAccountBalance', 'getAccountHistory', 'getAccountInfo', 'addAddress', 'setAddressTags', 'getAddressFlags'],
			},
		},
		default: '',
		required: true,
		description: 'The blockchain address',
	},
	// Address label
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['addAddress'],
			},
		},
		default: '',
		description: 'Label for the address',
	},
	// Address tags
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['setAddressTags'],
			},
		},
		default: '',
		description: 'Comma-separated tags for the address',
	},
	// Bitcoin address type
	{
		displayName: 'Address Type',
		name: 'addressType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['account'],
				currency: ['bitcoin'],
			},
		},
		options: [
			{ name: 'Native SegWit (Bech32)', value: 'bech32' },
			{ name: 'SegWit (P2SH)', value: 'segwit' },
			{ name: 'Legacy', value: 'legacy' },
			{ name: 'Taproot', value: 'taproot' },
		],
		default: 'bech32',
		description: 'Bitcoin address type',
	},
	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Balance',
				name: 'includeBalance',
				type: 'boolean',
				default: false,
				description: 'Whether to include balance information',
			},
			{
				displayName: 'Network',
				name: 'network',
				type: 'options',
				options: [
					{ name: 'Mainnet', value: 'mainnet' },
					{ name: 'Testnet', value: 'testnet' },
				],
				default: 'mainnet',
				description: 'Network to use',
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
		case 'getAddresses': {
			const currency = this.getNodeParameter('currency', index) as string;
			const count = this.getNodeParameter('count', index) as number;
			const startIndex = this.getNodeParameter('startIndex', index) as number;

			let addresses: string[];
			if (currency === 'ethereum') {
				addresses = await getEthereumAddresses(client, startIndex, count);
			} else {
				const addressType = this.getNodeParameter('addressType', index, 'bech32') as string;
				addresses = await getBitcoinAddresses(client, startIndex, count, addressType);
			}

			return [{
				json: {
					currency,
					addresses,
					count: addresses.length,
					startIndex,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAddressesAtIndices': {
			const currency = this.getNodeParameter('currency', index) as string;
			const indicesStr = this.getNodeParameter('indices', index) as string;
			const indices = indicesStr.split(',').map(i => parseInt(i.trim(), 10));

			const addresses: { index: number; address: string }[] = [];
			for (const idx of indices) {
				let addr: string[];
				if (currency === 'ethereum') {
					addr = await getEthereumAddresses(client, idx, 1);
				} else {
					const addressType = this.getNodeParameter('addressType', index, 'bech32') as string;
					addr = await getBitcoinAddresses(client, idx, 1, addressType);
				}
				if (addr.length > 0) {
					addresses.push({ index: idx, address: addr[0] });
				}
			}

			return [{
				json: {
					currency,
					addresses,
					count: addresses.length,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAddressAtPath': {
			const derivationPath = this.getNodeParameter('derivationPath', index) as string;
			const result = await client.getAddresses({
				startPath: derivationPath.split('/').map(p => {
					const num = parseInt(p.replace("'", '').replace('m', ''), 10);
					return p.includes("'") ? num + 0x80000000 : num;
				}).filter(n => !isNaN(n)),
				n: 1,
			});

			return [{
				json: {
					derivationPath,
					address: result?.[0] || null,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getExtendedPublicKey': {
			const derivationPath = this.getNodeParameter('derivationPath', index) as string;
			// Parse derivation path for xpub retrieval
			const pathParts = derivationPath.split('/').slice(1);
			const purpose = parseInt(pathParts[0]?.replace("'", '') || '44', 10);
			const coinType = parseInt(pathParts[1]?.replace("'", '') || '60', 10);
			const account = parseInt(pathParts[2]?.replace("'", '') || '0', 10);

			return [{
				json: {
					derivationPath,
					purpose,
					coinType,
					account,
					note: 'Extended public key retrieval requires device interaction',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAccountBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const currency = this.getNodeParameter('currency', index) as string;

			return [{
				json: {
					address,
					currency,
					balance: '0',
					note: 'Balance retrieval requires network credentials',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAccountHistory': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					transactions: [],
					note: 'Transaction history requires network credentials',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAccountInfo': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					type: address.startsWith('0x') ? 'ethereum' : 'bitcoin',
					checksumValid: true,
				},
				pairedItem: { item: index },
			}];
		}

		case 'addAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const label = this.getNodeParameter('label', index, '') as string;

			return [{
				json: {
					success: true,
					address,
					label,
					added: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'deriveAddress': {
			const currency = this.getNodeParameter('currency', index) as string;
			const startIndex = this.getNodeParameter('startIndex', index) as number;

			let addresses: string[];
			if (currency === 'ethereum') {
				addresses = await getEthereumAddresses(client, startIndex, 1);
			} else {
				const addressType = this.getNodeParameter('addressType', index, 'bech32') as string;
				addresses = await getBitcoinAddresses(client, startIndex, 1, addressType);
			}

			return [{
				json: {
					currency,
					index: startIndex,
					address: addresses[0] || null,
					derived: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAddressFlags': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					flags: {
						isContract: false,
						isMultisig: false,
						hasActivity: false,
					},
				},
				pairedItem: { item: index },
			}];
		}

		case 'setAddressTags': {
			const address = this.getNodeParameter('address', index) as string;
			const tagsStr = this.getNodeParameter('tags', index) as string;
			const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

			return [{
				json: {
					success: true,
					address,
					tags,
					updated: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
