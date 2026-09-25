import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const coverageRel='docs/memory/SOURCE_TO_CAPABILITY_COVERAGE_2.3.3.json';
const coveragePath=path.join(root,coverageRel);
if(!fs.existsSync(coveragePath)) throw new Error(`Missing ${coverageRel}`);
const c=JSON.parse(fs.readFileSync(coveragePath,'utf8'));
const digestPath=path.join(root,c.deepDigest||'');
if(!fs.existsSync(digestPath)) throw new Error(`Deep digest missing: ${c.deepDigest}`);
const manifestRel='docs/constitution/ECO_SYSTEM_MASTER_SOURCES_MANIFEST_1.0.0.json';
if(!fs.existsSync(manifestRel)) throw new Error(`Missing ${manifestRel}`);
const manifest=JSON.parse(fs.readFileSync(manifestRel,'utf8'));
const expectedMasters={
 '2.3.2':{sha256:'cd5c60fde9bb2a2b4053051a2ce206d7c89f1f15c774e7b8b1178b859c82d893',sizeBytes:2202570},
 '2.3.3':{sha256:'b253d90ac334b4f30f580b45b09f69ade30805239d5f41f5e7e52501eb9930de',sizeBytes:2225260},
 '2.3.4':{sha256:'1b38e16e5f625d6d591c713f31499445c2400c2686702e1247a13a083cafae07',sizeBytes:2227673}
};
for(const [version,e] of Object.entries(expectedMasters)){
  const m=manifest.masters?.find(x=>x.version===version);
  if(!m||m.sha256!==e.sha256||m.sizeBytes!==e.sizeBytes||m.preservedExternally!==true) throw new Error(`Master fingerprint mismatch: ${version}`);
}
if(manifest.authoritativeCurrent!=='2.3.4') throw new Error('Master manifest must declare 2.3.4 authoritative');
const requiredTop=['Projet Serge.rar','Feuille mensuelle(1).xlsx','Accueil.xlsm (standalone variant)','Serge Cahier des charges 2025.docx'];
for(const name of requiredTop){ if(!c.topLevelSources?.some(x=>x.name===name)) throw new Error(`Coverage missing top source: ${name}`); }
const requiredRar=['Accueil.xlsm','Caisses.xlsx','Calendrier versements mes Tontines.xlsm','Configuraion des Rubriques.xlsm','Configuration des Membres.xlsm','FICHE2.xlsx','Feuille mensuelle.xlsx','Fiche Membre.xlsm','Liste des Exercices précédents.xlsm','Listes des membres.xlsx','Paramètres.xlsx','RECAP.xlsx','Rapports.docx','Rapports.xlsx','Rubriques Autres Emprunts.xlsx','Rubriques Emprunts.xlsx','Rubriques Epargne à Intérêts.xlsx','Rubriques Main Levée.xlsx','Rubriques Ordinaires.xlsx','Rubriques Remboursements.xlsx','Rubriques Spécial Emprunt.xlsx','Rubriques Tontines.xlsx','Statistiques.xlsx','example.eap','modele.eap','Lanceur.pub'];
for(const name of requiredRar){ if(!c.rarEntries?.some(x=>x.name===name)) throw new Error(`Coverage missing RAR entry: ${name}`); }
const d=JSON.parse(fs.readFileSync(digestPath,'utf8'));
if(d.entries?.length!==requiredRar.length) throw new Error(`Deep digest must cover ${requiredRar.length} RAR entries, got ${d.entries?.length||0}`);
for(const name of requiredRar){ const e=d.entries.find(x=>x.name===name); if(!e) throw new Error(`Deep digest missing: ${name}`); if(!e.sha256) throw new Error(`Deep digest missing SHA: ${name}`); if(!Array.isArray(e.semantics)||!e.semantics.length) throw new Error(`Deep digest missing semantics: ${name}`); }
const supplement='docs/constitution/ECO_SYSTEM_COMPLETE_APP_EXECUTION_SUPPLEMENT_1.0.0_2026-09-10.md';
if(!fs.existsSync(supplement)) throw new Error(`Missing ${supplement}`);
const s=fs.readFileSync(supplement,'utf8');
for(const phrase of ['Living Rules','1.0.0-complete-app','realMoneyEnabled=false']) if(!s.includes(phrase)) throw new Error(`Complete App supplement missing ${phrase}`);
console.log(`Source coverage OK: ${requiredTop.length} top sources, ${requiredRar.length} deep RAR entries, ${c.domainCoverage?.length||0} domain mappings; masters 2.3.2→2.3.4 fingerprinted and externally preserved`);
