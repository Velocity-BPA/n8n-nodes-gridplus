/**
 * GridPlus Lattice1 Trigger Node
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import type {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { createLatticeClient } from './transport/latticeClient';
import { EVENT_TYPES, POLLING_INTERVALS } from './constants/events';

export class GridPlusTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GridPlus Trigger',
		name: 'gridPlusTrigger',
		icon: 'file:gridplus.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows on GridPlus Lattice1 events',
		defaults: {
			name: 'GridPlus Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'gridPlusLattice',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event Category',
				name: 'eventCategory',
				type: 'options',
				options: [
					{ name: 'Device Events', value: 'device' },
					{ name: 'SafeCard Events', value: 'safecard' },
					{ name: 'Transaction Events', value: 'transaction' },
					{ name: 'Signing Events', value: 'signing' },
					{ name: 'Auto-Sign Events', value: 'autosign' },
					{ name: 'Address Events', value: 'address' },
					{ name: 'Security Events', value: 'security' },
					{ name: 'Connection Events', value: 'connection' },
				],
				default: 'device',
				description: 'Category of events to listen for',
			},
			// Device events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['device'],
					},
				},
				options: [
					{ name: 'Device Connected', value: EVENT_TYPES.DEVICE.CONNECTED },
					{ name: 'Device Disconnected', value: EVENT_TYPES.DEVICE.DISCONNECTED },
					{ name: 'Device State Changed', value: EVENT_TYPES.DEVICE.STATE_CHANGED },
				],
				default: EVENT_TYPES.DEVICE.CONNECTED,
				description: 'Device event to trigger on',
			},
			// SafeCard events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['safecard'],
					},
				},
				options: [
					{ name: 'SafeCard Loaded', value: EVENT_TYPES.SAFECARD.LOADED },
					{ name: 'SafeCard Ejected', value: EVENT_TYPES.SAFECARD.EJECTED },
				],
				default: EVENT_TYPES.SAFECARD.LOADED,
				description: 'SafeCard event to trigger on',
			},
			// Transaction events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['transaction'],
					},
				},
				options: [
					{ name: 'Transaction Request', value: EVENT_TYPES.TRANSACTION.REQUEST },
					{ name: 'Transaction Signed', value: EVENT_TYPES.TRANSACTION.SIGNED },
					{ name: 'Transaction Rejected', value: EVENT_TYPES.TRANSACTION.REJECTED },
					{ name: 'Transaction Broadcast', value: EVENT_TYPES.TRANSACTION.BROADCAST },
					{ name: 'Transaction Confirmed', value: EVENT_TYPES.TRANSACTION.CONFIRMED },
				],
				default: EVENT_TYPES.TRANSACTION.SIGNED,
				description: 'Transaction event to trigger on',
			},
			// Signing events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['signing'],
					},
				},
				options: [
					{ name: 'Sign Request Received', value: EVENT_TYPES.SIGNING.REQUEST_RECEIVED },
					{ name: 'Sign Request Approved', value: EVENT_TYPES.SIGNING.APPROVED },
					{ name: 'Sign Request Rejected', value: EVENT_TYPES.SIGNING.REJECTED },
					{ name: 'Batch Sign Complete', value: EVENT_TYPES.SIGNING.BATCH_COMPLETE },
				],
				default: EVENT_TYPES.SIGNING.APPROVED,
				description: 'Signing event to trigger on',
			},
			// Auto-sign events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['autosign'],
					},
				},
				options: [
					{ name: 'Auto-Sign Triggered', value: EVENT_TYPES.AUTOSIGN.TRIGGERED },
					{ name: 'Auto-Sign Limit Reached', value: EVENT_TYPES.AUTOSIGN.LIMIT_REACHED },
					{ name: 'Auto-Sign Disabled', value: EVENT_TYPES.AUTOSIGN.DISABLED },
				],
				default: EVENT_TYPES.AUTOSIGN.TRIGGERED,
				description: 'Auto-sign event to trigger on',
			},
			// Address events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['address'],
					},
				},
				options: [
					{ name: 'Address Generated', value: EVENT_TYPES.ADDRESS.GENERATED },
					{ name: 'Address Book Updated', value: EVENT_TYPES.ADDRESS.BOOK_UPDATED },
					{ name: 'Tag Added', value: EVENT_TYPES.ADDRESS.TAG_ADDED },
				],
				default: EVENT_TYPES.ADDRESS.GENERATED,
				description: 'Address event to trigger on',
			},
			// Security events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['security'],
					},
				},
				options: [
					{ name: 'Pairing Request', value: EVENT_TYPES.SECURITY.PAIRING },
					{ name: 'Permission Changed', value: EVENT_TYPES.SECURITY.PERMISSION_CHANGED },
					{ name: 'Spending Limit Hit', value: EVENT_TYPES.SECURITY.SPENDING_LIMIT_HIT },
					{ name: 'Unusual Activity', value: EVENT_TYPES.SECURITY.UNUSUAL_ACTIVITY },
				],
				default: EVENT_TYPES.SECURITY.SPENDING_LIMIT_HIT,
				description: 'Security event to trigger on',
			},
			// Connection events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['connection'],
					},
				},
				options: [
					{ name: 'Connection Established', value: EVENT_TYPES.CONNECTION.ESTABLISHED },
					{ name: 'Connection Lost', value: EVENT_TYPES.CONNECTION.LOST },
					{ name: 'Reconnecting', value: EVENT_TYPES.CONNECTION.RECONNECTING },
					{ name: 'Connection Timeout', value: EVENT_TYPES.CONNECTION.TIMEOUT },
				],
				default: EVENT_TYPES.CONNECTION.LOST,
				description: 'Connection event to trigger on',
			},
			// Additional options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Device Info',
						name: 'includeDeviceInfo',
						type: 'boolean',
						default: true,
						description: 'Whether to include full device information in the event payload',
					},
					{
						displayName: 'Include Timestamp',
						name: 'includeTimestamp',
						type: 'boolean',
						default: true,
						description: 'Whether to include ISO timestamp in the event payload',
					},
					{
						displayName: 'Filter by Wallet UID',
						name: 'walletUid',
						type: 'string',
						default: '',
						description: 'Only trigger for events from this specific wallet UID',
					},
					{
						displayName: 'Filter by Chain ID',
						name: 'chainId',
						type: 'number',
						default: 0,
						description: 'Only trigger for events on this chain (0 for all chains)',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const eventCategory = this.getNodeParameter('eventCategory') as string;
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options', {}) as {
			includeDeviceInfo?: boolean;
			includeTimestamp?: boolean;
			walletUid?: string;
			chainId?: number;
		};

		const webhookData = this.getWorkflowStaticData('node');
		const lastPollTime = webhookData.lastPollTime as number | undefined;
		const now = Date.now();

		// Update last poll time
		webhookData.lastPollTime = now;

		try {
			const client = await createLatticeClient(this as unknown as Parameters<typeof createLatticeClient>[0]);
			await client.connect();

			const events: INodeExecutionData[] = [];

			// Check for events based on category
			switch (eventCategory) {
				case 'device': {
					const deviceState = await client.getDeviceInfo();
					const previousState = webhookData.deviceState as typeof deviceState | undefined;

					if (event === EVENT_TYPES.DEVICE.CONNECTED && !previousState && deviceState) {
						events.push(createEventPayload('device_connected', deviceState, options));
					} else if (event === EVENT_TYPES.DEVICE.DISCONNECTED && previousState && !deviceState) {
						events.push(createEventPayload('device_disconnected', { previousState }, options));
					} else if (event === EVENT_TYPES.DEVICE.STATE_CHANGED && previousState &&
						JSON.stringify(previousState) !== JSON.stringify(deviceState)) {
						events.push(createEventPayload('device_state_changed', {
							previous: previousState,
							current: deviceState,
						}, options));
					}

					webhookData.deviceState = deviceState;
					break;
				}

				case 'safecard': {
					const safeCardInfo = await client.getSafeCardInfo();
					const previousSafeCard = webhookData.safeCardInfo as typeof safeCardInfo | undefined;

					if (event === EVENT_TYPES.SAFECARD.LOADED && !previousSafeCard?.loaded && safeCardInfo?.loaded) {
						events.push(createEventPayload('safecard_loaded', safeCardInfo, options));
					} else if (event === EVENT_TYPES.SAFECARD.EJECTED && previousSafeCard?.loaded && !safeCardInfo?.loaded) {
						events.push(createEventPayload('safecard_ejected', { previousSafeCard }, options));
					}

					webhookData.safeCardInfo = safeCardInfo;
					break;
				}

				case 'transaction': {
					// Poll for transaction status changes
					const pendingTxs = webhookData.pendingTransactions as string[] || [];
					// In a real implementation, this would check transaction statuses
					// For now, we'll emit events based on state changes
					break;
				}

				case 'signing': {
					// Check for pending signing requests
					// This would typically integrate with the device's signing queue
					break;
				}

				case 'autosign': {
					// Monitor auto-sign activity
					break;
				}

				case 'connection': {
					const isConnected = client.isConnected;
					const wasConnected = webhookData.wasConnected as boolean | undefined;

					if (event === EVENT_TYPES.CONNECTION.ESTABLISHED && !wasConnected && isConnected) {
						events.push(createEventPayload('connection_established', {
							deviceId: client.deviceId,
						}, options));
					} else if (event === EVENT_TYPES.CONNECTION.LOST && wasConnected && !isConnected) {
						events.push(createEventPayload('connection_lost', {
							deviceId: client.deviceId,
						}, options));
					}

					webhookData.wasConnected = isConnected;
					break;
				}
			}

			// Filter events if wallet UID or chain ID specified
			let filteredEvents = events;
			if (options.walletUid) {
				filteredEvents = filteredEvents.filter(e =>
					e.json.walletUid === options.walletUid || !e.json.walletUid
				);
			}
			if (options.chainId && options.chainId > 0) {
				filteredEvents = filteredEvents.filter(e =>
					e.json.chainId === options.chainId || !e.json.chainId
				);
			}

			if (filteredEvents.length > 0) {
				return [filteredEvents];
			}

			return null;
		} catch (error) {
			// On connection errors, emit connection_lost event if listening for it
			if (eventCategory === 'connection' && event === EVENT_TYPES.CONNECTION.LOST) {
				return [[createEventPayload('connection_lost', {
					error: error instanceof Error ? error.message : String(error),
				}, options)]];
			}

			// For other errors, just return null (no events)
			return null;
		}
	}
}

function createEventPayload(
	eventType: string,
	data: Record<string, unknown>,
	options: { includeTimestamp?: boolean; includeDeviceInfo?: boolean },
): INodeExecutionData {
	const payload: Record<string, unknown> = {
		event: eventType,
		...data,
	};

	if (options.includeTimestamp !== false) {
		payload.timestamp = new Date().toISOString();
		payload.timestampMs = Date.now();
	}

	return {
		json: payload,
	};
}
