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
 * Staking Resource
 * Provides Ethereum staking operations including liquid staking protocols
 */
export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['staking'],
			},
		},
		options: [
			{
				name: 'Claim Rewards',
				value: 'claimRewards',
				description: 'Claim staking rewards',
				action: 'Claim staking rewards',
			},
			{
				name: 'Get Staking APY',
				value: 'getStakingApy',
				description: 'Get current staking APY for various protocols',
				action: 'Get staking APY',
			},
			{
				name: 'Get Staking Positions',
				value: 'getStakingPositions',
				description: 'Get all staking positions for an address',
				action: 'Get staking positions',
			},
			{
				name: 'Get Validator Info',
				value: 'getValidatorInfo',
				description: 'Get information about a validator',
				action: 'Get validator info',
			},
			{
				name: 'Stake ETH',
				value: 'stakeEth',
				description: 'Stake ETH through a staking protocol',
				action: 'Stake ETH',
			},
			{
				name: 'Unstake ETH',
				value: 'unstakeEth',
				description: 'Unstake ETH (request withdrawal)',
				action: 'Unstake ETH',
			},
		],
		default: 'getStakingPositions',
	},

	// Staking protocol selection
	{
		displayName: 'Staking Protocol',
		name: 'stakingProtocol',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['stakeEth', 'unstakeEth', 'getStakingApy', 'claimRewards'],
			},
		},
		options: [
			{ name: 'Lido (stETH)', value: 'lido' },
			{ name: 'Rocket Pool (rETH)', value: 'rocketpool' },
			{ name: 'Coinbase (cbETH)', value: 'coinbase' },
			{ name: 'Frax (sfrxETH)', value: 'frax' },
			{ name: 'Ankr (ankrETH)', value: 'ankr' },
			{ name: 'StakeWise (sETH2)', value: 'stakewise' },
			{ name: 'Native Staking (32 ETH)', value: 'native' },
			{ name: 'Custom Protocol', value: 'custom' },
		],
		default: 'lido',
		description: 'The staking protocol to use',
	},

	// Custom protocol address
	{
		displayName: 'Protocol Contract Address',
		name: 'protocolAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['stakeEth', 'unstakeEth', 'claimRewards'],
				stakingProtocol: ['custom'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The contract address of the staking protocol',
	},

	// Stake ETH parameters
	{
		displayName: 'Amount to Stake (ETH)',
		name: 'stakeAmount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['stakeEth'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0.01,
			numberPrecision: 18,
		},
		description: 'Amount of ETH to stake',
	},

	// Unstake parameters
	{
		displayName: 'Amount to Unstake',
		name: 'unstakeAmount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['unstakeEth'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0,
			numberPrecision: 18,
		},
		description: 'Amount of staked tokens to unstake (0 for all)',
	},

	// Address for queries
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['getStakingPositions'],
			},
		},
		default: '',
		placeholder: '0x... or leave empty for derived address',
		description: 'The address to query positions for',
	},

	// Address index for signing
	{
		displayName: 'Address Index',
		name: 'addressIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['stakeEth', 'unstakeEth', 'claimRewards'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0,
		},
		description: 'The index of the derived address to use',
	},

	// Validator info parameters
	{
		displayName: 'Validator Index or Public Key',
		name: 'validatorId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['getValidatorInfo'],
			},
		},
		default: '',
		placeholder: '12345 or 0x...',
		description: 'The validator index number or public key',
	},

	// Network selection
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['staking'],
			},
		},
		options: [
			{ name: 'Ethereum Mainnet', value: 'mainnet' },
			{ name: 'Goerli Testnet', value: 'goerli' },
			{ name: 'Holesky Testnet', value: 'holesky' },
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
				resource: ['staking'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Pending Rewards',
				name: 'includePendingRewards',
				type: 'boolean',
				default: true,
				description: 'Whether to include pending/unclaimed rewards in positions',
			},
			{
				displayName: 'Include Historical Rewards',
				name: 'includeHistoricalRewards',
				type: 'boolean',
				default: false,
				description: 'Whether to include historical rewards data',
			},
			{
				displayName: 'Slippage Tolerance (%)',
				name: 'slippageTolerance',
				type: 'number',
				default: 0.5,
				typeOptions: {
					minValue: 0.1,
					maxValue: 5,
					numberPrecision: 2,
				},
				description: 'Maximum acceptable slippage for liquid staking',
			},
			{
				displayName: 'Max Gas Price (Gwei)',
				name: 'maxGasPrice',
				type: 'number',
				default: 100,
				description: 'Maximum gas price for transactions',
			},
			{
				displayName: 'Referral Address',
				name: 'referralAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Referral address for staking protocols that support it',
			},
		],
	},
];

/**
 * Execute staking operations
 * Note: Requires network access to Ethereum RPC and staking contracts
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
		includePendingRewards?: boolean;
		includeHistoricalRewards?: boolean;
		slippageTolerance?: number;
		maxGasPrice?: number;
		referralAddress?: string;
	};

	let result: Record<string, unknown> = {};

	switch (operation) {
		case 'getStakingPositions': {
			const address = this.getNodeParameter('address', index, '') as string;

			result = {
				success: true,
				address: address || 'derived_address_placeholder',
				network,
				positions: [
					{
						protocol: 'lido',
						token: 'stETH',
						balance: '0',
						balanceEth: '0',
						valueUsd: 0,
						pendingRewards: additionalOptions.includePendingRewards ? '0' : undefined,
						apy: 0,
					},
					{
						protocol: 'rocketpool',
						token: 'rETH',
						balance: '0',
						balanceEth: '0',
						valueUsd: 0,
						pendingRewards: additionalOptions.includePendingRewards ? '0' : undefined,
						apy: 0,
					},
				],
				totalValueEth: '0',
				totalValueUsd: 0,
				totalPendingRewards: additionalOptions.includePendingRewards ? '0' : undefined,
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires on-chain queries',
			};
			break;
		}

		case 'stakeEth': {
			const stakingProtocol = this.getNodeParameter('stakingProtocol', index) as string;
			const stakeAmount = this.getNodeParameter('stakeAmount', index) as number;
			const addressIndex = this.getNodeParameter('addressIndex', index, 0) as number;
			const protocolAddress = stakingProtocol === 'custom'
				? this.getNodeParameter('protocolAddress', index) as string
				: undefined;

			const protocolInfo: Record<string, { token: string; contract: string }> = {
				lido: { token: 'stETH', contract: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' },
				rocketpool: { token: 'rETH', contract: '0xae78736Cd615f374D3085123A210448E74Fc6393' },
				coinbase: { token: 'cbETH', contract: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704' },
				frax: { token: 'sfrxETH', contract: '0xac3E018457B222d93114458476f3E3416Abbe38F' },
				ankr: { token: 'ankrETH', contract: '0xE95A203B1a91a908F9B9CE46459d101078c2c3cb' },
				stakewise: { token: 'sETH2', contract: '0xFe2e637202056d30016725477c5da089Ab0A043A' },
				native: { token: 'ETH', contract: '0x00000000219ab540356cBB839Cbe05303d7705Fa' },
			};

			const info = stakingProtocol === 'custom'
				? { token: 'CUSTOM', contract: protocolAddress }
				: protocolInfo[stakingProtocol];

			result = {
				success: true,
				operation: 'stake',
				protocol: stakingProtocol,
				network,
				stakingContract: info?.contract,
				receivedToken: info?.token,
				amountEth: stakeAmount.toString(),
				estimatedTokens: stakeAmount.toString(),
				signerAddressIndex: addressIndex,
				slippageTolerance: additionalOptions.slippageTolerance || 0.5,
				referral: additionalOptions.referralAddress || null,
				status: 'pending_signature',
				transactionHash: null,
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires Lattice signing',
			};
			break;
		}

		case 'unstakeEth': {
			const stakingProtocol = this.getNodeParameter('stakingProtocol', index) as string;
			const unstakeAmount = this.getNodeParameter('unstakeAmount', index) as number;
			const addressIndex = this.getNodeParameter('addressIndex', index, 0) as number;

			result = {
				success: true,
				operation: 'unstake',
				protocol: stakingProtocol,
				network,
				amount: unstakeAmount > 0 ? unstakeAmount.toString() : 'all',
				estimatedEth: unstakeAmount.toString(),
				signerAddressIndex: addressIndex,
				withdrawalDelay: stakingProtocol === 'native' ? '~1-30 days (validator exit)' : 'varies by protocol',
				status: 'pending_signature',
				transactionHash: null,
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires Lattice signing',
			};
			break;
		}

		case 'claimRewards': {
			const stakingProtocol = this.getNodeParameter('stakingProtocol', index) as string;
			const addressIndex = this.getNodeParameter('addressIndex', index, 0) as number;

			result = {
				success: true,
				operation: 'claim_rewards',
				protocol: stakingProtocol,
				network,
				signerAddressIndex: addressIndex,
				claimableRewards: '0',
				status: 'pending_signature',
				transactionHash: null,
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires on-chain query and Lattice signing',
			};
			break;
		}

		case 'getStakingApy': {
			const stakingProtocol = this.getNodeParameter('stakingProtocol', index) as string;

			result = {
				success: true,
				protocol: stakingProtocol,
				network,
				apy: {
					current: 0,
					sevenDayAverage: 0,
					thirtyDayAverage: 0,
					yearToDate: 0,
				},
				totalValueLocked: '0',
				totalStaked: '0',
				numberOfStakers: 0,
				exchangeRate: '1.0',
				lastUpdated: new Date().toISOString(),
				note: 'Production implementation requires API/on-chain queries',
			};
			break;
		}

		case 'getValidatorInfo': {
			const validatorId = this.getNodeParameter('validatorId', index) as string;

			result = {
				success: true,
				validator: validatorId,
				network,
				status: 'unknown',
				balance: '0',
				effectiveBalance: '0',
				slashed: false,
				activationEpoch: 0,
				exitEpoch: null,
				withdrawableEpoch: null,
				withdrawalCredentials: null,
				attestationEffectiveness: 0,
				proposedBlocks: 0,
				missedAttestations: 0,
				income: {
					total: '0',
					attestations: '0',
					proposals: '0',
					syncCommittee: '0',
				},
				timestamp: new Date().toISOString(),
				note: 'Production implementation requires Beacon Chain API access',
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
