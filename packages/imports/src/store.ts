export interface ArtifactObjectLike{
  text():Promise<string>;
  arrayBuffer?():Promise<ArrayBuffer>;
  httpEtag?:string;
  size?:number;
}
export interface ArtifactStoreLike{
  put(key:string,value:string|ArrayBuffer|Uint8Array,options?:{httpMetadata?:{contentType?:string};customMetadata?:Record<string,string>}):Promise<unknown>;
  get(key:string):Promise<ArtifactObjectLike|null>;
  delete?(key:string):Promise<void>;
  head?(key:string):Promise<ArtifactObjectLike|null>;
}
