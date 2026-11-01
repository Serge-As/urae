export const rubricUnitLabel=r=>['IN_KIND','NON_FINANCIAL'].includes(r.facets?.medium)?'Nature · valorisation XAF si comptabilisée ; quantités séparées':r.facets?.medium==='HYBRID'?'Mixte · montants XAF ; quantités séparées':'Montants en XAF';
export function projectRubricMatrix({rubricId,meetings,members,receipts,from='',to='',contributorsOnly=false}){
 const selected=meetings.filter(m=>{const day=String(m.scheduledAt??m.openedAt??'').slice(0,10);return(!from||day>=from)&&(!to||day<=to);}).slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)));
 const ids=new Set(selected.map(m=>m.id)),totals=new Map(),noMeeting=!from&&!to&&receipts.some(r=>r.rubricId===rubricId&&!r.meetingId);
 for(const r of receipts){if(r.rubricId!==rubricId||(!ids.has(r.meetingId)&&!(!r.meetingId&&noMeeting)))continue;const key=JSON.stringify([r.membershipId,r.meetingId??'']);totals.set(key,(totals.get(key)??0)+Number(r.netAmount??0));}
 const columns=[...selected.map(m=>({id:m.id,title:m.title,meeting:m})),...(noMeeting?[{id:'',title:'Sans séance'}]:[])];
 const rows=members.map(m=>{const cells=columns.map(c=>totals.get(JSON.stringify([m.id,c.id]))??0);return{member:m,cells,total:cells.reduce((n,x)=>n+x,0)};}).filter(r=>!contributorsOnly||r.cells.some(x=>x!==0));
 const columnTotals=columns.map((_,i)=>rows.reduce((n,r)=>n+r.cells[i],0));return{columns,rows,columnTotals,total:columnTotals.reduce((n,x)=>n+x,0)};
}
