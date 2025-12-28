/**
 * Device Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../transport/latticeClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['device'],
			},
		},
		options: [
			{ name: 'Check Connection Status', value: 'checkConnectionStatus', action: 'Check connection status' },
			{ name: 'Connect', value: 'connect', action: 'Connect to Lattice' },
			{ name: 'Disconnect', value: 'disconnect', action: 'Disconnect from Lattice' },
			{ name: 'Get Active Wallet', value: 'getActiveWallet', action: 'Get active wallet' },
			{ name: 'Get Device Info', value: 'getDeviceInfo', action: 'Get device info' },
			{ name: 'Get Device State', value: 'getDeviceState', action: 'Get device state' },
			{ name: 'Get Firmware Version', value: 'getFirmwareVersion', action: 'Get firmware version' },
			{ name: 'Get Paired Apps', value: 'getPairedApps', action: 'Get paired apps' },
			{ name: 'Get Wallet UID', value: 'getWalletUid', action: 'Get wallet UID' },
			{ name: 'Pair App', value: 'pairApp', action: 'Pair app with device' },
			{ name: 'Ping Device', value: 'pingDevice', action: 'Ping device' },
			{ name: 'Remove App Pairing', value: 'removeAppPairing', action: 'Remove app pairing' },
		],
		default: 'getDeviceInfo',
	},
	// Pair App parameters
	{
		displayName: 'Pairing Code',
		name: 'pairingCode',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['device'],
				operation: ['pairApp'],
			},
		},
		default: '',
		required: true,
		description: 'The pairing code displayed on the Lattice device',
	},
	// Remove App Pairing parameters
	{
		displayName: 'App Name',
		name: 'appName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['device'],
				operation: ['removeAppPairing'],
			},
		},
		default: '',
		required: true,
		description: 'Name of the app to remove pairing for',
	},
	// Connection timeout option
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['device'],
				operation: ['connect', 'pingDevice'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Timeout (Ms)',
				name: 'timeout',
				type: 'number',
				default: 30000,
				description: 'Connection timeout in milliseconds',
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

	switch (operation) {
		case 'connect': {
			await client.connect();
			const deviceInfo = await client.getDeviceInfo();
			return [{
				json: {
					success: true,
					connected: true,
					deviceInfo,
				},
				pairedItem: { item: index },
			}];
		}

		case 'disconnect': {
			await client.disconnect();
			return [{
				json: {
					success: true,
					connected: false,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getDeviceInfo': {
			await client.connect();
			const deviceInfo = await client.getDeviceInfo();
			return [{
				json: deviceInfo || { error: 'No device info available' },
				pairedItem: { item: index },
			}];
		}

		case 'getFirmwareVersion': {
			await client.connect();
			const deviceInfo = await client.getDeviceInfo();
			return [{
				json: {
					firmwareVersion: deviceInfo?.firmwareVersion || 'Unknown',
					deviceId: deviceInfo?.deviceId,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getActiveWallet': {
			await client.connect();
			const wallet = await client.getActiveWallet();
			return [{
				json: wallet || { error: 'No active wallet' },
				pairedItem: { item: index },
			}];
		}

		case 'getWalletUid': {
			await client.connect();
			const wallet = await client.getActiveWallet();
			return [{
				json: {
					walletUid: wallet?.uid || null,
					walletName: wallet?.name || null,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getPairedApps': {
			await client.connect();
			const apps = await client.getPairedApps();
			return [{
				json: {
					apps: apps || [],
					count: apps?.length || 0,
				},
				pairedItem: { item: index },
			}];
		}

		case 'pairApp': {
			const pairingCode = this.getNodeParameter('pairingCode', index) as string;
			await client.connect();
			const result = await client.initiatePairing(pairingCode);
			return [{
				json: {
					success: result,
					paired: result,
				},
				pairedItem: { item: index },
			}];
		}

		case 'removeAppPairing': {
			const appName = this.getNodeParameter('appName', index) as string;
			await client.connect();
			const result = await client.removeAppPairing(appName);
			return [{
				json: {
					success: result,
					removedApp: appName,
				},
				pairedItem: { item: index },
			}];
		}

		case 'checkConnectionStatus': {
			const isConnected = client.isConnected;
			return [{
				json: {
					connected: isConnected,
					deviceId: client.deviceId,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getDeviceState': {
			await client.connect();
			const deviceInfo = await client.getDeviceInfo();
			const wallet = await client.getActiveWallet();
			const safeCard = await client.getSafeCardInfo();
			return [{
				json: {
					device: deviceInfo,
					activeWallet: wallet,
					safeCard: safeCard,
					connected: client.isConnected,
				},
				pairedItem: { item: index },
			}];
		}

		case 'pingDevice': {
			await client.connect();
			const start = Date.now();
			const success = await client.ping();
			const latency = Date.now() - start;
			return [{
				json: {
					success,
					latencyMs: latency,
					timestamp: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
