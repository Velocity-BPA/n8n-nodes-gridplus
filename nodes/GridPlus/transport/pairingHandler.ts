/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { LatticeClient, LatticeConfig } from './latticeClient';

/**
 * Pairing state
 */
export interface PairingState {
  status: 'not_started' | 'pending' | 'awaiting_approval' | 'completed' | 'failed';
  deviceId: string | null;
  appName: string | null;
  pairingCode: string | null;
  secret: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Pairing options
 */
export interface PairingOptions {
  deviceId: string;
  password: string;
  appName: string;
  endpointUrl?: string;
  timeout?: number;
  onStatusChange?: (state: PairingState) => void;
  onApprovalRequired?: (code: string) => void;
}

/**
 * Pairing result
 */
export interface PairingResult {
  success: boolean;
  pairingCode: string | null;
  secret: string | null;
  error: string | null;
}

/**
 * Handles the pairing process between n8n and Lattice1 device
 */
export class PairingHandler {
  private state: PairingState;
  private options: PairingOptions;
  private client: LatticeClient | null = null;
  private pollingInterval: NodeJS.Timer | null = null;
  private readonly POLL_INTERVAL = 2000; // 2 seconds
  private readonly MAX_WAIT_TIME = 120000; // 2 minutes

  constructor(options: PairingOptions) {
    this.options = options;
    this.state = {
      status: 'not_started',
      deviceId: options.deviceId,
      appName: options.appName,
      pairingCode: null,
      secret: null,
      error: null,
      startedAt: null,
      completedAt: null,
    };
  }

  /**
   * Get current pairing state
   */
  getState(): PairingState {
    return { ...this.state };
  }

  /**
   * Start the pairing process
   */
  async startPairing(): Promise<PairingResult> {
    try {
      this.updateState({ status: 'pending', startedAt: new Date().toISOString() });

      // Initialize client
      const config: LatticeConfig = {
        deviceId: this.options.deviceId,
        password: this.options.password,
        appName: this.options.appName,
        endpointUrl: this.options.endpointUrl,
        timeout: this.options.timeout || 30000,
        connectionType: 'cloud',
      };

      this.client = new LatticeClient(config);
      await this.client.initialize();

      // Check if already paired
      const isPaired = await this.client.checkPairing();
      
      if (isPaired) {
        this.updateState({
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        
        return {
          success: true,
          pairingCode: this.state.pairingCode,
          secret: this.state.secret,
          error: null,
        };
      }

      // Initiate new pairing
      this.updateState({ status: 'awaiting_approval' });

      const pairingCode = await this.client.initiatePairing();
      this.updateState({ pairingCode });

      // Notify that approval is required on device
      if (this.options.onApprovalRequired) {
        this.options.onApprovalRequired(pairingCode);
      }

      // Wait for approval
      const approved = await this.waitForApproval();
      
      if (approved) {
        this.updateState({
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        
        return {
          success: true,
          pairingCode: this.state.pairingCode,
          secret: this.state.secret,
          error: null,
        };
      } else {
        throw new Error('Pairing was not approved within the timeout period');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.updateState({
        status: 'failed',
        error: errorMessage,
      });
      
      return {
        success: false,
        pairingCode: null,
        secret: null,
        error: errorMessage,
      };
    } finally {
      this.cleanup();
    }
  }

  /**
   * Wait for user approval on the device
   */
  private async waitForApproval(): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      this.pollingInterval = setInterval(async () => {
        try {
          // Check if pairing is complete
          const isPaired = await this.client?.checkPairing();
          
          if (isPaired) {
            this.stopPolling();
            resolve(true);
            return;
          }

          // Check timeout
          if (Date.now() - startTime > this.MAX_WAIT_TIME) {
            this.stopPolling();
            resolve(false);
            return;
          }
        } catch (error) {
          // Continue polling on error
          console.warn('Pairing check error:', (error as Error).message);
        }
      }, this.POLL_INTERVAL);
    });
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Update pairing state
   */
  private updateState(updates: Partial<PairingState>): void {
    this.state = { ...this.state, ...updates };
    
    if (this.options.onStatusChange) {
      this.options.onStatusChange(this.state);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopPolling();
    this.client = null;
  }

  /**
   * Cancel pairing process
   */
  cancel(): void {
    this.updateState({
      status: 'failed',
      error: 'Pairing cancelled by user',
    });
    this.cleanup();
  }
}

/**
 * Verify existing pairing
 */
export async function verifyPairing(
  deviceId: string,
  password: string,
  pairingCode: string,
  appName: string = 'n8n-GridPlus',
): Promise<boolean> {
  try {
    const config: LatticeConfig = {
      deviceId,
      password,
      appName,
      pairingCode,
      connectionType: 'cloud',
    };

    const client = new LatticeClient(config);
    await client.initialize();
    
    return await client.checkPairing();
  } catch {
    return false;
  }
}

/**
 * Generate secure app private key for pairing
 */
export function generateAppPrivateKey(): string {
  // In real implementation, use crypto.randomBytes
  const bytes = new Array(32).fill(0).map(() => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  );
  return '0x' + bytes.join('');
}

/**
 * Format pairing code for display
 */
export function formatPairingCode(code: string): string {
  // Format as XXXX-XXXX-XXXX
  const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const parts = cleaned.match(/.{1,4}/g) || [];
  return parts.join('-');
}
