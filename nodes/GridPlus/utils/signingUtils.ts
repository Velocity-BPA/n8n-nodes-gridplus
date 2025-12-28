/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { LatticeClient, TransactionRequest, MessageRequest, TypedDataRequest } from '../transport/latticeClient';
import { EVM_CHAINS, getChainConfig } from '../constants/chains';
import { getEthereumPath, parseDerivationPath } from '../constants/derivationPaths';

/**
 * Signing result
 */
export interface SigningResult {
  success: boolean;
  signature?: string;
  txHash?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Transaction building options
 */
export interface TransactionOptions {
  chainId: number;
  to: string;
  value?: string;
  data?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type?: 'legacy' | 'eip1559';
}

/**
 * Build transaction request from options
 */
export function buildTransactionRequest(options: TransactionOptions): TransactionRequest {
  const chainConfig = getChainConfig(
    Object.keys(EVM_CHAINS).find(k => EVM_CHAINS[k].chainId === options.chainId) || ''
  );
  
  // Determine transaction type
  const useEip1559 = options.type === 'eip1559' || 
    (options.type !== 'legacy' && chainConfig?.eip1559);
  
  const tx: TransactionRequest = {
    chainId: options.chainId,
    to: options.to,
    value: options.value || '0x0',
    data: options.data || '0x',
  };
  
  if (options.nonce !== undefined) {
    tx.nonce = options.nonce;
  }
  
  if (options.gasLimit) {
    tx.gasLimit = options.gasLimit;
  }
  
  if (useEip1559) {
    tx.type = 2;
    tx.maxFeePerGas = options.maxFeePerGas;
    tx.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
  } else {
    tx.type = 0;
    tx.gasPrice = options.gasPrice;
  }
  
  return tx;
}

/**
 * Sign an Ethereum transaction
 */
export async function signEthereumTransaction(
  client: LatticeClient,
  options: TransactionOptions,
  addressIndex: number = 0,
): Promise<SigningResult> {
  try {
    const tx = buildTransactionRequest(options);
    const path = parseDerivationPath(getEthereumPath(addressIndex));
    
    if (!path) {
      throw new Error('Invalid derivation path');
    }
    
    const signerPath = [
      path.purpose + 0x80000000,
      path.coinType + 0x80000000,
      path.account + 0x80000000,
      path.change || 0,
      path.addressIndex || 0,
    ];
    
    const signed = await client.signTransaction(tx, signerPath);
    
    return {
      success: true,
      txHash: signed.txHash,
      signature: `${signed.r}${signed.s.slice(2)}${signed.v.toString(16)}`,
      metadata: {
        rawTx: signed.rawTx,
        chainId: options.chainId,
        addressIndex,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Sign a message
 */
export async function signMessage(
  client: LatticeClient,
  message: string,
  address: string,
  protocol: 'personal_sign' | 'eth_sign' = 'personal_sign',
): Promise<SigningResult> {
  try {
    const request: MessageRequest = {
      message,
      address,
      protocol,
    };
    
    const signature = await client.signMessage(request);
    
    return {
      success: true,
      signature,
      metadata: {
        message,
        address,
        protocol,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Sign typed data (EIP-712)
 */
export async function signTypedData(
  client: LatticeClient,
  typedData: TypedDataRequest,
): Promise<SigningResult> {
  try {
    const signature = await client.signTypedData(typedData);
    
    return {
      success: true,
      signature,
      metadata: {
        primaryType: typedData.primaryType,
        domain: typedData.domain,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Sign Bitcoin PSBT
 */
export async function signPsbt(
  client: LatticeClient,
  psbt: string,
  inputSignatures?: number[],
): Promise<SigningResult> {
  try {
    const signedPsbt = await client.signPsbt({ psbt, inputSignatures });
    
    return {
      success: true,
      signature: signedPsbt,
      metadata: {
        inputsCount: inputSignatures?.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Batch sign multiple transactions
 */
export async function batchSign(
  client: LatticeClient,
  transactions: TransactionOptions[],
  addressIndex: number = 0,
): Promise<SigningResult[]> {
  const results: SigningResult[] = [];
  
  for (const tx of transactions) {
    const result = await signEthereumTransaction(client, tx, addressIndex);
    results.push(result);
    
    // Small delay between signatures to avoid overwhelming the device
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Validate transaction before signing
 */
export function validateTransaction(options: TransactionOptions): string[] {
  const errors: string[] = [];
  
  // Validate address
  if (!options.to || !/^0x[a-fA-F0-9]{40}$/.test(options.to)) {
    errors.push('Invalid recipient address');
  }
  
  // Validate chain ID
  if (!options.chainId || options.chainId < 1) {
    errors.push('Invalid chain ID');
  }
  
  // Validate value
  if (options.value && !/^0x[a-fA-F0-9]+$/.test(options.value)) {
    errors.push('Invalid value format (must be hex)');
  }
  
  // Validate gas parameters
  if (options.type === 'eip1559') {
    if (!options.maxFeePerGas) {
      errors.push('maxFeePerGas is required for EIP-1559 transactions');
    }
    if (!options.maxPriorityFeePerGas) {
      errors.push('maxPriorityFeePerGas is required for EIP-1559 transactions');
    }
  } else if (options.type === 'legacy') {
    if (!options.gasPrice) {
      errors.push('gasPrice is required for legacy transactions');
    }
  }
  
  return errors;
}

/**
 * Validate message for signing
 */
export function validateMessage(message: string): string[] {
  const errors: string[] = [];
  
  if (!message || message.length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (message.length > 10000) {
    errors.push('Message is too long (max 10000 characters)');
  }
  
  return errors;
}

/**
 * Format signature for different purposes
 */
export function formatSignature(
  signature: string,
  format: 'raw' | 'rsv' | 'vrs' = 'raw',
): string {
  if (!signature.startsWith('0x')) {
    signature = '0x' + signature;
  }
  
  // Standard Ethereum signature is 65 bytes (130 hex chars + 0x prefix)
  if (signature.length !== 132) {
    return signature; // Return as-is if not standard length
  }
  
  const r = signature.slice(2, 66);
  const s = signature.slice(66, 130);
  const v = signature.slice(130, 132);
  
  switch (format) {
    case 'rsv':
      return `0x${r}${s}${v}`;
    case 'vrs':
      return `0x${v}${r}${s}`;
    default:
      return signature;
  }
}

/**
 * Recover signer address from signature
 */
export function recoverSignerAddress(
  message: string,
  signature: string,
): string | null {
  // This would use ethers.js verifyMessage in a real implementation
  // Placeholder return
  return null;
}

/**
 * Hash message for signing (EIP-191)
 */
export function hashMessage(message: string): string {
  const prefix = '\x19Ethereum Signed Message:\n';
  const fullMessage = prefix + message.length + message;
  // In real implementation: ethers.keccak256(ethers.toUtf8Bytes(fullMessage))
  return '0x' + Buffer.from(fullMessage).toString('hex');
}

/**
 * Encode typed data hash (EIP-712)
 */
export function encodeTypedDataHash(typedData: TypedDataRequest): string {
  // In real implementation: ethers.TypedDataEncoder.hash(domain, types, message)
  return '0x' + Buffer.from(JSON.stringify(typedData)).toString('hex').slice(0, 64);
}
