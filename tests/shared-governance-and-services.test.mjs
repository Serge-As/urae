import test from 'node:test'; import assert from 'node:assert/strict';
import {SERVICE_CAPABILITY_DIRECTORY,validateServiceCapabilityDirectory} from '../.build/packages/module-registry/src/index.js';
test('service capability directory is coherent',()=>{assert.equal(validateServiceCapabilityDirectory(),true);assert.ok(SERVICE_CAPABILITY_DIRECTORY.length>=11);});
test('critical services declare forbidden responsibilities',()=>{for(const s of SERVICE_CAPABILITY_DIRECTORY) assert.ok(s.forbidden.length>0);});
