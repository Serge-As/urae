import {mountVoiceEntryUI} from './voice-entry-ui.js';
import {mountExpenseRecapUI} from './expense-recap-ui.js';

const style=document.createElement('style');
style.id='voice-entry-134-styles';
style.textContent=`
.voice-financial-panel{border:1px solid #b9d6c7;background:linear-gradient(180deg,#fbfffd,#f4faf6)}
.voice-command-grid,.voice-preview-head{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.voice-command-grid .full{grid-column:1/-1}
.voice-command-grid label,.voice-preview-head label{display:grid;gap:6px}.voice-command-grid textarea{width:100%;min-height:92px}
.voice-status{min-height:1.5em;color:var(--muted)}.voice-status.error{color:#9b2e2e;font-weight:700}.voice-status.success{color:var(--brand);font-weight:800}
.voice-entry-row{display:grid;grid-template-columns:minmax(130px,1.15fr) minmax(150px,1fr) minmax(150px,.9fr) minmax(105px,.65fr) minmax(150px,1fr) auto;gap:9px;align-items:end;padding:12px;border:1px solid var(--line);border-radius:13px;background:white}
.voice-entry-row>[hidden]{display:none!important}.voice-entry-row input,.voice-entry-row select{width:100%;min-width:0}
.voice-local-help{margin-top:12px;padding:10px 12px;border:1px dashed var(--line);border-radius:12px}.voice-local-help summary{cursor:pointer;font-weight:800}
.sheet-controls{display:flex;align-items:end;gap:12px;justify-content:space-between;flex-wrap:wrap;margin:0 0 12px}.sheet-controls label{display:grid;gap:6px}
.canonical-two-sheet td,.canonical-two-sheet th{vertical-align:top;min-width:150px}.canonical-two-sheet th:first-child{position:sticky;left:0;z-index:3;background:#fff;min-width:170px}
.sheet-cell-value{display:grid;gap:3px;margin-bottom:7px}.sheet-cell-value small{font-size:11px;color:var(--muted);white-space:normal}
.sheet-cell-editor{display:grid;grid-template-columns:48px minmax(78px,1fr) 44px;gap:5px;align-items:center}.sheet-cell-editor select,.sheet-cell-editor input,.sheet-cell-editor button{min-width:0;min-height:39px;padding:6px}
.focused-field-dictation{position:fixed;right:18px;bottom:82px;z-index:80;width:54px;height:54px;border-radius:50%;padding:0;box-shadow:0 8px 25px #10271c33;background:var(--brand);color:white;font-size:22px;border:0}.focused-field-dictation[hidden]{display:none!important}
#backOfficeExpensePanel .form-grid{align-items:end}
@media(max-width:1000px){.voice-entry-row{grid-template-columns:repeat(2,minmax(0,1fr))}.voice-entry-row strong{grid-column:1/-1}}
@media(max-width:700px){
 .voice-command-grid,.voice-preview-head,.voice-entry-row{grid-template-columns:minmax(0,1fr)}
 .voice-command-grid .full,.voice-entry-row strong{grid-column:1}
 .voice-entry-row{padding:10px}.voice-entry-row button{width:100%}
 .canonical-two-sheet{min-width:760px}.sheet-cell-editor{grid-template-columns:45px minmax(72px,1fr) 42px}
 .focused-field-dictation{right:12px;bottom:76px}
}
`;
document.head.append(style);

const start=()=>{mountVoiceEntryUI();mountExpenseRecapUI();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
