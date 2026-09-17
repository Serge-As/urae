import worker,{type WorkerEnv} from './index.js';
export {GroupLiveHub} from './group-live-hub.js';

export const RELEASE_VERSION='1.4.0-master-2.3.4-closure';

const releaseTruthPaths=new Set(['/health','/api/v1/product/capabilities']);

const withReleaseTruth=async(response:Response):Promise<Response>=>{
  if(!response.ok)return response;
  const contentType=response.headers.get('content-type')??'';
  if(!contentType.includes('application/json'))return response;
  try{
    const payload=await response.clone().json() as Record<string,unknown>;
    payload.version=RELEASE_VERSION;
    const headers=new Headers(response.headers);
    headers.set('content-type','application/json; charset=utf-8');
    headers.set('cache-control','no-store');
    return new Response(JSON.stringify(payload,null,2),{status:response.status,statusText:response.statusText,headers});
  }catch{return response;}
};

export default {
  async fetch(request:Request,env:WorkerEnv={}):Promise<Response>{
    const response=await worker.fetch(request,env);
    return releaseTruthPaths.has(new URL(request.url).pathname)?withReleaseTruth(response):response;
  }
};
