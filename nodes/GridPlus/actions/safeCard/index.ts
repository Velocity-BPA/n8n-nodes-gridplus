/**
 * SafeCard Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../transport/latticeClient';
import { getEthereumAddresses, getBitcoinAddresses } from '../utils/addressUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['safeCard'],
			},
		},
		options: [
			{ name: 'Create SafeCard Backup', value: 'createBackup', action: 'Create SafeCard backup' },
			{ name: 'Eject SafeCard', value: 'eject', action: 'Eject SafeCard' },
			{ name: 'Get SafeCard', value: 'get', action: 'Get SafeCard details' },
			{ name: 'Get SafeCard Addresses', value: 'getAddresses', action: 'Get SafeCard addresses' },
			{ name: 'Get SafeCard Balance', value: 'getBalance', action: 'Get SafeCard balance' },
			{ name: 'Get SafeCard Metadata', value: 'getMetadata', action: 'Get SafeCard metadata' },
			{ name: 'Get SafeCard Status', value: 'getStatus', action: 'Get SafeCard status' },
			{ name: 'List SafeCards', value: 'list', action: 'List SafeCards' },
			{ name: 'Load SafeCard', value: 'load', action: 'Load SafeCard' },
			{ name: 'Restore SafeCard', value: 'restore', action: 'Restore SafeCard' },
		],
		default: 'getStatus',
	},
	// Address retrieval parameters
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['safeCard'],
				operation: ['getAddresses', 'getBalance'],
			},
		},
		options: [
			{ name: 'Ethereum', value: 'ETH' },
			{ name: 'Bitcoin', value: 'BTC' },
			{ name: 'All', value: 'ALL' },
		],
		default: 'ETH',
		description: 'Currency to get addresses/balance for',
	},
	{
		displayName: 'Address Count',
		name: 'addressCount',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['safeCard'],
				operation: ['getAddresses'],
			},
		},
		default: 5,
		description: 'Number of addresses to retrieve',
	},
	// Load SafeCard parameters
	{
		displayName: 'SafeCard ID',
		name: 'safeCardId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safeCard'],
				operation: ['load', 'get', 'getMetadata'],
			},
		},
		default: '',
		description: 'ID of the SafeCard (leave empty for inserted card)',
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
		case 'list': {
			const safeCardInfo = await client.getSafeCardInfo();
			return [{
				json: {
					safeCards: safeCardInfo ? [safeCardInfo] : [],
					count: safeCardInfo ? 1 : 0,
				},
				pairedItem: { item: index },
			}];
		}

		case 'get': {
			const safeCardInfo = await client.getSafeCardInfo();
			return [{
				json: safeCardInfo || { loaded: false, error: 'No SafeCard loaded' },
				pairedItem: { item: index },
			}];
		}

		case 'getStatus': {
			const safeCardInfo = await client.getSafeCardInfo();
			return [{
				json: {
					loaded: safeCardInfo?.loaded || false,
					status: safeCardInfo?.loaded ? 'active' : 'not_loaded',
					uid: safeCardInfo?.uid || null,
				},
				pairedItem: { item: index },
			}];
		}

		case 'load': {
			const safeCardId = this.getNodeParameter('safeCardId', index, '') as string;
			const result = await client.loadSafeCard(safeCardId || undefined);
			const safeCardInfo = await client.getSafeCardInfo();
			return [{
				json: {
					success: result,
					safeCard: safeCardInfo,
				},
				pairedItem: { item: index },
			}];
		}

		case 'eject': {
			const result = await client.ejectSafeCard();
			return [{
				json: {
					success: result,
					ejected: result,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAddresses': {
			const currency = this.getNodeParameter('currency', index) as string;
			const count = this.getNodeParameter('addressCount', index, 5) as number;

			const addresses: Record<string, string[]> = {};

			if (currency === 'ETH' || currency === 'ALL') {
				addresses.ethereum = await getEthereumAddresses(client, count);
			}

			if (currency === 'BTC' || currency === 'ALL') {
				addresses.bitcoin = await getBitcoinAddresses(client, count, 'segwit');
			}

			return [{
				json: {
					addresses,
					currency,
					count,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getBalance': {
			const currency = this.getNodeParameter('currency', index) as string;
			// Note: Balance checking requires network connectivity
			// This returns a placeholder structure
			return [{
				json: {
					currency,
					message: 'Balance checking requires network credentials. Configure GridPlus Network credentials.',
					balances: [],
				},
				pairedItem: { item: index },
			}];
		}

		case 'createBackup': {
			return [{
				json: {
					success: false,
					message: 'SafeCard backup must be initiated from the device itself for security.',
					instructions: [
						'1. Navigate to Settings on your Lattice device',
						'2. Select SafeCard Management',
						'3. Choose Create Backup',
						'4. Follow on-screen instructions',
					],
				},
				pairedItem: { item: index },
			}];
		}

		case 'restore': {
			return [{
				json: {
					success: false,
					message: 'SafeCard restore must be initiated from the device itself for security.',
					instructions: [
						'1. Insert backup SafeCard into Lattice device',
						'2. Navigate to Settings',
						'3. Select SafeCard Management',
						'4. Choose Restore from Backup',
						'5. Follow on-screen instructions',
					],
				},
				pairedItem: { item: index },
			}];
		}

		case 'getMetadata': {
			const safeCardInfo = await client.getSafeCardInfo();
			return [{
				json: {
					metadata: {
						uid: safeCardInfo?.uid,
						loaded: safeCardInfo?.loaded,
						type: 'SafeCard',
						capabilities: ['signing', 'storage', 'backup'],
					},
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
