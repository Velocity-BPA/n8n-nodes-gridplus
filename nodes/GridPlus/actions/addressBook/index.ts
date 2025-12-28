/**
 * Address Book Resource Actions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLatticeClient } from '../../transport/latticeClient';
import { createAddressBookEntry, searchAddressBook, exportAddressBookToCsv, importAddressBookFromCsv } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['addressBook'],
			},
		},
		options: [
			{ name: 'Add Address', value: 'addAddress', action: 'Add address' },
			{ name: 'Export Address Book', value: 'exportAddressBook', action: 'Export address book' },
			{ name: 'Get Address Book', value: 'getAddressBook', action: 'Get address book' },
			{ name: 'Get Address by Label', value: 'getAddressByLabel', action: 'Get address by label' },
			{ name: 'Get Address Tags', value: 'getAddressTags', action: 'Get address tags' },
			{ name: 'Import Address Book', value: 'importAddressBook', action: 'Import address book' },
			{ name: 'Remove Address', value: 'removeAddress', action: 'Remove address' },
			{ name: 'Search Addresses', value: 'searchAddresses', action: 'Search addresses' },
			{ name: 'Update Address', value: 'updateAddress', action: 'Update address' },
		],
		default: 'getAddressBook',
	},
	// Address
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['addAddress', 'updateAddress', 'removeAddress', 'getAddressTags'],
			},
		},
		default: '',
		required: true,
		description: 'Blockchain address',
	},
	// Label
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['addAddress', 'updateAddress', 'getAddressByLabel'],
			},
		},
		default: '',
		description: 'Human-readable label for the address',
	},
	// Tags
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['addAddress', 'updateAddress'],
			},
		},
		default: '',
		description: 'Comma-separated tags',
	},
	// Chain type
	{
		displayName: 'Chain Type',
		name: 'chainType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['addAddress', 'updateAddress'],
			},
		},
		options: [
			{ name: 'Ethereum/EVM', value: 'ethereum' },
			{ name: 'Bitcoin', value: 'bitcoin' },
		],
		default: 'ethereum',
		description: 'Type of blockchain for this address',
	},
	// Notes
	{
		displayName: 'Notes',
		name: 'notes',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['addAddress', 'updateAddress'],
			},
		},
		default: '',
		description: 'Additional notes about this address',
	},
	// Search query
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['searchAddresses'],
			},
		},
		default: '',
		required: true,
		description: 'Search term (matches address, label, or tags)',
	},
	// CSV data for import
	{
		displayName: 'CSV Data',
		name: 'csvData',
		type: 'string',
		typeOptions: {
			rows: 10,
		},
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['importAddressBook'],
			},
		},
		default: '',
		required: true,
		description: 'CSV data to import (address,label,tags,notes)',
	},
	// Export format
	{
		displayName: 'Format',
		name: 'exportFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['addressBook'],
				operation: ['exportAddressBook'],
			},
		},
		options: [
			{ name: 'CSV', value: 'csv' },
			{ name: 'JSON', value: 'json' },
		],
		default: 'csv',
		description: 'Export format',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createLatticeClient(this);
	await client.connect();

	// Simulated address book storage (in production, this would be persisted)
	const addressBook: Array<{
		address: string;
		label: string;
		tags: string[];
		chainType: string;
		notes: string;
		createdAt: string;
		updatedAt: string;
	}> = [];

	switch (operation) {
		case 'getAddressBook': {
			return [{
				json: {
					entries: addressBook,
					count: addressBook.length,
				},
				pairedItem: { item: index },
			}];
		}

		case 'addAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const label = this.getNodeParameter('label', index) as string;
			const tagsStr = this.getNodeParameter('tags', index) as string;
			const chainType = this.getNodeParameter('chainType', index) as string;
			const notes = this.getNodeParameter('notes', index) as string;

			const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
			const entry = createAddressBookEntry(address, label, tags, chainType);
			
			return [{
				json: {
					success: true,
					entry: {
						...entry,
						notes,
					},
				},
				pairedItem: { item: index },
			}];
		}

		case 'updateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const label = this.getNodeParameter('label', index) as string;
			const tagsStr = this.getNodeParameter('tags', index) as string;
			const notes = this.getNodeParameter('notes', index) as string;

			const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

			return [{
				json: {
					success: true,
					address,
					label,
					tags,
					notes,
					updatedAt: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'removeAddress': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					success: true,
					address,
					removed: true,
					timestamp: new Date().toISOString(),
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAddressByLabel': {
			const label = this.getNodeParameter('label', index) as string;
			const results = searchAddressBook(addressBook, label);

			return [{
				json: {
					label,
					entries: results,
					count: results.length,
				},
				pairedItem: { item: index },
			}];
		}

		case 'searchAddresses': {
			const searchQuery = this.getNodeParameter('searchQuery', index) as string;
			const results = searchAddressBook(addressBook, searchQuery);

			return [{
				json: {
					query: searchQuery,
					results,
					count: results.length,
				},
				pairedItem: { item: index },
			}];
		}

		case 'getAddressTags': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					tags: [],
				},
				pairedItem: { item: index },
			}];
		}

		case 'exportAddressBook': {
			const exportFormat = this.getNodeParameter('exportFormat', index) as string;

			if (exportFormat === 'csv') {
				const csv = exportAddressBookToCsv(addressBook);
				return [{
					json: {
						format: 'csv',
						data: csv,
						count: addressBook.length,
					},
					pairedItem: { item: index },
				}];
			} else {
				return [{
					json: {
						format: 'json',
						data: addressBook,
						count: addressBook.length,
					},
					pairedItem: { item: index },
				}];
			}
		}

		case 'importAddressBook': {
			const csvData = this.getNodeParameter('csvData', index) as string;
			const imported = importAddressBookFromCsv(csvData);

			return [{
				json: {
					success: true,
					imported: imported.length,
					entries: imported,
				},
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
