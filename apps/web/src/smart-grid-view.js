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

const paletteFamilies = {
  ORDINAIRE: ['Ordinaires', 'Ordinary'],
  EPARGNE: ['Épargne', 'Savings'],
  SECOURS: ['Solidarité', 'Solidarity'],
  TONTINE: ['Tontines', 'Tontines'],
  REMBOURSEMENT: ['Remboursements', 'Repayments'],
  EMPRUNT: ['Prêts', 'Loans'],
  MAIN_LEVEE: ['Main levée', 'Levies']
};

export function rubricPaletteFamily(rubric, financialNature) {
  if (financialNature === 'LOAN') return 'EMPRUNT';
  if (financialNature === 'REPAYMENT') return 'REMBOURSEMENT';
  const kind = String(rubric.activityPlan?.kind || rubric.facets?.custom?.systemKey || '').toUpperCase();
  const family = { SAVINGS: 'EPARGNE', EPARGNE: 'EPARGNE', SOLIDARITY: 'SECOURS', SECOURS: 'SECOURS',
    TONTINE: 'TONTINE', LEVY: 'MAIN_LEVEE', HAND_RAISE: 'MAIN_LEVEE', MAIN_LEVEE: 'MAIN_LEVEE' };
  if (Object.hasOwn(family, kind)) return family[kind];
  if (kind && kind !== 'CONTRIBUTION' && kind !== 'OTHER') return 'ORDINAIRE';
  // Older sheets can predate activity plans. These labels only select an ink colour.
  const label = String(rubric.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (/^(?:epargne|savings?)\b/.test(label)) return 'EPARGNE';
  if (/^(?:secours|solidarite|solidarity|assurance|insurance)\b/.test(label)) return 'SECOURS';
  if (/^tontine(?:\b|\d)/.test(label)) return 'TONTINE';
  if (/^(?:main[ -]levee|hand raise|levy)\b/.test(label)) return 'MAIN_LEVEE';
  return 'ORDINAIRE';
}

export function connectSheetNavigation(wrap, table, toolbar, tx, fitted) {
  if (!fitted) {
    // Native focus scrolling does not account for frozen identity/total cells.
    wrap.addEventListener('focusin', event => {
      const input = event.target.closest('.cell-target-input');
      if (!input) return;
      requestAnimationFrame(() => {
        if (document.activeElement !== input) return;
        const cell = input.closest('td');
        const identity = cell.parentElement.querySelector('th:last-of-type');
        const total = cell.parentElement.querySelector('.table-row-total');
        const left = identity.getBoundingClientRect().right;
        const right = total && getComputedStyle(total).position === 'sticky'
          ? total.getBoundingClientRect().left : wrap.getBoundingClientRect().left + wrap.clientWidth;
        const rect = cell.getBoundingClientRect();
        const start = rect.width <= right - left ? rect : input.getBoundingClientRect();
        if (start.left < left) wrap.scrollLeft += start.left - left;
        else if (start.right > right) wrap.scrollLeft += start.right - right;
      });
    });
  }
  const pager = toolbar.querySelector('.eco-smartgrid-navigation');
  if (pager) {
    const [previous, next] = pager.querySelectorAll('button');
    let start;
    wrap.addEventListener('touchstart', event => {
      start = null;
      if (wrap.querySelector('.cell-target-input:focus') || event.touches.length !== 1 || event.target.closest('input,button,select,a,textarea')) return;
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, left: wrap.scrollLeft < 2,
        right: wrap.scrollWidth - wrap.clientWidth - wrap.scrollLeft < 2 };
    }, { passive: true });
    wrap.addEventListener('touchcancel', () => { start = null; }, { passive: true });
    wrap.addEventListener('touchend', event => {
      const origin = start;
      start = null;
      if (!origin || event.touches.length || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - origin.x;
      const dy = event.changedTouches[0].clientY - origin.y;
      if (Math.abs(dx) < 55 || Math.abs(dx) < 2 * Math.abs(dy)) return;
      const control = dx < 0 && origin.right ? next : dx > 0 && origin.left ? previous : null;
      if (control && !control.disabled) control.click();
    }, { passive: true });
    return;
  }
  if (fitted) return;
  const headers = Array.from(table.querySelectorAll('thead [data-rubric-family]'));
  if (!headers.length) return;
  const rail = document.createElement('div');
  rail.className = 'eco-family-rail';
  rail.setAttribute('role', 'group');
  rail.setAttribute('aria-label', tx('Accès aux familles de rubriques', 'Jump to a category family'));
  const buttons = new Map();
  const frozenEdge = () => headers[0].previousElementSibling.getBoundingClientRect().right;
  for (const header of headers) {
    const family = header.dataset.rubricFamily;
    if (buttons.has(family)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(buttons.size === 0));
    button.dataset.rubricFamily = family;
    button.textContent = tx(...paletteFamilies[family]);
    button.onclick = () => wrap.scrollBy({ left: header.getBoundingClientRect().left - frozenEdge(), behavior: 'instant' });
    rail.append(button);
    buttons.set(family, button);
  }
  const markVisible = () => {
    if (!wrap.clientWidth) return;
    const edge = frozenEdge() + 2;
    const header = headers.find(cell => cell.getBoundingClientRect().right > edge) || headers.at(-1);
    for (const [key, button] of buttons) button.setAttribute('aria-pressed', String(key === header.dataset.rubricFamily));
  };
  toolbar.append(rail);
  wrap.addEventListener('scroll', markVisible, { passive: true });
  requestAnimationFrame(markVisible);
}
