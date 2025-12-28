/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * GridPlus Network Credentials
 *
 * Network configuration for blockchain interactions. Supports multiple
 * networks including Ethereum, Polygon, Arbitrum, and Bitcoin.
 */
export class GridPlusNetwork implements ICredentialType {
  name = 'gridPlusNetwork';
  displayName = 'GridPlus Network';
  documentationUrl = 'https://docs.gridplus.io/';
  properties: INodeProperties[] = [
    {
      displayName: 'Network Type',
      name: 'networkType',
      type: 'options',
      default: 'evm',
      options: [
        {
          name: 'EVM (Ethereum-Compatible)',
          value: 'evm',
          description: 'Ethereum, Polygon, Arbitrum, and other EVM chains',
        },
        {
          name: 'Bitcoin',
          value: 'bitcoin',
          description: 'Bitcoin mainnet or testnet',
        },
      ],
      description: 'Type of blockchain network',
    },
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      default: 'ethereum-mainnet',
      displayOptions: {
        show: {
          networkType: ['evm'],
        },
      },
      options: [
        {
          name: 'Ethereum Mainnet',
          value: 'ethereum-mainnet',
          description: 'Ethereum mainnet (Chain ID: 1)',
        },
        {
          name: 'Ethereum Goerli',
          value: 'ethereum-goerli',
          description: 'Ethereum Goerli testnet (Chain ID: 5)',
        },
        {
          name: 'Ethereum Sepolia',
          value: 'ethereum-sepolia',
          description: 'Ethereum Sepolia testnet (Chain ID: 11155111)',
        },
        {
          name: 'Polygon Mainnet',
          value: 'polygon-mainnet',
          description: 'Polygon mainnet (Chain ID: 137)',
        },
        {
          name: 'Polygon Mumbai',
          value: 'polygon-mumbai',
          description: 'Polygon Mumbai testnet (Chain ID: 80001)',
        },
        {
          name: 'Arbitrum One',
          value: 'arbitrum-one',
          description: 'Arbitrum One mainnet (Chain ID: 42161)',
        },
        {
          name: 'Arbitrum Goerli',
          value: 'arbitrum-goerli',
          description: 'Arbitrum Goerli testnet (Chain ID: 421613)',
        },
        {
          name: 'Optimism',
          value: 'optimism',
          description: 'Optimism mainnet (Chain ID: 10)',
        },
        {
          name: 'Avalanche C-Chain',
          value: 'avalanche-c',
          description: 'Avalanche C-Chain mainnet (Chain ID: 43114)',
        },
        {
          name: 'BNB Smart Chain',
          value: 'bnb-chain',
          description: 'BNB Smart Chain mainnet (Chain ID: 56)',
        },
        {
          name: 'Base',
          value: 'base',
          description: 'Base mainnet (Chain ID: 8453)',
        },
        {
          name: 'Fantom',
          value: 'fantom',
          description: 'Fantom Opera mainnet (Chain ID: 250)',
        },
        {
          name: 'Gnosis Chain',
          value: 'gnosis',
          description: 'Gnosis Chain mainnet (Chain ID: 100)',
        },
        {
          name: 'Custom Network',
          value: 'custom',
          description: 'Configure a custom EVM network',
        },
      ],
      description: 'EVM network to connect to',
    },
    {
      displayName: 'Bitcoin Network',
      name: 'bitcoinNetwork',
      type: 'options',
      default: 'mainnet',
      displayOptions: {
        show: {
          networkType: ['bitcoin'],
        },
      },
      options: [
        {
          name: 'Mainnet',
          value: 'mainnet',
          description: 'Bitcoin mainnet',
        },
        {
          name: 'Testnet',
          value: 'testnet',
          description: 'Bitcoin testnet',
        },
        {
          name: 'Signet',
          value: 'signet',
          description: 'Bitcoin signet',
        },
      ],
      description: 'Bitcoin network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
      description:
        'RPC endpoint URL for the network. Use providers like Infura, Alchemy, or your own node.',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 1,
      displayOptions: {
        show: {
          networkType: ['evm'],
          network: ['custom'],
        },
      },
      description: 'Chain ID for custom EVM network',
    },
    {
      displayName: 'Network Name',
      name: 'networkName',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          networkType: ['evm'],
          network: ['custom'],
        },
      },
      placeholder: 'My Custom Network',
      description: 'Human-readable name for the custom network',
    },
    {
      displayName: 'Currency Symbol',
      name: 'currencySymbol',
      type: 'string',
      default: 'ETH',
      displayOptions: {
        show: {
          networkType: ['evm'],
          network: ['custom'],
        },
      },
      description: 'Native currency symbol (e.g., ETH, MATIC)',
    },
    {
      displayName: 'Block Explorer URL',
      name: 'blockExplorerUrl',
      type: 'string',
      default: '',
      placeholder: 'https://etherscan.io',
      description: 'Block explorer URL for viewing transactions',
    },
    {
      displayName: 'WebSocket URL',
      name: 'wsUrl',
      type: 'string',
      default: '',
      placeholder: 'wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID',
      description:
        'WebSocket URL for real-time updates. Optional but recommended for triggers.',
    },
    {
      displayName: 'API Key',
      name: 'rpcApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'API key for the RPC provider if required (e.g., Infura, Alchemy)',
    },
    {
      displayName: 'Max Gas Price (Gwei)',
      name: 'maxGasPrice',
      type: 'number',
      default: 500,
      displayOptions: {
        show: {
          networkType: ['evm'],
        },
      },
      description:
        'Maximum gas price in Gwei to use for transactions. Acts as a safety limit.',
    },
    {
      displayName: 'Request Timeout (ms)',
      name: 'requestTimeout',
      type: 'number',
      default: 30000,
      description: 'Timeout for RPC requests in milliseconds',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.rpcUrl}}',
      url: '',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
