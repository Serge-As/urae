import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregateDemand,rankSupplierBids,calculateUnitEconomics} from '../.build/packages/economic-engine/src/index.js';

test('Eco-System concentrates pseudonymous group demand without member data',()=>{
  const agg=aggregateDemand([
    {groupCode:'ECO-GRP-AAAAA-BBBBB-CC',itemKey:'SAVON-400G',quantity:80,targetUnitPrice:900,locality:'Yaoundé',source:'TONTINE_IN_KIND'},
    {groupCode:'ECO-GRP-DDDDD-EEEEE-FF',itemKey:'SAVON-400G',quantity:120,targetUnitPrice:850,locality:'Yaoundé',source:'GROUP_BUY'},
    {groupCode:'ECO-GRP-GGGGG-HHHHH-II',itemKey:'HUILE-1L',quantity:50,targetUnitPrice:1400,locality:'Douala',source:'TONTINE_IN_KIND'}
  ]);
  const soap=agg.find(x=>x.itemKey==='SAVON-400G');
  assert.equal(soap.groups,2);assert.equal(soap.totalQuantity,200);assert.equal(soap.privacy,'PSEUDONYMOUS_GROUP_AGGREGATE');
  assert.ok(soap.weightedTargetUnitPrice>=850&&soap.weightedTargetUnitPrice<=900);
});

test('supplier ranking rewards landed price while refusing bids without enough capacity',()=>{
  const demand=aggregateDemand([{groupCode:'ECO-GRP-AAAAA-BBBBB-CC',itemKey:'SAVON',quantity:100,source:'GROUP_BUY'}])[0];
  const ranked=rankSupplierBids(demand,[
    {supplierId:'cheap-small',unitPrice:700,transportTotal:0,capacity:50,reliabilityScore:100,leadTimeDays:1},
    {supplierId:'good',unitPrice:850,transportTotal:5000,capacity:120,reliabilityScore:95,leadTimeDays:2},
    {supplierId:'expensive',unitPrice:950,transportTotal:0,capacity:200,reliabilityScore:99,leadTimeDays:1}
  ]);
  assert.equal(ranked[0].supplierId,'good');assert.equal(ranked.at(-1).supplierId,'cheap-small');assert.equal(ranked.at(-1).eligible,false);
});

test('unit economics measures margin instead of assuming activity is profitable',()=>{
  const r=calculateUnitEconomics({revenues:[{code:'SUPPLIER_ACCESS',amount:50000},{code:'ADS',amount:20000}],costs:[{code:'CLOUDFLARE',amount:5000},{code:'MODERATION',amount:10000}]});
  assert.equal(r.revenue,70000);assert.equal(r.cost,15000);assert.equal(r.margin,55000);assert.ok(r.marginRate>0.78);
});
