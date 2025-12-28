/**
 * Bitcoin Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { getBitcoinAddresses } from '../../utils/addressUtils';
import { signPsbt } from '../../utils/signingUtils';
import { BITCOIN_NETWORKS } from '../../constants/chains';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['bitcoin'],
			},
		},
		options: [
			{ name: 'Broadcast Transaction', value: 'broadcastTransaction', action: 'Broadcast transaction' },
			{ name: 'Compose Transaction', value: 'composeTransaction', action: 'Compose transaction' },
			{ name: 'Create Transaction', value: 'createTransaction', action: 'Create transaction' },
			{ name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
			{ name: 'Get Bitcoin Address at Index', value: 'getAddressAtIndex', action: 'Get Bitcoin address at index' },
			{ name: 'Get Bitcoin Addresses', value: 'getAddresses', action: 'Get Bitcoin addresses' },
			{ name: 'Get UTXO', value: 'getUtxo', action: 'Get UTXO' },
			{ name: 'Get xPub/yPub/zPub', value: 'getExtendedPubKey', action: 'Get extended public key' },
			{ name: 'Sign Message', value: 'signMessage', action: 'Sign message' },
			{ name: 'Sign PSBT', value: 'signPsbt', action: 'Sign PSBT' },
			{ name: 'Sign Transaction', value: 'signTransaction', action: 'Sign transaction' },
			{ name: 'Verify Message', value: 'verifyMessage', action: 'Verify message' },
		],
		default: 'getAddresses',
	},
	// Network selection
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
			},
		},
		options: [
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Testnet', value: 'testnet' },
			{ name: 'Signet', value: 'signet' },
		],
		default: 'mainnet',
		description: 'Bitcoin network to use',
	},
	// Address type
	{
		displayName: 'Address Type',
		name: 'addressType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
			},
		},
		options: [
			{ name: 'Native SegWit (Bech32/bc1q)', value: 'bech32' },
			{ name: 'SegWit (P2SH/3)', value: 'segwit' },
			{ name: 'Legacy (P2PKH/1)', value: 'legacy' },
			{ name: 'Taproot (bc1p)', value: 'taproot' },
		],
		default: 'bech32',
		description: 'Bitcoin address format',
	},
	// Address count
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['getAddresses'],
			},
		},
		default: 5,
		typeOptions: { minValue: 1, maxValue: 10 },
		description: 'Number of addresses to retrieve',
	},
	// Address index
	{
		displayName: 'Address Index',
		name: 'addressIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['getAddressAtIndex', 'signTransaction', 'signPsbt', 'signMessage'],
			},
		},
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Address index for operations',
	},
	// Extended key type
	{
		displayName: 'Extended Key Type',
		name: 'extendedKeyType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['getExtendedPubKey'],
			},
		},
		options: [
			{ name: 'xPub (Legacy/BIP44)', value: 'xpub' },
			{ name: 'yPub (SegWit/BIP49)', value: 'ypub' },
			{ name: 'zPub (Native SegWit/BIP84)', value: 'zpub' },
		],
		default: 'zpub',
		description: 'Type of extended public key to retrieve',
	},
	// Account number
	{
		displayName: 'Account',
		name: 'account',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['getExtendedPubKey', 'getAddresses'],
			},
		},
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'BIP44 account number',
	},
	// PSBT
	{
		displayName: 'PSBT (Base64)',
		name: 'psbt',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['signPsbt'],
			},
		},
		default: '',
		required: true,
		description: 'Partially Signed Bitcoin Transaction in Base64 format',
	},
	// Raw transaction
	{
		displayName: 'Raw Transaction (Hex)',
		name: 'rawTransaction',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['signTransaction', 'broadcastTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Raw Bitcoin transaction in hex format',
	},
	// Transaction inputs
	{
		displayName: 'Inputs (JSON)',
		name: 'inputs',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['createTransaction', 'composeTransaction'],
			},
		},
		default: '[]',
		description: 'Transaction inputs as JSON array',
	},
	// Transaction outputs
	{
		displayName: 'Outputs (JSON)',
		name: 'outputs',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['createTransaction', 'composeTransaction'],
			},
		},
		default: '[]',
		description: 'Transaction outputs as JSON array',
	},
	// Fee rate
	{
		displayName: 'Fee Rate (sat/vB)',
		name: 'feeRate',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['createTransaction', 'composeTransaction'],
			},
		},
		default: 10,
		description: 'Fee rate in satoshis per virtual byte',
	},
	// Address for balance/UTXO
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['getBalance', 'getUtxo'],
			},
		},
		default: '',
		required: true,
		description: 'Bitcoin address',
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['signMessage', 'verifyMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Message to sign or verify',
	},
	// Signature for verification
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['verifyMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Signature to verify',
	},
	{
		displayName: 'Signer Address',
		name: 'signerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['bitcoin'],
				operation: ['verifyMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Address that supposedly signed the message',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createLatticeClient(this);
	await client.connect();

	const network = this.getNodeParameter('network', index) as string;
	const addressType = this.getNodeParameter('addressType', index) as string;
	const networkConfig = BITCOIN_NETWORKS[network as keyof typeof BITCOIN_NETWORKS];

	switch (operation) {
		case 'getAddresses': {
			const count = this.getNodeParameter('count', index) as number;
			const addresses = await getBitcoinAddresses(client, 0, count, addressType);
			return [{
				json: {
					network,
					addressType,
					addresses,
					count: addresses.length,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAddressAtIndex': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const addresses = await getBitcoinAddresses(client, addressIndex, 1, addressType);
			return [{
				json: {
					network,
					addressType,
					index: addressIndex,
					address: addresses[0] || null,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getExtendedPubKey': {
			const extendedKeyType = this.getNodeParameter('extendedKeyType', index) as string;
			const account = this.getNodeParameter('account', index) as number;

			const purposeMap: Record<string, number> = {
				xpub: 44,
				ypub: 49,
				zpub: 84,
			};

			return [{
				json: {
					network,
					keyType: extendedKeyType,
					account,
					derivationPath: `m/${purposeMap[extendedKeyType]}'/${networkConfig?.coinType || 0}'/${account}'`,
					note: 'Extended public key retrieval requires device interaction',
				},
				pairedItem: { item: index },
			}];
		}

		case 'signPsbt': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const psbt = this.getNodeParameter('psbt', index) as string;
			const result = await signPsbt(client, psbt, addressIndex);
			return [{
				json: {
					success: true,
					network,
					signedPsbt: result.signedPsbt,
					complete: result.complete,
				},
				pairedItem: { item: index },
			}];
		}

		case 'signTransaction': {
			const rawTransaction = this.getNodeParameter('rawTransaction', index) as string;
			return [{
				json: {
					network,
					rawTransaction,
					note: 'Use signPsbt for better signing support',
				},
				pairedItem: { item: index },
			}];
		}

		case 'signMessage': {
			const addressIndex = this.getNodeParameter('addressIndex', index) as number;
			const message = this.getNodeParameter('message', index) as string;
			const addresses = await getBitcoinAddresses(client, addressIndex, 1, addressType);

			return [{
				json: {
					network,
					message,
					address: addresses[0],
					signature: '',
					note: 'Bitcoin message signing requires device interaction',
				},
				pairedItem: { item: index },
			}];
		}

		case 'verifyMessage': {
			const message = this.getNodeParameter('message', index) as string;
			const signature = this.getNodeParameter('signature', index) as string;
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;

			return [{
				json: {
					network,
					message,
					signature,
					signerAddress,
					verified: false,
					note: 'Message verification requires signature validation',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			return [{
				json: {
					network,
					address,
					balance: '0',
					unit: 'satoshis',
					note: 'Balance retrieval requires network API access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'getUtxo': {
			const address = this.getNodeParameter('address', index) as string;
			return [{
				json: {
					network,
					address,
					utxos: [],
					note: 'UTXO retrieval requires network API access',
				},
				pairedItem: { item: index },
			}];
		}

		case 'createTransaction':
		case 'composeTransaction': {
			const inputs = this.getNodeParameter('inputs', index) as object[];
			const outputs = this.getNodeParameter('outputs', index) as object[];
			const feeRate = this.getNodeParameter('feeRate', index) as number;

			return [{
				json: {
					network,
					inputs,
					outputs,
					feeRate,
					estimatedFee: 0,
					note: 'Transaction composition requires UTXO data',
				},
				pairedItem: { item: index },
			}];
		}

		case 'broadcastTransaction': {
			const rawTransaction = this.getNodeParameter('rawTransaction', index) as string;
			return [{
				json: {
					network,
					rawTransaction,
					broadcasted: false,
					note: 'Transaction broadcast requires network API access',
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
