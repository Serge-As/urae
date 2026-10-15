import {mountVoiceEntryUI} from './voice-entry-ui.js';
import {mountExpenseRecapUI} from './expense-recap-ui.js';
import {mountMemberDossierUI} from './member-dossier-ui.js';
import {mountDocumentsUI} from './documents-ui.js';
import {mountContextualGroupUI} from './contextual-group-ui.js';
import {mountMasterClosureUI} from './master-closure-ui.js';
import {mountMasterGovernanceUI} from './master-governance-ui.js';

// Voice and document styles live in styles.css, permitted by the production CSP.


const start=()=>{mountVoiceEntryUI();mountExpenseRecapUI();mountMemberDossierUI();mountDocumentsUI();mountContextualGroupUI();mountMasterClosureUI();mountMasterGovernanceUI();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
