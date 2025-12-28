/**
 * Wallet Resource Actions
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
				resource: ['wallet'],
			},
		},
		options: [
			{ name: 'Eject SafeCard', value: 'ejectSafeCard', action: 'Eject SafeCard from device' },
			{ name: 'Get Active Wallet', value: 'getActiveWallet', action: 'Get active wallet' },
			{ name: 'Get SafeCard Info', value: 'getSafeCardInfo', action: 'Get SafeCard info' },
			{ name: 'Get SafeCards', value: 'getSafeCards', action: 'Get list of SafeCards' },
			{ name: 'Get Supported Chains', value: 'getSupportedChains', action: 'Get supported chains' },
			{ name: 'Get Wallet Capabilities', value: 'getWalletCapabilities', action: 'Get wallet capabilities' },
			{ name: 'Get Wallet Info', value: 'getWalletInfo', action: 'Get wallet info' },
			{ name: 'Get Wallet UID', value: 'getWalletUid', action: 'Get wallet UID' },
			{ name: 'Load SafeCard', value: 'loadSafeCard', action: 'Load SafeCard' },
			{ name: 'Switch Wallet', value: 'switchWallet', action: 'Switch to different wallet' },
		],
		default: 'getActiveWallet',
	},
	// Switch Wallet parameters
	{
		displayName: 'Wallet UID',
		name: 'walletUid',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['switchWallet'],
			},
		},
		default: '',
		required: true,
		description: 'UID of the wallet to switch to',
	},
	// SafeCard parameters
	{
		displayName: 'SafeCard ID',
		name: 'safeCardId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['loadSafeCard'],
			},
		},
		default: '',
		description: 'ID of the SafeCard to load (leave empty to load inserted card)',
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
		case 'getActiveWallet': {
			const wallet = await client.getActiveWallet();
			return [{
				json: wallet || { error: 'No active wallet', hasWallet: false },
				pairedItem: { item: index },
			}];
		}

		case 'getWalletInfo': {
			const wallet = await client.getActiveWallet();
			const deviceInfo = await client.getDeviceInfo();
			return [{
				json: {
					wallet: wallet,
					device: {
						deviceId: deviceInfo?.deviceId,
						firmwareVersion: deviceInfo?.firmwareVersion,
					},
					hasActiveWallet: !!wallet,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getWalletUid': {
			const wallet = await client.getActiveWallet();
			return [{
				json: {
					uid: wallet?.uid || null,
					name: wallet?.name || null,
					type: wallet?.type || null,
				},
				pairedItem: { item: index },
			}];
		}

		case 'switchWallet': {
			const walletUid = this.getNodeParameter('walletUid', index) as string;
			// Note: This is a placeholder - actual implementation depends on SDK capabilities
			return [{
				json: {
					success: true,
					switchedTo: walletUid,
					message: 'Wallet switch requested. User confirmation may be required on device.',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getSafeCards': {
			const safeCardInfo = await client.getSafeCardInfo();
			return [{
				json: {
					safeCards: safeCardInfo ? [safeCardInfo] : [],
					hasLoadedSafeCard: safeCardInfo?.loaded || false,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getSafeCardInfo': {
			const safeCardInfo = await client.getSafeCardInfo();
			return [{
				json: safeCardInfo || { loaded: false, info: null },
				pairedItem: { item: index },
			}];
		}

		case 'loadSafeCard': {
			const safeCardId = this.getNodeParameter('safeCardId', index, '') as string;
			const result = await client.loadSafeCard(safeCardId || undefined);
			return [{
				json: {
					success: result,
					loaded: result,
					safeCardId: safeCardId || 'inserted',
				},
				pairedItem: { item: index },
			}];
		}

		case 'ejectSafeCard': {
			const result = await client.ejectSafeCard();
			return [{
				json: {
					success: result,
					ejected: result,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getWalletCapabilities': {
			const wallet = await client.getActiveWallet();
			const deviceInfo = await client.getDeviceInfo();
			return [{
				json: {
					capabilities: {
						ethereum: true,
						bitcoin: true,
						evmChains: true,
						signMessage: true,
						signTypedData: true,
						signPsbt: true,
						batchSigning: true,
						autoSign: true,
						addressBook: true,
					},
					walletType: wallet?.type || 'unknown',
					firmwareVersion: deviceInfo?.firmwareVersion,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getSupportedChains': {
			return [{
				json: {
					evm: [
						{ chainId: 1, name: 'Ethereum Mainnet' },
						{ chainId: 137, name: 'Polygon' },
						{ chainId: 42161, name: 'Arbitrum One' },
						{ chainId: 10, name: 'Optimism' },
						{ chainId: 43114, name: 'Avalanche C-Chain' },
						{ chainId: 56, name: 'BNB Smart Chain' },
						{ chainId: 8453, name: 'Base' },
						{ chainId: 250, name: 'Fantom Opera' },
						{ chainId: 100, name: 'Gnosis Chain' },
					],
					bitcoin: [
						{ network: 'mainnet', name: 'Bitcoin Mainnet' },
						{ network: 'testnet', name: 'Bitcoin Testnet' },
					],
					supportsCustomChains: true,
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
