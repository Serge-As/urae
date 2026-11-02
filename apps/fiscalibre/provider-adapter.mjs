/** Transport serveur à raccorder au contrat officiel, jamais importé dans le navigateur.
 * Aucun endpoint présumé. Authentification et décodage fournis par le connecteur agréé.
 * Une réponse 2xx sans reçu ne devient jamais ACCEPTED. */
export function createProviderAdapter({enabled=false,officialOrigins=[],operations={},authenticate,decodeReceipt,fetchImpl=fetch,timeoutMs=20000}={}){
 const missing=[];
 if(!enabled)missing.push('ACTIVATION_REQUIRED');
 if(!officialOrigins.length)missing.push('OFFICIAL_ORIGIN_CONFIRMATION_REQUIRED');
 if(typeof authenticate!=='function')missing.push('SERVER_AUTHENTICATION_REQUIRED');
 if(typeof decodeReceipt!=='function')missing.push('OFFICIAL_RECEIPT_CONTRACT_REQUIRED');
 return {
  status:()=>({state:missing.length?'NOT_CONFIGURED':'READY_FOR_SANDBOX',missing:[...missing],productionQualified:false}),
  async submit({operation,payload,idempotencyKey,companyId,authorize}={}){
   if(missing.length)return {state:'NOT_CONFIGURED',missing:[...missing],submitted:false};
   // La vérification d'autorisation doit appartenir au service serveur de l'entreprise.
   if(typeof authorize!=='function'||!await authorize(companyId,operation))return {state:'FORBIDDEN',submitted:false};
   const contract=operations[operation];
   if(!contract||typeof contract.validate!=='function')return {state:'CONTRACT_MISSING',submitted:false};
   const url=new URL(contract.url);
   if(url.protocol!=='https:'||url.username||url.password||!officialOrigins.includes(url.origin))return {state:'ENDPOINT_REJECTED',submitted:false};
   if(typeof idempotencyKey!=='string'||!/^[-a-zA-Z0-9.]{8,120}$/.test(idempotencyKey))return {state:'IDEMPOTENCY_KEY_REQUIRED',submitted:false};
   const validation=await contract.validate(payload);if(validation!==true)return {state:'INVALID_PAYLOAD',submitted:false};
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
   try{
    const auth=await authenticate({companyId,operation});
    // L'en-tête d'idempotence doit être défini dans la documentation du fournisseur.
    // Le registre durable des tentatives et doublons appartient au service appelant.
    const headers={'content-type':'application/json',...auth};
    if(contract.idempotencyHeader)headers[contract.idempotencyHeader]=idempotencyKey;
    const res=await fetchImpl(url,{method:'POST',headers,body:JSON.stringify(payload),signal:controller.signal,redirect:'error'});
    if(!res.ok)return {state:'REJECTED_HTTP',httpStatus:res.status,submitted:true,accepted:false};
    const content=await res.text();if(content.length>2000000)return {state:'UNKNOWN',submitted:true,accepted:false,reason:'OVERSIZED_RESPONSE'};
    const receipt=await decodeReceipt(content,res.status);
    if(receipt?.accepted===true&&typeof receipt.reference==='string'&&receipt.reference.length>0)return {state:'ACCEPTED',submitted:true,accepted:true,reference:receipt.reference};
    return {state:'PENDING_VERIFICATION',submitted:true,accepted:false,reason:'OFFICIAL_ACCEPTANCE_NOT_PROVEN'};
   }catch{return {state:'UNKNOWN',submitted:'unknown',accepted:false,reason:'NETWORK_OR_PROTOCOL_ERROR',retryRequiresStatusLookup:true};}
   finally{clearTimeout(timer);}
  }
 };
}
