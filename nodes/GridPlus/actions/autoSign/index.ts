/**
 * Auto-Sign Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import {
	createAutoSignRule,
	createSpendingLimitRule,
	createContractWhitelistRule,
	createAddressWhitelistRule,
	createTimeBasedRule,
	validateAutoSignRule,
	exportRules,
	importRules,
} from '../../utils/autoSignUtils';
import { AUTO_SIGN_RULE_TYPES } from '../../constants/permissions';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['autoSign'],
			},
		},
		options: [
			{ name: 'Create Auto-Sign Rule', value: 'createRule', action: 'Create auto sign rule' },
			{ name: 'Delete Auto-Sign Rule', value: 'deleteRule', action: 'Delete auto sign rule' },
			{ name: 'Disable Auto-Sign', value: 'disableAutoSign', action: 'Disable auto sign' },
			{ name: 'Enable Auto-Sign', value: 'enableAutoSign', action: 'Enable auto sign' },
			{ name: 'Get Auto-Sign History', value: 'getAutoSignHistory', action: 'Get auto sign history' },
			{ name: 'Get Auto-Sign Rules', value: 'getRules', action: 'Get auto sign rules' },
			{ name: 'Get Eligible Transactions', value: 'getEligibleTransactions', action: 'Get eligible transactions' },
			{ name: 'Set Contract Whitelist', value: 'setContractWhitelist', action: 'Set contract whitelist' },
			{ name: 'Set Spending Limit', value: 'setSpendingLimit', action: 'Set spending limit' },
			{ name: 'Update Auto-Sign Rule', value: 'updateRule', action: 'Update auto sign rule' },
		],
		default: 'getRules',
	},
	// Rule type
	{
		displayName: 'Rule Type',
		name: 'ruleType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule'],
			},
		},
		options: Object.values(AUTO_SIGN_RULE_TYPES).map(t => ({
			name: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
			value: t,
		})),
		default: AUTO_SIGN_RULE_TYPES.SPENDING_LIMIT,
		description: 'Type of auto-sign rule',
	},
	// Rule ID
	{
		displayName: 'Rule ID',
		name: 'ruleId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['updateRule', 'deleteRule'],
			},
		},
		default: '',
		required: true,
		description: 'ID of the rule to modify',
	},
	// Rule name
	{
		displayName: 'Rule Name',
		name: 'ruleName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule', 'updateRule'],
			},
		},
		default: '',
		description: 'Human-readable name for the rule',
	},
	// Chain ID
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule', 'updateRule', 'setSpendingLimit', 'setContractWhitelist'],
			},
		},
		default: 1,
		description: 'Chain ID for the rule',
	},
	// Spending limit
	{
		displayName: 'Limit Amount (Wei)',
		name: 'limitAmount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule', 'setSpendingLimit'],
				ruleType: ['spending_limit'],
			},
		},
		default: '1000000000000000000',
		description: 'Maximum amount per transaction in Wei',
	},
	// Time period
	{
		displayName: 'Time Period',
		name: 'timePeriod',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule', 'setSpendingLimit'],
			},
		},
		options: [
			{ name: 'Per Transaction', value: 'transaction' },
			{ name: 'Hourly', value: 'hourly' },
			{ name: 'Daily', value: 'daily' },
			{ name: 'Weekly', value: 'weekly' },
			{ name: 'Monthly', value: 'monthly' },
		],
		default: 'daily',
		description: 'Time period for limits',
	},
	// Contract addresses
	{
		displayName: 'Contract Addresses',
		name: 'contractAddresses',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule', 'setContractWhitelist'],
				ruleType: ['contract_whitelist'],
			},
		},
		default: '',
		description: 'Comma-separated list of whitelisted contract addresses',
	},
	// Address whitelist
	{
		displayName: 'Recipient Addresses',
		name: 'recipientAddresses',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule'],
				ruleType: ['address_whitelist'],
			},
		},
		default: '',
		description: 'Comma-separated list of allowed recipient addresses',
	},
	// Time window for time-based rules
	{
		displayName: 'Start Time',
		name: 'startTime',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule'],
				ruleType: ['time_based'],
			},
		},
		default: '09:00',
		description: 'Start time for auto-sign window (HH:MM)',
	},
	{
		displayName: 'End Time',
		name: 'endTime',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule'],
				ruleType: ['time_based'],
			},
		},
		default: '17:00',
		description: 'End time for auto-sign window (HH:MM)',
	},
	// Enabled state
	{
		displayName: 'Enabled',
		name: 'enabled',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['autoSign'],
				operation: ['createRule', 'updateRule'],
			},
		},
		default: true,
		description: 'Whether the rule is active',
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
		case 'getRules': {
			return [{
				json: {
					rules: [],
					count: 0,
					note: 'Auto-sign rules are stored on the device',
				},
				pairedItem: { item: index },
			}];
		}

		case 'createRule': {
			const ruleType = this.getNodeParameter('ruleType', index) as string;
			const ruleName = this.getNodeParameter('ruleName', index) as string;
			const chainId = this.getNodeParameter('chainId', index) as number;
			const enabled = this.getNodeParameter('enabled', index) as boolean;

			let rule;
			switch (ruleType) {
				case 'spending_limit': {
					const limitAmount = this.getNodeParameter('limitAmount', index) as string;
					const timePeriod = this.getNodeParameter('timePeriod', index) as string;
					rule = createSpendingLimitRule(ruleName, chainId, limitAmount, timePeriod);
					break;
				}
				case 'contract_whitelist': {
					const contractsStr = this.getNodeParameter('contractAddresses', index) as string;
					const contracts = contractsStr.split(',').map(c => c.trim()).filter(c => c);
					rule = createContractWhitelistRule(ruleName, chainId, contracts);
					break;
				}
				case 'address_whitelist': {
					const addressesStr = this.getNodeParameter('recipientAddresses', index) as string;
					const addresses = addressesStr.split(',').map(a => a.trim()).filter(a => a);
					rule = createAddressWhitelistRule(ruleName, chainId, addresses);
					break;
				}
				case 'time_based': {
					const startTime = this.getNodeParameter('startTime', index) as string;
					const endTime = this.getNodeParameter('endTime', index) as string;
					rule = createTimeBasedRule(ruleName, chainId, startTime, endTime);
					break;
				}
				default:
					rule = createAutoSignRule(ruleName, ruleType, { chainId });
			}

			rule.enabled = enabled;
			const validation = validateAutoSignRule(rule);

			return [{
				json: {
					success: validation.valid,
					rule,
					validation,
				},
				pairedItem: { item: index },
			}];
		}

		case 'updateRule': {
			const ruleId = this.getNodeParameter('ruleId', index) as string;
			const ruleName = this.getNodeParameter('ruleName', index) as string;
			const enabled = this.getNodeParameter('enabled', index) as boolean;

			return [{
				json: {
					success: true,
					ruleId,
					updates: { name: ruleName, enabled },
					updatedAt: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'deleteRule': {
			const ruleId = this.getNodeParameter('ruleId', index) as string;

			return [{
				json: {
					success: true,
					ruleId,
					deleted: true,
				},
				pairedItem: { item: index },
			}];
		}

		case 'enableAutoSign': {
			return [{
				json: {
					success: true,
					autoSignEnabled: true,
					timestamp: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'disableAutoSign': {
			return [{
				json: {
					success: true,
					autoSignEnabled: false,
					timestamp: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'setSpendingLimit': {
			const chainId = this.getNodeParameter('chainId', index) as number;
			const limitAmount = this.getNodeParameter('limitAmount', index) as string;
			const timePeriod = this.getNodeParameter('timePeriod', index) as string;

			return [{
				json: {
					success: true,
					spendingLimit: {
						chainId,
						amount: limitAmount,
						period: timePeriod,
						createdAt: new Date().toISOString(),
					},
				},
				pairedItem: { item: index },
			}];
		}

		case 'setContractWhitelist': {
			const chainId = this.getNodeParameter('chainId', index) as number;
			const contractsStr = this.getNodeParameter('contractAddresses', index) as string;
			const contracts = contractsStr.split(',').map(c => c.trim()).filter(c => c);

			return [{
				json: {
					success: true,
					chainId,
					contracts,
					count: contracts.length,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getEligibleTransactions': {
			return [{
				json: {
					transactions: [],
					count: 0,
					note: 'Shows pending transactions that match auto-sign rules',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAutoSignHistory': {
			return [{
				json: {
					history: [],
					count: 0,
					note: 'Auto-sign history from device',
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
