# n8n-nodes-gridplus

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **GridPlus Lattice1** hardware wallet integration. This package provides enterprise-grade blockchain signing capabilities with 21 resources and 150+ operations for device management, multi-chain transaction signing, SafeCard handling, and automation workflows.

![n8n](https://img.shields.io/badge/n8n-community--node-green)
![GridPlus](https://img.shields.io/badge/GridPlus-Lattice1-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

- **Device Management**: Connect, pair, and manage Lattice1 hardware wallets
- **SafeCard Support**: Full SafeCard lifecycle management (load, eject, backup, restore)
- **Multi-Chain Signing**: Sign transactions on Ethereum, Bitcoin, Polygon, Arbitrum, Optimism, and more
- **EIP-712 Typed Data**: Sign structured data for DeFi protocols
- **Bitcoin PSBT**: Sign Partially Signed Bitcoin Transactions
- **Auto-Sign Rules**: Configure automated signing with spending limits and whitelists
- **Address Book**: Manage labeled addresses across chains
- **Permission System**: Granular permission controls for enterprise deployments
- **DeFi Operations**: Token approvals, contract verification, transaction simulation
- **NFT Support**: Transfer and approve NFTs with ERC-721/1155 support
- **ENS Resolution**: Resolve and manage Ethereum Name Service records
- **Staking**: ETH staking operations and validator management
- **Export Tools**: Generate tax reports, export addresses, and public keys
- **Real-Time Triggers**: Monitor device events, transactions, and signing requests

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-gridplus`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-gridplus

# Restart n8n
n8n start
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-gridplus.git
cd n8n-nodes-gridplus

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-gridplus

# Restart n8n
n8n start
```

## Credentials Setup

### GridPlus Lattice Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Connection Type | Local Network (WiFi), GridPlus Connect (Cloud), or USB | Yes |
| Device ID | Your Lattice1 device identifier | Yes |
| Password | Device pairing password | Yes |
| Endpoint URL | Lattice endpoint (auto-configured for most setups) | No |
| App Name | Application name shown on device | Yes |

### GridPlus Connect Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Device ID | Your Lattice1 device identifier | Yes |
| Connect API Key | GridPlus Connect API key | Yes |
| Pairing Secret | Shared secret for pairing | Yes |
| App Name | Application name shown on device | Yes |

### GridPlus Network Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Network | Ethereum Mainnet, Goerli, Sepolia, etc. | Yes |
| RPC URL | Custom RPC endpoint | No |
| Chain ID | Network chain ID | Auto |

## Resources & Operations

### Device Resource
- Connect/Disconnect from Lattice
- Get device info, firmware version, active wallet
- Manage app pairings
- Check connection status

### Wallet Resource
- Get active wallet and wallet info
- Switch between wallets
- Get wallet capabilities and supported chains

### SafeCard Resource
- List, load, and eject SafeCards
- Get SafeCard status and addresses
- Create and restore backups
- Manage SafeCard metadata

### Account Resource
- Get addresses at indices or derivation paths
- Derive new addresses
- Get extended public keys (xPub/yPub/zPub)
- Manage address tags

### Ethereum Resource
- Sign transactions (Legacy and EIP-1559)
- Sign messages (personal_sign)
- Sign typed data (EIP-712)
- Get balances and token balances
- Estimate gas and broadcast transactions

### EVM Chains Resource
- Multi-chain support: Polygon, Arbitrum, Optimism, Base, Avalanche, BNB, Fantom, Gnosis
- Add custom EVM chains
- Sign and broadcast on any EVM network

### Bitcoin Resource
- Sign transactions and PSBTs
- Support for Legacy, SegWit, Native SegWit (Bech32), and Taproot
- Get UTXOs and compose transactions
- Message signing and verification

### Transaction Resource
- Create and sign transactions
- Batch signing for multiple transactions
- Track signing status
- Cancel pending requests

### Signing Resource
- Unified signing interface
- Approve/reject signing requests
- Sign arbitrary data and hashes
- Batch signing operations

### Address Book Resource
- Add, update, and remove addresses
- Search and filter by labels/tags
- Import/export address books (CSV/JSON)

### Permissions Resource
- Manage app permissions
- Set spending limits (hourly/daily/weekly/monthly)
- Configure contract whitelists
- Manage auto-sign rules

### Auto-Sign Resource
- Create and manage auto-sign rules
- Set spending limits and whitelists
- Time-based signing windows
- View auto-sign history

### Multi-Currency Resource
- Get balances across all chains
- Portfolio valuation
- Custom token management
- Exchange rate queries

### DeFi Resource
- Sign DeFi transactions
- Decode transaction data
- Verify contracts
- Manage token approvals
- Simulate transactions

### NFT Resource
- Get NFT collections and info
- Transfer and approve NFTs
- ERC-721 and ERC-1155 support
- Floor price tracking

### ENS Resource
- Resolve ENS names to addresses
- Reverse lookup (address to ENS)
- Manage ENS records
- Sign ENS transactions

### Staking Resource
- Stake and unstake ETH
- Claim staking rewards
- Get validator info
- View staking APY

### Firmware Resource
- Get firmware and hardware versions
- Check for updates
- View changelogs
- Get device capabilities

### Security Resource
- View security settings
- Manage paired devices
- Export security reports
- Verify device authenticity

### Export Resource
- Export addresses (CSV)
- Export transaction history
- Generate tax reports (TurboTax, Koinly, etc.)
- Export public keys for watch-only wallets

### Utility Resource
- Get supported chains and derivation paths
- Validate addresses
- Get gas prices
- Test connections

## Trigger Node

The **GridPlus Trigger** node monitors real-time events:

### Device Triggers
- Device Connected/Disconnected
- SafeCard Loaded/Ejected
- Wallet Changed

### Transaction Triggers
- Transaction Request Received
- Transaction Signed/Rejected
- Transaction Broadcast/Confirmed

### Signing Triggers
- Sign Request Received
- Sign Request Approved/Rejected
- Auto-Sign Triggered

### Security Triggers
- Pairing Request
- Permission Changed
- Spending Limit Hit

## Usage Examples

### Sign an Ethereum Transaction

```javascript
// Node: GridPlus
// Resource: Ethereum
// Operation: Sign EIP-1559 Transaction

{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD58",
  "value": "1000000000000000000", // 1 ETH in wei
  "maxFeePerGas": "30000000000",
  "maxPriorityFeePerGas": "2000000000",
  "gasLimit": "21000",
  "chainId": 1
}
```

### Sign a Bitcoin PSBT

```javascript
// Node: GridPlus
// Resource: Bitcoin
// Operation: Sign PSBT

{
  "psbt": "cHNidP8BAH0CAA...",
  "addressType": "bech32",
  "network": "mainnet"
}
```

### Create Auto-Sign Rule

```javascript
// Node: GridPlus
// Resource: Auto-Sign
// Operation: Create Rule

{
  "ruleName": "Daily USDC Transfers",
  "ruleType": "spending_limit",
  "currency": "USDC",
  "maxAmount": "1000",
  "period": "daily",
  "contractAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
}
```

### Export Addresses for Tax Software

```javascript
// Node: GridPlus
// Resource: Export
// Operation: Generate Tax Report

{
  "taxYear": 2024,
  "format": "koinly",
  "costBasisMethod": "fifo",
  "includeTokenTransactions": true
}
```

## GridPlus Concepts

| Concept | Description |
|---------|-------------|
| **Lattice1** | Enterprise-grade hardware wallet by GridPlus |
| **SafeCard** | Removable secure wallet cards for the Lattice1 |
| **Wallet UID** | Unique identifier for each wallet/SafeCard |
| **Pairing** | Secure connection between app and device |
| **Auto-Sign** | Automated signing based on configurable rules |
| **Spending Limits** | Transaction value limits per time period |
| **Contract Whitelist** | Approved smart contracts for auto-signing |
| **Address Book** | Named/labeled addresses stored on device |

## Networks

| Network | Chain ID | Type |
|---------|----------|------|
| Ethereum Mainnet | 1 | EVM |
| Polygon | 137 | EVM |
| Arbitrum One | 42161 | EVM |
| Optimism | 10 | EVM |
| Base | 8453 | EVM |
| Avalanche C-Chain | 43114 | EVM |
| BNB Chain | 56 | EVM |
| Fantom | 250 | EVM |
| Gnosis | 100 | EVM |
| Bitcoin Mainnet | - | UTXO |
| Bitcoin Testnet | - | UTXO |

## Error Handling

The node provides detailed error messages for common issues:

- **Connection Errors**: Device not found, network timeout, pairing required
- **Signing Errors**: User rejected, insufficient funds, invalid transaction
- **Permission Errors**: Operation not allowed, spending limit exceeded
- **Validation Errors**: Invalid address, malformed transaction data

## Security Best Practices

1. **Never share your device password** - Use secure credential storage in n8n
2. **Use spending limits** - Configure appropriate limits for auto-sign rules
3. **Whitelist contracts** - Only allow known, verified contracts
4. **Regular audits** - Export and review security reports periodically
5. **Firmware updates** - Keep your Lattice1 firmware up to date
6. **Secure network** - Use local network connection when possible

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please read our contribution guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [GridPlus SDK Docs](https://docs.gridplus.io)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-gridplus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Velocity-BPA/n8n-nodes-gridplus/discussions)

## Acknowledgments

- [GridPlus](https://gridplus.io) for the Lattice1 hardware wallet and SDK
- [n8n](https://n8n.io) for the workflow automation platform
- The open-source blockchain community
