/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { LatticeClient, LatticeConfig, LatticeState } from './latticeClient';

/**
 * Connection status
 */
export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Connection event types
 */
export type ConnectionEvent = 
  | 'connect'
  | 'disconnect'
  | 'reconnect'
  | 'error'
  | 'stateChange';

/**
 * Connection event callback
 */
export type ConnectionCallback = (
  event: ConnectionEvent,
  data?: Record<string, unknown>,
) => void;

/**
 * Connection manager options
 */
export interface ConnectionManagerOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Manages the connection lifecycle to Lattice1 devices
 */
export class ConnectionManager {
  private client: LatticeClient | null = null;
  private config: LatticeConfig;
  private options: ConnectionManagerOptions;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts: number = 0;
  private heartbeatTimer: NodeJS.Timer | null = null;
  private reconnectTimer: NodeJS.Timer | null = null;
  private callbacks: Map<ConnectionEvent, ConnectionCallback[]> = new Map();
  private lastState: LatticeState | null = null;

  constructor(config: LatticeConfig, options: ConnectionManagerOptions = {}) {
    this.config = config;
    this.options = {
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...options,
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get the Lattice client
   */
  getClient(): LatticeClient | null {
    return this.client;
  }

  /**
   * Get last known device state
   */
  getLastState(): LatticeState | null {
    return this.lastState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Connect to the device
   */
  async connect(): Promise<boolean> {
    if (this.status === 'connected') {
      return true;
    }

    try {
      this.setStatus('connecting');
      
      this.client = new LatticeClient(this.config);
      await this.client.initialize();
      
      const connected = await this.client.connect();
      
      if (connected) {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.lastState = this.client.getState();
        this.startHeartbeat();
        this.emit('connect', { deviceId: this.config.deviceId });
        return true;
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      this.setStatus('error');
      this.emit('error', { error: (error as Error).message });
      
      if (this.options.autoReconnect) {
        this.scheduleReconnect();
      }
      
      return false;
    }
  }

  /**
   * Disconnect from the device
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.stopReconnect();
    
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
    
    this.setStatus('disconnected');
    this.emit('disconnect', { deviceId: this.config.deviceId });
  }

  /**
   * Reconnect to the device
   */
  async reconnect(): Promise<boolean> {
    if (this.status === 'reconnecting') {
      return false;
    }

    this.setStatus('reconnecting');
    this.emit('reconnect', { 
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.options.maxReconnectAttempts,
    });

    // Disconnect first
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }

    // Try to connect again
    return this.connect();
  }

  /**
   * Register event callback
   */
  on(event: ConnectionEvent, callback: ConnectionCallback): void {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.push(callback);
    this.callbacks.set(event, callbacks);
  }

  /**
   * Remove event callback
   */
  off(event: ConnectionEvent, callback: ConnectionCallback): void {
    const callbacks = this.callbacks.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      this.callbacks.set(event, callbacks);
    }
  }

  /**
   * Execute operation with connection guarantee
   */
  async withConnection<T>(
    operation: (client: LatticeClient) => Promise<T>,
  ): Promise<T> {
    if (!this.isConnected() || !this.client) {
      const connected = await this.connect();
      if (!connected || !this.client) {
        throw new Error('Failed to establish connection');
      }
    }

    try {
      return await operation(this.client);
    } catch (error) {
      // Check if error is connection-related
      const errorMessage = (error as Error).message.toLowerCase();
      if (
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('disconnected')
      ) {
        // Try reconnecting and retrying once
        await this.reconnect();
        if (this.isConnected() && this.client) {
          return await operation(this.client);
        }
      }
      throw error;
    }
  }

  /**
   * Set connection status
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      
      if (this.options.onStatusChange) {
        this.options.onStatusChange(status);
      }
      
      this.emit('stateChange', { 
        previousStatus: this.status, 
        currentStatus: status,
      });
    }
  }

  /**
   * Emit event to callbacks
   */
  private emit(event: ConnectionEvent, data?: Record<string, unknown>): void {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(async () => {
      if (!this.client) {
        return;
      }

      try {
        const isAlive = await this.client.ping();
        if (!isAlive) {
          throw new Error('Heartbeat failed');
        }
        
        // Update state
        this.lastState = this.client.getState();
      } catch (error) {
        console.warn('Heartbeat failed:', (error as Error).message);
        this.setStatus('error');
        
        if (this.options.autoReconnect) {
          this.scheduleReconnect();
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 10)) {
      console.error('Max reconnection attempts reached');
      this.emit('error', { 
        error: 'Max reconnection attempts reached',
        attempts: this.reconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff
    const delay = Math.min(
      this.options.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      60000, // Max 1 minute
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnect();
    }, delay);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Destroy the connection manager
   */
  async destroy(): Promise<void> {
    await this.disconnect();
    this.callbacks.clear();
  }
}

/**
 * Connection pool for managing multiple device connections
 */
export class ConnectionPool {
  private connections: Map<string, ConnectionManager> = new Map();
  private options: ConnectionManagerOptions;

  constructor(options: ConnectionManagerOptions = {}) {
    this.options = options;
  }

  /**
   * Get or create connection for device
   */
  async getConnection(config: LatticeConfig): Promise<ConnectionManager> {
    const key = config.deviceId;
    
    let manager = this.connections.get(key);
    
    if (!manager) {
      manager = new ConnectionManager(config, this.options);
      this.connections.set(key, manager);
    }
    
    if (!manager.isConnected()) {
      await manager.connect();
    }
    
    return manager;
  }

  /**
   * Remove connection
   */
  async removeConnection(deviceId: string): Promise<void> {
    const manager = this.connections.get(deviceId);
    if (manager) {
      await manager.destroy();
      this.connections.delete(deviceId);
    }
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): string[] {
    return Array.from(this.connections.entries())
      .filter(([_, manager]) => manager.isConnected())
      .map(([deviceId, _]) => deviceId);
  }

  /**
   * Destroy all connections
   */
  async destroyAll(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(
      manager => manager.destroy(),
    );
    await Promise.all(promises);
    this.connections.clear();
  }
}
