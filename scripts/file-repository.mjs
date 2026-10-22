import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';

const empty = () => ({
  version: 1,
  users: {}, projects: {}, groups: {}, memberships: {}, obligations: {}, cases: {}, audits: {}, meetings: {},
  ledgerAccounts: {}, ledgerEntries: {}, receipts: {}, cashboxReconciliations: {},
  publicGroupListings: {}, membershipApplications: {}, rubricDefinitions: {}, governanceKnowledgeClaims: {},
  workspaceRecords: {}, financialOperations: {}
});

const clone = value => value === undefined ? undefined : structuredClone(value);

export class FilePlatformRepository {
  constructor(filePath = '.data/local-db.json') {
    this.filePath = path.resolve(filePath);
    this.data = empty();
    this.ready = this.#load();
    this.writeChain = Promise.resolve();
  }

  async #load() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8'));
      this.data = { ...empty(), ...parsed };
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      await this.#persist();
    }
  }

  async #persist() {
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    await rename(tmp, this.filePath);
  }

  async #write(mutator) {
    await this.ready;
    let result;
    const writeJob = this.writeChain.then(async () => {
      const previous = this.data;
      this.data = structuredClone(previous);
      try { result = mutator(); await this.#persist(); }
      catch (error) { this.data = previous; throw error; }
    });
    this.writeChain = writeJob.catch(() => undefined);
    await writeJob;
    return clone(result);
  }

  async #read(reader) { await this.ready; await this.writeChain; return clone(reader()); }
  #upsert(bucket, value) { this.data[bucket][value.id] = clone(value); return value; }
  #values(bucket) { return Object.values(this.data[bucket]); }

  commitFinancialOperation(operation) {
    return this.#write(() => {
      const e=operation.entry;
      const key=JSON.stringify([e.tenantId,e.groupId,operation.kind,e.idempotencyKey]);
      const existing=this.data.financialOperations[key];
      if(existing)return existing;
      for(const a of operation.accounts)this.#upsert('ledgerAccounts',a);
      this.#upsert('ledgerEntries',e);
      if(operation.receipt)this.#upsert('receipts',operation.receipt);
      this.#upsert('audits',operation.audit);
      for(const record of operation.outboxRecords??[])this.#upsert('workspaceRecords',record);
      this.data.financialOperations[key]=clone(operation);
      return operation;
    });
  }

  saveUser(v){return this.#write(()=>this.#upsert('users',v));}
  getUser(id){return this.#read(()=>this.data.users[id]);}
  saveProject(v){return this.#write(()=>this.#upsert('projects',v));}
  getProject(t,id){return this.#read(()=>{const x=this.data.projects[id];return x?.tenantId===t?x:undefined;});}
  saveGroup(v){return this.#write(()=>this.#upsert('groups',v));}
  getGroupById(id){return this.#read(()=>this.data.groups[id]);}
  listMembershipsForUser(userId){return this.#read(()=>this.#values('memberships').filter(m=>m.userId===userId));}
  getGroup(t,id){return this.#read(()=>{const x=this.data.groups[id];return x?.tenantId===t?x:undefined;});}
  listGroups(t){return this.#read(()=>this.#values('groups').filter(x=>x.tenantId===t));}
  saveMembership(v){return this.#write(()=>this.#upsert('memberships',v));}
  getMembership(t,g,id){return this.#read(()=>{const x=this.data.memberships[id];return x?.tenantId===t&&x.groupId===g?x:undefined;});}
  listMemberships(t,g){return this.#read(()=>this.#values('memberships').filter(x=>x.tenantId===t&&x.groupId===g));}
  saveObligation(v){return this.#write(()=>this.#upsert('obligations',v));}
  listObligations(t,a){return this.#read(()=>this.#values('obligations').filter(x=>x.tenantId===t&&(!a||x.assigneeId===a)));}
  saveCase(v){return this.#write(()=>this.#upsert('cases',v));}
  getCaseById(id){return this.#read(()=>this.data.cases[id]);}
  listCareCasesForActor(a){return this.#read(()=>this.#values('cases').filter(x=>x.openedBy===a||x.care?.participantIds.includes(a)));}
  saveCaseRevision(v,revision){return this.#write(()=>{const prior=this.data.cases[v.id];if(revision===null?Boolean(prior):!prior||prior.tenantId!==v.tenantId||prior.openedBy!==v.openedBy||(prior.care?.revision??0)!==revision)return false;this.#upsert('cases',v);return true;});}
  listCases(t,a){return this.#read(()=>this.#values('cases').filter(x=>x.tenantId===t&&(!a||x.openedBy===a)));}
  saveAudit(v){return this.#write(()=>this.#upsert('audits',v));}
  listAudit(t){return this.#read(()=>this.#values('audits').filter(x=>x.tenantId===t));}
  saveMeeting(v){return this.#write(()=>this.#upsert('meetings',v));}
  getMeeting(t,g,id){return this.#read(()=>{const x=this.data.meetings[id];return x?.tenantId===t&&x.groupId===g?x:undefined;});}
  listMeetings(t,g){return this.#read(()=>this.#values('meetings').filter(x=>x.tenantId===t&&x.groupId===g));}
  saveLedgerAccount(v){return this.#write(()=>this.#upsert('ledgerAccounts',v));}
  listLedgerAccounts(t,g){return this.#read(()=>this.#values('ledgerAccounts').filter(x=>x.tenantId===t&&x.groupId===g));}
  saveLedgerEntry(v){return this.#write(()=>this.#upsert('ledgerEntries',v));}
  getLedgerEntry(t,g,id){return this.#read(()=>{const x=this.data.ledgerEntries[id];return x?.tenantId===t&&x.groupId===g?x:undefined;});}
  findLedgerEntryByIdempotency(t,g,k){return this.#read(()=>this.#values('ledgerEntries').find(x=>x.tenantId===t&&x.groupId===g&&x.idempotencyKey===k));}
  listLedgerEntries(t,g){return this.#read(()=>this.#values('ledgerEntries').filter(x=>x.tenantId===t&&x.groupId===g));}
  saveContributionReceipt(v){return this.#write(()=>this.#upsert('receipts',v));}
  findContributionReceiptByIdempotency(t,g,k){return this.#read(()=>this.#values('receipts').find(x=>x.tenantId===t&&x.groupId===g&&x.idempotencyKey===k));}
  listContributionReceipts(t,g){return this.#read(()=>this.#values('receipts').filter(x=>x.tenantId===t&&x.groupId===g));}
  saveCashboxReconciliation(v){return this.#write(()=>this.#upsert('cashboxReconciliations',v));}
  listCashboxReconciliations(t,g){return this.#read(()=>this.#values('cashboxReconciliations').filter(x=>x.tenantId===t&&x.groupId===g));}
  savePublicGroupListing(v){return this.#write(()=>{this.data.publicGroupListings[v.groupId]=clone(v);return v;});}
  getPublicGroupListing(groupId){return this.#read(()=>this.data.publicGroupListings[groupId]);}
  listPublicGroupListings(){return this.#read(()=>this.#values('publicGroupListings'));}
  saveMembershipApplication(v){return this.#write(()=>this.#upsert('membershipApplications',v));}
  getMembershipApplication(id){return this.#read(()=>this.data.membershipApplications[id]);}
  listMembershipApplicationsForGroup(t,g){return this.#read(()=>this.#values('membershipApplications').filter(x=>x.targetTenantId===t&&x.groupId===g));}
  saveRubricDefinition(v){return this.#write(()=>this.#upsert('rubricDefinitions',v));}
  getRubricDefinition(t,g,id){return this.#read(()=>{const x=this.data.rubricDefinitions[id];return x?.tenantId===t&&x.groupId===g?x:undefined;});}
  listRubricDefinitions(t,g){return this.#read(()=>this.#values('rubricDefinitions').filter(x=>x.tenantId===t&&x.groupId===g));}
  saveGovernanceKnowledgeClaim(v){return this.#write(()=>this.#upsert('governanceKnowledgeClaims',v));}
  listGovernanceKnowledgeClaims(t,g){return this.#read(()=>this.#values('governanceKnowledgeClaims').filter(x=>x.tenantId===t&&(!g||x.groupId===g)));}
  saveWorkspaceRecord(v){return this.#write(()=>this.#upsert('workspaceRecords',v));}
  insertGovernedRecord(v){return this.#write(()=>{
    if(!['TRUST.VERIFICATION','GOVERNANCE.VOTE.ACTION','GOVERNANCE.VOTE.BALLOT'].includes(v.moduleId))throw Error('INVALID_GOVERNED_RECORD');
    const prior=this.data.workspaceRecords[v.id];
    if(prior){if(prior.tenantId!==v.tenantId||prior.moduleId!==v.moduleId||prior.groupId!==v.groupId)throw Error('GOVERNED_RECORD_CONFLICT');return{record:prior,inserted:false};}
    this.#upsert('workspaceRecords',v);return{record:v,inserted:true};
  });}
  getWorkspaceRecord(t,id){return this.#read(()=>{const x=this.data.workspaceRecords[id];return x?.tenantId===t?x:undefined;});}
  listWorkspaceRecords(t,m,g){return this.#read(()=>this.#values('workspaceRecords').filter(x=>x.tenantId===t&&(!m||x.moduleId===m)&&(!g||x.groupId===g)));}
}
