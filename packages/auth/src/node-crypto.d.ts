// Narrow Node runtime boundary, mirrored from the official node:crypto API.
declare module 'node:crypto' {
 export function scrypt(password:string,salt:string,keylen:number,options:{N:number;r:number;p:number;maxmem:number},callback:(error:Error|null,key:Uint8Array)=>void):void;
 export function timingSafeEqual(a:Uint8Array,b:Uint8Array):boolean;
 export function randomBytes(size:number):Uint8Array & {toString(encoding:string):string};
}
