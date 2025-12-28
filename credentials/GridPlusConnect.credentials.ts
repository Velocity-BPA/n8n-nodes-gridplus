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
 * GridPlus Connect Credentials
 *
 * Credentials for connecting to Lattice1 through the GridPlus Connect
 * cloud relay service. This allows remote access to your hardware wallet
 * without requiring direct network access.
 */
export class GridPlusConnect implements ICredentialType {
  name = 'gridPlusConnect';
  displayName = 'GridPlus Connect';
  documentationUrl = 'https://docs.gridplus.io/';
  properties: INodeProperties[] = [
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
      displayName: 'Connect API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'API key from GridPlus Connect service',
    },
    {
      displayName: 'Pairing Secret',
      name: 'pairingSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description:
        'Secret key established during device pairing with GridPlus Connect',
    },
    {
      displayName: 'App Name',
      name: 'appName',
      type: 'string',
      default: 'n8n-GridPlus-Connect',
      required: true,
      description:
        'Name of this application as it will appear in GridPlus Connect',
    },
    {
      displayName: 'Connect Endpoint',
      name: 'connectEndpoint',
      type: 'string',
      default: 'https://connect.gridpl.us',
      description: 'GridPlus Connect API endpoint',
    },
    {
      displayName: 'Enable Notifications',
      name: 'enableNotifications',
      type: 'boolean',
      default: true,
      description:
        'Whether to receive push notifications for signing requests',
    },
    {
      displayName: 'Session Timeout (minutes)',
      name: 'sessionTimeout',
      type: 'number',
      default: 60,
      description:
        'How long to keep the session active without activity',
    },
    {
      displayName: 'Retry Attempts',
      name: 'retryAttempts',
      type: 'number',
      default: 3,
      description:
        'Number of times to retry failed connection attempts',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
        'X-Device-ID': '={{$credentials.deviceId}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.connectEndpoint || "https://connect.gridpl.us"}}',
      url: '/api/v1/status',
      method: 'GET',
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
        'X-Device-ID': '={{$credentials.deviceId}}',
      },
    },
  };
}
