const round2=value=>Math.round(Number(value)*100)/100;

export const geoErrorCode=error=>{
  const code=Number(error?.code??0);
  if(code===1)return 'GEO_PERMISSION_DENIED';
  if(code===2)return 'GEO_POSITION_UNAVAILABLE';
  if(code===3)return 'GEO_TIMEOUT';
  return error?.message||'GEO_UNAVAILABLE';
};

export const geoErrorMessage=error=>{
  const code=geoErrorCode(error);
  if(code==='GEO_PERMISSION_DENIED')return 'Localisation refusée. Vous pouvez continuer avec la localité saisie manuellement.';
  if(code==='GEO_POSITION_UNAVAILABLE')return 'Position indisponible sur cet appareil. Utilisez la localité manuelle.';
  if(code==='GEO_TIMEOUT')return 'Le GPS met trop de temps à répondre. Réessayez ou utilisez la localité manuelle.';
  if(code==='GEO_REQUIRES_HTTPS')return 'La localisation GPS exige une connexion HTTPS sécurisée.';
  if(code==='GEO_UNSUPPORTED')return 'La localisation GPS n’est pas disponible sur ce navigateur.';
  return 'Localisation momentanément indisponible. Utilisez la localité manuelle.';
};

const locate=options=>new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,options));

export async function requestApproximateLocation(){
  if(typeof window!=='undefined'&&!window.isSecureContext)throw new Error('GEO_REQUIRES_HTTPS');
  if(typeof navigator==='undefined'||!navigator.geolocation)throw new Error('GEO_UNSUPPORTED');
  let position;
  try{position=await locate({enableHighAccuracy:true,timeout:12000,maximumAge:60000});}
  catch(first){if(Number(first?.code)===1)throw first;position=await locate({enableHighAccuracy:false,timeout:18000,maximumAge:300000});}
  const latitude=Number(position.coords?.latitude),longitude=Number(position.coords?.longitude),accuracy=Number(position.coords?.accuracy??1000);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<-90||latitude>90||longitude<-180||longitude>180)throw new Error('GEO_POSITION_UNAVAILABLE');
  // Public sharing is deliberately coarse (~1 km minimum). Precise device coordinates
  // remain local to this function and are never persisted by the browser helper.
  return{latitude:round2(latitude),longitude:round2(longitude),precisionMeters:Math.max(1000,Math.min(10000,Math.round(Number.isFinite(accuracy)?accuracy:1000))),source:'DEVICE_GEOLOCATION'};
}

export async function geolocationPermissionState(){
  try{if(navigator.permissions?.query)return(await navigator.permissions.query({name:'geolocation'})).state;}catch{}
  return 'unknown';
}
