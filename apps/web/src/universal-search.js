const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
export async function authorizedSearchContext({app,context,getContext,allowCached=false}){
 const same=()=>JSON.stringify(context)===JSON.stringify(getContext());
 const requireSame=()=>{if(!same())throw Error('SEARCH_CONTEXT_CHANGED');};requireSame();
 const groups=await app.listMyGroups({requireServer:!allowCached});requireSame();
 if(!context.group)return{groups,privateGroup:false};
 if(!groups.some(g=>g.id===context.group))throw Error('SEARCH_ACCESS_UNVERIFIED');
 const access=await app.groupMe({requireServer:!allowCached});requireSame();
 if(!access?.isManager&&String(access?.membership?.status).toLowerCase()!=='active')throw Error('SEARCH_ACCESS_UNVERIFIED');
 return{groups,privateGroup:true};
}
const tokens=q=>norm(q).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const rank=(haystack,query)=>{
  const h=norm(haystack),qs=tokens(query);if(!qs.length)return 0;if(!qs.every(t=>h.includes(t)))return 0;
  let score=1;const q=norm(query);if(h===q)score+=10;if(h.startsWith(q))score+=6;for(const t of qs)if(h.split(/\s+/).some(x=>x.startsWith(t)))score+=2;return score;
};
const push=(rows,kind,id,title,subtitle,haystack,query,meta={})=>{const score=rank(haystack,query);if(score)rows.push({kind,id,title,subtitle,score,...meta});};

export const localUniversalSearch=({query,groups=[],modules=[],members=[],meetings=[],rubrics=[]})=>{
  const rows=[];
  for(const g of groups)push(rows,'group',g.id,g.name,'Groupe · '+String(g.kind??''),[g.name,g.kind,g.governanceModel].join(' '),query);
  for(const m of members)push(rows,'member',m.id,m.displayName,'Membre · '+String(m.status??''),[m.displayName,m.roles?.join(' '),m.status].join(' '),query);
  for(const meeting of meetings)push(rows,'meeting',meeting.id,meeting.title||'Séance','Séance · '+String(meeting.status??''),[meeting.title,meeting.status,meeting.location,meeting.theme,meeting.scheduledAt].join(' '),query);
  for(const r of rubrics)push(rows,'rubric',r.id,r.name,'Rubrique · '+String(r.activityPlan?.kind??r.facets?.purpose??''),[r.name,r.purpose,r.aliases?.join(' '),r.activityPlan?.kind].join(' '),query);
  for(const m of modules)push(rows,'module',m.id,m.labelFr||m.labelEn||m.id,'Service · '+m.id,[m.id,m.labelFr,m.labelEn,m.status,m.lot].join(' '),query);
  return rows.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'fr')).slice(0,40);
};

const scalarText=data=>Object.entries(data??{}).flatMap(([k,v])=>['string','number','boolean'].includes(typeof v)?[k,String(v)]:[]).join(' ');
export const remoteUniversalSearch=({query='',documents=[],knowledge=[],workspaces=[],inbox=[]})=>{
  const rows=[];
  for(const d of documents)rows.push({kind:'document',id:String(d.recordId??d.id??''),title:String(d.title??'Document'),subtitle:'Document'+(d.source?' · '+d.source:''),snippet:String(d.snippet??''),score:Number(d.score??1)});
  for(const k of knowledge)rows.push({kind:'knowledge',id:String(k.id??''),title:String(k.title??'Connaissance'),subtitle:'Connaissance · '+String(k.data?.knowledgeState??k.state??''),snippet:String(k.data?.body??'').slice(0,220),score:Math.max(1,rank([k.title,k.data?.body,k.data?.tags].join(' '),query))});
  for(const w of workspaces){
    const id=String(w.id??'');if(!id)continue;
    const title=String(w.title??w.moduleId??'Élément métier'),subtitle='Métier · '+String(w.moduleId??'')+' · '+String(w.status??'');
    push(rows,'workspace',id,title,subtitle,[title,w.summary,w.tags?.join(' '),scalarText(w.data)].join(' '),query,{snippet:String(w.summary??'').slice(0,220),moduleId:String(w.moduleId??'')});
  }
  for(const item of inbox){
    const id=String(item.id??'');if(!id)continue;
    push(rows,'inbox',id,String(item.title??'Action'),'Action · '+String(item.kind??'')+' · '+String(item.status??''),[item.title,item.kind,item.status,item.priority,item.sourceType,item.sourceId].join(' '),query,{groupId:item.groupId});
  }
  return rows.filter(x=>x.id).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'fr')).slice(0,50);
};
