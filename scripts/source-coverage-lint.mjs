import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const coverageRel='docs/memory/SOURCE_TO_CAPABILITY_COVERAGE_2.3.3.json';
const coveragePath=path.join(root,coverageRel);
if(!fs.existsSync(coveragePath)) throw new Error(`Missing ${coverageRel}`);
const c=JSON.parse(fs.readFileSync(coveragePath,'utf8'));
const masterPath=path.join(root,c.master||'');
if(!fs.existsSync(masterPath)) throw new Error(`Coverage master missing: ${c.master}`);
const master=fs.readFileSync(masterPath,'utf8');
const priorPath=path.join(root,'docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.2_2026-09-05.md');
if(!fs.existsSync(priorPath)) throw new Error('Missing immutable prior master 2.3.2');
const prior=fs.readFileSync(priorPath,'utf8').split(/\r?\n/);
const current=master.split(/\r?\n/);
// Preserve every substantive line of 2.3.2 after the edition-specific preamble in order.
const start=prior.findIndex(x=>x.includes('RÈGLE D\'ABSORPTION EXHAUSTIVE'));
if(start<0) throw new Error('Cannot locate 2.3.2 preservation anchor');
let pos=0;
for(const line of prior.slice(start)){
  const idx=current.indexOf(line,pos);
  if(idx<0) throw new Error(`2.3.2 preservation failed near: ${line.slice(0,120)}`);
  pos=idx+1;
}
const requiredTop=['Projet Serge.rar','Feuille mensuelle(1).xlsx','Accueil.xlsm (standalone variant)','Serge Cahier des charges 2025.docx'];
for(const name of requiredTop){ if(!c.topLevelSources?.some(x=>x.name===name)) throw new Error(`Coverage missing top source: ${name}`); }
const requiredRar=['Accueil.xlsm','Caisses.xlsx','Calendrier versements mes Tontines.xlsm','Configuraion des Rubriques.xlsm','Configuration des Membres.xlsm','FICHE2.xlsx','Feuille mensuelle.xlsx','Fiche Membre.xlsm','Liste des Exercices précédents.xlsm','Listes des membres.xlsx','Paramètres.xlsx','RECAP.xlsx','Rapports.docx','Rapports.xlsx','Rubriques Autres Emprunts.xlsx','Rubriques Emprunts.xlsx','Rubriques Epargne à Intérêts.xlsx','Rubriques Main Levée.xlsx','Rubriques Ordinaires.xlsx','Rubriques Remboursements.xlsx','Rubriques Spécial Emprunt.xlsx','Rubriques Tontines.xlsx','Statistiques.xlsx','example.eap','modele.eap','Lanceur.pub'];
for(const name of requiredRar){ if(!c.rarEntries?.some(x=>x.name===name)) throw new Error(`Coverage missing RAR entry: ${name}`); }
const digestPath=path.join(root,c.deepDigest||'');
if(!fs.existsSync(digestPath)) throw new Error(`Deep digest missing: ${c.deepDigest}`);
const d=JSON.parse(fs.readFileSync(digestPath,'utf8'));
if(d.entries?.length!==requiredRar.length) throw new Error(`Deep digest must cover ${requiredRar.length} RAR entries, got ${d.entries?.length||0}`);
for(const name of requiredRar){ const e=d.entries.find(x=>x.name===name); if(!e) throw new Error(`Deep digest missing: ${name}`); if(!e.sha256) throw new Error(`Deep digest missing SHA: ${name}`); if(!Array.isArray(e.semantics)||!e.semantics.length) throw new Error(`Deep digest missing semantics: ${name}`); }
const sections=['# PARTIE 7D','# 7D.3 COMMUNITY DISCOVERY','## 7D.4 Recherche de membres','# 7D.5 COMMITMENT RELIABILITY','# 7D.9 RUBRIC ENGINE','# 7D.10 SESSION COMMAND CENTER','# 7D.29 CARTOGRAPHIE SOURCE','# PARTIE 7E','## 7E.4 Grammaire canonique des calendriers','## 7E.9 Prêts — taux fixe','## 7E.13 Discovery','## 7E.14 Vérité opérationnelle versionnée'];
for(const sec of sections){ if(!master.includes(sec)) throw new Error(`Master coverage section missing: ${sec}`); }
if(!master.includes('realMoneyEnabled=false')) throw new Error('Master must preserve realMoneyEnabled=false');
if(!master.includes('RÈGLE DE RÉFÉRENCE UNIQUE 2.3.4')) throw new Error('Master missing single-reference rule 2.3.4');
console.log(`Source coverage OK: ${requiredTop.length} top-level sources, ${requiredRar.length} deep-digested RAR entries, ${c.domainCoverage?.length||0} domain mappings; 2.3.2 preserved`);
