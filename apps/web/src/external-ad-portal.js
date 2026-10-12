const byId=id=>document.getElementById(id);
const options=new URLSearchParams(location.hash.slice(1));
const token=options.get('token')??'',tenant=options.get('tenant')??'',group=options.get('group')??'';
const status=byId('portalStatus'),form=byId('externalAdForm'),send=byId('externalAdSend');
let en=false;
const copy={
 fr:{title:'Annonceur invité',intro:'Soumettez une proposition. Seul un gestionnaire habilité peut l’examiner et aucune publication ou facturation n’est automatique.',checking:'Vérification de l’invitation…',ready:'Invitation valide. Déposez votre proposition.',used:'Proposition enregistrée. État : ',expired:'Lien non valide ou expiré. Demandez une autre invitation.',sending:'Transmission en cours…',success:'Proposition enregistrée. Un responsable pourra l’examiner.',error:'Échec de l’opération : '},
 en:{title:'Invited advertiser',intro:'Submit an advertisement proposal. An authorized manager must review it; no automatic publication or payment occurs.',checking:'Checking invitation…',ready:'Invitation valid. You can submit your proposal.',used:'Proposal received. Status: ',expired:'This link is invalid or expired. Request another invitation.',sending:'Submitting…',success:'Proposal recorded. A manager will review it.',error:'Operation failed: '}
};
const lang=()=>copy[en?'en':'fr'];
function speak(text){status.textContent=text;}
function paintLanguage(){
 document.documentElement.lang=en?'en':'fr';
 byId('portalTitle').textContent=lang().title;byId('portalIntro').textContent=lang().intro;
 byId('portalLanguage').textContent=en?'Français':'English';
 send.textContent=en?'Submit for review':'Soumettre à modération';
}
byId('portalLanguage').onclick=()=>{en=!en;paintLanguage();};
const endpoint='/api/v1/external-ads/groups/'+encodeURIComponent(group)+'/invite';
async function ask(suffix='',init={}){
 const h=new Headers(init.headers??{});h.set('x-external-ad-token',token);h.set('x-tenant-id',tenant);
 const response=await fetch(endpoint+suffix,{...init,headers:h,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
 const body=await response.json().catch(()=>({error:'HTTP_'+response.status}));
 if(!response.ok)throw Error(String(body.error??'HTTP_'+response.status));
 return body;
}
async function verify(){
 paintLanguage();
 if(!token||!tenant||!group){speak(lang().expired);return;}
 try{
  const data=await ask();
  if(data.proposalId){speak(lang().used+(data.state??'SUBMITTED'));return;}
  form.hidden=false;speak(lang().ready);
 }catch{form.hidden=true;speak(lang().expired);}
}
form.onsubmit=e=>{e.preventDefault();void(async()=>{
 send.disabled=true;speak(lang().sending);
 try{
  const values=Object.fromEntries(new FormData(form).entries());
  delete values.file;
  const photo=byId('externalAdPhoto')?.files?.[0];
  if(photo){
   if(photo.size>2000000)throw Error('MEDIA_SIZE_OUT_OF_RANGE');
   const mediaForm=new FormData();mediaForm.append('file',photo);
   await ask('/photo',{method:'POST',body:mediaForm});
  }
  delete values.photo;
  const data=await ask('',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(values)});
  form.hidden=true;speak(lang().success+' ('+data.id+')');
 }catch(error){speak(lang().error+String(error?.message??error));}
 finally{send.disabled=false;}
})()};
void verify();
