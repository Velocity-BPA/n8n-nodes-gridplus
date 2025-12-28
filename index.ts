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

/**
 * n8n-nodes-gridplus
 *
 * A comprehensive n8n community node for GridPlus Lattice1 hardware wallet
 * providing 21 resources and 150+ operations for device management,
 * multi-chain signing, SafeCard handling, and enterprise automation.
 *
 * @packageDocumentation
 */

// Emit licensing notice on load (WARN level, non-blocking)
const emitLicensingNotice = (): void => {
	const notice = `
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`;
	console.warn(notice);
};

// Emit notice once on module load
emitLicensingNotice();

// Export credentials
export { GridPlusLattice } from './credentials/GridPlusLattice.credentials';
export { GridPlusConnect } from './credentials/GridPlusConnect.credentials';
export { GridPlusNetwork } from './credentials/GridPlusNetwork.credentials';

// Export nodes
export { GridPlus } from './nodes/GridPlus/GridPlus.node';
export { GridPlusTrigger } from './nodes/GridPlus/GridPlusTrigger.node';
