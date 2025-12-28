/**
 * GridPlus Lattice1 n8n Community Node
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import * as device from './actions/device';
import * as wallet from './actions/wallet';
import * as safeCard from './actions/safeCard';
import * as account from './actions/account';
import * as ethereum from './actions/ethereum';
import * as evmChains from './actions/evmChains';
import * as bitcoin from './actions/bitcoin';
import * as transaction from './actions/transaction';
import * as signing from './actions/signing';
import * as addressBook from './actions/addressBook';
import * as permissions from './actions/permissions';
import * as autoSign from './actions/autoSign';
import * as multiCurrency from './actions/multiCurrency';
import * as defi from './actions/defi';
import * as nft from './actions/nft';
import * as ens from './actions/ens';
import * as staking from './actions/staking';
import * as firmware from './actions/firmware';
import * as security from './actions/security';
import * as exportResource from './actions/export';
import * as utility from './actions/utility';

export class GridPlus implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GridPlus Lattice1',
		name: 'gridPlus',
		icon: 'file:gridplus.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with GridPlus Lattice1 hardware wallet for enterprise blockchain automation',
		defaults: {
			name: 'GridPlus Lattice1',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'gridPlusLattice',
				required: true,
			},
			{
				name: 'gridPlusNetwork',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Address Book', value: 'addressBook' },
					{ name: 'Auto-Sign', value: 'autoSign' },
					{ name: 'Bitcoin', value: 'bitcoin' },
					{ name: 'DeFi', value: 'defi' },
					{ name: 'Device', value: 'device' },
					{ name: 'ENS', value: 'ens' },
					{ name: 'Ethereum', value: 'ethereum' },
					{ name: 'EVM Chains', value: 'evmChains' },
					{ name: 'Export', value: 'export' },
					{ name: 'Firmware', value: 'firmware' },
					{ name: 'Multi-Currency', value: 'multiCurrency' },
					{ name: 'NFT', value: 'nft' },
					{ name: 'Permissions', value: 'permissions' },
					{ name: 'SafeCard', value: 'safeCard' },
					{ name: 'Security', value: 'security' },
					{ name: 'Signing', value: 'signing' },
					{ name: 'Staking', value: 'staking' },
					{ name: 'Transaction', value: 'transaction' },
					{ name: 'Utility', value: 'utility' },
					{ name: 'Wallet', value: 'wallet' },
				],
				default: 'device',
			},
			// Device operations
			...device.description,
			// Wallet operations
			...wallet.description,
			// SafeCard operations
			...safeCard.description,
			// Account operations
			...account.description,
			// Ethereum operations
			...ethereum.description,
			// EVM Chains operations
			...evmChains.description,
			// Bitcoin operations
			...bitcoin.description,
			// Transaction operations
			...transaction.description,
			// Signing operations
			...signing.description,
			// Address Book operations
			...addressBook.description,
			// Permissions operations
			...permissions.description,
			// Auto-Sign operations
			...autoSign.description,
			// Multi-Currency operations
			...multiCurrency.description,
			// DeFi operations
			...defi.description,
			// NFT operations
			...nft.description,
			// ENS operations
			...ens.description,
			// Staking operations
			...staking.description,
			// Firmware operations
			...firmware.description,
			// Security operations
			...security.description,
			// Export operations
			...exportResource.description,
			// Utility operations
			...utility.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: INodeExecutionData[] = [];

				switch (resource) {
					case 'device':
						responseData = await device.execute.call(this, i, operation);
						break;
					case 'wallet':
						responseData = await wallet.execute.call(this, i, operation);
						break;
					case 'safeCard':
						responseData = await safeCard.execute.call(this, i, operation);
						break;
					case 'account':
						responseData = await account.execute.call(this, i, operation);
						break;
					case 'ethereum':
						responseData = await ethereum.execute.call(this, i, operation);
						break;
					case 'evmChains':
						responseData = await evmChains.execute.call(this, i, operation);
						break;
					case 'bitcoin':
						responseData = await bitcoin.execute.call(this, i, operation);
						break;
					case 'transaction':
						responseData = await transaction.execute.call(this, i, operation);
						break;
					case 'signing':
						responseData = await signing.execute.call(this, i, operation);
						break;
					case 'addressBook':
						responseData = await addressBook.execute.call(this, i, operation);
						break;
					case 'permissions':
						responseData = await permissions.execute.call(this, i, operation);
						break;
					case 'autoSign':
						responseData = await autoSign.execute.call(this, i, operation);
						break;
					case 'multiCurrency':
						responseData = await multiCurrency.execute.call(this, i, operation);
						break;
					case 'defi':
						responseData = await defi.execute.call(this, i, operation);
						break;
					case 'nft':
						responseData = await nft.execute.call(this, i, operation);
						break;
					case 'ens':
						responseData = await ens.execute.call(this, i, operation);
						break;
					case 'staking':
						responseData = await staking.execute.call(this, i, operation);
						break;
					case 'firmware':
						responseData = await firmware.execute.call(this, i, operation);
						break;
					case 'security':
						responseData = await security.execute.call(this, i, operation);
						break;
					case 'export':
						responseData = await exportResource.execute.call(this, i, operation);
						break;
					case 'utility':
						responseData = await utility.execute.call(this, i, operation);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...responseData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
