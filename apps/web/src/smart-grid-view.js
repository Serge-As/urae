/** UI-only projection: never creates or mutates financial entries. */
export function splitFinancialRubrics(rubrics, requestedParts=1) {
  const items = Array.isArray(rubrics) ? rubrics : [];
  const allowed = Number.isInteger(Number(requestedParts)) && Number(requestedParts) > 0 ? Number(requestedParts) : 1;
  const count = Math.max(1, Math.min(items.length || 1, allowed));
  const minimum = Math.floor(items.length / count);
  const extras = items.length % count;
  const sections = [];
  let cursor = 0;
  for (let i = 0; i < count; i++) {
    const length = minimum + (i < extras ? 1 : 0);
    sections.push(items.slice(cursor, cursor + length));
    cursor += length;
  }
  return sections;
}

/** Geometry only. A part is offered only when EVERY one of its columns fits.
 * The full view deliberately keeps horizontal scrolling. No financial state
 * or totals enter this calculation. Widths match the canonical CSS columns. */
export function planFinancialRubricLayout({count, width, mode='visual', individual=false}) {
  const senior=mode==='senior', assisted=mode==='assisted';
  const numberWidth=individual?0:32;
  const identityWidth=individual?140:senior?148:116;
  const totalWidth=senior?134:108;
  const columnWidth=senior?214:assisted?184:132;
  const reserved=numberWidth+identityWidth+totalWidth;
  const available=Math.max(0,Math.floor(Number(width)||0)-4);
  const capacity=Math.max(0,Math.floor((available-reserved)/columnWidth));
  const n=Math.max(0,Math.floor(Number(count)||0));
  const recommended=capacity>0?Math.max(1,Math.ceil(n/capacity)):null;
  const fits=parts=>Number.isInteger(parts)&&parts>=1&&parts<=Math.max(1,n)&&capacity>0&&Math.ceil(n/parts)<=capacity;
  const choices=[...new Set([1,2,3,5,recommended].filter(x=>x!==null&&x<=Math.max(1,n)))].filter(x=>x===1||fits(x)).sort((a,b)=>a-b);
  return {numberWidth,identityWidth,totalWidth,columnWidth,reserved,available,capacity,recommended,choices,fits};
}

export function sumFinancialRubrics(rubrics, valueForRubric) {
  return (Array.isArray(rubrics) ? rubrics : []).reduce((total, rubric) => total + Number(valueForRubric(rubric) ?? 0), 0);
}

const rubricFamilies = new Map([
  ['CONTRIBUTION', 'ordinary'], ['TRANSPORT', 'ordinary'], ['OFFICE', 'ordinary'],
  ['SAVINGS', 'savings'], ['SOLIDARITY', 'solidarity'], ['TONTINE', 'tontine'],
  ['ASSISTANCE', 'assistance'], ['LEVY', 'levy'], ['HAND_RAISE', 'levy']
]);

// Read-only presentation. The posting nature is supplied by the existing financial owner.
export function rubricMark(rubric, nature) {
  const facets = rubric.facets ?? {};
  const kind = rubric.activityPlan?.kind;
  const system = facets.custom?.systemKey;
  let family = rubricFamilies.get(kind) ?? rubricFamilies.get(system) ?? 'other';
  let flow = { INFLOW: 'in', OUTFLOW: 'out' }[facets.direction] ?? '';
  if (nature === 'LOAN') return { family: 'loan', flow: 'out' };
  if (nature === 'REPAYMENT') return { family: 'repayment', flow: 'in' };
  if (nature === 'OUTFLOW') flow = 'out';
  if (!kind && !system) {
    const label = String(rubric.name ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    if (/^(epargne|savings?)\b/.test(label)) family = 'savings';
    else if (/^(secours|solidarite|solidarity|assurance|insurance)\b/.test(label)) family = 'solidarity';
    else if (/^tontine(?:\b|\d)/.test(label)) family = 'tontine';
    else if (/^(main[ -]levee|hand raise|levy)\b/.test(label)) family = 'levy';
  }
  if (facets.medium === 'NON_FINANCIAL' || facets.medium === 'IN_KIND') flow = '';
  if (family === 'assistance' && rubric.activityPlan?.policyDraft?.assistance?.fundingMode === 'MIXED') flow = '';
  return { family, flow };
}

const familyLabels = {
  ordinary: ['Cotisations et frais', 'Contributions and fees'], savings: ['Épargne', 'Savings'],
  solidarity: ['Secours', 'Solidarity'], tontine: ['Tontine', 'Tontine'],
  assistance: ['Assistance', 'Assistance'], levy: ['Main levée', 'Special collection'],
  loan: ['Prêt', 'Loan'], repayment: ['Remboursement', 'Repayment'], other: ['Autre rubrique', 'Other category']
};

export function markRubricHeader(header, mark, tx) {
  header.dataset.rubricFamily = mark.family;
  const family = tx(...familyLabels[mark.family]);
  const flow = mark.flow === 'out' ? tx('Sortie', 'Outflow') : mark.flow === 'in' ? tx('Entrée', 'Inflow') : '';
  const caption = document.createElement('small');
  caption.className = 'rubric-key';
  caption.dataset.caption = flow || family;
  caption.setAttribute('aria-hidden', 'true');
  header.title = [family, flow].filter(Boolean).join(' · ');
  header.setAttribute('aria-description', header.title);
  header.append(caption);
}

export function addFamilyJump(wrap, table, toolbar, tx) {
  const headers = [...table.querySelectorAll('thead th[data-rubric-family]')];
  const firstByFamily = new Map();
  for (const th of headers) if (!firstByFamily.has(th.dataset.rubricFamily)) firstByFamily.set(th.dataset.rubricFamily, th);
  if (firstByFamily.size < 2) return;
  const select = document.createElement('select');
  const prompt = tx('Atteindre une famille…', 'Jump to family…');
  select.setAttribute('aria-label', prompt);
  select.className = 'rubric-family-jump';
  select.add(new Option(prompt, ''));
  for (const family of firstByFamily.keys()) select.add(new Option(tx(...familyLabels[family]), family));
  select.onchange = () => {
    const header = firstByFamily.get(select.value);
    if (header) wrap.scrollLeft += header.getBoundingClientRect().left - headers[0].previousElementSibling.getBoundingClientRect().right;
    select.value = '';
  };
  toolbar.append(select);
}
