const VERSION=10,SIZE=57,DATA_CODEWORDS=274,EC_PER_BLOCK=18;
const BLOCK_DATA=[68,68,69,69] as const;
const ALIGN=[6,28,50] as const;

const gfExp=new Uint8Array(512),gfLog=new Uint8Array(256);
{
  let x=1;
  for(let i=0;i<255;i++){gfExp[i]=x;gfLog[x]=i;x<<=1;if(x&0x100)x^=0x11d;}
  for(let i=255;i<512;i++)gfExp[i]=gfExp[i-255]!;
}
const gfMul=(a:number,b:number)=>a===0||b===0?0:gfExp[gfLog[a]!+gfLog[b]!]!;
const rsGenerator=(degree:number)=>{
  let poly=[1];
  for(let i=0;i<degree;i++){
    const next=new Array(poly.length+1).fill(0),root=gfExp[i]!;
    for(let j=0;j<poly.length;j++){next[j]^=poly[j]!;next[j+1]^=gfMul(poly[j]!,root);}
    poly=next;
  }
  return poly;
};
const rsRemainder=(data:number[],degree:number)=>{
  const gen=rsGenerator(degree),rem=new Array(degree).fill(0);
  for(const value of data){
    const factor=value^rem[0]!;
    rem.shift();rem.push(0);
    for(let i=0;i<degree;i++)rem[i]^=gfMul(gen[i+1]!,factor);
  }
  return rem;
};
const appendBits=(out:number[],value:number,length:number)=>{for(let i=length-1;i>=0;i--)out.push((value>>>i)&1);};
const dataCodewords=(text:string)=>{
  const bytes=[...new TextEncoder().encode(text)];
  if(bytes.length>271)throw Error('QR_V10_L_PAYLOAD_TOO_LARGE');
  const bits:number[]=[];appendBits(bits,0b0100,4);appendBits(bits,bytes.length,16);for(const b of bytes)appendBits(bits,b,8);
  const capacity=DATA_CODEWORDS*8;for(let i=0;i<Math.min(4,capacity-bits.length);i++)bits.push(0);while(bits.length%8)bits.push(0);
  const out:number[]=[];for(let i=0;i<bits.length;i+=8){let n=0;for(let j=0;j<8;j++)n=(n<<1)|(bits[i+j]??0);out.push(n);}
  for(let pad=0;out.length<DATA_CODEWORDS;pad++)out.push(pad%2===0?0xec:0x11);return out;
};
const allCodewords=(text:string)=>{
  const data=dataCodewords(text),blocks:number[][]=[],ecc:number[][]=[];let offset=0;
  for(const len of BLOCK_DATA){const block=data.slice(offset,offset+len);offset+=len;blocks.push(block);ecc.push(rsRemainder(block,EC_PER_BLOCK));}
  const out:number[]=[];
  for(let i=0;i<69;i++)for(const b of blocks)if(i<b.length)out.push(b[i]!);
  for(let i=0;i<EC_PER_BLOCK;i++)for(const e of ecc)out.push(e[i]!);
  return out;
};
const bchRemainder=(value:number,poly:number)=>{
  let p=value,polyDegree=31-Math.clz32(poly);
  while(p!==0&&31-Math.clz32(p)>=polyDegree)p^=poly<<(31-Math.clz32(p)-polyDegree);
  return p;
};
const formatBits=()=>{const data=(1<<3)|0,rem=bchRemainder(data<<10,0x537);return((data<<10)|rem)^0x5412;};
const versionBits=()=>{const rem=bchRemainder(VERSION<<12,0x1f25);return(VERSION<<12)|rem;};

export type QrMatrix=boolean[][];

export function qrV10LMatrix(text:string):QrMatrix{
  const modules=Array.from({length:SIZE},()=>Array<boolean>(SIZE).fill(false));
  const fn=Array.from({length:SIZE},()=>Array<boolean>(SIZE).fill(false));
  const set=(x:number,y:number,dark:boolean)=>{if(x<0||y<0||x>=SIZE||y>=SIZE)return;modules[y]![x]=dark;fn[y]![x]=true;};
  const finder=(x:number,y:number)=>{
    for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=7;dx++){
      const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=SIZE||yy>=SIZE)continue;
      const dark=dx>=0&&dx<=6&&dy>=0&&dy<=6&&(dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4));set(xx,yy,dark);
    }
  };
  finder(0,0);finder(SIZE-7,0);finder(0,SIZE-7);
  for(let i=8;i<SIZE-8;i++){if(!fn[6]![i])set(i,6,i%2===0);if(!fn[i]![6])set(6,i,i%2===0);}
  for(const cy of ALIGN)for(const cx of ALIGN){
    if(fn[cy]![cx])continue;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(cx+dx,cy+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
  }
  const fmt=formatBits();
  for(let i=0;i<=5;i++)set(8,i,((fmt>>>i)&1)!==0);
  set(8,7,((fmt>>>6)&1)!==0);set(8,8,((fmt>>>7)&1)!==0);set(7,8,((fmt>>>8)&1)!==0);
  for(let i=9;i<15;i++)set(14-i,8,((fmt>>>i)&1)!==0);
  for(let i=0;i<8;i++)set(SIZE-1-i,8,((fmt>>>i)&1)!==0);
  for(let i=8;i<15;i++)set(8,SIZE-15+i,((fmt>>>i)&1)!==0);
  set(8,SIZE-8,true);
  const ver=versionBits();
  for(let i=0;i<18;i++){const bit=((ver>>>i)&1)!==0,a=SIZE-11+(i%3),bb=Math.floor(i/3);set(a,bb,bit);set(bb,a,bit);}
  const code=allCodewords(text),bits:number[]=[];for(const c of code)appendBits(bits,c,8);let bitIndex=0;
  for(let right=SIZE-1;right>=1;right-=2){
    if(right===6)right=5;
    for(let vert=0;vert<SIZE;vert++){
      const upward=((right+1)&2)===0,y=upward?SIZE-1-vert:vert;
      for(let j=0;j<2;j++){
        const x=right-j;if(fn[y]![x])continue;
        let dark=bitIndex<bits.length?bits[bitIndex++]!==0:false;
        if((x+y)%2===0)dark=!dark;
        modules[y]![x]=dark;
      }
    }
  }
  return modules;
}

export function qrMatrixSvg(matrix:QrMatrix,scale=8,border=4):string{
  const size=matrix.length,dim=(size+border*2)*scale,paths:string[]=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(matrix[y]![x])paths.push(`M${(x+border)*scale} ${(y+border)*scale}h${scale}v${scale}h-${scale}z`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${paths.join('')}" fill="black"/></svg>`;
}
