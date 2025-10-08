/**
 * M2 Gateway Factory
 *
 * Provides the appropriate M2Gateway implementation based on environment.
 * Defaults to MockM2Gateway for development, switches to real client when configured.
 *
 * @module features/m3/gateway
 */

import type { M2Gateway } from '../types';
import { M2GatewayClient } from './M2Gateway';
import { MockM2Gateway } from './MockM2Gateway';

const M2_BASE_URL = process.env.EXPO_PUBLIC_M2_BASE_URL || '';
const USE_MOCK = !M2_BASE_URL || M2_BASE_URL === 'mock';

let gatewayInstance: M2Gateway | null = null;

export function getM2Gateway(): M2Gateway {
  if (gatewayInstance) {
    return gatewayInstance;
  }

  if (USE_MOCK) {
    console.log('[M2Gateway] Using mock implementation');
    gatewayInstance = new MockM2Gateway();
  } else {
    console.log(`[M2Gateway] Using real client: ${M2_BASE_URL}`);
    gatewayInstance = new M2GatewayClient(M2_BASE_URL);
  }

  return gatewayInstance;
}

export function setM2Gateway(gateway: M2Gateway): void {
  gatewayInstance = gateway;
}

export { M2GatewayClient, MockM2Gateway };
