const normalize=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const tokens=v=>normalize(v).split(/\s+/).filter(Boolean);
const finance=/\b(cotisation|versement|epargne|secours|remboursement|pret|depense|sortie|collation|ration|aide locale|main levee|tontine|amende|assistance)\b/i;
const amount=/\b\d[\d .]{1,}\b/;
const launch=/\b(creer|créer|configurer|lancer|nouveau|nouvelle|transformer|association|tontine)\b/i;
const nav=/\b(ouvre|ouvrir|va|aller|affiche|montre|go|open|show)\b/i;
const VIEW_ALIASES=[
 ['dashboard',['accueil','home','cockpit']],['sessions',['seance','séance','seances','séances','reunion','réunion']],
 ['members',['membre','membres']],['operations',['operation','operations','saisie','tableau']],['finance',['finance','caisse','comptabilite','comptabilité']],
 ['discovery',['decouvrir','découvrir','discovery','recrutement']],['ecosystem',['ecosysteme','écosystème','forum','marche','marché','academy','business']],
 ['documents',['document','documents','paper']],['settings',['parametre','paramètres','reglage','réglage','settings']]
];

const moduleScore=(query,m)=>{
 const q=new Set(tokens(query)),h=tokens([m.id,m.labelFr,m.labelEn,m.lot].join(' '));if(!q.size||!h.length)return 0;
 let hits=0;for(const x of q)if(h.some(y=>y===x||y.includes(x)||x.includes(y)))hits++;
 return hits/q.size;
};
export function interpretLocalAssistant(raw,modules=[]){
 const text=String(raw??'').trim();if(!text)return{intent:'EMPTY',offlineCapable:true,canWriteLedger:false,requiresHumanConfirmation:false,results:[]};
 const normalized=normalize(text);
 if(/\b(creer|configurer|lancer|transformer|nouveau|nouvelle)\b/i.test(normalized)&&/\b(association|tontine|groupe)\b/i.test(normalized))return{intent:'LAUNCH_DRAFT',raw:text,offlineCapable:true,canWriteLedger:false,requiresHumanConfirmation:true,results:[]};
 if(finance.test(normalized)&&amount.test(text))return{intent:'FINANCIAL_DRAFT',raw:text,offlineCapable:true,canWriteLedger:false,requiresHumanConfirmation:true,results:[]};
 const n=normalize(text);for(const [view,aliases] of VIEW_ALIASES)if(nav.test(text)&&aliases.some(a=>n.includes(normalize(a))))return{intent:'NAVIGATE',view,offlineCapable:true,canWriteLedger:false,requiresHumanConfirmation:false,results:[]};
 const results=modules.map(m=>({id:m.id,labelFr:m.labelFr,labelEn:m.labelEn,status:m.status,score:moduleScore(text,m)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8);
 if(nav.test(text)&&results[0]?.score>=0.5)return{intent:'MODULE',moduleId:results[0].id,offlineCapable:true,canWriteLedger:false,requiresHumanConfirmation:false,results};
 return{intent:'SEARCH',offlineCapable:true,canWriteLedger:false,requiresHumanConfirmation:false,results};
}

const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
export function mountLocalAssistantUI({getModules=()=>[],openModule=()=>{},navigate=()=>{},notify=()=>{}}={}){
 const host=document.querySelector('#view-dashboard');if(!host||document.getElementById('localAssistantCenter'))return{open:()=>{},interpret:(x)=>interpretLocalAssistant(x,getModules())};
 const root=el('details',undefined,'panel');root.id='localAssistantCenter';root.append(el('summary','Assistant local · hors ligne · actions sûres'));
 root.append(el('p','L’assistant local comprend la navigation, recherche le catalogue, prépare le Launch Studio et transmet les commandes financières au panneau de prévisualisation. Il ne peut jamais écrire directement dans le Ledger. La voix dépend du navigateur ; le texte reste disponible hors ligne.','truth-notice'));
 const form=document.createElement('form');form.className='form-grid';const lab=el('label','Votre instruction'),box=document.createElement('textarea');box.rows=3;box.placeholder='Ex. Ouvre les séances · Crée une tontine hybride · Chez membre Alice, Épargne 1000';lab.className='full';lab.append(box);const run=el('button','Comprendre localement','primary');run.type='submit';form.append(lab,run);const result=el('div',undefined,'stack');root.append(form,result);host.prepend(root);
 const execute=raw=>{const draft=interpretLocalAssistant(raw,getModules());result.replaceChildren();const note=el('p','Traitement local · réseau requis : non · écriture Ledger directe : non','hint');result.append(note);
   if(draft.intent==='EMPTY'){result.append(el('p','Écrivez une instruction.','empty-state'));return draft;}
   if(draft.intent==='FINANCIAL_DRAFT'){const c=el('article',undefined,'item');c.append(el('strong','Brouillon financier détecté'),el('p','Ouverture du panneau financier canonique. Rien ne sera comptabilisé avant votre validation de la prévisualisation.','truth-notice'));const b=el('button','Prévisualiser dans les deux feuilles','primary');b.type='button';b.onclick=()=>{navigate('operations',{anchor:'voiceFinancialPanel',force:true});setTimeout(()=>{const input=document.getElementById('voiceFinancialText');if(input){input.value=raw;input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('voiceFinancialInterpret')?.click();}},120);};c.append(b);result.append(c);return draft;}
   if(draft.intent==='LAUNCH_DRAFT'){const c=el('article',undefined,'item');c.append(el('strong','Configuration de groupe à préparer'),el('p','Le texte est transmis au Launch Studio comme description à analyser ; aucune création de groupe ni règle n’est validée automatiquement.','hint'));const b=el('button','Préparer dans le Launch Studio','primary');b.type='button';b.onclick=()=>{navigate('launch',{anchor:'launchAssistantPanel',force:true});setTimeout(()=>{const input=document.getElementById('launchAssistantText');if(input){input.value=raw;input.dispatchEvent(new Event('input',{bubbles:true}));}},100);};c.append(b);result.append(c);return draft;}
   if(draft.intent==='NAVIGATE'){navigate(draft.view,{force:true});result.append(el('p','Navigation locale effectuée.','hint'));return draft;}
   if(draft.intent==='MODULE'){void openModule(draft.moduleId);result.append(el('p','Service trouvé dans le catalogue : '+draft.moduleId,'hint'));return draft;}
   if(!draft.results.length)result.append(el('p','Aucun service local correspondant. Reformulez avec le nom du menu ou du service.','empty-state'));
   for(const x of draft.results){const c=el('article',undefined,'item');c.append(el('strong',x.labelFr||x.id),el('small',x.id+' · '+x.status));const b=el('button','Ouvrir','secondary');b.type='button';b.onclick=()=>void openModule(x.id);c.append(b);result.append(c);}return draft;
 };
 form.onsubmit=e=>{e.preventDefault();execute(box.value);};
 return{open:()=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});box.focus();},interpret:execute};
}
