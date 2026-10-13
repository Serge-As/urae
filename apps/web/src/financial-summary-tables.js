// Read-only presentation of the existing Loan and SavingsYield projections.
// This module never creates a period, computes interest or writes a balance.
const kinds=['principal','interest','projected','due'];
const amount=value=>{const n=Number(value??0);return Number.isFinite(n)?n:0;};
const zero=()=>Object.fromEntries(kinds.map(key=>[key,0]));
const add=(target,source)=>{for(const key of kinds)target[key]+=amount(source?.[key]);return target;};
const periodState=p=>p?{principal:amount(p.principalAfter),interest:amount(p.interestAfter),projected:amount(p.nextInterestProjected),due:amount(p.totalDebtAfter)}:null;
const timestamp=row=>String(row?.updatedAt??row?.receivedAt??row?.createdAt??'');
const newer=(a,b)=>timestamp(b)>=timestamp(a)?b:a;

export function projectDebtEvolution(data={},memberName=id=>String(id)){
  const meetings=data.meetings??[],order=new Map(meetings.map((m,i)=>[String(m.id),i]));
  const loans=new Map(),closed=new Set((data.closedLoanIds??[]).map(String));
  for(const debt of data.loanDebts??[]){
    if(!debt.loanId)continue;
    const id=String(debt.loanId),previous=loans.get(id);
    if(!previous)loans.set(id,{id,memberId:String(debt.memberId??''),title:String(debt.title??id),open:debt,periods:new Map()});
    else previous.open=newer(previous.open,debt);
  }
  for(const p of data.loanPeriods??[]){
    if(!p.loanId)continue;
    const id=String(p.loanId);
    let loan=loans.get(id);
    if(!loan){loan={id,memberId:String(p.memberId??''),title:String(p.loanTitle??id),open:null,periods:new Map()};loans.set(id,loan);}
    if(!loan.memberId&&p.memberId)loan.memberId=String(p.memberId);
    // Revisions of one canonical loan/meeting are snapshots, not new loans.
    const key=String(p.meetingId??''),previous=loan.periods.get(key);
    loan.periods.set(key,previous?newer(previous,p):p);
  }
  const groups=new Map(),sessionTotals=meetings.map(zero),latestTotals=zero();
  for(const loan of loans.values()){
    const ordered=[...loan.periods.values()].sort((a,b)=>(order.get(String(a.meetingId))??Number.MAX_SAFE_INTEGER)-(order.get(String(b.meetingId))??Number.MAX_SAFE_INTEGER)||timestamp(a).localeCompare(timestamp(b)));
    const series=meetings.map((_,index)=>{
      let latest=null;for(const p of ordered)if((order.get(String(p.meetingId))??Infinity)<=index)latest=p;
      return periodState(latest);
    });
    const latest=closed.has(loan.id)?zero():loan.open?{
      principal:amount(loan.open.principal),interest:amount(loan.open.interest),
      projected:amount(loan.open.nextInterestProjected),due:amount(loan.open.totalDue)
    }:periodState(ordered.at(-1))??zero();
    // Unknown memberships are kept separate rather than merged by an empty ID.
    const memberKey=loan.memberId||'unassigned:'+loan.id;
    let group=groups.get(memberKey);
    if(!group){group={memberId:loan.memberId,key:memberKey,name:memberName(loan.memberId),loans:[],series:meetings.map(zero),latest:zero()};groups.set(memberKey,group);}
    group.loans.push({id:loan.id,title:loan.title,series,latest});
    series.forEach((state,i)=>{add(group.series[i],state);add(sessionTotals[i],state);});
    add(group.latest,latest);add(latestTotals,latest);
  }
  const members=[...groups.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name))||a.key.localeCompare(b.key));
  for(const member of members)member.loans.sort((a,b)=>a.id.localeCompare(b.id));
  return{meetings,members,sessionTotals,latestTotals};
}

const fundFor=rubric=>/scolaire|school/i.test(String(rubric?.name??''))?'SCHOOL':'CLASSIC';
const fundName=fund=>fund==='SCHOOL'?'Épargne scolaire':'Épargne classique';

export function savingsDepositRubrics(deposits=[],rubrics=[]){
  const catalog=new Map();
  // Both configured simulation funds remain visible before their first deposit.
  if(!rubrics.length)for(const fund of ['CLASSIC','SCHOOL'])catalog.set('fund:'+fund,{key:'fund:'+fund,id:null,name:fundName(fund),fund});
  for(const r of rubrics){if(!r.id)continue;catalog.set('rubric:'+String(r.id),{key:'rubric:'+String(r.id),id:String(r.id),name:String(r.name??r.id),fund:fundFor(r)});}
  for(const deposit of deposits){
    const fund=String(deposit.fund??'CLASSIC'),key=deposit.rubricId?'rubric:'+String(deposit.rubricId):'fund:'+fund;
    if(!catalog.has(key))catalog.set(key,{key,id:deposit.rubricId?String(deposit.rubricId):null,name:String(deposit.rubricName??fundName(fund)),fund});
  }
  if(!catalog.size)for(const fund of ['CLASSIC','SCHOOL'])catalog.set('fund:'+fund,{key:'fund:'+fund,id:null,name:fundName(fund),fund});
  return [...catalog.values()];
}

export function projectSavingsDeposits({deposits=[],members=[],rubrics=[],rubricFilter='ALL',memberFilter='ALL'}={}){
  const catalog=savingsDepositRubrics(deposits,rubrics);
  const selected=catalog.filter(r=>rubricFilter==='ALL'||r.key===rubricFilter||r.fund===rubricFilter),keys=new Set(selected.map(r=>r.key));
  const unique=new Map();let anonymous=0;
  for(const d of deposits){
    const key=d.id?'id:'+String(d.id):'unidentified:'+anonymous++;
    const previous=unique.get(key);unique.set(key,previous?newer(previous,d):d);
  }
  const rows=[...unique.values()].filter(d=>keys.has(d.rubricId?'rubric:'+String(d.rubricId):'fund:'+String(d.fund??'CLASSIC'))&&(memberFilter==='ALL'||String(d.memberId)===memberFilter));
  const byMember=new Map();
  const insertMember=m=>{const id=String(m.id);if(memberFilter!=='ALL'&&id!==memberFilter)return;if(!byMember.has(id))byMember.set(id,{memberId:id,name:String(m.displayName??id),memberNumber:m.memberNumber??'—',rubrics:selected.map(r=>({...r,deposits:[],total:0})),total:0});};
  for(const m of members)insertMember(m);
  for(const d of rows){
    const id=String(d.memberId);if(!byMember.has(id))insertMember({id,displayName:id});
    const member=byMember.get(id),key=d.rubricId?'rubric:'+String(d.rubricId):'fund:'+String(d.fund??'CLASSIC');
    const rubric=member.rubrics.find(r=>r.key===key);rubric.deposits.push(d);rubric.total+=amount(d.amount);member.total+=amount(d.amount);
  }
  const grouped=[...byMember.values()].sort((a,b)=>{
    const an=Number(a.memberNumber),bn=Number(b.memberNumber);
    return (Number.isFinite(an)?an:Infinity)-(Number.isFinite(bn)?bn:Infinity)||a.name.localeCompare(b.name)||a.memberId.localeCompare(b.memberId);
  });
  for(const member of grouped)for(const r of member.rubrics)r.deposits.sort((a,b)=>amount(a.session)-amount(b.session)||String(a.periodKey??'').localeCompare(String(b.periodKey??''))||String(a.id??'').localeCompare(String(b.id??'')));
  return{rubrics:selected,members:grouped,depositCount:rows.length,total:grouped.reduce((n,m)=>n+m.total,0)};
}

const node=(doc,tag,text,className)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const STYLE_ID='eco-financial-summary-tables-style';
export function installFinancialSummaryStyles(doc=globalThis.document){
  if(!doc||doc.getElementById(STYLE_ID))return;
  const style=node(doc,'style');style.id=STYLE_ID;
  style.textContent=`
    .loan-four-criteria-table .member-tone-0{--eco-summary-tone:#f2f8f4}
    .loan-four-criteria-table .member-tone-1{--eco-summary-tone:#fff}
    .loan-four-criteria-table .loan-criteria-row>.loan-member-key{background:var(--eco-summary-tone);vertical-align:top;padding-top:12px}
    .loan-four-criteria-table .loan-member-subtotal>.loan-member-subtotal-label{left:var(--eco-member-col);max-width:calc(var(--eco-loan-col) + var(--eco-criterion-col));border-left:4px solid #277c56}
    .yield-deposit-member-table{width:100%;border-collapse:separate;border-spacing:0;--eco-deposit-number-col:42px;--eco-deposit-member-col:130px}
    .yield-deposit-member-table th,.yield-deposit-member-table td{padding:8px 10px;vertical-align:top}
    .yield-deposit-member-table .yield-member-tone-0{--eco-summary-tone:#f1f8f3}
    .yield-deposit-member-table .yield-member-tone-1{--eco-summary-tone:#fff}
    .yield-deposit-member-table .yield-member-number,.yield-deposit-member-table .yield-member-name{background:var(--eco-summary-tone);position:sticky;z-index:3}
    .yield-deposit-member-table .yield-member-number{left:0;min-width:var(--eco-deposit-number-col)}
    .yield-deposit-member-table .yield-member-name{left:var(--eco-deposit-number-col);min-width:var(--eco-deposit-member-col);max-width:180px;white-space:normal}
    .yield-deposit-member-table .yield-member-start>*{border-top:2px solid #9dbfac}
    .yield-deposit-member-table .yield-rubric-key{background:var(--eco-summary-tone);border-left:4px solid #277c56}
    .yield-deposit-member-table .yield-fund-school>.yield-rubric-key{border-left-color:#795698}
    .yield-deposit-member-table .amount{font-weight:800;text-align:right;white-space:nowrap}
    .yield-deposit-member-table .yield-member-subtotal>*{background:#e0f0e5;font-weight:900;border-top:1px solid #aacdb8}
    .yield-deposit-member-table .yield-member-subtotal .yield-rubric-key{border-left-color:#193e2f}
    .yield-deposit-member-table .yield-deposit-details summary{cursor:pointer;font-size:12px;white-space:nowrap}
    .yield-deposit-member-table .yield-deposit-detail{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid #d9e6df}
    .yield-deposit-member-table .yield-deposit-detail button{min-height:38px;font-size:12px;padding:5px 9px}
    @media(max-width:760px){.yield-deposit-member-table{width:max-content;min-width:100%;--eco-deposit-member-col:105px}.yield-deposit-member-table th,.yield-deposit-member-table td{padding:6px;font-size:12px}}
    @media print{.yield-deposit-member-table .yield-member-number,.yield-deposit-member-table .yield-member-name{position:static}.yield-deposit-member-table .yield-deposit-detail button{display:none}}
  `;
  doc.head.append(style);
}

export function renderDebtEvolutionTable(data,{document:doc=globalThis.document,memberName=id=>String(id),fmt=String,tr=(fr)=>fr}={}){
  installFinancialSummaryStyles(doc);
  const projection=projectDebtEvolution(data,memberName),criteria=[
    ['principal',tr('Capital restant','Outstanding principal')],['interest',tr('Intérêts dus','Interest due')],
    ['projected',tr('Prochains intérêts projetés','Projected next interest')],['due',tr('Total dette exigible','Total due debt')]
  ];
  const table=node(doc,'table',undefined,'meeting-matrix loan-four-criteria-table'),head=node(doc,'thead'),hr=node(doc,'tr');
  for(const title of [tr('Membre','Member'),tr('Prêt','Loan'),tr('Critère','Criterion'),...projection.meetings.map(m=>'S'+String(m.session??'')),tr('Situation actuelle','Current')])hr.append(node(doc,'th',title));
  head.append(hr);table.append(head);const body=node(doc,'tbody');
  const appendAmounts=(row,series,latest,key,empty=false)=>{for(const state of series)row.append(node(doc,'td',state||!empty?fmt(amount(state?.[key])):'—'));row.append(node(doc,'td',fmt(amount(latest[key]))));};
  projection.members.forEach((member,memberIndex)=>{
    const subtotal=member.loans.length>1,tone='member-tone-'+(memberIndex%2);
    member.loans.forEach((loan,loanIndex)=>criteria.forEach(([key,label],criterionIndex)=>{
      const row=node(doc,'tr',undefined,'loan-criteria-row '+tone+' loan-criterion-'+key+(criterionIndex===0?' loan-criteria-start':''));row.dataset.memberId=member.memberId;row.dataset.loanId=loan.id;
      if(loanIndex===0&&criterionIndex===0){const th=node(doc,'th',member.name,'loan-member-key');th.rowSpan=member.loans.length*criteria.length+(subtotal?criteria.length:0);th.scope='rowgroup';row.append(th);}
      if(criterionIndex===0){const th=node(doc,'th',loan.title,'loan-name-key');th.rowSpan=criteria.length;th.scope='rowgroup';row.append(th);}
      const criterion=node(doc,'th',label,'loan-criterion-key');criterion.scope='row';row.append(criterion);appendAmounts(row,loan.series,loan.latest,key,true);body.append(row);
    }));
    if(subtotal)for(const [key,label] of criteria){
      const row=node(doc,'tr',undefined,'loan-member-subtotal '+tone+' loan-criterion-'+key);row.dataset.memberId=member.memberId;
      const th=node(doc,'th',tr('TOTAL MEMBRE · ','MEMBER TOTAL · ')+label,'loan-member-subtotal-label');th.colSpan=2;th.scope='row';row.append(th);appendAmounts(row,member.series,member.latest,key);body.append(row);
    }
  });
  if(!projection.members.length){const row=node(doc,'tr'),cell=node(doc,'td',tr('Aucun prêt ni historique à afficher.','No loans or history to display.'));cell.colSpan=4+projection.meetings.length;row.append(cell);body.append(row);}
  table.append(body);const foot=node(doc,'tfoot');
  for(const [key,label] of criteria){const row=node(doc,'tr',undefined,'table-total-row loan-criterion-'+key),th=node(doc,'th',tr('TOTAL GROUPE · ','GROUP TOTAL · ')+label);th.colSpan=3;th.scope='row';row.append(th);appendAmounts(row,projection.sessionTotals,projection.latestTotals,key);foot.append(row);}
  table.append(foot);return table;
}

export function renderSavingsDepositTable(projection,{document:doc=globalThis.document,fmt=String,periodName=String,onRemove,memberPage=0,pageSize=40,tr=(fr)=>fr}={}){
  installFinancialSummaryStyles(doc);
  const pages=Math.max(1,Math.ceil(projection.members.length/pageSize)),page=Math.max(0,Math.min(memberPage,pages-1));
  const table=node(doc,'table',undefined,'meeting-matrix yield-deposit-member-table'),head=node(doc,'thead'),hr=node(doc,'tr');
  for(const title of ['N°',tr('Membre','Member'),tr('Rubrique','Rubric'),tr('Montant (F CFA)','Amount (XAF)'),tr('Détail des dépôts','Deposit detail')])hr.append(node(doc,'th',title));
  head.append(hr);table.append(head);const body=node(doc,'tbody');
  projection.members.slice(page*pageSize,(page+1)*pageSize).forEach((member,index)=>{
    const tone='yield-member-tone-'+((page*pageSize+index)%2);
    member.rubrics.forEach((rubric,rubricIndex)=>{
      const row=node(doc,'tr',undefined,tone+' yield-fund-'+String(rubric.fund).toLowerCase()+(rubricIndex===0?' yield-member-start':''));row.dataset.memberId=member.memberId;row.dataset.rubricKey=rubric.key;
      if(rubricIndex===0)for(const [text,className] of [[member.memberNumber,'yield-member-number'],[member.name,'yield-member-name']]){const th=node(doc,'th',text,className);th.rowSpan=member.rubrics.length+1;th.scope='rowgroup';row.append(th);}
      const label=node(doc,'th',rubric.name,'yield-rubric-key');label.scope='row';row.append(label,node(doc,'td',fmt(rubric.total),'amount'));
      const detailCell=node(doc,'td');
      if(rubric.deposits.length){
        const details=node(doc,'details',undefined,'yield-deposit-details');details.append(node(doc,'summary',rubric.deposits.length+' '+tr('dépôt(s)','deposit(s)')));
        for(const d of rubric.deposits){
          const detail=node(doc,'div',undefined,'yield-deposit-detail');detail.dataset.depositId=String(d.id??'');
          detail.append(node(doc,'span','S'+String(d.session??'—')+' · '+periodName(String(d.periodKey??''))+' · '+fmt(amount(d.amount))));
          if(onRemove){const remove=node(doc,'button',tr('Retirer de cette simulation','Remove from this simulation'),'link-btn');remove.type='button';remove.setAttribute('aria-label',tr('Retirer de la simulation le dépôt de ','Remove the simulation deposit for ')+member.name+' · '+rubric.name+' · S'+String(d.session??'—'));remove.onclick=()=>onRemove(d);detail.append(remove);}
          details.append(detail);
        }
        detailCell.append(details);
      }else detailCell.textContent='—';
      row.append(detailCell);body.append(row);
    });
    const total=node(doc,'tr',undefined,tone+' yield-member-subtotal');total.dataset.memberId=member.memberId;
    total.append(node(doc,'th',tr('TOTAL MEMBRE','MEMBER TOTAL'),'yield-rubric-key'),node(doc,'td',fmt(member.total),'amount'),node(doc,'td',''));body.append(total);
  });
  if(!projection.members.length){const row=node(doc,'tr'),cell=node(doc,'td',tr('Aucun membre pour ce filtre.','No member for this filter.'));cell.colSpan=5;row.append(cell);body.append(row);}
  table.append(body);const foot=node(doc,'tfoot'),row=node(doc,'tr',undefined,'table-total-row');
  const label=node(doc,'th',tr('TOTAL FILTRÉ','FILTERED TOTAL')+' ('+projection.members.length+' '+tr('membres','members')+' · '+projection.depositCount+' '+tr('dépôts','deposits')+')');label.colSpan=3;
  row.append(label,node(doc,'td',fmt(projection.total),'amount sum'),node(doc,'td',''));foot.append(row);table.append(foot);
  return{table,page,pages};
}
