import type {Id} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
const roles=new Set(['founder','manager','admin','president','treasurer']);
const normalize=(x:string)=>x.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
async function groupAccess(repo:PlatformRepository,kernel:PlatformKernel,groupId:Id){
  const ctx=kernel.context.get(),group=await repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
  if(group.createdBy===ctx.actorId)return;
  const membership=(await repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
  if(!membership)throw Error('FORBIDDEN_SCOPE');
}
export class DocumentSearchService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  async search(groupId:Id,query:string,limit=20){
    await groupAccess(this.repo,this.kernel,groupId);const ctx=this.kernel.context.get();
    const q=normalize(query.trim());if(q.length<2)return[];
    const terms=[...new Set(q.split(/\s+/).filter(x=>x.length>1))];
    const records=(await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId))
      .filter(r=>r.moduleId==='GOVERNANCE.DOCUMENTS'||r.tags.includes('kind:DOCUMENT'))
      .filter(r=>r.status!=='ARCHIVED');
    const hits:Array<{recordId:Id;title:string;score:number;snippet:string;source?:string;page?:string;version?:number}>=[];
    for(const r of records){
      const content=[r.title,r.summary??'',typeof r.data.content==='string'?r.data.content:''].join('\n'),hay=normalize(content);
      const matched=terms.filter(t=>hay.includes(t));if(!matched.length)continue;
      const first=Math.min(...matched.map(t=>hay.indexOf(t)).filter(x=>x>=0));
      const snippet=content.slice(Math.max(0,first-100),Math.min(content.length,first+260)).replace(/\s+/g,' ').trim();
      hits.push({recordId:r.id,title:r.title,score:matched.length,snippet,source:typeof r.data.source==='string'?r.data.source:undefined,page:typeof r.data.page==='string'?r.data.page:undefined,version:Number(r.data.version??1)});
    }
    return hits.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,Math.max(1,Math.min(100,limit)));
  }
}
