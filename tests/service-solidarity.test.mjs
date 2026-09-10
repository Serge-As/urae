import test from 'node:test';
import assert from 'node:assert/strict';
import { SERVICE_CAPABILITY_DIRECTORY } from '../.build/packages/module-registry/src/service-capabilities.js';

test('service capability directory has one canonical owner per declared capability', () => {
  const owners = new Map();
  for (const service of SERVICE_CAPABILITY_DIRECTORY) for (const cap of service.owns) {
    assert.equal(owners.has(cap), false, `${cap} owned twice by ${owners.get(cap)} and ${service.serviceId}`);
    owners.set(cap, service.serviceId);
  }
  assert.equal(owners.get('financial-ledger'), 'LEDGER');
  assert.equal(owners.get('group-discovery'), 'DISCOVERY_MEMBERSHIP');
  assert.equal(owners.get('persistence-adapter'), 'REPOSITORY');
});

test('service dependencies reference known services and do not self-depend', () => {
  const ids = new Set(SERVICE_CAPABILITY_DIRECTORY.map(s => s.serviceId));
  for (const service of SERVICE_CAPABILITY_DIRECTORY) {
    for (const dependency of service.allowedDependencies) {
      assert.ok(ids.has(dependency), `${service.serviceId} depends on unknown ${dependency}`);
      assert.notEqual(dependency, service.serviceId);
    }
  }
});

test('high-risk shared services preserve fail-closed or queue semantics', () => {
  const byId = id => SERVICE_CAPABILITY_DIRECTORY.find(s => s.serviceId === id);
  assert.equal(byId('LEDGER').failurePolicy, 'FAIL_CLOSED');
  assert.equal(byId('REPOSITORY').failurePolicy, 'FAIL_CLOSED');
  assert.equal(byId('OFFLINE').failurePolicy, 'QUEUE_AND_RETRY');
  assert.ok(byId('TRUST').mustNotOwn.includes('wealth-inference'));
  assert.ok(byId('TRUST').mustNotOwn.includes('automatic-exclusion'));
});
