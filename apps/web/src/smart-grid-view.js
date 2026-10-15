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

