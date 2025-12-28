/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, ILoadOptionsFunctions, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { LatticeClient, createLatticeClient } from '../transport/latticeClient';
import { ConnectionManager, ConnectionPool } from '../transport/connectionManager';

/**
 * Connection cache for reusing connections within workflows
 */
const connectionCache = new Map<string, ConnectionManager>();

/**
 * Global connection pool
 */
let connectionPool: ConnectionPool | null = null;

/**
 * Get or create connection pool
 */
export function getConnectionPool(): ConnectionPool {
  if (!connectionPool) {
    connectionPool = new ConnectionPool({
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
    });
  }
  return connectionPool;
}

/**
 * Get a connected Lattice client
 */
export async function getConnectedClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialType: string = 'gridPlusLattice',
): Promise<LatticeClient> {
  const client = await createLatticeClient(context, credentialType);
  await client.connect();
  return client;
}

/**
 * Execute with auto-connect and error handling
 */
export async function executeWithClient<T>(
  context: IExecuteFunctions,
  operation: (client: LatticeClient) => Promise<T>,
  credentialType: string = 'gridPlusLattice',
): Promise<T> {
  const client = await getConnectedClient(context, credentialType);
  
  try {
    return await operation(client);
  } finally {
    // Note: In production, you might want to cache the connection
    await client.disconnect();
  }
}

/**
 * Get credentials as typed object
 */
export async function getLatticeCredentials(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialType: string = 'gridPlusLattice',
): Promise<{
  deviceId: string;
  password: string;
  appName: string;
  endpointUrl?: string;
  connectionType: 'local' | 'cloud' | 'usb';
}> {
  const credentials = await context.getCredentials(credentialType) as ICredentialDataDecryptedObject;
  
  return {
    deviceId: credentials.deviceId as string,
    password: credentials.password as string,
    appName: credentials.appName as string || 'n8n-GridPlus',
    endpointUrl: credentials.endpointUrl as string,
    connectionType: credentials.connectionType as 'local' | 'cloud' | 'usb',
  };
}

/**
 * Test connection to Lattice device
 */
export async function testConnection(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialType: string = 'gridPlusLattice',
): Promise<{
  success: boolean;
  message: string;
  deviceInfo?: Record<string, unknown>;
}> {
  try {
    const client = await getConnectedClient(context, credentialType);
    const deviceInfo = await client.getDeviceInfo();
    await client.disconnect();
    
    return {
      success: true,
      message: 'Successfully connected to Lattice device',
      deviceInfo,
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Retry wrapper for operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Create cache key for connection
 */
export function createConnectionCacheKey(
  deviceId: string,
  appName: string,
): string {
  return `${deviceId}:${appName}`;
}

/**
 * Check if connection is cached and valid
 */
export function getCachedConnection(key: string): ConnectionManager | null {
  const manager = connectionCache.get(key);
  if (manager && manager.isConnected()) {
    return manager;
  }
  return null;
}

/**
 * Cache a connection
 */
export function setCachedConnection(
  key: string,
  manager: ConnectionManager,
): void {
  connectionCache.set(key, manager);
}

/**
 * Clear cached connection
 */
export async function clearCachedConnection(key: string): Promise<void> {
  const manager = connectionCache.get(key);
  if (manager) {
    await manager.disconnect();
    connectionCache.delete(key);
  }
}

/**
 * Clear all cached connections
 */
export async function clearAllCachedConnections(): Promise<void> {
  for (const [key, manager] of connectionCache) {
    await manager.disconnect();
    connectionCache.delete(key);
  }
}

/**
 * Format connection error for user display
 */
export function formatConnectionError(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout')) {
    return 'Connection timed out. Please check that your Lattice device is powered on and connected to the network.';
  }
  
  if (message.includes('pairing') || message.includes('pair')) {
    return 'Pairing failed. Please verify your device ID and password, then try pairing again from your Lattice device.';
  }
  
  if (message.includes('network') || message.includes('unreachable')) {
    return 'Network error. Please check your internet connection and firewall settings.';
  }
  
  if (message.includes('password') || message.includes('auth')) {
    return 'Authentication failed. Please verify your device password.';
  }
  
  return `Connection error: ${error.message}`;
}
