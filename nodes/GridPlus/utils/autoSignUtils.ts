/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  AutoSignRule,
  AutoSignRuleType,
  AUTO_SIGN_RULE_TYPES,
  AutoSignCriteria,
  SpendingLimit,
  WhitelistedContract,
  SAFETY_LIMITS,
  LIMIT_PERIODS,
} from '../constants/permissions';
import { TransactionRequest } from '../transport/latticeClient';

/**
 * Auto-sign evaluation result
 */
export interface AutoSignEvaluation {
  eligible: boolean;
  matchedRules: AutoSignRule[];
  blockedBy?: string;
  reason?: string;
  spendingCheck?: {
    passed: boolean;
    limitId?: string;
    used: string;
    remaining: string;
  };
}

/**
 * Create a new auto-sign rule
 */
export function createAutoSignRule(
  name: string,
  type: AutoSignRuleType,
  criteria: AutoSignCriteria,
  limits?: SpendingLimit,
  chainId?: number,
): AutoSignRule {
  const now = new Date().toISOString();
  
  return {
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    enabled: true,
    chainId,
    criteria,
    limits,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a spending limit rule
 */
export function createSpendingLimitRule(
  name: string,
  chainId: number,
  maxAmount: string,
  period: 'transaction' | 'daily' | 'weekly' | 'monthly',
  tokenAddress?: string,
): AutoSignRule {
  return createAutoSignRule(
    name,
    AUTO_SIGN_RULE_TYPES.SPENDING_LIMIT,
    {
      maxValue: maxAmount,
    },
    {
      chainId,
      tokenAddress,
      maxAmount,
      period,
      used: '0',
    },
    chainId,
  );
}

/**
 * Create a contract whitelist rule
 */
export function createContractWhitelistRule(
  name: string,
  chainId: number,
  contractAddresses: string[],
  methodSignatures?: string[],
): AutoSignRule {
  return createAutoSignRule(
    name,
    AUTO_SIGN_RULE_TYPES.CONTRACT_WHITELIST,
    {
      contractAddresses,
      methodSignatures,
    },
    undefined,
    chainId,
  );
}

/**
 * Create an address whitelist rule
 */
export function createAddressWhitelistRule(
  name: string,
  chainId: number,
  toAddresses: string[],
  maxValue?: string,
): AutoSignRule {
  return createAutoSignRule(
    name,
    AUTO_SIGN_RULE_TYPES.ADDRESS_WHITELIST,
    {
      toAddresses,
      maxValue,
    },
    undefined,
    chainId,
  );
}

/**
 * Create a time-based rule
 */
export function createTimeBasedRule(
  name: string,
  chainId: number,
  startTime: string,
  endTime: string,
  daysOfWeek?: number[],
  maxValue?: string,
): AutoSignRule {
  return createAutoSignRule(
    name,
    AUTO_SIGN_RULE_TYPES.TIME_BASED,
    {
      timeWindow: {
        start: startTime,
        end: endTime,
        daysOfWeek,
      },
      maxValue,
    },
    undefined,
    chainId,
  );
}

/**
 * Evaluate transaction against auto-sign rules
 */
export function evaluateAutoSign(
  tx: TransactionRequest,
  rules: AutoSignRule[],
  spendingLimits: SpendingLimit[],
  whitelistedContracts: WhitelistedContract[],
): AutoSignEvaluation {
  const matchedRules: AutoSignRule[] = [];
  
  // Filter to enabled rules for this chain
  const applicableRules = rules.filter(
    rule => rule.enabled && (!rule.chainId || rule.chainId === tx.chainId)
  );
  
  if (applicableRules.length === 0) {
    return {
      eligible: false,
      matchedRules: [],
      reason: 'No applicable auto-sign rules for this chain',
    };
  }
  
  for (const rule of applicableRules) {
    const matches = checkRuleMatch(tx, rule, whitelistedContracts);
    if (matches) {
      matchedRules.push(rule);
    }
  }
  
  if (matchedRules.length === 0) {
    return {
      eligible: false,
      matchedRules: [],
      reason: 'Transaction does not match any auto-sign rules',
    };
  }
  
  // Check spending limits
  const spendingCheck = checkSpendingLimits(tx, spendingLimits);
  if (!spendingCheck.passed) {
    return {
      eligible: false,
      matchedRules,
      blockedBy: 'spending_limit',
      reason: `Spending limit exceeded: ${spendingCheck.remaining} remaining`,
      spendingCheck,
    };
  }
  
  return {
    eligible: true,
    matchedRules,
    spendingCheck,
  };
}

/**
 * Check if transaction matches a specific rule
 */
function checkRuleMatch(
  tx: TransactionRequest,
  rule: AutoSignRule,
  whitelistedContracts: WhitelistedContract[],
): boolean {
  const criteria = rule.criteria;
  
  switch (rule.type) {
    case AUTO_SIGN_RULE_TYPES.SPENDING_LIMIT:
      return checkValueLimit(tx.value, criteria.maxValue);
      
    case AUTO_SIGN_RULE_TYPES.CONTRACT_WHITELIST:
      return checkContractWhitelist(tx.to, tx.data, criteria, whitelistedContracts);
      
    case AUTO_SIGN_RULE_TYPES.ADDRESS_WHITELIST:
      return checkAddressWhitelist(tx.to, criteria.toAddresses) &&
        checkValueLimit(tx.value, criteria.maxValue);
      
    case AUTO_SIGN_RULE_TYPES.TIME_BASED:
      return checkTimeWindow(criteria.timeWindow) &&
        checkValueLimit(tx.value, criteria.maxValue);
      
    case AUTO_SIGN_RULE_TYPES.TOKEN_TRANSFER:
      return checkTokenTransfer(tx.data, criteria.tokenAddresses);
      
    default:
      return false;
  }
}

/**
 * Check if value is within limit
 */
function checkValueLimit(value?: string, maxValue?: string): boolean {
  if (!maxValue) return true;
  if (!value) return true;
  
  const valueBigInt = BigInt(value);
  const maxBigInt = BigInt(maxValue);
  
  return valueBigInt <= maxBigInt;
}

/**
 * Check contract whitelist
 */
function checkContractWhitelist(
  to: string,
  data?: string,
  criteria?: AutoSignCriteria,
  whitelistedContracts?: WhitelistedContract[],
): boolean {
  const toAddress = to.toLowerCase();
  
  // Check criteria contract list
  if (criteria?.contractAddresses) {
    const inCriteriaList = criteria.contractAddresses.some(
      addr => addr.toLowerCase() === toAddress
    );
    if (!inCriteriaList) return false;
  }
  
  // Check global whitelist
  if (whitelistedContracts) {
    const contract = whitelistedContracts.find(
      c => c.address.toLowerCase() === toAddress
    );
    
    if (!contract) return false;
    
    // Check method signature if specified
    if (contract.allowedMethods && data && data.length >= 10) {
      const methodSig = data.slice(0, 10);
      if (!contract.allowedMethods.includes(methodSig)) {
        return false;
      }
    }
  }
  
  // Check method signatures from criteria
  if (criteria?.methodSignatures && data && data.length >= 10) {
    const methodSig = data.slice(0, 10);
    if (!criteria.methodSignatures.includes(methodSig)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check address whitelist
 */
function checkAddressWhitelist(to: string, addresses?: string[]): boolean {
  if (!addresses || addresses.length === 0) return false;
  
  const toAddress = to.toLowerCase();
  return addresses.some(addr => addr.toLowerCase() === toAddress);
}

/**
 * Check time window
 */
function checkTimeWindow(
  timeWindow?: { start: string; end: string; daysOfWeek?: number[] },
): boolean {
  if (!timeWindow) return true;
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  const currentDay = now.getDay();
  
  // Check day of week
  if (timeWindow.daysOfWeek && !timeWindow.daysOfWeek.includes(currentDay)) {
    return false;
  }
  
  // Check time range
  if (currentTime < timeWindow.start || currentTime > timeWindow.end) {
    return false;
  }
  
  return true;
}

/**
 * Check token transfer
 */
function checkTokenTransfer(data?: string, tokenAddresses?: string[]): boolean {
  if (!data || !tokenAddresses) return false;
  
  // ERC20 transfer signature: 0xa9059cbb
  // ERC20 transferFrom signature: 0x23b872dd
  const transferSig = '0xa9059cbb';
  const transferFromSig = '0x23b872dd';
  
  if (data.startsWith(transferSig) || data.startsWith(transferFromSig)) {
    // Would need to decode and check token address
    return true;
  }
  
  return false;
}

/**
 * Check spending limits
 */
function checkSpendingLimits(
  tx: TransactionRequest,
  limits: SpendingLimit[],
): { passed: boolean; limitId?: string; used: string; remaining: string } {
  const chainLimits = limits.filter(l => l.chainId === tx.chainId);
  
  if (chainLimits.length === 0) {
    return { passed: true, used: '0', remaining: 'unlimited' };
  }
  
  for (const limit of chainLimits) {
    // Skip token-specific limits if this is a native transfer
    if (limit.tokenAddress && (!tx.data || tx.data === '0x')) {
      continue;
    }
    
    const txValue = BigInt(tx.value || '0');
    const maxAmount = BigInt(limit.maxAmount);
    const used = BigInt(limit.used);
    const remaining = maxAmount - used;
    
    if (txValue > remaining) {
      return {
        passed: false,
        limitId: limit.id,
        used: used.toString(),
        remaining: remaining.toString(),
      };
    }
  }
  
  return { passed: true, used: '0', remaining: 'available' };
}

/**
 * Update spending after successful transaction
 */
export function updateSpendingUsed(
  limit: SpendingLimit,
  amount: string,
): SpendingLimit {
  const newUsed = (BigInt(limit.used) + BigInt(amount)).toString();
  
  return {
    ...limit,
    used: newUsed,
  };
}

/**
 * Reset spending limit (for period reset)
 */
export function resetSpendingLimit(limit: SpendingLimit): SpendingLimit {
  const periodSeconds = LIMIT_PERIODS[limit.period];
  const resetAt = new Date(Date.now() + periodSeconds * 1000).toISOString();
  
  return {
    ...limit,
    used: '0',
    resetAt,
  };
}

/**
 * Check if limit needs reset
 */
export function needsReset(limit: SpendingLimit): boolean {
  if (!limit.resetAt) return false;
  return new Date(limit.resetAt) < new Date();
}

/**
 * Validate auto-sign rule
 */
export function validateAutoSignRule(rule: AutoSignRule): string[] {
  const errors: string[] = [];
  
  if (!rule.name || rule.name.length === 0) {
    errors.push('Rule name is required');
  }
  
  if (!Object.values(AUTO_SIGN_RULE_TYPES).includes(rule.type)) {
    errors.push('Invalid rule type');
  }
  
  if (rule.criteria.toAddresses && rule.criteria.toAddresses.length > SAFETY_LIMITS.MAX_ADDRESSES_PER_RULE) {
    errors.push(`Too many addresses (max ${SAFETY_LIMITS.MAX_ADDRESSES_PER_RULE})`);
  }
  
  if (rule.limits) {
    const maxBigInt = BigInt(SAFETY_LIMITS.MAX_SPENDING_LIMIT_AMOUNT);
    if (BigInt(rule.limits.maxAmount) > maxBigInt) {
      errors.push('Spending limit amount exceeds maximum allowed');
    }
  }
  
  return errors;
}

/**
 * Export rules to JSON
 */
export function exportRules(rules: AutoSignRule[]): string {
  return JSON.stringify(rules, null, 2);
}

/**
 * Import rules from JSON
 */
export function importRules(json: string): AutoSignRule[] {
  const parsed = JSON.parse(json);
  
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid rules format: expected array');
  }
  
  // Validate each rule
  for (const rule of parsed) {
    const errors = validateAutoSignRule(rule);
    if (errors.length > 0) {
      throw new Error(`Invalid rule "${rule.name}": ${errors.join(', ')}`);
    }
  }
  
  return parsed;
}
