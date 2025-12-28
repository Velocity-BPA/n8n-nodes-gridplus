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

import { GridPlus } from '../../nodes/GridPlus/GridPlus.node';

describe('GridPlus Node', () => {
	let gridPlusNode: GridPlus;

	beforeEach(() => {
		gridPlusNode = new GridPlus();
	});

	describe('Node Configuration', () => {
		it('should have correct node name', () => {
			expect(gridPlusNode.description.name).toBe('gridPlus');
		});

		it('should have correct display name', () => {
			expect(gridPlusNode.description.displayName).toBe('GridPlus');
		});

		it('should have correct group', () => {
			expect(gridPlusNode.description.group).toContain('transform');
		});

		it('should have correct version', () => {
			expect(gridPlusNode.description.version).toBe(1);
		});

		it('should have description', () => {
			expect(gridPlusNode.description.description).toBeTruthy();
			expect(typeof gridPlusNode.description.description).toBe('string');
		});

		it('should have defaults configured', () => {
			expect(gridPlusNode.description.defaults).toBeDefined();
			expect(gridPlusNode.description.defaults.name).toBe('GridPlus');
		});

		it('should have inputs and outputs configured', () => {
			expect(gridPlusNode.description.inputs).toEqual(['main']);
			expect(gridPlusNode.description.outputs).toEqual(['main']);
		});
	});

	describe('Resources', () => {
		it('should have 21 resources defined', () => {
			const resourceProperty = gridPlusNode.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');

			if (resourceProperty && 'options' in resourceProperty) {
				expect(resourceProperty.options?.length).toBe(21);
			}
		});

		it('should include device resource', () => {
			const resourceProperty = gridPlusNode.description.properties.find(
				(p) => p.name === 'resource',
			);
			if (resourceProperty && 'options' in resourceProperty) {
				const deviceResource = (resourceProperty.options as Array<{ value: string }>)?.find(
					(o) => o.value === 'device',
				);
				expect(deviceResource).toBeDefined();
			}
		});

		it('should include wallet resource', () => {
			const resourceProperty = gridPlusNode.description.properties.find(
				(p) => p.name === 'resource',
			);
			if (resourceProperty && 'options' in resourceProperty) {
				const walletResource = (resourceProperty.options as Array<{ value: string }>)?.find(
					(o) => o.value === 'wallet',
				);
				expect(walletResource).toBeDefined();
			}
		});

		it('should include ethereum resource', () => {
			const resourceProperty = gridPlusNode.description.properties.find(
				(p) => p.name === 'resource',
			);
			if (resourceProperty && 'options' in resourceProperty) {
				const ethereumResource = (resourceProperty.options as Array<{ value: string }>)?.find(
					(o) => o.value === 'ethereum',
				);
				expect(ethereumResource).toBeDefined();
			}
		});

		it('should include bitcoin resource', () => {
			const resourceProperty = gridPlusNode.description.properties.find(
				(p) => p.name === 'resource',
			);
			if (resourceProperty && 'options' in resourceProperty) {
				const bitcoinResource = (resourceProperty.options as Array<{ value: string }>)?.find(
					(o) => o.value === 'bitcoin',
				);
				expect(bitcoinResource).toBeDefined();
			}
		});
	});

	describe('Credentials', () => {
		it('should require GridPlus credentials', () => {
			expect(gridPlusNode.description.credentials).toBeDefined();
			expect(gridPlusNode.description.credentials?.length).toBeGreaterThan(0);
		});

		it('should include GridPlusLattice credential type', () => {
			const latticeCredential = gridPlusNode.description.credentials?.find(
				(c) => c.name === 'gridPlusLattice',
			);
			expect(latticeCredential).toBeDefined();
		});
	});
});
