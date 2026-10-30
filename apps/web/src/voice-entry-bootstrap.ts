import {mountVoiceEntryUI} from './voice-entry-ui.js';
// Only the voice compatibility binding precedes main. Secondary controllers
// mount after the authenticated core and cannot hold restoration indefinitely.
const start=()=>{mountVoiceEntryUI();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('eco:core-ready',()=>{
  void import('./expense-recap-ui.js').then(m=>m.mountExpenseRecapUI()).catch(()=>{});
  void import('./contextual-group-ui.js').then(m=>m.mountContextualGroupUI()).catch(()=>{});
  void import('./master-closure-ui.js').then(m=>m.mountMasterClosureUI()).catch(()=>{});
  void import('./master-governance-ui.js').then(m=>m.mountMasterGovernanceUI()).catch(()=>{});
},{once:true});
