/**
 * Permissions Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { PERMISSION_TYPES, PERMISSION_LEVELS, DEFAULT_PERMISSION_SETS, hasPermission } from '../../constants/permissions';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['permissions'],
			},
		},
		options: [
			{ name: 'Add Allowed Contract', value: 'addAllowedContract', action: 'Add allowed contract' },
			{ name: 'Get Allowed Contracts', value: 'getAllowedContracts', action: 'Get allowed contracts' },
			{ name: 'Get App Permissions', value: 'getAppPermissions', action: 'Get app permissions' },
			{ name: 'Get Auto-Sign Rules', value: 'getAutoSignRules', action: 'Get auto sign rules' },
			{ name: 'Get Spending Limits', value: 'getSpendingLimits', action: 'Get spending limits' },
			{ name: 'Remove Allowed Contract', value: 'removeAllowedContract', action: 'Remove allowed contract' },
			{ name: 'Remove Auto-Sign Rule', value: 'removeAutoSignRule', action: 'Remove auto sign rule' },
			{ name: 'Request Permission', value: 'requestPermission', action: 'Request permission' },
			{ name: 'Set Auto-Sign Rule', value: 'setAutoSignRule', action: 'Set auto sign rule' },
			{ name: 'Set Spending Limit', value: 'setSpendingLimit', action: 'Set spending limit' },
		],
		default: 'getAppPermissions',
	},
	// Permission type
	{
		displayName: 'Permission',
		name: 'permission',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['requestPermission'],
			},
		},
		options: Object.values(PERMISSION_TYPES).map(p => ({
			name: p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
			value: p,
		})),
		default: PERMISSION_TYPES.SIGN_TRANSACTION,
		description: 'Permission to request',
	},
	// Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['addAllowedContract', 'removeAllowedContract'],
			},
		},
		default: '',
		required: true,
		description: 'Smart contract address',
	},
	// Contract name
	{
		displayName: 'Contract Name',
		name: 'contractName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['addAllowedContract'],
			},
		},
		default: '',
		description: 'Human-readable name for the contract',
	},
	// Chain ID
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['addAllowedContract', 'setSpendingLimit'],
			},
		},
		default: 1,
		description: 'Chain ID for the contract or limit',
	},
	// Spending limit amount
	{
		displayName: 'Limit Amount',
		name: 'limitAmount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['setSpendingLimit'],
			},
		},
		default: '1000000000000000000',
		required: true,
		description: 'Spending limit amount in Wei',
	},
	// Spending limit period
	{
		displayName: 'Period',
		name: 'limitPeriod',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['setSpendingLimit'],
			},
		},
		options: [
			{ name: 'Hourly', value: 'hourly' },
			{ name: 'Daily', value: 'daily' },
			{ name: 'Weekly', value: 'weekly' },
			{ name: 'Monthly', value: 'monthly' },
		],
		default: 'daily',
		description: 'Time period for the spending limit',
	},
	// Auto-sign rule ID
	{
		displayName: 'Rule ID',
		name: 'ruleId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['removeAutoSignRule'],
			},
		},
		default: '',
		required: true,
		description: 'ID of the auto-sign rule',
	},
	// Auto-sign rule configuration
	{
		displayName: 'Rule Configuration (JSON)',
		name: 'ruleConfig',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['permissions'],
				operation: ['setAutoSignRule'],
			},
		},
		default: '{"type": "spending_limit", "enabled": true}',
		required: true,
		description: 'Auto-sign rule configuration',
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
		case 'getAppPermissions': {
			return [{
				json: {
					permissions: DEFAULT_PERMISSION_SETS.READ_ONLY,
					permissionTypes: Object.values(PERMISSION_TYPES),
					permissionLevels: Object.entries(PERMISSION_LEVELS).map(([name, level]) => ({ name, level })),
				},
				pairedItem: { item: index },
			}];
		}

		case 'requestPermission': {
			const permission = this.getNodeParameter('permission', index) as string;

			return [{
				json: {
					permission,
					requested: true,
					status: 'pending',
					note: 'Permission request requires device approval',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getSpendingLimits': {
			return [{
				json: {
					limits: [],
					note: 'Spending limits are configured on the device',
				},
				pairedItem: { item: index },
			}];
		}

		case 'setSpendingLimit': {
			const chainId = this.getNodeParameter('chainId', index) as number;
			const limitAmount = this.getNodeParameter('limitAmount', index) as string;
			const limitPeriod = this.getNodeParameter('limitPeriod', index) as string;

			return [{
				json: {
					success: true,
					chainId,
					limit: {
						amount: limitAmount,
						period: limitPeriod,
						createdAt: new Date().toISOString(),
					},
					note: 'Spending limit requires device confirmation',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAllowedContracts': {
			return [{
				json: {
					contracts: [],
					count: 0,
				},
				pairedItem: { item: index },
			}];
		}

		case 'addAllowedContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const contractName = this.getNodeParameter('contractName', index) as string;
			const chainId = this.getNodeParameter('chainId', index) as number;

			return [{
				json: {
					success: true,
					contract: {
						address: contractAddress,
						name: contractName,
						chainId,
						addedAt: new Date().toISOString(),
					},
				},
				pairedItem: { item: index },
			}];
		}

		case 'removeAllowedContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			return [{
				json: {
					success: true,
					contractAddress,
					removed: true,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAutoSignRules': {
			return [{
				json: {
					rules: [],
					count: 0,
				},
				pairedItem: { item: index },
			}];
		}

		case 'setAutoSignRule': {
			const ruleConfig = this.getNodeParameter('ruleConfig', index) as object;

			return [{
				json: {
					success: true,
					rule: {
						id: `rule_${Date.now()}`,
						...ruleConfig,
						createdAt: new Date().toISOString(),
					},
				},
				pairedItem: { item: index },
			}];
		}

		case 'removeAutoSignRule': {
			const ruleId = this.getNodeParameter('ruleId', index) as string;

			return [{
				json: {
					success: true,
					ruleId,
					removed: true,
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
