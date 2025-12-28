/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * GridPlus event types for triggers
 */
export const GRIDPLUS_EVENTS = {
  // Device events
  DEVICE_CONNECTED: 'device.connected',
  DEVICE_DISCONNECTED: 'device.disconnected',
  DEVICE_STATE_CHANGED: 'device.state_changed',
  DEVICE_ERROR: 'device.error',
  
  // SafeCard events
  SAFECARD_LOADED: 'safecard.loaded',
  SAFECARD_EJECTED: 'safecard.ejected',
  SAFECARD_ERROR: 'safecard.error',
  
  // Wallet events
  WALLET_CHANGED: 'wallet.changed',
  WALLET_ACTIVATED: 'wallet.activated',
  
  // Transaction events
  TRANSACTION_REQUEST: 'transaction.request',
  TRANSACTION_SIGNED: 'transaction.signed',
  TRANSACTION_REJECTED: 'transaction.rejected',
  TRANSACTION_BROADCAST: 'transaction.broadcast',
  TRANSACTION_CONFIRMED: 'transaction.confirmed',
  TRANSACTION_FAILED: 'transaction.failed',
  
  // Signing events
  SIGN_REQUEST_RECEIVED: 'signing.request_received',
  SIGN_REQUEST_APPROVED: 'signing.request_approved',
  SIGN_REQUEST_REJECTED: 'signing.request_rejected',
  SIGN_BATCH_COMPLETE: 'signing.batch_complete',
  
  // Auto-sign events
  AUTO_SIGN_TRIGGERED: 'autosign.triggered',
  AUTO_SIGN_LIMIT_REACHED: 'autosign.limit_reached',
  AUTO_SIGN_DISABLED: 'autosign.disabled',
  AUTO_SIGN_RULE_MATCHED: 'autosign.rule_matched',
  
  // Address events
  ADDRESS_GENERATED: 'address.generated',
  ADDRESS_BOOK_UPDATED: 'address.book_updated',
  ADDRESS_TAG_ADDED: 'address.tag_added',
  
  // Security events
  PAIRING_REQUEST: 'security.pairing_request',
  PAIRING_COMPLETED: 'security.pairing_completed',
  PAIRING_FAILED: 'security.pairing_failed',
  PERMISSION_CHANGED: 'security.permission_changed',
  SPENDING_LIMIT_HIT: 'security.spending_limit_hit',
  UNUSUAL_ACTIVITY: 'security.unusual_activity',
  PIN_TIMEOUT: 'security.pin_timeout',
  
  // Connection events
  CONNECTION_ESTABLISHED: 'connection.established',
  CONNECTION_LOST: 'connection.lost',
  CONNECTION_RECONNECTING: 'connection.reconnecting',
  CONNECTION_TIMEOUT: 'connection.timeout',
} as const;

export type GridPlusEventType = typeof GRIDPLUS_EVENTS[keyof typeof GRIDPLUS_EVENTS];

/**
 * Event categories for filtering
 */
export const EVENT_CATEGORIES = {
  DEVICE: 'device',
  SAFECARD: 'safecard',
  WALLET: 'wallet',
  TRANSACTION: 'transaction',
  SIGNING: 'signing',
  AUTO_SIGN: 'autosign',
  ADDRESS: 'address',
  SECURITY: 'security',
  CONNECTION: 'connection',
} as const;

export type EventCategory = typeof EVENT_CATEGORIES[keyof typeof EVENT_CATEGORIES];

/**
 * Event payload interfaces
 */
export interface BaseEventPayload {
  timestamp: string;
  deviceId: string;
  eventType: GridPlusEventType;
}

export interface DeviceEventPayload extends BaseEventPayload {
  deviceInfo?: {
    firmwareVersion: string;
    hardwareVersion: string;
    isPaired: boolean;
  };
  state?: string;
  error?: string;
}

export interface SafeCardEventPayload extends BaseEventPayload {
  safeCardId?: string;
  safeCardName?: string;
  walletUid?: string;
}

export interface TransactionEventPayload extends BaseEventPayload {
  txHash?: string;
  txType?: string;
  chainId?: number;
  from?: string;
  to?: string;
  value?: string;
  nonce?: number;
  status?: 'pending' | 'signed' | 'rejected' | 'broadcast' | 'confirmed' | 'failed';
}

export interface SigningEventPayload extends BaseEventPayload {
  requestId: string;
  requestType: 'transaction' | 'message' | 'typedData' | 'hash';
  signerAddress?: string;
  signature?: string;
  approved?: boolean;
}

export interface AutoSignEventPayload extends BaseEventPayload {
  ruleId: string;
  ruleName: string;
  matchedCriteria?: Record<string, unknown>;
  limitRemaining?: string;
  disabled?: boolean;
}

export interface AddressEventPayload extends BaseEventPayload {
  address: string;
  derivationPath?: string;
  label?: string;
  tags?: string[];
}

export interface SecurityEventPayload extends BaseEventPayload {
  eventSubtype: string;
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, unknown>;
  recommendation?: string;
}

export interface ConnectionEventPayload extends BaseEventPayload {
  connectionType: 'local' | 'cloud' | 'usb';
  status: 'connected' | 'disconnected' | 'reconnecting' | 'timeout';
  retryCount?: number;
}

export type EventPayload =
  | DeviceEventPayload
  | SafeCardEventPayload
  | TransactionEventPayload
  | SigningEventPayload
  | AutoSignEventPayload
  | AddressEventPayload
  | SecurityEventPayload
  | ConnectionEventPayload;

/**
 * Get events by category
 */
export function getEventsByCategory(category: EventCategory): GridPlusEventType[] {
  const events: GridPlusEventType[] = [];
  const prefix = category + '.';
  
  for (const event of Object.values(GRIDPLUS_EVENTS)) {
    if (event.startsWith(prefix)) {
      events.push(event);
    }
  }
  
  return events;
}

/**
 * Get event category from event type
 */
export function getEventCategory(eventType: GridPlusEventType): EventCategory | null {
  const category = eventType.split('.')[0];
  
  if (Object.values(EVENT_CATEGORIES).includes(category as EventCategory)) {
    return category as EventCategory;
  }
  
  return null;
}

/**
 * Polling intervals for different event types (in milliseconds)
 */
export const POLLING_INTERVALS = {
  DEVICE_STATUS: 5000,
  TRANSACTION_STATUS: 3000,
  SIGNING_REQUEST: 2000,
  CONNECTION_CHECK: 10000,
  AUTO_SIGN_CHECK: 5000,
} as const;

/**
 * Default webhook path for events
 */
export const WEBHOOK_PATH = '/gridplus/webhook';
