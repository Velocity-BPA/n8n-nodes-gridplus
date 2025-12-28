/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Lattice1 permission types
 */
export const PERMISSION_TYPES = {
  SIGN_TRANSACTION: 'sign_transaction',
  SIGN_MESSAGE: 'sign_message',
  SIGN_TYPED_DATA: 'sign_typed_data',
  GET_ADDRESSES: 'get_addresses',
  GET_PUBLIC_KEYS: 'get_public_keys',
  ADD_ADDRESS_TAGS: 'add_address_tags',
  VIEW_ADDRESS_BOOK: 'view_address_book',
  MODIFY_ADDRESS_BOOK: 'modify_address_book',
  CREATE_AUTO_SIGN_RULE: 'create_auto_sign_rule',
  MODIFY_AUTO_SIGN_RULE: 'modify_auto_sign_rule',
  VIEW_SPENDING_LIMITS: 'view_spending_limits',
  MODIFY_SPENDING_LIMITS: 'modify_spending_limits',
  ADD_WHITELISTED_CONTRACT: 'add_whitelisted_contract',
  REMOVE_WHITELISTED_CONTRACT: 'remove_whitelisted_contract',
  EXPORT_DATA: 'export_data',
  VIEW_DEVICE_INFO: 'view_device_info',
} as const;

export type PermissionType = typeof PERMISSION_TYPES[keyof typeof PERMISSION_TYPES];

/**
 * Permission levels
 */
export const PERMISSION_LEVELS = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  ADMIN: 3,
} as const;

export type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];

/**
 * Permission scope
 */
export const PERMISSION_SCOPES = {
  DEVICE: 'device',
  WALLET: 'wallet',
  SAFECARD: 'safecard',
  NETWORK: 'network',
  GLOBAL: 'global',
} as const;

export type PermissionScope = typeof PERMISSION_SCOPES[keyof typeof PERMISSION_SCOPES];

/**
 * Auto-sign rule types
 */
export const AUTO_SIGN_RULE_TYPES = {
  SPENDING_LIMIT: 'spending_limit',
  CONTRACT_WHITELIST: 'contract_whitelist',
  ADDRESS_WHITELIST: 'address_whitelist',
  TOKEN_TRANSFER: 'token_transfer',
  NFT_TRANSFER: 'nft_transfer',
  DEFI_INTERACTION: 'defi_interaction',
  RECURRING: 'recurring',
  TIME_BASED: 'time_based',
} as const;

export type AutoSignRuleType = typeof AUTO_SIGN_RULE_TYPES[keyof typeof AUTO_SIGN_RULE_TYPES];

/**
 * Auto-sign rule configuration
 */
export interface AutoSignRule {
  id: string;
  name: string;
  type: AutoSignRuleType;
  enabled: boolean;
  chainId?: number;
  criteria: AutoSignCriteria;
  limits?: SpendingLimit;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auto-sign criteria
 */
export interface AutoSignCriteria {
  toAddresses?: string[];
  fromAddresses?: string[];
  contractAddresses?: string[];
  methodSignatures?: string[];
  maxValue?: string;
  maxGasPrice?: string;
  tokenAddresses?: string[];
  timeWindow?: {
    start: string;
    end: string;
    daysOfWeek?: number[];
  };
}

/**
 * Spending limit configuration
 */
export interface SpendingLimit {
  id?: string;
  chainId: number;
  tokenAddress?: string; // null for native currency
  maxAmount: string;
  period: 'transaction' | 'daily' | 'weekly' | 'monthly';
  used: string;
  resetAt?: string;
}

/**
 * Contract whitelist entry
 */
export interface WhitelistedContract {
  address: string;
  chainId: number;
  name: string;
  verified: boolean;
  allowedMethods?: string[];
  addedAt: string;
  addedBy: string;
}

/**
 * Default permission sets
 */
export const DEFAULT_PERMISSION_SETS = {
  READ_ONLY: [
    PERMISSION_TYPES.GET_ADDRESSES,
    PERMISSION_TYPES.GET_PUBLIC_KEYS,
    PERMISSION_TYPES.VIEW_ADDRESS_BOOK,
    PERMISSION_TYPES.VIEW_SPENDING_LIMITS,
    PERMISSION_TYPES.VIEW_DEVICE_INFO,
  ],
  BASIC_SIGNING: [
    PERMISSION_TYPES.GET_ADDRESSES,
    PERMISSION_TYPES.GET_PUBLIC_KEYS,
    PERMISSION_TYPES.SIGN_TRANSACTION,
    PERMISSION_TYPES.SIGN_MESSAGE,
    PERMISSION_TYPES.VIEW_ADDRESS_BOOK,
  ],
  FULL_SIGNING: [
    PERMISSION_TYPES.GET_ADDRESSES,
    PERMISSION_TYPES.GET_PUBLIC_KEYS,
    PERMISSION_TYPES.SIGN_TRANSACTION,
    PERMISSION_TYPES.SIGN_MESSAGE,
    PERMISSION_TYPES.SIGN_TYPED_DATA,
    PERMISSION_TYPES.VIEW_ADDRESS_BOOK,
    PERMISSION_TYPES.MODIFY_ADDRESS_BOOK,
    PERMISSION_TYPES.ADD_ADDRESS_TAGS,
  ],
  ADMIN: Object.values(PERMISSION_TYPES),
} as const;

/**
 * Permission error codes
 */
export const PERMISSION_ERRORS = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_LEVEL: 'INSUFFICIENT_LEVEL',
  EXPIRED_PERMISSION: 'EXPIRED_PERMISSION',
  INVALID_SCOPE: 'INVALID_SCOPE',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  CONTRACT_NOT_WHITELISTED: 'CONTRACT_NOT_WHITELISTED',
  AUTO_SIGN_DISABLED: 'AUTO_SIGN_DISABLED',
  RULE_NOT_MATCHED: 'RULE_NOT_MATCHED',
} as const;

export type PermissionError = typeof PERMISSION_ERRORS[keyof typeof PERMISSION_ERRORS];

/**
 * Check if permission is in set
 */
export function hasPermission(
  permissions: PermissionType[],
  required: PermissionType,
): boolean {
  return permissions.includes(required);
}

/**
 * Check if all permissions are present
 */
export function hasAllPermissions(
  permissions: PermissionType[],
  required: PermissionType[],
): boolean {
  return required.every((p) => permissions.includes(p));
}

/**
 * Check if any permission is present
 */
export function hasAnyPermission(
  permissions: PermissionType[],
  required: PermissionType[],
): boolean {
  return required.some((p) => permissions.includes(p));
}

/**
 * Get missing permissions
 */
export function getMissingPermissions(
  current: PermissionType[],
  required: PermissionType[],
): PermissionType[] {
  return required.filter((p) => !current.includes(p));
}

/**
 * Format permission for display
 */
export function formatPermission(permission: PermissionType): string {
  return permission
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Spending limit periods in seconds
 */
export const LIMIT_PERIODS = {
  transaction: 0,
  daily: 86400,
  weekly: 604800,
  monthly: 2592000,
} as const;

/**
 * Maximum values for safety
 */
export const SAFETY_LIMITS = {
  MAX_AUTO_SIGN_RULES: 50,
  MAX_WHITELISTED_CONTRACTS: 100,
  MAX_SPENDING_LIMIT_AMOUNT: '1000000000000000000000000', // 1M ETH equivalent
  MAX_ADDRESSES_PER_RULE: 20,
  MAX_METHODS_PER_CONTRACT: 50,
} as const;
