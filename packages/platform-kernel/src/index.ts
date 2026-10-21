import type {
  ActorContext, AuditEvent, CaseRecord, DomainEvent, EvidenceRecord, Id, Obligation
} from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';

export class ContextEngine {
  private current?: ActorContext;
  set(context: ActorContext): void { this.current = structuredClone(context); }
  get(): ActorContext {
    if (!this.current) throw new Error('CONTEXT_REQUIRED');
    return structuredClone(this.current);
  }
  clear(): void { this.current = undefined; }
}

export interface PolicyDecision { allowed: boolean; reason: string; }
export type PolicyRule = (context: ActorContext, input: unknown) => PolicyDecision;

export class PolicyEngine {
  private rules = new Map<string, PolicyRule>();
  register(name: string, rule: PolicyRule): void { this.rules.set(name, rule); }
  evaluate(name: string, context: ActorContext, input?: unknown): PolicyDecision {
    const rule = this.rules.get(name);
    if (!rule) return { allowed: false, reason: `POLICY_NOT_REGISTERED:${name}` };
    return rule(context, input);
  }
}

export type WorkflowDefinition = Record<string, string[]>;
export class WorkflowEngine {
  private definitions = new Map<string, WorkflowDefinition>();
  register(name: string, definition: WorkflowDefinition): void { this.definitions.set(name, definition); }
  canTransition(name: string, from: string, to: string): boolean {
    return this.definitions.get(name)?.[from]?.includes(to) ?? false;
  }
  transition(name: string, from: string, to: string): string {
    if (!this.canTransition(name, from, to)) throw new Error(`INVALID_TRANSITION:${name}:${from}->${to}`);
    return to;
  }
}

export class EventBackbone {
  private events: DomainEvent[] = [];
  private listeners = new Map<string, Array<(event: DomainEvent) => void>>();
  publish(event: DomainEvent): void {
    this.events.push(structuredClone(event));
    for (const fn of this.listeners.get(event.type) ?? []) fn(structuredClone(event));
    for (const fn of this.listeners.get('*') ?? []) fn(structuredClone(event));
  }
  subscribe(type: string, listener: (event: DomainEvent) => void): () => void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener); this.listeners.set(type, list);
    return () => this.listeners.set(type, (this.listeners.get(type) ?? []).filter(x => x !== listener));
  }
  history(): DomainEvent[] { return structuredClone(this.events); }
}

export class AuditLedger {
  private events: AuditEvent[] = [];
  append(event: Omit<AuditEvent, 'id' | 'at'> & Partial<Pick<AuditEvent, 'id' | 'at'>>): AuditEvent {
    const full: AuditEvent = { id: event.id ?? makeId('audit'), at: event.at ?? new Date().toISOString(), ...event };
    this.events.push(structuredClone(full));
    return structuredClone(full);
  }
  list(tenantId?: Id): AuditEvent[] {
    return structuredClone(tenantId ? this.events.filter(e => e.tenantId === tenantId) : this.events);
  }
}

export class ObligationEngine {
  private items = new Map<Id, Obligation>();
  create(input: Omit<Obligation, 'id' | 'status'> & Partial<Pick<Obligation, 'id' | 'status'>>): Obligation {
    const item: Obligation = { ...input, id: input.id ?? makeId('obl'), status: input.status ?? 'open' };
    this.items.set(item.id, structuredClone(item));
    return structuredClone(item);
  }
  complete(id: Id): Obligation {
    const current = this.items.get(id); if (!current) throw new Error('OBLIGATION_NOT_FOUND');
    const next: Obligation = { ...current, status: 'completed' };
    this.items.set(id, next); return structuredClone(next);
  }
  listFor(tenantId: Id, assigneeId?: Id): Obligation[] {
    return [...this.items.values()].filter(x => x.tenantId === tenantId && (!assigneeId || x.assigneeId === assigneeId)).map(x => structuredClone(x));
  }
}

export class EvidenceEngine {
  private records = new Map<Id, EvidenceRecord>();
  add(input: Omit<EvidenceRecord, 'id' | 'createdAt' | 'immutable'> & Partial<Pick<EvidenceRecord, 'id' | 'createdAt' | 'immutable'>>): EvidenceRecord {
    const record: EvidenceRecord = {
      ...input, id: input.id ?? makeId('evidence'), createdAt: input.createdAt ?? new Date().toISOString(), immutable: input.immutable ?? true
    };
    this.records.set(record.id, structuredClone(record)); return structuredClone(record);
  }
  get(id: Id): EvidenceRecord | undefined { const r = this.records.get(id); return r ? structuredClone(r) : undefined; }
}

export interface ReconciliationResult {
  status: 'MATCHED' | 'MISMATCH' | 'MISSING_EVIDENCE' | 'UNDER_REVIEW' | 'RESOLVED';
  expected: number;
  observed: number;
  variance: number;
}
export class ReconciliationEngine {
  compare(expected: number, observed: number, tolerance = 0): ReconciliationResult {
    const variance = observed - expected;
    return { status: Math.abs(variance) <= tolerance ? 'MATCHED' : 'MISMATCH', expected, observed, variance };
  }
}

export {caseOperationKey} from './case-care.js';
import {createCaseCare,applyCaseCare} from './case-care.js';
export class CaseEngine {
  readonly createCare = createCaseCare;
  readonly applyCare = applyCaseCare;
  private cases = new Map<Id, CaseRecord>();
  open(input: Omit<CaseRecord, 'id' | 'openedAt' | 'status'> & Partial<Pick<CaseRecord, 'id' | 'openedAt' | 'status'>>): CaseRecord {
    const item: CaseRecord = { ...input, id: input.id ?? makeId('case'), openedAt: input.openedAt ?? new Date().toISOString(), status: input.status ?? 'OPEN' };
    this.cases.set(item.id, structuredClone(item)); return structuredClone(item);
  }
  list(tenantId: Id): CaseRecord[] { return [...this.cases.values()].filter(x => x.tenantId === tenantId).map(x => structuredClone(x)); }
}

export interface InboxItem { id: Id; kind: 'obligation' | 'case' | 'notification'; title: string; priority: string; status: string; }
export class InboxEngine {
  constructor(private obligations: ObligationEngine, private cases: CaseEngine) {}
  forUser(tenantId: Id, userId: Id): InboxItem[] {
    const obs = this.obligations.listFor(tenantId, userId).filter(o => o.status === 'open' || o.status === 'overdue')
      .map(o => ({ id: o.id, kind: 'obligation' as const, title: o.title, priority: o.priority, status: o.status }));
    const cases = this.cases.list(tenantId).filter(c => c.openedBy === userId && c.status !== 'CLOSED')
      .map(c => ({ id: c.id, kind: 'case' as const, title: c.summary, priority: 'normal', status: c.status }));
    return [...obs, ...cases];
  }
}

export interface Notification { id: Id; tenantId: Id; userId: Id; title: string; body: string; channel: 'in_app' | 'web_push' | 'email' | 'sms' | 'whatsapp' | 'telegram'; createdAt: string; }
export class NotificationEngine {
  private items: Notification[] = [];
  enqueue(input: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const n: Notification = { ...input, id: makeId('notif'), createdAt: new Date().toISOString() };
    this.items.push(n); return structuredClone(n);
  }
  list(tenantId: Id, userId: Id): Notification[] { return this.items.filter(x => x.tenantId === tenantId && x.userId === userId).map(x => structuredClone(x)); }
}

export class ConfigurationEngine {
  private values = new Map<string, unknown>();
  private key(tenantId: Id, scope: string, name: string): string { return `${tenantId}:${scope}:${name}`; }
  set<T>(tenantId: Id, scope: string, name: string, value: T): void { this.values.set(this.key(tenantId, scope, name), structuredClone(value)); }
  get<T>(tenantId: Id, scope: string, name: string): T | undefined {
    const v = this.values.get(this.key(tenantId, scope, name)); return v === undefined ? undefined : structuredClone(v as T);
  }
}

export class FeatureEngine {
  private flags = new Map<string, boolean>();
  set(name: string, enabled: boolean): void { this.flags.set(name, enabled); }
  enabled(name: string): boolean { return this.flags.get(name) ?? false; }
}

export interface ConsentRecord { id: Id; tenantId: Id; userId: Id; purpose: string; granted: boolean; at: string; }
export class DataGovernanceEngine {
  private consents: ConsentRecord[] = [];
  record(tenantId: Id, userId: Id, purpose: string, granted: boolean): ConsentRecord {
    const item = { id: makeId('consent'), tenantId, userId, purpose, granted, at: new Date().toISOString() };
    this.consents.push(item); return structuredClone(item);
  }
  hasConsent(tenantId: Id, userId: Id, purpose: string): boolean {
    const latest = this.consents.filter(x => x.tenantId === tenantId && x.userId === userId && x.purpose === purpose).at(-1);
    return latest?.granted ?? false;
  }
}

export interface DeviceCapabilities {
  indexedDb: boolean; serviceWorker: boolean; webRtc: boolean; bluetooth: boolean; microphone: boolean; webGpu: boolean;
}
export class CompatibilityEngine {
  classify(c: DeviceCapabilities): 'core' | 'offline_advanced' | 'advanced' {
    if (c.indexedDb && c.serviceWorker && c.webRtc) return 'advanced';
    if (c.indexedDb && c.serviceWorker) return 'offline_advanced';
    return 'core';
  }
}

export class ResourceGovernor {
  private usage = new Map<string, number>();
  private budgets = new Map<string, number>();
  setBudget(resource: string, max: number): void { this.budgets.set(resource, max); }
  consume(resource: string, amount: number): { allowed: boolean; remaining: number } {
    const max = this.budgets.get(resource) ?? Number.POSITIVE_INFINITY;
    const current = this.usage.get(resource) ?? 0;
    if (current + amount > max) return { allowed: false, remaining: Math.max(0, max - current) };
    this.usage.set(resource, current + amount);
    return { allowed: true, remaining: Math.max(0, max - current - amount) };
  }
}

export class PlatformKernel {
  readonly context = new ContextEngine();
  readonly policy = new PolicyEngine();
  readonly workflow = new WorkflowEngine();
  readonly events = new EventBackbone();
  readonly audit = new AuditLedger();
  readonly obligations = new ObligationEngine();
  readonly evidence = new EvidenceEngine();
  readonly reconciliation = new ReconciliationEngine();
  readonly cases = new CaseEngine();
  readonly inbox = new InboxEngine(this.obligations, this.cases);
  readonly notifications = new NotificationEngine();
  readonly configuration = new ConfigurationEngine();
  readonly features = new FeatureEngine();
  readonly governance = new DataGovernanceEngine();
  readonly compatibility = new CompatibilityEngine();
  readonly resources = new ResourceGovernor();

  constructor() {
    this.features.set('group-launch-studio', true);
    this.features.set('meeting-sync-core', true);
    this.features.set('cashbox', true);
    this.features.set('offline_outbox', true);
    this.features.set('premium_live_ledger', false);
    this.features.set('crdt_collaboration', false);
    this.features.set('periodic_sync_hint', false);
    this.features.set('passkeys_optional', false);
    this.features.set('share_target_receipts', false);
    this.features.set('guided_group_assistant', true);
    this.features.set('member_live_confirmation', true);
    this.features.set('member_nonblocking_reserve', true);
    this.features.set('financial-real-money', false);
    this.resources.setBudget('cloud_ai_calls', 0);
    this.resources.setBudget('relay_media_bytes', 0);
  }
}
