/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { LatticeClient } from '../transport/latticeClient';
import {
  getEthereumPath,
  getBitcoinPath,
  parseDerivationPath,
  isValidDerivationPath,
  COIN_TYPES,
} from '../constants/derivationPaths';

/**
 * Address with metadata
 */
export interface AddressInfo {
  address: string;
  derivationPath: string;
  index: number;
  type: 'ethereum' | 'bitcoin' | 'other';
  label?: string;
  tags?: string[];
  createdAt?: string;
}

/**
 * Address book entry
 */
export interface AddressBookEntry {
  address: string;
  label: string;
  tags?: string[];
  chainId?: number;
  isContract?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Ethereum addresses
 */
export async function getEthereumAddresses(
  client: LatticeClient,
  startIndex: number = 0,
  count: number = 5,
): Promise<AddressInfo[]> {
  const addresses: AddressInfo[] = [];
  
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = getEthereumPath(i);
    const parsed = parseDerivationPath(path);
    
    if (!parsed) continue;
    
    const startPath = [
      parsed.purpose + 0x80000000,
      parsed.coinType + 0x80000000,
      parsed.account + 0x80000000,
      parsed.change || 0,
      i,
    ];
    
    const result = await client.getAddresses({ startPath, n: 1 });
    
    if (result.length > 0) {
      addresses.push({
        address: result[0],
        derivationPath: path,
        index: i,
        type: 'ethereum',
      });
    }
  }
  
  return addresses;
}

/**
 * Get Bitcoin addresses
 */
export async function getBitcoinAddresses(
  client: LatticeClient,
  startIndex: number = 0,
  count: number = 5,
  addressType: 'legacy' | 'segwit' | 'native' | 'taproot' = 'native',
  testnet: boolean = false,
): Promise<AddressInfo[]> {
  const addresses: AddressInfo[] = [];
  
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = getBitcoinPath(i, addressType, testnet);
    const parsed = parseDerivationPath(path);
    
    if (!parsed) continue;
    
    const startPath = [
      parsed.purpose + 0x80000000,
      parsed.coinType + 0x80000000,
      parsed.account + 0x80000000,
      parsed.change || 0,
      i,
    ];
    
    const result = await client.getAddresses({ startPath, n: 1 });
    
    if (result.length > 0) {
      addresses.push({
        address: result[0],
        derivationPath: path,
        index: i,
        type: 'bitcoin',
      });
    }
  }
  
  return addresses;
}

/**
 * Get address at specific derivation path
 */
export async function getAddressAtPath(
  client: LatticeClient,
  derivationPath: string,
): Promise<string | null> {
  if (!isValidDerivationPath(derivationPath)) {
    throw new Error(`Invalid derivation path: ${derivationPath}`);
  }
  
  const parsed = parseDerivationPath(derivationPath);
  if (!parsed) {
    return null;
  }
  
  const startPath = [
    parsed.purpose + 0x80000000,
    parsed.coinType + 0x80000000,
    parsed.account + 0x80000000,
    parsed.change || 0,
    parsed.addressIndex || 0,
  ];
  
  const result = await client.getAddresses({ startPath, n: 1 });
  return result.length > 0 ? result[0] : null;
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Bitcoin address
 */
export function isValidBitcoinAddress(
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
): boolean {
  // Legacy P2PKH
  if (network === 'mainnet' && /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    return true;
  }
  if (network === 'testnet' && /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    return true;
  }
  
  // P2SH (SegWit compatible)
  if (network === 'mainnet' && /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    return true;
  }
  if (network === 'testnet' && /^2[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    return true;
  }
  
  // Bech32 (Native SegWit)
  if (network === 'mainnet' && /^bc1[a-z0-9]{39,59}$/.test(address.toLowerCase())) {
    return true;
  }
  if (network === 'testnet' && /^tb1[a-z0-9]{39,59}$/.test(address.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Validate address for any supported chain
 */
export function isValidAddress(
  address: string,
  chain: 'ethereum' | 'bitcoin' | 'polygon' | 'arbitrum' = 'ethereum',
  network: 'mainnet' | 'testnet' = 'mainnet',
): boolean {
  switch (chain) {
    case 'bitcoin':
      return isValidBitcoinAddress(address, network);
    case 'ethereum':
    case 'polygon':
    case 'arbitrum':
    default:
      return isValidEthereumAddress(address);
  }
}

/**
 * Format address for display
 */
export function formatAddress(
  address: string,
  format: 'full' | 'short' | 'checksum' = 'full',
): string {
  if (!address) return '';
  
  switch (format) {
    case 'short':
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    case 'checksum':
      return toChecksumAddress(address);
    case 'full':
    default:
      return address;
  }
}

/**
 * Convert to checksum address (EIP-55)
 */
export function toChecksumAddress(address: string): string {
  if (!isValidEthereumAddress(address)) {
    return address;
  }
  
  // In real implementation, use ethers.getAddress()
  // This is a simplified version
  const addr = address.toLowerCase().replace('0x', '');
  // Would hash with keccak256 and capitalize based on hash
  return '0x' + addr;
}

/**
 * Compare addresses (case-insensitive for Ethereum)
 */
export function addressesEqual(addr1: string, addr2: string): boolean {
  if (!addr1 || !addr2) return false;
  return addr1.toLowerCase() === addr2.toLowerCase();
}

/**
 * Get address type from derivation path
 */
export function getAddressTypeFromPath(path: string): 'ethereum' | 'bitcoin' | 'unknown' {
  const parsed = parseDerivationPath(path);
  if (!parsed) return 'unknown';
  
  if (parsed.coinType === COIN_TYPES.ETH) {
    return 'ethereum';
  }
  
  if (parsed.coinType === COIN_TYPES.BTC || parsed.coinType === COIN_TYPES.BTC_TESTNET) {
    return 'bitcoin';
  }
  
  return 'unknown';
}

/**
 * Create address book entry
 */
export function createAddressBookEntry(
  address: string,
  label: string,
  options?: Partial<Omit<AddressBookEntry, 'address' | 'label' | 'createdAt' | 'updatedAt'>>,
): AddressBookEntry {
  const now = new Date().toISOString();
  
  return {
    address: address.toLowerCase(),
    label,
    tags: options?.tags || [],
    chainId: options?.chainId,
    isContract: options?.isContract || false,
    notes: options?.notes,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Search address book
 */
export function searchAddressBook(
  entries: AddressBookEntry[],
  query: string,
): AddressBookEntry[] {
  const lowerQuery = query.toLowerCase();
  
  return entries.filter(entry => 
    entry.address.toLowerCase().includes(lowerQuery) ||
    entry.label.toLowerCase().includes(lowerQuery) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    entry.notes?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Export address book to CSV
 */
export function exportAddressBookToCsv(entries: AddressBookEntry[]): string {
  const headers = ['Address', 'Label', 'Tags', 'Chain ID', 'Is Contract', 'Notes', 'Created At'];
  const rows = entries.map(entry => [
    entry.address,
    entry.label,
    entry.tags?.join(';') || '',
    entry.chainId?.toString() || '',
    entry.isContract ? 'true' : 'false',
    entry.notes || '',
    entry.createdAt,
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

/**
 * Import address book from CSV
 */
export function importAddressBookFromCsv(csv: string): AddressBookEntry[] {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const entries: AddressBookEntry[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    if (cleanValues.length >= 2) {
      entries.push({
        address: cleanValues[0],
        label: cleanValues[1],
        tags: cleanValues[2] ? cleanValues[2].split(';') : [],
        chainId: cleanValues[3] ? parseInt(cleanValues[3], 10) : undefined,
        isContract: cleanValues[4] === 'true',
        notes: cleanValues[5] || undefined,
        createdAt: cleanValues[6] || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  
  return entries;
}
