const utf8=new TextEncoder();
const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const crc=data=>{let n=0xffffffff;for(const b of data){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;};
const concat=parts=>{const out=new Uint8Array(parts.reduce((n,x)=>n+x.length,0));let at=0;for(const x of parts){out.set(x,at);at+=x.length;}return out;};
const header=(size,fields)=>{const out=new Uint8Array(size),v=new DataView(out.buffer);for(const [offset,value,width] of fields)width===2?v.setUint16(offset,value,true):v.setUint32(offset,value,true);return out;};
function zip(files){let offset=0;const local=[],central=[];for(const [name,text]of files){const filename=utf8.encode(name),bytes=utf8.encode(text),checksum=crc(bytes);
 const h=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[14,checksum,4],[18,bytes.length,4],[22,bytes.length,4],[26,filename.length,2]]);local.push(h,filename,bytes);
 central.push(header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[16,checksum,4],[20,bytes.length,4],[24,bytes.length,4],[28,filename.length,2],[42,offset,4]]),filename);offset+=h.length+filename.length+bytes.length;
 }const index=concat(central);return concat([...local,index,header(22,[[0,0x06054b50,4],[8,files.length,2],[10,files.length,2],[12,index.length,4],[16,offset,4]])]);}
const col=i=>{let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};
export function buildXlsx(sheets){
 if(!Array.isArray(sheets)||!sheets.length||sheets.length>30)throw Error('INVALID_WORKBOOK');
 const names=new Set();for(const s of sheets){if(!s.name||s.name.length>31||/[\[\]:*?/\\]/.test(s.name)||names.has(s.name.toLowerCase())||s.rows.length>100000)throw Error('INVALID_SHEET');names.add(s.name.toLowerCase());}
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const worksheets=sheets.map((s,index)=>['xl/worksheets/sheet'+(index+1)+'.xml','<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>'+s.rows.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((value,c)=>{if(typeof value==='number'&&!Number.isSafeInteger(value))throw Error('INVALID_XAF_CELL');const ref=col(c)+(r+1);return typeof value==='number'?'<c r="'+ref+'"><v>'+value+'</v></c>':'<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';}).join('')+'</row>').join('')+'</sheetData></worksheet>']);
 const types='<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>';
 const workbook='<?xml version="1.0"?><workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>';
 const rels='<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'</Relationships>';
 return zip([['[Content_Types].xml',types],['_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',rels],...worksheets]);
}
export function sheetsForPrint(kind,d){
 const ref={name:'Repères',rows:[['Eco-System · copie de lecture'],['Groupe',d.group?.name??''],['Référence',d.lot??''],['Généré le',d.generatedAt??''],['Source','Projection des propriétaires canoniques ; aucune écriture créée'],['Statut','Vérifier la fraîcheur et la confirmation dans Eco avant tout paiement']]};
 let rows;
 if(kind==='SESSION_SHEET')rows=[['Membre',...d.rubrics.map(r=>r.name),'Total des flux affichés'],...d.rows.map(r=>[r.displayName,...r.cells,r.total]),['Totaux',...d.columnTotals,d.grandTotal]];
 else if(kind==='MEMBER_SHEET')rows=[['Membre',d.member.displayName],['Rubrique','Flux net XAF'],...d.byRubric.map(r=>[r.rubricName,r.total]),['Séance','Rubrique','XAF','Référence reçu'],...d.receipts.map(r=>[r.meetingName,r.rubricName,r.netAmount,r.receiptId])];
 else if(kind==='GROUP_STATE')rows=[['Repère','Valeur'],['Membres actifs',d.counts.members],['Rubriques',d.counts.rubrics],['Séances',d.counts.meetings],...(d.financial?[['Solde de caisse XAF',d.financial.cashBalance]]:[]),['Séance','État','Date'],...d.meetings.map(m=>[m.title,m.status,m.at])];
 else if(kind==='ATTENDANCE_SHEET')rows=[['Membre','Présence','Observation','Signature'],...d.rows.map(r=>[r.displayName,r.attendance,r.note,''])];
 else if(kind==='ROLE_REGISTER')rows=[['Membre','Rôle','Référence'],...d.rows.map(r=>[r.displayName,r.role,r.membershipId])];
 else if(kind==='MEMBER_CARDS')rows=[['Membre','Référence','Rôles'],...d.cards.map(r=>[r.displayName,r.membershipId,r.roles.join(', ')])];
 else throw Error('EXPORT_KIND_UNSUPPORTED');
 return [{name:'État Eco',rows},ref];
}
export function downloadXlsx(kind,data){const blob=new Blob([buildXlsx(sheetsForPrint(kind,data))],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Eco-'+kind+'-'+(data.lot??'projection')+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
