/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * BIP44 coin types
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
export const COIN_TYPES = {
  BTC: 0,
  BTC_TESTNET: 1,
  ETH: 60,
  ETC: 61,
  LTC: 2,
  DOGE: 3,
  BCH: 145,
  XRP: 144,
  ATOM: 118,
  SOL: 501,
  DOT: 354,
} as const;

export type CoinType = typeof COIN_TYPES[keyof typeof COIN_TYPES];

/**
 * Derivation path purposes
 */
export const DERIVATION_PURPOSES = {
  BIP44: 44, // Legacy addresses (P2PKH)
  BIP49: 49, // SegWit compatibility (P2SH-P2WPKH)
  BIP84: 84, // Native SegWit (P2WPKH bech32)
  BIP86: 86, // Taproot (P2TR)
} as const;

export type DerivationPurpose = typeof DERIVATION_PURPOSES[keyof typeof DERIVATION_PURPOSES];

/**
 * Common derivation path templates
 */
export const DERIVATION_PATHS = {
  // Ethereum paths
  ETHEREUM_LEDGER: "m/44'/60'/0'/0",
  ETHEREUM_METAMASK: "m/44'/60'/0'/0/0",
  ETHEREUM_LEGACY: "m/44'/60'/0'",
  
  // Bitcoin paths
  BITCOIN_LEGACY: "m/44'/0'/0'",
  BITCOIN_SEGWIT_COMPAT: "m/49'/0'/0'",
  BITCOIN_NATIVE_SEGWIT: "m/84'/0'/0'",
  BITCOIN_TAPROOT: "m/86'/0'/0'",
  
  // Bitcoin testnet paths
  BITCOIN_TESTNET_LEGACY: "m/44'/1'/0'",
  BITCOIN_TESTNET_SEGWIT: "m/84'/1'/0'",
  
  // Other chains
  LITECOIN: "m/44'/2'/0'",
  DOGECOIN: "m/44'/3'/0'",
  ETHEREUM_CLASSIC: "m/44'/61'/0'",
} as const;

export type DerivationPath = typeof DERIVATION_PATHS[keyof typeof DERIVATION_PATHS];

/**
 * Address types supported by Lattice1
 */
export const ADDRESS_TYPES = {
  ETH: 'ETH',
  BTC_LEGACY: 'BTC_LEGACY',
  BTC_SEGWIT: 'BTC_SEGWIT',
  BTC_NATIVE_SEGWIT: 'BTC_NATIVE_SEGWIT',
  BTC_TAPROOT: 'BTC_TAPROOT',
} as const;

export type AddressType = typeof ADDRESS_TYPES[keyof typeof ADDRESS_TYPES];

/**
 * Build a derivation path from components
 */
export function buildDerivationPath(
  purpose: number,
  coinType: number,
  account: number = 0,
  change: number = 0,
  addressIndex?: number,
): string {
  let path = `m/${purpose}'/${coinType}'/${account}'`;
  
  if (change !== undefined) {
    path += `/${change}`;
  }
  
  if (addressIndex !== undefined) {
    path += `/${addressIndex}`;
  }
  
  return path;
}

/**
 * Parse a derivation path into components
 */
export function parseDerivationPath(path: string): {
  purpose: number;
  coinType: number;
  account: number;
  change?: number;
  addressIndex?: number;
} | null {
  const regex = /^m\/(\d+)'\/(\d+)'\/(\d+)'(?:\/(\d+))?(?:\/(\d+))?$/;
  const match = path.match(regex);
  
  if (!match) {
    return null;
  }
  
  return {
    purpose: parseInt(match[1], 10),
    coinType: parseInt(match[2], 10),
    account: parseInt(match[3], 10),
    change: match[4] ? parseInt(match[4], 10) : undefined,
    addressIndex: match[5] ? parseInt(match[5], 10) : undefined,
  };
}

/**
 * Get derivation path for Ethereum at specific index
 */
export function getEthereumPath(index: number = 0): string {
  return `m/44'/60'/0'/0/${index}`;
}

/**
 * Get derivation path for Bitcoin at specific index
 */
export function getBitcoinPath(
  index: number = 0,
  type: 'legacy' | 'segwit' | 'native' | 'taproot' = 'native',
  testnet: boolean = false,
): string {
  const coinType = testnet ? 1 : 0;
  
  const purposes: Record<string, number> = {
    legacy: 44,
    segwit: 49,
    native: 84,
    taproot: 86,
  };
  
  const purpose = purposes[type];
  return `m/${purpose}'/${coinType}'/0'/0/${index}`;
}

/**
 * Get extended key paths for HD wallets
 */
export const EXTENDED_KEY_PATHS = {
  // xPub paths (BIP44)
  XPUB_BTC: "m/44'/0'/0'",
  XPUB_ETH: "m/44'/60'/0'",
  
  // yPub paths (BIP49)
  YPUB_BTC: "m/49'/0'/0'",
  
  // zPub paths (BIP84)
  ZPUB_BTC: "m/84'/0'/0'",
} as const;

/**
 * Lattice1 address flags
 */
export const ADDRESS_FLAGS = {
  NONE: 0,
  ED25519: 1,
  SECP256K1: 2,
  COMPRESSED: 4,
  UNCOMPRESSED: 8,
} as const;

export type AddressFlag = typeof ADDRESS_FLAGS[keyof typeof ADDRESS_FLAGS];

/**
 * Default number of addresses to derive
 */
export const DEFAULT_ADDRESS_COUNT = 10;

/**
 * Maximum addresses per request
 */
export const MAX_ADDRESSES_PER_REQUEST = 10;

/**
 * Validate a derivation path
 */
export function isValidDerivationPath(path: string): boolean {
  const regex = /^m(\/\d+'?)+$/;
  return regex.test(path);
}

/**
 * Get standard derivation path by chain
 */
export function getStandardPath(
  chain: 'ethereum' | 'bitcoin' | 'polygon' | 'arbitrum' | 'optimism',
  index: number = 0,
): string {
  switch (chain) {
    case 'ethereum':
    case 'polygon':
    case 'arbitrum':
    case 'optimism':
      return getEthereumPath(index);
    case 'bitcoin':
      return getBitcoinPath(index, 'native', false);
    default:
      return getEthereumPath(index);
  }
}
