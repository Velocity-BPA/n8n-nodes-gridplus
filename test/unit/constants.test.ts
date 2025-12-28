/**
 * n8n-nodes-gridplus
 * Copyright (c) 2025 Velocity BPA
 *
 * This Source Code Form is subject to the terms of the Business Source License 1.1.
 * You may use this file in compliance with the BSL 1.1.
 * Commercial use by for-profit organizations requires a commercial license.
 *
 * For licensing information, visit https://velobpa.com/licensing
 * or contact licensing@velobpa.com.
 */

import { SUPPORTED_CHAINS } from '../../nodes/GridPlus/constants/chains';
import { DERIVATION_PATH_TEMPLATES } from '../../nodes/GridPlus/constants/derivationPaths';
import { PERMISSION_TYPES } from '../../nodes/GridPlus/constants/permissions';
import { LATTICE_EVENTS } from '../../nodes/GridPlus/constants/events';

describe('Constants', () => {
	describe('Supported Chains', () => {
		it('should include Ethereum mainnet', () => {
			expect(SUPPORTED_CHAINS.ETHEREUM).toBeDefined();
			expect(SUPPORTED_CHAINS.ETHEREUM.chainId).toBe(1);
			expect(SUPPORTED_CHAINS.ETHEREUM.name).toBe('Ethereum');
		});

		it('should include Polygon', () => {
			expect(SUPPORTED_CHAINS.POLYGON).toBeDefined();
			expect(SUPPORTED_CHAINS.POLYGON.chainId).toBe(137);
		});

		it('should include Bitcoin mainnet', () => {
			expect(SUPPORTED_CHAINS.BITCOIN).toBeDefined();
			expect(SUPPORTED_CHAINS.BITCOIN.type).toBe('utxo');
		});

		it('should have consistent chain structure', () => {
			Object.values(SUPPORTED_CHAINS).forEach((chain) => {
				expect(chain).toHaveProperty('name');
				expect(chain).toHaveProperty('type');
				expect(chain).toHaveProperty('isMainnet');
			});
		});

		it('should have at least 10 supported chains', () => {
			const chainCount = Object.keys(SUPPORTED_CHAINS).length;
			expect(chainCount).toBeGreaterThanOrEqual(10);
		});
	});

	describe('Derivation Path Templates', () => {
		it('should include ETH derivation path', () => {
			expect(DERIVATION_PATH_TEMPLATES.ETH).toBeDefined();
			expect(DERIVATION_PATH_TEMPLATES.ETH).toContain("44'/60'");
		});

		it('should include BTC derivation paths', () => {
			expect(DERIVATION_PATH_TEMPLATES.BTC_LEGACY).toBeDefined();
			expect(DERIVATION_PATH_TEMPLATES.BTC_SEGWIT).toBeDefined();
			expect(DERIVATION_PATH_TEMPLATES.BTC_NATIVE_SEGWIT).toBeDefined();
		});

		it('should include BTC Taproot path', () => {
			expect(DERIVATION_PATH_TEMPLATES.BTC_TAPROOT).toBeDefined();
			expect(DERIVATION_PATH_TEMPLATES.BTC_TAPROOT).toContain("86'");
		});

		it('should have valid BIP44 format', () => {
			Object.values(DERIVATION_PATH_TEMPLATES).forEach((path) => {
				expect(path).toMatch(/^m\/\d+'/);
			});
		});
	});

	describe('Permission Types', () => {
		it('should include signing permissions', () => {
			expect(PERMISSION_TYPES.SIGN_TRANSACTION).toBeDefined();
			expect(PERMISSION_TYPES.SIGN_MESSAGE).toBeDefined();
			expect(PERMISSION_TYPES.SIGN_TYPED_DATA).toBeDefined();
		});

		it('should include address permissions', () => {
			expect(PERMISSION_TYPES.GET_ADDRESSES).toBeDefined();
			expect(PERMISSION_TYPES.GET_PUBLIC_KEYS).toBeDefined();
		});

		it('should include auto-sign permissions', () => {
			expect(PERMISSION_TYPES.AUTO_SIGN_RULE).toBeDefined();
		});

		it('should have at least 5 permission types', () => {
			const permissionCount = Object.keys(PERMISSION_TYPES).length;
			expect(permissionCount).toBeGreaterThanOrEqual(5);
		});
	});

	describe('Lattice Events', () => {
		it('should include device events', () => {
			expect(LATTICE_EVENTS.DEVICE_CONNECTED).toBeDefined();
			expect(LATTICE_EVENTS.DEVICE_DISCONNECTED).toBeDefined();
		});

		it('should include transaction events', () => {
			expect(LATTICE_EVENTS.TRANSACTION_SIGNED).toBeDefined();
			expect(LATTICE_EVENTS.TRANSACTION_REJECTED).toBeDefined();
		});

		it('should include SafeCard events', () => {
			expect(LATTICE_EVENTS.SAFECARD_LOADED).toBeDefined();
			expect(LATTICE_EVENTS.SAFECARD_EJECTED).toBeDefined();
		});

		it('should have unique event values', () => {
			const eventValues = Object.values(LATTICE_EVENTS);
			const uniqueValues = new Set(eventValues);
			expect(uniqueValues.size).toBe(eventValues.length);
		});
	});
});
