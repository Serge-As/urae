import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {DiscoveryService} from '../.build/packages/discovery/src/index.js';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

async function seed(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),foundation=new FoundationService(repo,kernel);
  kernel.context.set({actorId:'founder',tenantId:'geo_t',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'geo-test'});
  await foundation.ensureUser({id:'founder',displayName:'Fondatrice',locale:'fr',createdAt:new Date().toISOString()});
  const make=async name=>{const p=await foundation.createProject({tenantId:'geo_t',createdBy:'founder',name,kind:'association',governanceModel:'community',memberCount:10,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});return foundation.convertProjectToGroup('geo_t',p.id);};
  return{repo,kernel,near:await make('Groupe Yaoundé'),far:await make('Groupe Douala')};
}

test('GEO.DIRECTORY uses opt-in coarse coordinates and radius without exposing precise device coordinates',async()=>{
  const {repo,kernel,near,far}=await seed(),discovery=new DiscoveryService(repo,kernel);
  await discovery.publishGroupListing({tenantId:'geo_t',groupId:near.id,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Yaoundé',approxLocation:{latitude:3.86691,longitude:11.51671,precisionMeters:12,source:'DEVICE_GEOLOCATION'},missionTags:['entraide'],activityTags:[]});
  await discovery.publishGroupListing({tenantId:'geo_t',groupId:far.id,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Douala',approxLocation:{latitude:4.05105,longitude:9.76787,precisionMeters:8,source:'DEVICE_GEOLOCATION'},missionTags:['entraide'],activityTags:[]});
  const stored=await repo.getPublicGroupListing(near.id);
  assert.deepEqual(stored?.approxLocation,{latitude:3.87,longitude:11.52,precisionMeters:1000,source:'DEVICE_GEOLOCATION'});
  const matches=await discovery.proximityByCoordinates(3.8669,11.5167,20);
  assert.equal(matches.length,1);assert.equal(matches[0].listing.groupId,near.id);assert.ok(matches[0].reasonCodes.includes('GPS_PROXIMITY'));assert.ok(Number(matches[0].distanceKm)<2);
  const audit=kernel.audit.list('geo_t').find(x=>x.action==='GROUP_DISCOVERY_LISTING_PUBLISHED'&&x.targetId===near.id);
  assert.equal(audit?.after?.approximateLocationShared,true);
  assert.equal(JSON.stringify(audit?.after??{}).includes('3.87'),false,'audit must not copy coordinates');
});

test('GPS publication can be explicitly revoked without deleting the textual locality',async()=>{
  const {repo,kernel,near}=await seed(),discovery=new DiscoveryService(repo,kernel);
  const base={tenantId:'geo_t',groupId:near.id,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Yaoundé',missionTags:[],activityTags:[]};
  await discovery.publishGroupListing({...base,approxLocation:{latitude:3.87,longitude:11.52,precisionMeters:1000,source:'DEVICE_GEOLOCATION'}});
  const cleared=await discovery.publishGroupListing({...base,clearApproxLocation:true});
  assert.equal(cleared.approxLocation,undefined);assert.equal(cleared.locality,'Yaoundé');
});

test('browser GPS is user-triggered, HTTPS-guarded and never persists precise coordinates',()=>{
  const helper=fs.readFileSync('apps/web/src/geolocation.js','utf8'),ui=fs.readFileSync('apps/web/src/role-directory-talent-ui.js','utf8');
  assert.match(helper,/getCurrentPosition/);assert.match(helper,/isSecureContext/);assert.match(helper,/round2/);
  assert.doesNotMatch(helper,/localStorage|sessionStorage|indexedDB/i);
  assert.match(ui,/Utiliser ma position/);assert.match(ui,/Retirer la zone GPS publique/);assert.match(ui,/requestApproximateLocation/);
  assert.equal(PRODUCT_MODULES.find(x=>x.id==='GEO.DIRECTORY')?.status,'FOUNDATION_ACTIVE');
});
