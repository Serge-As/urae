import type { OutboxItem } from '../../contracts/src/index.js';

export interface RelayEnvelope {
  protocolVersion: 1;
  senderDeviceId: string;
  recipient: 'server' | string;
  createdAt: string;
  expiresAt: string;
  nonce: string;
  payload: string;
  opaque: boolean;
}

export interface RelayTransport {
  readonly name: string;
  readonly local: boolean;
  available(): Promise<boolean>;
  send(envelope: RelayEnvelope): Promise<{ accepted: boolean; receiptId?: string }>;
}

export class LoopbackRelayTransport implements RelayTransport {
  readonly name = 'loopback';
  readonly local = true;
  async available(): Promise<boolean> { return true; }
  async send(envelope: RelayEnvelope): Promise<{ accepted: boolean; receiptId?: string }> {
    if (new Date(envelope.expiresAt).getTime() < Date.now()) return { accepted: false };
    return { accepted: true, receiptId: `loop_${envelope.nonce}` };
  }
}

export const envelopeForOutbox = (deviceId: string, item: OutboxItem): RelayEnvelope => ({
  protocolVersion: 1,
  senderDeviceId: deviceId,
  recipient: 'server',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  nonce: item.idempotencyKey,
  payload: JSON.stringify({ id: item.id, type: item.type, tenantId: item.tenantId, payload: item.payload }),
  opaque: false // devient true lorsque le chiffrement E2E du relay est branché.
});
