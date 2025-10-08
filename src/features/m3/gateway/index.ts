/**
 * M2 Gateway Factory
 *
 * Provides the M2Gateway implementation based on environment configuration.
 * PRODUCTION BUILDS MUST SET EXPO_PUBLIC_M2_BASE_URL to a valid backend URL.
 *
 * @module features/m3/gateway
 */

import type { M2Gateway } from '../types';
import { M2GatewayClient } from './M2Gateway';

const M2_BASE_URL = process.env.EXPO_PUBLIC_M2_BASE_URL;

let gatewayInstance: M2Gateway | null = null;

export function getM2Gateway(): M2Gateway {
  if (gatewayInstance) {
    return gatewayInstance;
  }

  if (!M2_BASE_URL || M2_BASE_URL.trim() === '') {
    throw new Error(
      '[M2Gateway] EXPO_PUBLIC_M2_BASE_URL must be set. ' +
      'Configure your backend URL in .env or environment variables. ' +
      'For testing, use setM2Gateway() to inject a test double.'
    );
  }

  console.log(`[M2Gateway] Initializing client: ${M2_BASE_URL}`);
  gatewayInstance = new M2GatewayClient(M2_BASE_URL);

  return gatewayInstance;
}

export function setM2Gateway(gateway: M2Gateway): void {
  gatewayInstance = gateway;
}

export function resetM2Gateway(): void {
  gatewayInstance = null;
}

export { M2GatewayClient };
