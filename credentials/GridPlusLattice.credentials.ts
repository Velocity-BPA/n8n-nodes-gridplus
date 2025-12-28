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
 * GridPlus Lattice Credentials
 *
 * Supports connection to GridPlus Lattice1 hardware wallet via:
 * - Local Network (WiFi) - Direct connection to device on local network
 * - GridPlus Connect (Cloud relay) - Connection through GridPlus cloud service
 * - USB (if supported) - Direct USB connection
 */
export class GridPlusLattice implements ICredentialType {
  name = 'gridPlusLattice';
  displayName = 'GridPlus Lattice';
  documentationUrl = 'https://docs.gridplus.io/';
  properties: INodeProperties[] = [
    {
      displayName: 'Connection Type',
      name: 'connectionType',
      type: 'options',
      default: 'local',
      options: [
        {
          name: 'Local Network (WiFi)',
          value: 'local',
          description: 'Connect directly to Lattice on your local network',
        },
        {
          name: 'GridPlus Connect (Cloud)',
          value: 'cloud',
          description: 'Connect through GridPlus cloud relay service',
        },
        {
          name: 'USB Direct',
          value: 'usb',
          description: 'Connect via USB (requires local n8n installation)',
        },
      ],
      description: 'Method to connect to your Lattice1 device',
    },
    {
      displayName: 'Device ID',
      name: 'deviceId',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'XXXX-XXXX-XXXX',
      description:
        'Your Lattice1 device ID. Found in Settings > Device Info on your Lattice1.',
    },
    {
      displayName: 'Device Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description:
        'The password set on your Lattice1 device for pairing applications',
    },
    {
      displayName: 'Lattice Endpoint URL',
      name: 'endpointUrl',
      type: 'string',
      default: '',
      placeholder: 'https://signing.gridpl.us',
      displayOptions: {
        show: {
          connectionType: ['local', 'cloud'],
        },
      },
      description:
        'Custom endpoint URL. Leave blank to use default GridPlus endpoint.',
    },
    {
      displayName: 'Local IP Address',
      name: 'localIp',
      type: 'string',
      default: '',
      placeholder: '192.168.1.100',
      displayOptions: {
        show: {
          connectionType: ['local'],
        },
      },
      description:
        'Local IP address of your Lattice1 device on your network',
    },
    {
      displayName: 'App Name',
      name: 'appName',
      type: 'string',
      default: 'n8n-GridPlus',
      required: true,
      description:
        'Name of this application as it will appear on your Lattice1 device',
    },
    {
      displayName: 'Private Key (For Pairing)',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'Optional private key for secure pairing. A new key will be generated if not provided.',
    },
    {
      displayName: 'Pairing Code',
      name: 'pairingCode',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'Pairing code if already paired. Leave blank for new pairing.',
    },
    {
      displayName: 'Auto-Reconnect',
      name: 'autoReconnect',
      type: 'boolean',
      default: true,
      description:
        'Whether to automatically reconnect if the connection is lost',
    },
    {
      displayName: 'Connection Timeout (ms)',
      name: 'timeout',
      type: 'number',
      default: 30000,
      description: 'Connection timeout in milliseconds',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.endpointUrl || "https://signing.gridpl.us"}}',
      url: '/health',
      method: 'GET',
    },
  };
}
