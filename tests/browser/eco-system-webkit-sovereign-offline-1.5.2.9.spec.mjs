import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const base='http://127.0.0.1:4173';

test('WebKit decodes an Eco QR with the bundled offline decoder and no BarcodeDetector dependency',async({page})=>{
  const response=await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  expect(response?.headers()['permissions-policy']??'').toContain('camera=(self)');
  expect(response?.headers()['content-security-policy']??'').toContain("worker-src 'self' blob:");
  const result=await page.evaluate(async()=>{
    const qr=await import('/packages/relay/src/qr-v10.js');
    const scanner=await import('/src/vendor/qr-scanner.min.js');
    const payload='ECOB1:abcdef123456:1:1:0123456789abcdef:SGVsbG9FY29TeXN0ZW0';
    const svg=qr.qrMatrixSvg(qr.qrV10LMatrix(payload),8,4);
    const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    const decoded=await scanner.default.scanImage(uri,{returnDetailedScanResult:true});
    return{decoded:decoded.data,barcodeDetector:typeof window.BarcodeDetector!=='undefined'};
  });
  expect(result.decoded).toBe('ECOB1:abcdef123456:1:1:0123456789abcdef:SGVsbG9FY29TeXN0ZW0');
});

test('WebKit shell keeps sovereign offline and QR decoder assets cached for airplane mode',async({page,context})=>{
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});});
  await expect.poll(async()=>page.evaluate(async()=>{
    const names=await caches.keys(),name=names.find(x=>x.includes('v1529-live-finance'));if(!name)return false;
    const c=await caches.open(name);
    return Boolean(await c.match('/__eco_release_ready__'));
  }),{timeout:20000}).toBe(true);
  const hits=await page.evaluate(async()=>{
    const name=(await caches.keys()).find(x=>x.includes('v1529-live-finance')),c=await caches.open(name);
    const paths=['/src/sovereign-offline-ui.js','/src/vendor/qr-scanner.min.js','/src/vendor/qr-scanner-worker.min.js','/packages/offline-sovereign/src/index.js','/packages/exercise/src/index.js','/packages/relay/src/broadcast.js','/packages/relay/src/local-room.js','/packages/eco-numpad/src/index.js'];
    return Promise.all(paths.map(async p=>Boolean(await c.match(p))));
  });
  expect(hits).toEqual([true,true,true,true,true,true,true,true]);
  await context.setOffline(true);
  const offline=await page.evaluate(async()=>{
    const name=(await caches.keys()).find(x=>x.includes('v1529-live-finance')),c=await caches.open(name);
    const paths=['/index.html','/src/sovereign-offline-ui.js','/src/vendor/qr-scanner-worker.min.js','/packages/relay/src/local-room.js','/packages/eco-numpad/src/index.js'];
    const rows=[];
    for(const path of paths){
      const response=await c.match(path);
      rows.push({path,status:response?.status??0,text:response?await response.text():''});
    }
    return rows;
  });
  expect(offline.map(x=>x.status)).toEqual([200,200,200,200,200]);
  expect(offline[0].text).toContain('ecoRelaySovereignWorkspace');
  expect(offline[1].text).toContain('QrScanner');
  expect(offline[2].text.length).toBeGreaterThan(100);
  expect(offline[3].text).toContain('EcoLocalRoomPeer');
  expect(offline[4].text).toContain('parseEcoNumpad');
  await expect(page.locator('#ecoRelaySovereignWorkspace')).toBeAttached();
  await context.setOffline(false);
});


test('WebKit opens a serverless Eco Local Room DataChannel and exchanges a packet',async({page})=>{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const {EcoLocalRoomPeer}=await import('/packages/relay/src/local-room.js');
    const host=new EcoLocalRoomPeer(),guest=new EcoLocalRoomPeer();
    let received=null;
    guest.onPacket(packet=>{received=packet;});
    try{
      const offer=await host.createOffer();
      const answer=await guest.acceptOffer(offer);
      await host.acceptAnswer(answer);
      await Promise.all([host.waitUntilOpen(12000),guest.waitUntilOpen(12000)]);
      host.send('PING',{value:27});
      const started=Date.now();
      while(!received&&Date.now()-started<3000)await new Promise(r=>setTimeout(r,25));
      return{supported:true,host:host.connected,guest:guest.connected,packet:received};
    }finally{host.close();guest.close();}
  });
  expect(result.supported).toBe(true);
  expect(result.host).toBe(true);
  expect(result.guest).toBe(true);
  expect(result.packet?.type).toBe('PING');
  expect(result.packet?.payload?.value).toBe(27);
});


test('A01 sovereign callbacks execute real import, packet and Vault events',async({page})=>{
  test.setTimeout(120_000);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
    document.body.innerHTML='<div id="ecoRelaySovereignWorkspace"></div><div id="ecoLocalSovereignWorkspace"></div>';
    try{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});}catch{}
    try{Object.defineProperty(navigator,'canShare',{value:undefined,configurable:true});}catch{}
    const calls={received:[],pairing:0,vaultExport:0,vaultInspect:0,vaultRestore:0,errors:[]};
    window.__a01Calls=calls;
    const app={
      numpadCodes:async()=>[],
      exercises:async()=>[],
      ledger:async()=>({summary:{cashBalance:0}}),
      relayReceiverIdentity:async()=>null,
      importRelayPairingMaterial:async material=>{calls.pairing++;calls.lastPairing=material;},
      receiveEcoBroadcast:async payload=>{calls.received.push(payload);return{membershipId:'member-a01',generatedAt:'2026-09-28T12:00:00.000Z'};},
      exportEcoVault:async phrase=>{calls.vaultExport++;calls.vaultPhrase=phrase;return'A01-VAULT';},
      inspectEcoVault:async()=>{calls.vaultInspect++;return{events:2,snapshots:1};},
      restoreEcoVault:async()=>{calls.vaultRestore++;return{events:2,outbox:0};},
      activeGroup:()=> 'group-a01',
      localRoomMemberBundle:async()=>({membershipId:'member-a01'}),
      localRoomManagerDelta:async()=>({entries:[]}),
      confrontLocalRoomManagerDelta:async()=>({commonSequence:0,localOnly:0,remoteOnly:0,potentialFinancialConflicts:[]})
    };
    const {mountSovereignOfflineUI}=await import('/src/sovereign-offline-ui.js');
    mountSovereignOfflineUI({
      app,
      getMembers:()=>[{id:'member-a01',memberNumber:1,displayName:'Membre A01',status:'active'}],
      getMeetings:()=>[{id:'meeting-a01',title:'Séance A01',status:'open',scheduledAt:'2026-09-28T12:00:00.000Z'}],
      isManager:()=>true,
      notify:()=>{},
      showError:error=>calls.errors.push(String(error))
    });
    await new Promise(resolve=>setTimeout(resolve,0));
  });

  const packInput=page.locator('input[accept*=".ecobroadcast"]');
  await packInput.setInputFiles({name:'a01.ecobroadcast',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({kind:'PACK_A01'}))});
  await expect.poll(()=>page.evaluate(()=>window.__a01Calls.received.length)).toBe(1);

  const pairingRaw=await page.evaluate(async()=>{
    const relay=await import('/packages/relay/src/broadcast.js');
    const baseMaterial=await relay.createRelayPairingMaterial('member-a01');
    return relay.encodePairingQr({...baseMaterial,groupId:'group-a01',groupName:'Groupe A01',displayName:'Membre A01',memberNumber:1});
  });
  const pairInput=page.locator('input[accept*=".ecopair"]');
  await pairInput.setInputFiles({name:'a01.ecopair',mimeType:'text/plain',buffer:Buffer.from(pairingRaw)});
  await expect.poll(()=>page.evaluate(()=>window.__a01Calls.pairing)).toBe(1);

  const vault=page.locator('#ecoLocalSovereignWorkspace section').filter({hasText:'Eco Vault'});
  await vault.locator('input[type="password"]').fill('A01-passphrase');
  await vault.getByRole('button',{name:'Créer un Eco Vault'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__a01Calls.vaultExport)).toBe(1);
  await vault.locator('input[accept*=".ecovault"]').setInputFiles({name:'a01.ecovault',mimeType:'text/plain',buffer:Buffer.from('A01-VAULT')});
  await vault.getByRole('button',{name:'Vérifier puis restaurer'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__a01Calls.vaultRestore)).toBe(1);
  await expect(vault).toContainText('Restauration terminée');

  const localRoom=page.locator('#ecoLocalSovereignWorkspace section').filter({hasText:'Eco Local Room'});
  await localRoom.getByRole('button',{name:'Créer une salle (hôte)'}).click();
  const shareSignal=localRoom.getByRole('button',{name:'Partager le signal'});
  await expect(shareSignal).toBeEnabled();
  const downloadPromise=page.waitForEvent('download');
  await shareSignal.click();
  const download=await downloadPromise;
  const downloadPath=await download.path();
  expect(downloadPath).toBeTruthy();
  const offer=await fs.readFile(downloadPath,'utf8');

  const answer=await page.evaluate(async offerRaw=>{
    const {EcoLocalRoomPeer}=await import('/packages/relay/src/local-room.js');
    const guest=new EcoLocalRoomPeer();
    window.__a01Guest=guest;
    return guest.acceptOffer(offerRaw);
  },offer);
  await localRoom.locator('input[accept*=".ecolocal"]').setInputFiles({name:'answer.ecolocal',mimeType:'text/plain',buffer:Buffer.from(answer)});
  await expect(localRoom).toContainText(/connecté/i,{timeout:20_000});
  await page.evaluate(async()=>{
    await window.__a01Guest.waitUntilOpen(12_000);
    window.__a01Guest.send('MEMBER_CAPSULE',{kind:'ROOM_PACKET_A01'});
  });
  await expect.poll(()=>page.evaluate(()=>window.__a01Calls.received.some(x=>x?.kind==='ROOM_PACKET_A01')),{timeout:10_000}).toBe(true);
  expect(await page.evaluate(()=>window.__a01Calls.errors)).toEqual([]);
  await page.evaluate(()=>window.__a01Guest?.close());
});

test('A01 Recap cell override persists after reload and does not rewrite canonical cash',async({page})=>{
  test.setTimeout(120_000);
  const password='Synthetic-a01-recap-2026!';
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const ids=await page.evaluate(async({password})=>{
    const json=async(path,method='GET',body,groupId)=>{
      const response=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
      const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
      if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
      return data;
    };
    const suffix=String(Date.now());
    const account=await json('/api/v1/auth/register','POST',{username:'a01_recap_'+suffix,password,displayName:'A01 Recap'});
    const project=await json('/api/v1/group-projects','POST',{name:'A01 Recap '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:1,nominalContribution:0,currency:'XAF'});
    const group=await json('/api/v1/group-projects/'+encodeURIComponent(project.id)+'/convert','POST',{});
    const members=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/members','GET',undefined,group.id);
    const membershipId=members.find(x=>x.userId===account.account.id)?.id??members[0]?.id;
    const before=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/recap/global','GET',undefined,group.id);
    await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/recap/layout','PUT',{
      expectedVersion:Number(before.layout?.version??0),
      columns:[{id:'manual_a01',label:'A01 manuel',polarity:'POSITIVE',manualOnly:true}]
    },group.id);
    const baseline=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/recap/global','GET',undefined,group.id);
    localStorage.setItem('tontine.activeGroupId',group.id);
    return{groupId:group.id,membershipId,baselineCash:Number(baseline.ledgerSummary?.cashBalance??0)};
  },{password});

  const openRecap=async()=>{
    await page.evaluate(async groupId=>{
      document.body.innerHTML='<select id="languageSelect"><option value="fr" selected>FR</option></select><select id="activeGroupSelect"><option value="'+groupId+'" selected>Groupe A01</option></select><div id="view-operations"><div class="page-head"></div></div>';
      const module=await import('/src/master-governance-ui.js');
      module.mountMasterGovernanceUI();
    },ids.groupId);
    const recapTab=page.locator('button[data-mg="recap"]');
    await expect(recapTab).toBeVisible();
    await recapTab.click();
    const cell=page.locator('[data-rec-cell][data-member="'+ids.membershipId+'"][data-column="manual_a01"]');
    await expect(cell).toBeVisible();
    return cell;
  };

  let cell=await openRecap();
  let promptIndex=0;
  const dialogHandler=async dialog=>{
    const answer=promptIndex++===0?'500':'Correction A01 persistante';
    await dialog.accept(answer);
  };
  page.on('dialog',dialogHandler);
  await cell.click();
  await expect.poll(async()=>Number(String(await cell.locator('strong').innerText()).replace(/[^0-9-]/g,''))).toBe(500);
  page.off('dialog',dialogHandler);

  const persisted=await page.evaluate(async({groupId,membershipId})=>{
    const response=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/recap/global',{headers:{'x-active-group-id':groupId}});
    if(!response.ok)throw new Error('recap '+response.status);
    const recap=await response.json();
    const row=recap.rows.find(x=>x.membershipId===membershipId);
    return{amount:row?.cells?.manual_a01?.displayAmount,cash:Number(recap.ledgerSummary?.cashBalance??0)};
  },ids);
  expect(Number(persisted.amount)).toBe(500);
  expect(persisted.cash).toBe(ids.baselineCash);

  await page.reload({waitUntil:'domcontentloaded'});
  cell=await openRecap();
  await expect.poll(async()=>Number(String(await cell.locator('strong').innerText()).replace(/[^0-9-]/g,''))).toBe(500);
});
