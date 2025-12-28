/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Chain configuration for supported EVM networks
 */
export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  currencySymbol: string;
  currencyDecimals: number;
  rpcUrl?: string;
  blockExplorerUrl?: string;
  isTestnet: boolean;
  eip1559: boolean;
}

/**
 * Supported EVM chains with their configurations
 */
export const EVM_CHAINS: Record<string, ChainConfig> = {
  'ethereum-mainnet': {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'eth',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
    eip1559: true,
  },
  'ethereum-goerli': {
    chainId: 5,
    name: 'Ethereum Goerli',
    shortName: 'gor',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    blockExplorerUrl: 'https://goerli.etherscan.io',
    isTestnet: true,
    eip1559: true,
  },
  'ethereum-sepolia': {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    shortName: 'sep',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    eip1559: true,
  },
  'polygon-mainnet': {
    chainId: 137,
    name: 'Polygon Mainnet',
    shortName: 'matic',
    currencySymbol: 'MATIC',
    currencyDecimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    eip1559: true,
  },
  'polygon-mumbai': {
    chainId: 80001,
    name: 'Polygon Mumbai',
    shortName: 'maticmum',
    currencySymbol: 'MATIC',
    currencyDecimals: 18,
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    isTestnet: true,
    eip1559: true,
  },
  'arbitrum-one': {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'arb1',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    eip1559: true,
  },
  'arbitrum-goerli': {
    chainId: 421613,
    name: 'Arbitrum Goerli',
    shortName: 'arb-goerli',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    blockExplorerUrl: 'https://goerli.arbiscan.io',
    isTestnet: true,
    eip1559: true,
  },
  'optimism': {
    chainId: 10,
    name: 'Optimism',
    shortName: 'oeth',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    eip1559: true,
  },
  'avalanche-c': {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    shortName: 'avax',
    currencySymbol: 'AVAX',
    currencyDecimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorerUrl: 'https://snowtrace.io',
    isTestnet: false,
    eip1559: true,
  },
  'bnb-chain': {
    chainId: 56,
    name: 'BNB Smart Chain',
    shortName: 'bnb',
    currencySymbol: 'BNB',
    currencyDecimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorerUrl: 'https://bscscan.com',
    isTestnet: false,
    eip1559: false,
  },
  'base': {
    chainId: 8453,
    name: 'Base',
    shortName: 'base',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    isTestnet: false,
    eip1559: true,
  },
  'fantom': {
    chainId: 250,
    name: 'Fantom Opera',
    shortName: 'ftm',
    currencySymbol: 'FTM',
    currencyDecimals: 18,
    rpcUrl: 'https://rpc.ftm.tools',
    blockExplorerUrl: 'https://ftmscan.com',
    isTestnet: false,
    eip1559: false,
  },
  'gnosis': {
    chainId: 100,
    name: 'Gnosis Chain',
    shortName: 'gno',
    currencySymbol: 'xDAI',
    currencyDecimals: 18,
    rpcUrl: 'https://rpc.gnosischain.com',
    blockExplorerUrl: 'https://gnosisscan.io',
    isTestnet: false,
    eip1559: true,
  },
};

/**
 * Bitcoin network configurations
 */
export interface BitcoinNetworkConfig {
  name: string;
  network: 'mainnet' | 'testnet' | 'signet';
  bip32: {
    public: number;
    private: number;
  };
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  bech32: string;
}

export const BITCOIN_NETWORKS: Record<string, BitcoinNetworkConfig> = {
  mainnet: {
    name: 'Bitcoin Mainnet',
    network: 'mainnet',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    bech32: 'bc',
  },
  testnet: {
    name: 'Bitcoin Testnet',
    network: 'testnet',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    bech32: 'tb',
  },
  signet: {
    name: 'Bitcoin Signet',
    network: 'signet',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    bech32: 'tb',
  },
};

/**
 * Get chain configuration by network identifier
 */
export function getChainConfig(network: string): ChainConfig | undefined {
  return EVM_CHAINS[network];
}

/**
 * Get chain ID from network identifier
 */
export function getChainId(network: string): number | undefined {
  return EVM_CHAINS[network]?.chainId;
}

/**
 * Check if network is a testnet
 */
export function isTestnet(network: string): boolean {
  return EVM_CHAINS[network]?.isTestnet ?? false;
}

/**
 * Get all supported mainnet chains
 */
export function getMainnetChains(): ChainConfig[] {
  return Object.values(EVM_CHAINS).filter((chain) => !chain.isTestnet);
}

/**
 * Get all supported testnet chains
 */
export function getTestnetChains(): ChainConfig[] {
  return Object.values(EVM_CHAINS).filter((chain) => chain.isTestnet);
}

/**
 * Supported currencies for multi-currency operations
 */
export const SUPPORTED_CURRENCIES = [
  'ETH',
  'BTC',
  'MATIC',
  'AVAX',
  'BNB',
  'FTM',
  'xDAI',
  'USDT',
  'USDC',
  'DAI',
  'WETH',
  'WBTC',
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Token standards
 */
export const TOKEN_STANDARDS = {
  ERC20: 'ERC-20',
  ERC721: 'ERC-721',
  ERC1155: 'ERC-1155',
  BEP20: 'BEP-20',
} as const;

export type TokenStandard = typeof TOKEN_STANDARDS[keyof typeof TOKEN_STANDARDS];
