/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, ILoadOptionsFunctions, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { EVM_CHAINS, BITCOIN_NETWORKS } from '../constants/chains';

/**
 * Lattice connection configuration
 */
export interface LatticeConfig {
  deviceId: string;
  password: string;
  appName: string;
  endpointUrl?: string;
  localIp?: string;
  privateKey?: string;
  pairingCode?: string;
  timeout?: number;
  connectionType: 'local' | 'cloud' | 'usb';
}

/**
 * Lattice device state
 */
export interface LatticeState {
  isPaired: boolean;
  isConnected: boolean;
  activeWalletUid: string | null;
  hasSafeCard: boolean;
  firmwareVersion: string | null;
  hardwareVersion: string | null;
  deviceName: string | null;
}

/**
 * Transaction request for signing
 */
export interface TransactionRequest {
  chainId: number;
  to: string;
  value?: string;
  data?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type?: 0 | 2;
}

/**
 * Signed transaction result
 */
export interface SignedTransaction {
  rawTx: string;
  txHash: string;
  v: number;
  r: string;
  s: string;
}

/**
 * Message signing request
 */
export interface MessageRequest {
  message: string;
  address: string;
  protocol?: 'personal_sign' | 'eth_sign';
}

/**
 * Typed data signing request (EIP-712)
 */
export interface TypedDataRequest {
  domain: Record<string, unknown>;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
  address: string;
}

/**
 * Address derivation request
 */
export interface AddressRequest {
  startPath: number[];
  n: number;
  flag?: number;
}

/**
 * Bitcoin PSBT request
 */
export interface PsbtRequest {
  psbt: string;
  inputSignatures?: number[];
}

/**
 * Lattice client wrapper for the GridPlus SDK
 */
export class LatticeClient {
  private config: LatticeConfig;
  private state: LatticeState;
  private client: unknown;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(config: LatticeConfig) {
    this.config = config;
    this.state = {
      isPaired: false,
      isConnected: false,
      activeWalletUid: null,
      hasSafeCard: false,
      firmwareVersion: null,
      hardwareVersion: null,
      deviceName: null,
    };
  }

  /**
   * Initialize the client connection
   */
  async initialize(): Promise<void> {
    try {
      // In a real implementation, this would use the gridplus-sdk
      // const { Client } = await import('gridplus-sdk');
      
      const clientConfig = {
        name: this.config.appName,
        deviceId: this.config.deviceId,
        password: this.config.password,
        baseUrl: this.config.endpointUrl || 'https://signing.gridpl.us',
        privKey: this.config.privateKey || undefined,
        timeout: this.config.timeout || 30000,
      };

      // this.client = new Client(clientConfig);
      this.client = clientConfig; // Placeholder for SDK integration
      
      this.emitLicenseNotice();
    } catch (error) {
      throw new Error(`Failed to initialize Lattice client: ${(error as Error).message}`);
    }
  }

  /**
   * Emit license notice (once per session)
   */
  private emitLicenseNotice(): void {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[Velocity BPA Licensing Notice] ' +
        'This n8n node is licensed under the Business Source License 1.1 (BSL 1.1). ' +
        'Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA. ' +
        'For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.'
      );
    }
  }

  /**
   * Connect to the Lattice device
   */
  async connect(): Promise<boolean> {
    try {
      // Check if already paired
      const isPaired = await this.checkPairing();
      
      if (!isPaired) {
        await this.initiatePairing();
      }

      this.state.isConnected = true;
      this.retryCount = 0;
      
      // Get device info after connection
      await this.refreshDeviceState();
      
      return true;
    } catch (error) {
      this.state.isConnected = false;
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await this.delay(1000 * this.retryCount);
        return this.connect();
      }
      
      throw new Error(`Failed to connect to Lattice: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnect from the Lattice device
   */
  async disconnect(): Promise<void> {
    this.state.isConnected = false;
    this.client = null;
  }

  /**
   * Check if device is paired
   */
  async checkPairing(): Promise<boolean> {
    try {
      // In real implementation: await this.client.getDeviceId();
      this.state.isPaired = !!this.config.pairingCode;
      return this.state.isPaired;
    } catch {
      return false;
    }
  }

  /**
   * Initiate pairing with the device
   */
  async initiatePairing(): Promise<string> {
    try {
      // In real implementation:
      // const pairingCode = await this.client.pair(this.config.password);
      const pairingCode = `PAIR_${Date.now()}`;
      this.state.isPaired = true;
      return pairingCode;
    } catch (error) {
      throw new Error(`Pairing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Refresh device state
   */
  async refreshDeviceState(): Promise<LatticeState> {
    try {
      // In real implementation: const info = await this.client.getDeviceInfo();
      this.state.firmwareVersion = '1.0.0';
      this.state.hardwareVersion = '1.0';
      this.state.deviceName = `Lattice1-${this.config.deviceId.slice(0, 4)}`;
      
      return this.state;
    } catch (error) {
      throw new Error(`Failed to get device state: ${(error as Error).message}`);
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<Record<string, unknown>> {
    this.ensureConnected();
    
    return {
      deviceId: this.config.deviceId,
      appName: this.config.appName,
      firmwareVersion: this.state.firmwareVersion,
      hardwareVersion: this.state.hardwareVersion,
      deviceName: this.state.deviceName,
      isPaired: this.state.isPaired,
      isConnected: this.state.isConnected,
      hasSafeCard: this.state.hasSafeCard,
      activeWalletUid: this.state.activeWalletUid,
    };
  }

  /**
   * Get active wallet
   */
  async getActiveWallet(): Promise<{ uid: string; type: string } | null> {
    this.ensureConnected();
    
    // In real implementation: const wallet = await this.client.getActiveWallet();
    if (!this.state.activeWalletUid) {
      return null;
    }
    
    return {
      uid: this.state.activeWalletUid,
      type: this.state.hasSafeCard ? 'safecard' : 'internal',
    };
  }

  /**
   * Get addresses at derivation path
   */
  async getAddresses(request: AddressRequest): Promise<string[]> {
    this.ensureConnected();
    
    // In real implementation:
    // const addresses = await this.client.getAddresses(request);
    
    // Generate placeholder addresses for demonstration
    const addresses: string[] = [];
    for (let i = 0; i < request.n; i++) {
      addresses.push(`0x${Buffer.from(`addr_${request.startPath.join('_')}_${i}`).toString('hex').slice(0, 40)}`);
    }
    
    return addresses;
  }

  /**
   * Sign Ethereum transaction
   */
  async signTransaction(
    tx: TransactionRequest,
    signerPath: number[],
  ): Promise<SignedTransaction> {
    this.ensureConnected();
    
    // Validate transaction
    this.validateTransaction(tx);
    
    // In real implementation:
    // const signed = await this.client.sign({ 
    //   currency: 'ETH',
    //   data: tx,
    //   signerPath 
    // });
    
    // Placeholder response
    const txHash = `0x${Buffer.from(JSON.stringify(tx)).toString('hex').slice(0, 64)}`;
    
    return {
      rawTx: '0x...',
      txHash,
      v: 27,
      r: '0x' + '0'.repeat(64),
      s: '0x' + '0'.repeat(64),
    };
  }

  /**
   * Sign message
   */
  async signMessage(request: MessageRequest): Promise<string> {
    this.ensureConnected();
    
    // In real implementation:
    // const signature = await this.client.sign({
    //   currency: 'ETH_MSG',
    //   data: { 
    //     payload: request.message,
    //     protocol: request.protocol || 'personal_sign'
    //   }
    // });
    
    // Placeholder signature
    return '0x' + '0'.repeat(130);
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(request: TypedDataRequest): Promise<string> {
    this.ensureConnected();
    
    // In real implementation:
    // const signature = await this.client.sign({
    //   currency: 'ETH_MSG',
    //   data: { 
    //     payload: request,
    //     protocol: 'eip712'
    //   }
    // });
    
    // Placeholder signature
    return '0x' + '0'.repeat(130);
  }

  /**
   * Sign Bitcoin transaction
   */
  async signBitcoinTransaction(
    inputs: Array<{ hash: string; index: number; value: number }>,
    outputs: Array<{ address: string; value: number }>,
    signerPaths: number[][],
  ): Promise<string> {
    this.ensureConnected();
    
    // In real implementation:
    // const signed = await this.client.sign({
    //   currency: 'BTC',
    //   data: { inputs, outputs },
    //   signerPath: signerPaths
    // });
    
    // Placeholder
    return 'raw_btc_tx';
  }

  /**
   * Sign PSBT
   */
  async signPsbt(request: PsbtRequest): Promise<string> {
    this.ensureConnected();
    
    // In real implementation:
    // const signed = await this.client.sign({
    //   currency: 'BTC',
    //   data: { psbt: request.psbt }
    // });
    
    return request.psbt; // Placeholder
  }

  /**
   * Get SafeCard info
   */
  async getSafeCardInfo(): Promise<Record<string, unknown> | null> {
    this.ensureConnected();
    
    if (!this.state.hasSafeCard) {
      return null;
    }
    
    return {
      loaded: true,
      walletUid: this.state.activeWalletUid,
    };
  }

  /**
   * Load SafeCard
   */
  async loadSafeCard(safeCardId: string): Promise<boolean> {
    this.ensureConnected();
    
    // In real implementation: await this.client.loadSafeCard(safeCardId);
    this.state.hasSafeCard = true;
    this.state.activeWalletUid = safeCardId;
    
    return true;
  }

  /**
   * Eject SafeCard
   */
  async ejectSafeCard(): Promise<boolean> {
    this.ensureConnected();
    
    // In real implementation: await this.client.ejectSafeCard();
    this.state.hasSafeCard = false;
    this.state.activeWalletUid = null;
    
    return true;
  }

  /**
   * Get paired apps
   */
  async getPairedApps(): Promise<Array<{ name: string; pairedAt: string }>> {
    this.ensureConnected();
    
    // In real implementation: await this.client.getPairedApps();
    return [
      { name: this.config.appName, pairedAt: new Date().toISOString() },
    ];
  }

  /**
   * Remove app pairing
   */
  async removeAppPairing(appName: string): Promise<boolean> {
    this.ensureConnected();
    
    // In real implementation: await this.client.removePairing(appName);
    return true;
  }

  /**
   * Ping device
   */
  async ping(): Promise<boolean> {
    try {
      this.ensureConnected();
      // In real implementation: await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection state
   */
  getState(): LatticeState {
    return { ...this.state };
  }

  /**
   * Ensure client is connected
   */
  private ensureConnected(): void {
    if (!this.state.isConnected) {
      throw new Error('Not connected to Lattice device. Call connect() first.');
    }
  }

  /**
   * Validate transaction parameters
   */
  private validateTransaction(tx: TransactionRequest): void {
    if (!tx.to || !/^0x[a-fA-F0-9]{40}$/.test(tx.to)) {
      throw new Error('Invalid recipient address');
    }
    
    const chainConfig = Object.values(EVM_CHAINS).find(c => c.chainId === tx.chainId);
    if (!chainConfig && tx.chainId !== 0) {
      console.warn(`Unknown chain ID: ${tx.chainId}`);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create Lattice client from n8n credentials
 */
export async function createLatticeClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialType: string = 'gridPlusLattice',
): Promise<LatticeClient> {
  const credentials = await context.getCredentials(credentialType) as ICredentialDataDecryptedObject;
  
  const config: LatticeConfig = {
    deviceId: credentials.deviceId as string,
    password: credentials.password as string,
    appName: credentials.appName as string || 'n8n-GridPlus',
    endpointUrl: credentials.endpointUrl as string,
    localIp: credentials.localIp as string,
    privateKey: credentials.privateKey as string,
    pairingCode: credentials.pairingCode as string,
    timeout: (credentials.timeout as number) || 30000,
    connectionType: credentials.connectionType as 'local' | 'cloud' | 'usb',
  };
  
  const client = new LatticeClient(config);
  await client.initialize();
  
  return client;
}
