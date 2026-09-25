import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('1.4.2 separates Operational Center from a real Sessions workspace without deleting legacy center content',async()=>{
  const [html,closure]=await Promise.all([
    readFile('apps/web/index.html','utf8'),
    readFile('apps/web/src/master-closure-ui.ts','utf8')
  ]);
  assert.match(html,/data-view="operations"[\s\S]*?Centre opérationnel/);
  assert.match(html,/data-view="sessions"[\s\S]*?<b[^>]*>Séances<\/b>/);
  assert.match(html,/id="view-operations"/);
  assert.match(html,/id="view-sessions"/);
  assert.match(closure,/Centre opérationnel 2\.3\.4/);
  for(const legacy of ['Membres','Impayés','Rapports','Recrutement & communication','État fonctionnel'])assert.ok(closure.includes(legacy),legacy);
  assert.ok(closure.includes('PV & décisions'));
});

test('dedicated Sessions exposes the founder minimum frame and keeps canonical owners',async()=>{
  const [html,ui]=await Promise.all([
    readFile('apps/web/index.html','utf8'),
    readFile('apps/web/src/sessions-ui.js','utf8')
  ]);
  for(const tab of ['Vue d’ensemble','Feuille de séance','Présences','Bénéficiaires & preuves','Récap & caisse','Dettes & amendes','Classements & programmation','Historique'])assert.ok(html.includes(tab),tab);
  for(const phrase of ['Solde début','Recettes séance','Dépenses séance','Solde clôture','Fiches individuelles','Gérer / archiver les rubriques','Réunion du ','Émargement papier reçu','Code de réception'])assert.ok(ui.includes(phrase),phrase);
  assert.match(ui,/app\.meetingAttendance\(/);
  assert.match(ui,/app\.recordMeetingAttendance\(/);
  assert.match(ui,/app\.meetingBeneficiaries\(/);
  assert.match(ui,/app\.recordMeetingBenefitEvidence\(/);
  assert.match(ui,/app\.cashboxReconciliations\(/);
  assert.match(ui,/app\.reconcileCashbox\(/);
  assert.match(ui,/app\.arrears\(/);
  assert.match(ui,/app\.ledger\(/);
  assert.match(ui,/canonical-financial-table-host/);assert.match(ui,/eco:render-canonical-financial-table/);
});

test('Operational Center no longer writes attendance through a generic workspace duplicate',async()=>{
  const source=await readFile('apps/web/src/master-closure-ui.ts','utf8');
  assert.doesNotMatch(source,/moduleId:'MEETING\.ATTENDANCE'/);
  assert.match(source,/meetings\/\$\{encodeURIComponent\(meeting\(\)\)\}\/attendance/);
  assert.match(source,/meetings\/\$\{encodeURIComponent\(meetingId\)\}\/attendance/);
});

test('mobile navigation and Center tabs stay readable through horizontal scrolling rather than hiding features',async()=>{
  const [html,css]=await Promise.all([readFile('apps/web/index.html','utf8'),readFile('apps/web/styles.css','utf8')]);
  assert.match(html,/data-mobile-label="Centre op\."/);
  assert.match(html,/data-mobile-label="Séances"/);
  assert.match(css,/scroll-snap-type:x proximity/);
  assert.match(css,/\.nav-btn b\[data-mobile-label\]/);
  assert.match(css,/\.m24-tabs\{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto/);
  assert.match(css,/\.sessions-tabs button\{min-width:132px/);
});

test('validated Blueprint is executable but cannot silently create money commitments',async()=>{
  const [ui,registry]=await Promise.all([
    readFile('apps/web/src/blueprint-executable-ui.js','utf8'),
    readFile('packages/module-registry/src/index.ts','utf8')
  ]);
  for(const id of ['GROUP.ANTICIPATION','GROUP.MEETING_AUTOPILOT','GROUP.DOCTOR','OPPORTUNITY.GRAPH','OPPORTUNITY.NEED','MARKETPLACE.DEMAND_EXCHANGE','MARKETPLACE.PROCUREMENT','MARKETPLACE.ECO_NOW','MARKETPLACE.HARVEST_LOCAL','MARKETPLACE.FRESH_DROP','MARKETPLACE.PICKUP_NETWORK','MARKETPLACE.MARKET_INTELLIGENCE','MANAGER.BUSINESS_AGENT','MANAGER.VALUE_DISCOVERY','CREATOR.STUDIO','LEARNING.TALENT','TRUST.GRAPH'])assert.ok(registry.includes("id:'"+id+"'"),id);
  assert.match(ui,/humanValidated:false/);
  assert.match(ui,/commercialCommitment:false/);
  assert.match(ui,/realMoney:false/);
  assert.match(ui,/Prévision ≠ demande ≠ engagement ≠ transaction/);
  assert.match(ui,/moduleId==='MARKETPLACE\.GROUP_BUY'/);
  assert.match(ui,/Blueprint 5\.0\.0/);
  assert.match(ui,/COMMUNITY\.FORUM/);
  assert.match(ui,/COMMUNITY\.PRO_HUBS/);
  assert.match(ui,/PARTNERS\.DIRECTORY/);
  assert.match(ui,/moteur canonique d’achats groupés/);
  assert.doesNotMatch(registry,/BACKHAUL|RETURN_LOAD|ECO_ROUTE/i);
});

test('forums and communities receive action presets without a parallel social engine or fake verification',async()=>{
  const [html,presets]=await Promise.all([
    readFile('apps/web/index.html','utf8'),
    readFile('apps/web/src/community-blueprint-presets.js','utf8')
  ]);
  for(const label of ['Forum principal','Opportunités','Marché & besoins','Compétences & emploi','Agriculture & production','Business & fournisseurs','Formation & transmission','ONG · partenaires · impact','Créateurs & vitrines','Actualités sourcées'])assert.ok(html.includes(label),label);
  for(const label of ['Achat groupé','Récolte / arrivage','Activité / vitrine','Partenaire / programme','Création / contenu utile','Info sourcée','Tendance / Buzz'])assert.ok(html.includes(label),label);
  assert.match(presets,/\[BESOIN\]/);
  assert.match(presets,/\[OFFRE\]/);
  assert.match(presets,/\[INFO SOURCÉE\]/);
  assert.match(presets,/Une tranche horaire ne transforme jamais un contenu en information vérifiée/);
  assert.match(presets,/kind:'REQUEST'/);
  assert.match(presets,/kind:'OFFER'/);
  assert.doesNotMatch(presets,/createSecondForum|parallelForum|newSocialEngine/i);
  assert.match(presets,/ONG · partenaires · impact/);
  assert.match(presets,/Créateurs · vitrines · contenus utiles/);
});

test('financial anti-scam lab is deterministic educational analysis, not a legal verdict',async()=>{
  const [html,lab]=await Promise.all([readFile('apps/web/index.html','utf8'),readFile('apps/web/src/financial-lab-ui.js','utf8')]);
  assert.ok(html.includes('Labo financier & anti-arnaques'));
  assert.match(lab,/Math\.pow\(1\+rate,months\)/);
  assert.match(lab,/gapWithoutNew/);
  assert.match(lab,/newDeposits/);
  assert.match(lab,/Eco-System ne conclut pas « Ponzi » ou « arnaque »/);
  assert.match(lab,/legalVerdict:false/);
  assert.match(lab,/realMoney:false/);
  assert.match(lab,/moduleId:'SAFETY\.ANTISCAM'/);
});

test('PWA precaches all Blueprint UI modules',async()=>{
  const sw=await readFile('apps/web/sw.js','utf8');
  for(const path of ['/src/sessions-ui.js','/src/blueprint-executable-ui.js','/src/community-blueprint-presets.js','/src/financial-lab-ui.js'])assert.ok(sw.includes(path),path);
});


test('PWA shell refresh remains versioned without forced offline reload',async()=>{
  const [main,sw,html]=await Promise.all([
    readFile('apps/web/src/main.js','utf8'),
    readFile('apps/web/sw.js','utf8'),
    readFile('apps/web/index.html','utf8')
  ]);
  assert.match(main,/void ensureCurrentServiceWorker\(\);[\s\S]*?void start\(\);/);
  assert.match(sw,/eco-system-v1523-financial-entry-offline-20260925/);
  assert.match(html,/\/styles\.css\?v=(?:143|145|1451|152|1523)/);
  assert.match(html,/\/src\/main\.js\?v=(?:143|145|1451|152|1523)/);
  assert.match(html,/ECO-SYSTEM · 1\.(?:4\.(?:3|5(?:\.1| RC)?)|5\.(?:0|2(?:\.3)?))/);
});
