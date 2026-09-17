const byId=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T|null;
const en=()=>byId<HTMLSelectElement>('languageSelect')?.value==='en';
const tr=(fr:string,eng:string)=>en()?eng:fr;
const activeGroup=()=>byId<HTMLSelectElement>('activeGroupSelect')?.value||(()=>{try{return localStorage.getItem('tontine.activeGroupId')??'';}catch{return '';}})();
const normalize=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

async function api<T=any>(path:string):Promise<T>{
  const headers=new Headers();headers.set('accept-language',en()?'en':'fr');const group=activeGroup();if(group)headers.set('x-active-group-id',group);
  const response=await fetch(path,{headers});const body=await response.json().catch(()=>({error:'HTTP_'+response.status}));if(!response.ok)throw Error(String(body.error??'HTTP_'+response.status));return body as T;
}
function go(view:string){(document.querySelector(`.nav-btn[data-view="${view}"]`) as HTMLButtonElement|null)?.click();window.scrollTo({top:0,behavior:'smooth'});}
function destination(rubric:any){
  const hay=normalize([rubric?.name,...(rubric?.aliases??[]),rubric?.purpose??''].join(' '));
  if(/tontine|rotati|tour|pot|savon|huile|drap/.test(hay))return 'tontines';
  if(/epargne|saving|pret|loan|rembours|repay|secours|assist|solidar|amende|inscription|timbre/.test(hay))return 'finance';
  return 'operations';
}
function labelFor(view:string){return view==='tontines'?tr('Gérer la tontine','Manage tontine'):view==='finance'?tr('Saisir / gérer','Record / manage'):tr('Saisir en séance','Record in meeting');}
function install(){
  if(byId('contextualRubricPanel'))return;
  const host=byId('view-operations');if(!host)return;
  const panel=document.createElement('section');panel.id='contextualRubricPanel';panel.className='panel contextual-rubric-panel';
  const first=host.querySelector('.page-head');first?.after(panel);void refresh();
}
async function refresh(){
  const root=byId('contextualRubricPanel');if(!root)return;const group=activeGroup();root.replaceChildren();
  const head=document.createElement('div');head.className='panel-head';
  const title=document.createElement('div');title.innerHTML=`<span class="eyebrow">${tr('Contexte du groupe','Group context')}</span><h2>${tr('Rubriques actives et raccourcis','Active rubrics and shortcuts')}</h2><p>${tr('Eco-System adapte les raccourcis au groupe sans masquer les autres capacités.','Eco-System adapts shortcuts to the group without hiding other capabilities.')}</p>`;
  const configure=document.createElement('button');configure.type='button';configure.className='secondary';configure.textContent=tr('Configurer les rubriques','Configure rubrics');configure.onclick=()=>go('launch');head.append(title,configure);root.append(head);
  if(!group){const p=document.createElement('p');p.className='hint';p.textContent=tr('Sélectionnez un groupe pour afficher ses rubriques actives.','Select a group to show its active rubrics.');root.append(p);return;}
  try{
    const rubrics=await api<any[]>(`/api/v1/groups/${encodeURIComponent(group)}/rubrics`),grid=document.createElement('div');grid.className='contextual-rubric-grid';
    if(!rubrics.length){const p=document.createElement('p');p.className='hint';p.textContent=tr('Aucune rubrique active. Utilisez « Configurer les rubriques » pour en créer ou valider.','No active rubric. Use “Configure rubrics” to create or validate one.');root.append(p);return;}
    for(const rubric of rubrics){
      const card=document.createElement('article');card.className='contextual-rubric-card';
      const strong=document.createElement('strong');strong.textContent=String(rubric.name??tr('Rubrique','Rubric'));
      const meta=document.createElement('small');meta.textContent=[rubric.purpose,...(rubric.aliases??[]).slice(0,2)].filter(Boolean).join(' · ')||tr('Rubrique configurée','Configured rubric');
      const actions=document.createElement('div');actions.className='actions';const view=destination(rubric);
      const action=document.createElement('button');action.type='button';action.className='primary';action.textContent=labelFor(view);action.onclick=()=>go(view);
      const config=document.createElement('button');config.type='button';config.className='link-btn';config.textContent=tr('Règles','Rules');config.onclick=()=>go('launch');actions.append(action,config);card.append(strong,meta,actions);grid.append(card);
    }
    root.append(grid);
  }catch(error){const p=document.createElement('p');p.className='hint error';p.textContent=tr('Impossible de charger les raccourcis du groupe. Les menus principaux restent disponibles.','Unable to load group shortcuts. Main menus remain available.');root.append(p);}
}
export function mountContextualGroupUI(){install();byId<HTMLSelectElement>('activeGroupSelect')?.addEventListener('change',()=>void refresh());byId<HTMLSelectElement>('languageSelect')?.addEventListener('change',()=>void refresh());document.addEventListener('eco:group-refresh',()=>void refresh());}
