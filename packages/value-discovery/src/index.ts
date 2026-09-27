import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const now=()=>new Date().toISOString();
const clean=(v:unknown,n=3000)=>String(v??'').trim().slice(0,n);
const list=(v:unknown)=>[...new Set((Array.isArray(v)?v:String(v??'').split(',')).map(x=>clean(x,200)).filter(Boolean))].slice(0,60);
const norm=(v:unknown)=>clean(v,4000).normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase();
const tokens=(...parts:unknown[])=>new Set(norm(parts.flatMap(x=>Array.isArray(x)?x:[x]).join(' ')).split(/[^a-z0-9]+/).filter(x=>x.length>2));

export class ValueDiscoveryService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async record(){
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'MANAGER.VALUE_DISCOVERY');
    return rows.find(x=>x.createdBy===c.actorId&&x.data.profileOwnerId===c.actorId&&x.status!=='ARCHIVED');
  }
  async profile(){return await this.record();}
  async saveProfile(input:{assets?:string[];skills?:string[];availability?:string;equipment?:string[];products?:string[];stock?:string[];land?:string[];network?:string[];experience?:string[];locality?:string;notes?:string}){
    const c=this.ctx(),existing=await this.record(),stamp=now(),data={profileOwnerId:c.actorId,assetsJson:JSON.stringify(list(input.assets)),skillsJson:JSON.stringify(list(input.skills)),availability:clean(input.availability,500),equipmentJson:JSON.stringify(list(input.equipment)),productsJson:JSON.stringify(list(input.products)),stockJson:JSON.stringify(list(input.stock)),landJson:JSON.stringify(list(input.land)),networkJson:JSON.stringify(list(input.network)),experienceJson:JSON.stringify(list(input.experience)),locality:clean(input.locality,240),notes:clean(input.notes,3000),incomePromise:false,updatedAt:stamp};
    const r:WorkspaceRecord=existing?{...existing,data:{...existing.data,...data},updatedAt:stamp}:{id:makeId('value_profile'),tenantId:c.tenantId,moduleId:'MANAGER.VALUE_DISCOVERY',title:'Mon potentiel de valeur',summary:'Profil privé servant à expliquer des correspondances avec des demandes réelles.',status:'ACTIVE',tags:['value-discovery','private-profile','no-income-promise'],data,createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);return r;
  }
  async suggestions(limit=30){
    const c=this.ctx(),profile=await this.record();if(!profile)return[];
    const read=(key:string)=>{try{return JSON.parse(String(profile.data[key]??'[]')) as string[];}catch{return[];}};
    const skills=read('skillsJson'),assets=read('assetsJson'),equipment=read('equipmentJson'),products=read('productsJson'),stock=read('stockJson'),land=read('landJson'),network=read('networkJson'),experience=read('experienceJson'),locality=String(profile.data.locality??'');
    const ownTokens=tokens(skills,assets,equipment,products,stock,land,network,experience,profile.data.notes),needs=(await this.repo.listWorkspaceRecords(c.tenantId,'OPPORTUNITY.NEED')).filter(x=>['PUBLISHED','MATCHED'].includes(String(x.data.state??''))&&x.data.publicationConsent===true);
    const micro=(await this.repo.listWorkspaceRecords(c.tenantId,'COMMUNITY.MICRO_ADS')).filter(x=>x.data.microAdState==='PUBLISHED'&&x.data.microAdType==='SEEK'&&Date.parse(String(x.data.expiresAt??0))>Date.now());
    const candidates=[...needs.map(x=>({kind:'NEED',id:x.id,title:x.title,category:String(x.data.category??''),locality:String(x.data.locality??''),text:[x.title,x.summary,x.data.category,x.data.specification,x.data.quality].join(' '),sourceRef:x.id})),...micro.map(x=>({kind:'MICRO_AD',id:x.id,title:x.title,category:String(x.data.category??''),locality:String(x.data.locality??''),text:[x.title,x.summary,x.data.category].join(' '),sourceRef:x.id}))];
    return candidates.map(x=>{const wanted=tokens(x.text),matches=[...wanted].filter(t=>ownTokens.has(t)),localityMatch=Boolean(locality&&x.locality&&norm(locality)===norm(x.locality));const reasons=[];if(matches.length)reasons.push('Correspondance : '+matches.slice(0,6).join(', '));if(localityMatch)reasons.push('Même localité déclarée');if(products.some(p=>norm(x.text).includes(norm(p))))reasons.push('Produit déclaré dans votre profil');if(skills.some(p=>norm(x.text).includes(norm(p))))reasons.push('Compétence déclarée dans votre profil');return{...x,reasons,matchCount:matches.length+(localityMatch?1:0),guaranteedIncome:false};}).filter(x=>x.matchCount>0).sort((a,b)=>b.matchCount-a.matchCount||a.title.localeCompare(b.title,'fr')).slice(0,Math.max(1,Math.min(100,limit)));
  }
}
