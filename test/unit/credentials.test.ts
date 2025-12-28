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

import { GridPlusLattice } from '../../credentials/GridPlusLattice.credentials';
import { GridPlusConnect } from '../../credentials/GridPlusConnect.credentials';
import { GridPlusNetwork } from '../../credentials/GridPlusNetwork.credentials';

describe('GridPlus Credentials', () => {
	describe('GridPlusLattice Credentials', () => {
		let credentials: GridPlusLattice;

		beforeEach(() => {
			credentials = new GridPlusLattice();
		});

		it('should have correct name', () => {
			expect(credentials.name).toBe('gridPlusLattice');
		});

		it('should have correct display name', () => {
			expect(credentials.displayName).toBe('GridPlus Lattice');
		});

		it('should have required properties', () => {
			const propertyNames = credentials.properties.map((p) => p.name);
			expect(propertyNames).toContain('connectionType');
			expect(propertyNames).toContain('deviceId');
			expect(propertyNames).toContain('password');
		});

		it('should have connection type options', () => {
			const connectionType = credentials.properties.find((p) => p.name === 'connectionType');
			expect(connectionType?.type).toBe('options');
		});

		it('should have password field as password type', () => {
			const passwordField = credentials.properties.find((p) => p.name === 'password');
			expect(passwordField?.typeOptions?.password).toBe(true);
		});
	});

	describe('GridPlusConnect Credentials', () => {
		let credentials: GridPlusConnect;

		beforeEach(() => {
			credentials = new GridPlusConnect();
		});

		it('should have correct name', () => {
			expect(credentials.name).toBe('gridPlusConnect');
		});

		it('should have correct display name', () => {
			expect(credentials.displayName).toBe('GridPlus Connect');
		});

		it('should have required properties', () => {
			const propertyNames = credentials.properties.map((p) => p.name);
			expect(propertyNames).toContain('deviceId');
			expect(propertyNames).toContain('connectApiKey');
		});

		it('should have API key field as password type', () => {
			const apiKeyField = credentials.properties.find((p) => p.name === 'connectApiKey');
			expect(apiKeyField?.typeOptions?.password).toBe(true);
		});
	});

	describe('GridPlusNetwork Credentials', () => {
		let credentials: GridPlusNetwork;

		beforeEach(() => {
			credentials = new GridPlusNetwork();
		});

		it('should have correct name', () => {
			expect(credentials.name).toBe('gridPlusNetwork');
		});

		it('should have correct display name', () => {
			expect(credentials.displayName).toBe('GridPlus Network');
		});

		it('should have network selection', () => {
			const networkField = credentials.properties.find((p) => p.name === 'network');
			expect(networkField?.type).toBe('options');
		});

		it('should have RPC URL field', () => {
			const rpcUrlField = credentials.properties.find((p) => p.name === 'rpcUrl');
			expect(rpcUrlField).toBeDefined();
		});
	});
});
