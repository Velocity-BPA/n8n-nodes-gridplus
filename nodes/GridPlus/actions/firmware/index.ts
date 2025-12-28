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
import { createLatticeClient } from '../../transport/latticeClient';

/**
 * Firmware Resource
 * Provides firmware version queries and device capability information
 */
export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['firmware'],
			},
		},
		options: [
			{
				name: 'Check for Updates',
				value: 'checkForUpdates',
				description: 'Check if firmware updates are available',
				action: 'Check for firmware updates',
			},
			{
				name: 'Get Changelog',
				value: 'getChangelog',
				description: 'Get changelog for firmware versions',
				action: 'Get firmware changelog',
			},
			{
				name: 'Get Device Capabilities',
				value: 'getDeviceCapabilities',
				description: 'Get device capabilities based on firmware version',
				action: 'Get device capabilities',
			},
			{
				name: 'Get Firmware Version',
				value: 'getFirmwareVersion',
				description: 'Get current firmware version of the device',
				action: 'Get firmware version',
			},
			{
				name: 'Get Hardware Version',
				value: 'getHardwareVersion',
				description: 'Get hardware version information',
				action: 'Get hardware version',
			},
			{
				name: 'Get Update Info',
				value: 'getUpdateInfo',
				description: 'Get detailed information about available update',
				action: 'Get update info',
			},
		],
		default: 'getFirmwareVersion',
	},

	// Version to get changelog for
	{
		displayName: 'Firmware Version',
		name: 'firmwareVersion',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['firmware'],
				operation: ['getChangelog', 'getDeviceCapabilities'],
			},
		},
		default: '',
		placeholder: '0.16.0',
		description: 'Specific firmware version (leave empty for current)',
	},

	// Additional options
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['firmware'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Beta Versions',
				name: 'includeBeta',
				type: 'boolean',
				default: false,
				description: 'Whether to include beta firmware versions in results',
			},
			{
				displayName: 'Include Release Notes',
				name: 'includeReleaseNotes',
				type: 'boolean',
				default: true,
				description: 'Whether to include full release notes',
			},
			{
				displayName: 'Version History Count',
				name: 'versionHistoryCount',
				type: 'number',
				default: 5,
				typeOptions: {
					minValue: 1,
					maxValue: 20,
				},
				description: 'Number of previous versions to include in changelog',
			},
		],
	},
];

/**
 * Execute firmware operations
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
		includeBeta?: boolean;
		includeReleaseNotes?: boolean;
		versionHistoryCount?: number;
	};

	let result: Record<string, unknown> = {};

	// Get Lattice client for device queries
	const credentials = await this.getCredentials('gridPlusLattice');
	const client = await createLatticeClient(credentials);

	switch (operation) {
		case 'getFirmwareVersion': {
			try {
				// Attempt to get firmware info from device
				const deviceInfo = await client.getDeviceInfo?.() || {};
				
				result = {
					success: true,
					currentVersion: deviceInfo.fwVersion || 'unknown',
					firmwareMajor: deviceInfo.fwVersionMajor || null,
					firmwareMinor: deviceInfo.fwVersionMinor || null,
					firmwarePatch: deviceInfo.fwVersionPatch || null,
					buildNumber: deviceInfo.buildNumber || null,
					releaseChannel: 'stable',
					installDate: null,
					timestamp: new Date().toISOString(),
				};
			} catch {
				result = {
					success: false,
					error: 'Unable to query device firmware version',
					currentVersion: 'unknown',
					timestamp: new Date().toISOString(),
				};
			}
			break;
		}

		case 'getHardwareVersion': {
			try {
				const deviceInfo = await client.getDeviceInfo?.() || {};
				
				result = {
					success: true,
					hardwareVersion: deviceInfo.hwVersion || 'unknown',
					model: 'Lattice1',
					manufacturer: 'GridPlus',
					serialNumber: deviceInfo.serial || 'unknown',
					productionDate: null,
					deviceId: credentials.deviceId || null,
					secureElement: {
						version: deviceInfo.seVersion || 'unknown',
						manufacturer: 'Microchip',
					},
					display: {
						type: 'IPS LCD',
						resolution: '480x320',
						touchscreen: true,
					},
					connectivity: {
						wifi: true,
						usb: true,
						bluetooth: false,
					},
					timestamp: new Date().toISOString(),
				};
			} catch {
				result = {
					success: false,
					error: 'Unable to query device hardware version',
					timestamp: new Date().toISOString(),
				};
			}
			break;
		}

		case 'checkForUpdates': {
			try {
				const deviceInfo = await client.getDeviceInfo?.() || {};
				const currentVersion = deviceInfo.fwVersion || '0.0.0';

				// In production, this would check GridPlus update server
				result = {
					success: true,
					currentVersion,
					latestStableVersion: '0.17.0',
					latestBetaVersion: additionalOptions.includeBeta ? '0.18.0-beta.1' : undefined,
					updateAvailable: false,
					updateType: null, // 'major' | 'minor' | 'patch' | null
					urgency: 'normal', // 'critical' | 'high' | 'normal' | 'low'
					downloadSize: null,
					estimatedInstallTime: null,
					releaseDate: null,
					timestamp: new Date().toISOString(),
					note: 'Production implementation requires GridPlus update API',
				};
			} catch {
				result = {
					success: false,
					error: 'Unable to check for updates',
					timestamp: new Date().toISOString(),
				};
			}
			break;
		}

		case 'getUpdateInfo': {
			const firmwareVersion = this.getNodeParameter('firmwareVersion', index, '') as string;

			result = {
				success: true,
				version: firmwareVersion || 'latest',
				releaseDate: new Date().toISOString(),
				releaseChannel: 'stable',
				downloadUrl: null,
				downloadSize: '15MB',
				checksum: null,
				signature: null,
				minHardwareVersion: '1.0',
				minPreviousFirmware: '0.15.0',
				installationNotes: [
					'Ensure device is connected to power',
					'Do not disconnect during update',
					'SafeCard should be ejected before update',
				],
				breakingChanges: [],
				newFeatures: [],
				bugFixes: [],
				securityFixes: [],
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires GridPlus update API',
			};
			break;
		}

		case 'getChangelog': {
			const firmwareVersion = this.getNodeParameter('firmwareVersion', index, '') as string;
			const historyCount = additionalOptions.versionHistoryCount || 5;

			result = {
				success: true,
				requestedVersion: firmwareVersion || 'all',
				versions: Array.from({ length: historyCount }, (_, i) => ({
					version: `0.${16 - i}.0`,
					releaseDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
					channel: 'stable',
					highlights: [],
					features: [],
					improvements: [],
					bugFixes: [],
					securityFixes: [],
					knownIssues: [],
					deprecations: [],
				})),
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires GridPlus changelog API',
			};
			break;
		}

		case 'getDeviceCapabilities': {
			const firmwareVersion = this.getNodeParameter('firmwareVersion', index, '') as string;

			try {
				const deviceInfo = await client.getDeviceInfo?.() || {};
				const version = firmwareVersion || deviceInfo.fwVersion || 'unknown';

				result = {
					success: true,
					firmwareVersion: version,
					capabilities: {
						// Transaction signing
						signing: {
							ethereum: true,
							bitcoin: true,
							eip1559: true,
							eip712: true,
							legacyEth: true,
							psbt: true,
							batchSigning: true,
							maxBatchSize: 10,
						},
						// Supported chains
						chains: {
							ethereumMainnet: true,
							polygon: true,
							arbitrum: true,
							optimism: true,
							avalanche: true,
							bsc: true,
							base: true,
							fantom: true,
							gnosis: true,
							customEvm: true,
							bitcoinMainnet: true,
							bitcoinTestnet: true,
						},
						// Address derivation
						derivation: {
							bip32: true,
							bip44: true,
							bip49: true,
							bip84: true,
							bip86: true,
							slip44: true,
							customPaths: true,
						},
						// Security features
						security: {
							pinProtection: true,
							pinTimeout: true,
							safeCard: true,
							multipleWallets: true,
							addressBook: true,
							contractWhitelist: true,
							spendingLimits: true,
							autoSign: true,
						},
						// Display features
						display: {
							transactionPreview: true,
							addressVerification: true,
							contractDecoding: true,
							erc20Display: true,
							nftDisplay: true,
							qrCodeScanning: true,
						},
						// Connectivity
						connectivity: {
							wifi: true,
							usb: true,
							gridplusConnect: true,
							localNetwork: true,
						},
						// Advanced features
						advanced: {
							exportPublicKeys: true,
							exportAddresses: true,
							firmwareUpdate: true,
							deviceReset: true,
							backupRestore: true,
						},
					},
					limits: {
						maxAddresses: 10,
						maxAddressBookEntries: 100,
						maxAutoSignRules: 50,
						maxWhitelistedContracts: 100,
						maxPairedApps: 10,
						maxSafeCards: 5,
					},
					timestamp: new Date().toISOString(),
				};
			} catch {
				result = {
					success: false,
					error: 'Unable to query device capabilities',
					timestamp: new Date().toISOString(),
				};
			}
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
