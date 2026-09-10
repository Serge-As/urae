export type ServiceRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FailurePolicy = 'DEGRADE_GRACEFULLY' | 'FAIL_CLOSED' | 'QUEUE_AND_RETRY';

export interface ServiceCapabilityCard {
  serviceId: string;
  responsibility: string;
  owns: string[];
  mustNotOwn: string[];
  forbidden: string[];
  allowedDependencies: string[];
  dataAuthority: string;
  risk: ServiceRisk;
  offlinePolicy: string;
  failurePolicy: FailurePolicy;
  audit: string;
}

export const SERVICE_CAPABILITY_DIRECTORY: ServiceCapabilityCard[] = [
  {
    serviceId: 'KERNEL', responsibility: 'Cross-cutting context, policy, audit, cases, evidence and resource governance.',
    owns: ['context','policy','audit','case-orchestration','evidence-contracts','resource-governance'],
    mustNotOwn: ['group-business-rules','financial-ledger','persistence-adapter'], forbidden: ['group-business-rules','financial-ledger','persistence-adapter'], allowedDependencies: [],
    dataAuthority: 'Cross-cutting control metadata only', risk: 'CRITICAL', offlinePolicy: 'May expose policy snapshots; never invent fresh authorization.', failurePolicy: 'FAIL_CLOSED', audit: 'All sensitive policy decisions.'
  },
  {
    serviceId: 'DOMAIN', responsibility: 'Canonical group, membership, meeting and business invariants.',
    owns: ['group','membership','meeting','group-launch'], mustNotOwn: ['database-driver','cloudflare-binding','ui-rendering'], forbidden: ['database-driver','cloudflare-binding','ui-rendering'], allowedDependencies: ['KERNEL'],
    dataAuthority: 'Canonical business entities through repository ports', risk: 'HIGH', offlinePolicy: 'Draft/intention only when server truth is unavailable.', failurePolicy: 'FAIL_CLOSED', audit: 'Membership and governance mutations.'
  },
  {
    serviceId: 'LEDGER', responsibility: 'Canonical append-only financial truth and reversals.',
    owns: ['financial-ledger','journal-entry','reversal','cash-receipt-truth'], mustNotOwn: ['payment-provider-finality','discovery-ranking','membership-admission'], forbidden: ['payment-provider-finality','discovery-ranking','membership-admission'], allowedDependencies: ['KERNEL','DOMAIN'],
    dataAuthority: 'Financial journal', risk: 'CRITICAL', offlinePolicy: 'May queue intent; never manufacture confirmed external payment.', failurePolicy: 'FAIL_CLOSED', audit: 'Every posting/reversal with correlation and idempotency.'
  },
  {
    serviceId: 'DISCOVERY_MEMBERSHIP', responsibility: 'Safe discovery projection plus the public gateway into canonical membership.',
    owns: ['group-discovery','membership-application','membership-invitation-gateway'], mustNotOwn: ['canonical-membership-write','private-contact-directory','trust-sanction'], forbidden: ['canonical-membership-write','private-contact-directory','trust-sanction'], allowedDependencies: ['KERNEL','DOMAIN','TRUST'],
    dataAuthority: 'Public/opt-in projections and application workflow only', risk: 'HIGH', offlinePolicy: 'Cached discovery may be stale; admission never finalized offline.', failurePolicy: 'FAIL_CLOSED', audit: 'Application/invitation/decision trail.'
  },
  {
    serviceId: 'RUBRICS', responsibility: 'Faceted rubric semantics and reviewable governance claims.',
    owns: ['rubric-facets','rubric-template','governance-claim'], mustNotOwn: ['ledger-posting','automatic-governance-activation'], forbidden: ['ledger-posting','automatic-governance-activation'], allowedDependencies: ['KERNEL','DOMAIN'],
    dataAuthority: 'Rubric definitions and sourced claims', risk: 'HIGH', offlinePolicy: 'Draft rubric configuration allowed; financial effects await canonical validation.', failurePolicy: 'FAIL_CLOSED', audit: 'Activation/version changes.'
  },
  {
    serviceId: 'TRUST', responsibility: 'Contextual, explainable reliability evidence.',
    owns: ['commitment-reliability','confidence','evidence-summary'], mustNotOwn: ['wealth-inference','automatic-exclusion','global-blacklist'], forbidden: ['wealth-inference','automatic-exclusion','global-blacklist'], allowedDependencies: ['KERNEL','DOMAIN'],
    dataAuthority: 'Advisory evidence projection', risk: 'HIGH', offlinePolicy: 'Cached advisory labels allowed with freshness metadata.', failurePolicy: 'DEGRADE_GRACEFULLY', audit: 'Evidence revisions, appeals and model version.'
  },
  {
    serviceId: 'OFFLINE', responsibility: 'Durable local intent/outbox without false server finality.',
    owns: ['outbox','local-intent','retry-state'], mustNotOwn: ['financial-finality','fresh-authorization'], forbidden: ['financial-finality','fresh-authorization'], allowedDependencies: ['KERNEL'],
    dataAuthority: 'Local pending state only', risk: 'HIGH', offlinePolicy: 'Primary owner of offline queue semantics.', failurePolicy: 'QUEUE_AND_RETRY', audit: 'Enqueue/retry/ack/cancel correlation.'
  },
  {
    serviceId: 'RELAY', responsibility: 'Transport already-authorized events/intents across intermittent links.',
    owns: ['relay-transport','relay-ack'], mustNotOwn: ['business-decision','financial-finality','identity-reassignment'], forbidden: ['business-decision','financial-finality','identity-reassignment'], allowedDependencies: ['KERNEL','OFFLINE'],
    dataAuthority: 'Transport envelope only', risk: 'HIGH', offlinePolicy: 'Carries signed/correlated envelopes; no autonomous business decision.', failurePolicy: 'QUEUE_AND_RETRY', audit: 'Send/receive/ack correlation.'
  },
  {
    serviceId: 'REPOSITORY', responsibility: 'Persistence adapter behind PlatformRepository.',
    owns: ['persistence-adapter','d1-adapter','file-adapter'], mustNotOwn: ['business-policy','ui-flow','financial-rule'], forbidden: ['business-policy','ui-flow','financial-rule'], allowedDependencies: [],
    dataAuthority: 'Persistence implementation; not business authority', risk: 'CRITICAL', offlinePolicy: 'Adapter-specific; must preserve repository contract.', failurePolicy: 'FAIL_CLOSED', audit: 'Migration/storage errors and integrity signals.'
  },
  {
    serviceId: 'APPLICATION', responsibility: 'Orchestrates use cases without confiscating domain ownership.',
    owns: ['use-case-orchestration','correlation'], mustNotOwn: ['second-ledger','second-membership-engine','database-table-contract'], forbidden: ['second-ledger','second-membership-engine','database-table-contract'], allowedDependencies: ['KERNEL','DOMAIN','LEDGER','DISCOVERY_MEMBERSHIP','RUBRICS','TRUST','OFFLINE','RELAY','REPOSITORY'],
    dataAuthority: 'No independent system of record', risk: 'HIGH', offlinePolicy: 'Coordinates owner policies; does not upgrade pending to final.', failurePolicy: 'FAIL_CLOSED', audit: 'Cross-service workflow correlation.'
  },
  {
    serviceId: 'WORKER_API', responsibility: 'HTTP boundary and environment adapter.',
    owns: ['http-api','health-contract','environment-binding'], mustNotOwn: ['business-rules','ledger-calculation','membership-policy'], forbidden: ['business-rules','ledger-calculation','membership-policy'], allowedDependencies: ['APPLICATION','REPOSITORY'],
    dataAuthority: 'No independent business truth', risk: 'HIGH', offlinePolicy: 'Not applicable; reports unavailable honestly.', failurePolicy: 'FAIL_CLOSED', audit: 'Sensitive endpoints, health/deploy identity.'
  }
];

export function serviceById(id: string): ServiceCapabilityCard | undefined {
  return SERVICE_CAPABILITY_DIRECTORY.find(s => s.serviceId === id);
}

export function validateServiceCapabilityDirectory(): boolean {
  const ids = new Set<string>();
  const owned = new Set<string>();
  for (const service of SERVICE_CAPABILITY_DIRECTORY) {
    if (!service.serviceId || ids.has(service.serviceId) || service.forbidden.length === 0) return false;
    ids.add(service.serviceId);
    for (const capability of service.owns) {
      if (owned.has(capability)) return false;
      owned.add(capability);
    }
  }
  for (const service of SERVICE_CAPABILITY_DIRECTORY)
    for (const dependency of service.allowedDependencies)
      if (dependency === service.serviceId || !ids.has(dependency)) return false;
  return true;
}
