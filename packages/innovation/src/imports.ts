export interface CsvPreviewIssue{row:number;column?:number;code:string;value?:string;}
export interface CsvPreview{fingerprint:string;delimiter:string;headers:string[];rows:string[][];issues:CsvPreviewIssue[];rowCount:number;}
const parse=(text:string,delimiter:string)=>{
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i]!;
    if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;continue;}if(ch==='"'){quoted=false;continue;}cell+=ch;continue;}
    if(ch==='"'){quoted=true;continue;}if(ch===delimiter){row.push(cell);cell='';continue;}
    if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';continue;}cell+=ch;
  }
  row.push(cell.replace(/\r$/,''));if(row.some(x=>x.length)||rows.length===0)rows.push(row);return rows;
};
const hex=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
export const sha256Text=async(text:string)=>{
  if(!globalThis.crypto?.subtle)throw Error('CRYPTO_SUBTLE_REQUIRED');
  const d=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return hex(new Uint8Array(d));
};
export const previewCsv=async(text:string,options:{delimiter?:string;requiredHeaders?:string[];maxRows?:number}={}):Promise<CsvPreview>=>{
  if(text.length>5_000_000)throw Error('IMPORT_FILE_TOO_LARGE');
  const first=text.split(/\r?\n/,1)[0]??'';const delimiter=options.delimiter??([';',',','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0]??';');
  const parsed=parse(text,delimiter),headers=(parsed.shift()??[]).map(x=>x.trim()),issues:CsvPreviewIssue[]=[];const width=headers.length;
  if(!width||headers.some(x=>!x))issues.push({row:1,code:'INVALID_OR_EMPTY_HEADER'});
  const duplicate=headers.find((h,i)=>headers.indexOf(h)!==i);if(duplicate)issues.push({row:1,code:'DUPLICATE_HEADER',value:duplicate});
  for(const required of options.requiredHeaders??[])if(!headers.includes(required))issues.push({row:1,code:'REQUIRED_HEADER_MISSING',value:required});
  const max=Math.max(1,Math.min(options.maxRows??5000,5000)),rows=parsed.slice(0,max);
  rows.forEach((r,i)=>{if(r.length!==width)issues.push({row:i+2,code:'COLUMN_COUNT_MISMATCH',value:String(r.length)});});
  if(parsed.length>max)issues.push({row:max+2,code:'PREVIEW_TRUNCATED',value:String(parsed.length-max)});
  return{fingerprint:await sha256Text(text),delimiter,headers,rows,issues,rowCount:parsed.length};
};
export interface NotificationDigestItem{id:string;title:string;dueAt?:string;priority:string;}
export const buildNotificationDigest=(items:NotificationDigestItem[],nowIso:string,windowHours=24)=>{
  const now=Date.parse(nowIso),end=now+Math.max(1,windowHours)*3600000;
  return items.filter(x=>!x.dueAt||(Date.parse(x.dueAt)>=now&&Date.parse(x.dueAt)<=end)).sort((a,b)=>(a.dueAt??'').localeCompare(b.dueAt??'')||a.title.localeCompare(b.title));
};
