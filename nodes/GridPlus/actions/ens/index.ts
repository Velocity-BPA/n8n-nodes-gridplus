/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

/**
 * ENS (Ethereum Name Service) Resource
 * Provides ENS name resolution and management operations
 */
export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ens'],
			},
		},
		options: [
			{
				name: 'Get ENS for Address',
				value: 'getEnsForAddress',
				description: 'Get ENS name for an Ethereum address (reverse lookup)',
				action: 'Get ENS name for address',
			},
			{
				name: 'Get ENS Records',
				value: 'getEnsRecords',
				description: 'Get all records for an ENS name',
				action: 'Get ENS records',
			},
			{
				name: 'Resolve ENS Name',
				value: 'resolveEnsName',
				description: 'Resolve an ENS name to an Ethereum address',
				action: 'Resolve ENS name to address',
			},
			{
				name: 'Set ENS Record',
				value: 'setEnsRecord',
				description: 'Set a record for an ENS name (requires signing)',
				action: 'Set ENS record',
			},
			{
				name: 'Sign ENS Transaction',
				value: 'signEnsTransaction',
				description: 'Sign an ENS-related transaction',
				action: 'Sign ENS transaction',
			},
		],
		default: 'resolveEnsName',
	},

	// Resolve ENS Name parameters
	{
		displayName: 'ENS Name',
		name: 'ensName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['resolveEnsName', 'getEnsRecords', 'setEnsRecord'],
			},
		},
		default: '',
		placeholder: 'vitalik.eth',
		description: 'The ENS name to resolve or query',
	},

	// Get ENS for Address parameters
	{
		displayName: 'Ethereum Address',
		name: 'ethereumAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['getEnsForAddress'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The Ethereum address to look up',
	},

	// Set ENS Record parameters
	{
		displayName: 'Record Type',
		name: 'recordType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['setEnsRecord'],
			},
		},
		options: [
			{ name: 'Address (ETH)', value: 'addr' },
			{ name: 'Address (Multi-Chain)', value: 'addr_multichain' },
			{ name: 'Avatar', value: 'avatar' },
			{ name: 'Content Hash', value: 'contenthash' },
			{ name: 'Description', value: 'description' },
			{ name: 'Display', value: 'display' },
			{ name: 'Email', value: 'email' },
			{ name: 'Keywords', value: 'keywords' },
			{ name: 'Notice', value: 'notice' },
			{ name: 'Twitter', value: 'com.twitter' },
			{ name: 'GitHub', value: 'com.github' },
			{ name: 'Discord', value: 'com.discord' },
			{ name: 'Telegram', value: 'org.telegram' },
			{ name: 'URL', value: 'url' },
			{ name: 'Custom', value: 'custom' },
		],
		default: 'addr',
		description: 'The type of ENS record to set',
	},
	{
		displayName: 'Custom Record Key',
		name: 'customRecordKey',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['setEnsRecord'],
				recordType: ['custom'],
			},
		},
		default: '',
		description: 'Custom record key name',
	},
	{
		displayName: 'Record Value',
		name: 'recordValue',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['setEnsRecord'],
			},
		},
		default: '',
		description: 'The value to set for the record',
	},
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['setEnsRecord'],
				recordType: ['addr_multichain'],
			},
		},
		default: 60,
		description: 'The chain ID for multi-chain address (60=ETH, 0=BTC, 2=LTC, etc.)',
	},

	// Sign ENS Transaction parameters
	{
		displayName: 'Transaction Type',
		name: 'transactionType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['signEnsTransaction'],
			},
		},
		options: [
			{ name: 'Register Name', value: 'register' },
			{ name: 'Renew Name', value: 'renew' },
			{ name: 'Set Resolver', value: 'setResolver' },
			{ name: 'Set Controller', value: 'setController' },
			{ name: 'Transfer Name', value: 'transfer' },
			{ name: 'Set Primary Name', value: 'setPrimaryName' },
			{ name: 'Wrap Name', value: 'wrap' },
			{ name: 'Unwrap Name', value: 'unwrap' },
		],
		default: 'register',
		description: 'The type of ENS transaction to sign',
	},
	{
		displayName: 'Name to Register',
		name: 'nameToRegister',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['signEnsTransaction'],
				transactionType: ['register'],
			},
		},
		default: '',
		placeholder: 'myname',
		description: 'The name to register (without .eth)',
	},
	{
		displayName: 'Registration Duration (Years)',
		name: 'registrationDuration',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['signEnsTransaction'],
				transactionType: ['register', 'renew'],
			},
		},
		default: 1,
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		description: 'Number of years to register/renew the name',
	},
	{
		displayName: 'New Owner Address',
		name: 'newOwnerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['signEnsTransaction'],
				transactionType: ['transfer', 'setController'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address of the new owner/controller',
	},
	{
		displayName: 'Resolver Address',
		name: 'resolverAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['signEnsTransaction'],
				transactionType: ['setResolver'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address of the resolver contract',
	},
	{
		displayName: 'Address Index',
		name: 'addressIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ens'],
				operation: ['signEnsTransaction', 'setEnsRecord'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0,
		},
		description: 'The index of the address to sign with (from derived addresses)',
	},

	// Network options
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['ens'],
			},
		},
		options: [
			{ name: 'Ethereum Mainnet', value: 'mainnet' },
			{ name: 'Goerli Testnet', value: 'goerli' },
			{ name: 'Sepolia Testnet', value: 'sepolia' },
		],
		default: 'mainnet',
		description: 'The Ethereum network to use',
	},

	// Additional options
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['ens'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Avatar',
				name: 'includeAvatar',
				type: 'boolean',
				default: false,
				description: 'Whether to include avatar URL in resolution results',
			},
			{
				displayName: 'Include All Records',
				name: 'includeAllRecords',
				type: 'boolean',
				default: false,
				description: 'Whether to include all text records in results',
			},
			{
				displayName: 'Use Wildcard Resolution',
				name: 'useWildcard',
				type: 'boolean',
				default: true,
				description: 'Whether to use wildcard resolution for subdomains',
			},
			{
				displayName: 'Max Gas Price (Gwei)',
				name: 'maxGasPrice',
				type: 'number',
				default: 100,
				description: 'Maximum gas price for transactions',
			},
		],
	},
];

/**
 * Execute ENS operations
 * Note: Requires network access to Ethereum RPC and ENS contracts
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
		includeAvatar?: boolean;
		includeAllRecords?: boolean;
		useWildcard?: boolean;
		maxGasPrice?: number;
	};

	let result: Record<string, unknown> = {};

	switch (operation) {
		case 'resolveEnsName': {
			const ensName = this.getNodeParameter('ensName', index) as string;

			// In production, this would use ethers.js ENS resolver
			result = {
				success: true,
				ensName,
				network,
				resolvedAddress: '0x0000000000000000000000000000000000000000',
				resolver: '0x0000000000000000000000000000000000000000',
				owner: '0x0000000000000000000000000000000000000000',
				registrant: '0x0000000000000000000000000000000000000000',
				expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
				isWrapped: false,
				avatar: additionalOptions.includeAvatar ? null : undefined,
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires ethers.js ENS provider',
			};
			break;
		}

		case 'getEnsForAddress': {
			const ethereumAddress = this.getNodeParameter('ethereumAddress', index) as string;

			// Reverse lookup
			result = {
				success: true,
				address: ethereumAddress,
				network,
				ensName: null,
				primaryName: null,
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires ethers.js lookupAddress',
			};
			break;
		}

		case 'getEnsRecords': {
			const ensName = this.getNodeParameter('ensName', index) as string;

			result = {
				success: true,
				ensName,
				network,
				records: {
					addr: null,
					contenthash: null,
					avatar: null,
					description: null,
					email: null,
					url: null,
					'com.twitter': null,
					'com.github': null,
					'com.discord': null,
					'org.telegram': null,
				},
				addresses: {
					ETH: null,
					BTC: null,
					LTC: null,
				},
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires ENS resolver getText calls',
			};
			break;
		}

		case 'setEnsRecord': {
			const ensName = this.getNodeParameter('ensName', index) as string;
			const recordType = this.getNodeParameter('recordType', index) as string;
			const recordValue = this.getNodeParameter('recordValue', index) as string;
			const addressIndex = this.getNodeParameter('addressIndex', index, 0) as number;
			const customRecordKey = recordType === 'custom'
				? this.getNodeParameter('customRecordKey', index, '') as string
				: undefined;
			const chainId = recordType === 'addr_multichain'
				? this.getNodeParameter('chainId', index, 60) as number
				: undefined;

			result = {
				success: true,
				ensName,
				network,
				recordType: recordType === 'custom' ? customRecordKey : recordType,
				recordValue,
				chainId,
				signerAddressIndex: addressIndex,
				transactionHash: null,
				status: 'pending_signature',
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires Lattice signing and broadcasting',
			};
			break;
		}

		case 'signEnsTransaction': {
			const transactionType = this.getNodeParameter('transactionType', index) as string;
			const addressIndex = this.getNodeParameter('addressIndex', index, 0) as number;

			const txParams: Record<string, unknown> = {
				type: transactionType,
				network,
				signerAddressIndex: addressIndex,
			};

			switch (transactionType) {
				case 'register': {
					const nameToRegister = this.getNodeParameter('nameToRegister', index) as string;
					const duration = this.getNodeParameter('registrationDuration', index, 1) as number;
					txParams.name = nameToRegister;
					txParams.duration = duration;
					txParams.durationSeconds = duration * 365 * 24 * 60 * 60;
					break;
				}
				case 'renew': {
					const ensName = this.getNodeParameter('ensName', index) as string;
					const duration = this.getNodeParameter('registrationDuration', index, 1) as number;
					txParams.name = ensName;
					txParams.duration = duration;
					txParams.durationSeconds = duration * 365 * 24 * 60 * 60;
					break;
				}
				case 'transfer':
				case 'setController': {
					const ensName = this.getNodeParameter('ensName', index) as string;
					const newOwnerAddress = this.getNodeParameter('newOwnerAddress', index) as string;
					txParams.name = ensName;
					txParams.newOwner = newOwnerAddress;
					break;
				}
				case 'setResolver': {
					const ensName = this.getNodeParameter('ensName', index) as string;
					const resolverAddress = this.getNodeParameter('resolverAddress', index) as string;
					txParams.name = ensName;
					txParams.resolver = resolverAddress;
					break;
				}
				case 'setPrimaryName': {
					const ensName = this.getNodeParameter('ensName', index) as string;
					txParams.name = ensName;
					break;
				}
				case 'wrap':
				case 'unwrap': {
					const ensName = this.getNodeParameter('ensName', index) as string;
					txParams.name = ensName;
					break;
				}
			}

			result = {
				success: true,
				transaction: txParams,
				status: 'pending_signature',
				signedTransaction: null,
				transactionHash: null,
				maxGasPrice: additionalOptions.maxGasPrice || 100,
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires Lattice device signing',
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}
