/** UI-only projection: never creates or mutates financial entries. */
export function splitFinancialRubrics(rubrics, requestedParts=1) {
  const items = Array.isArray(rubrics) ? rubrics : [];
  const allowed = [1, 2, 5].includes(Number(requestedParts)) ? Number(requestedParts) : 1;
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

export function sumFinancialRubrics(rubrics, valueForRubric) {
  return (Array.isArray(rubrics) ? rubrics : []).reduce((total, rubric) => total + Number(valueForRubric(rubric) ?? 0), 0);
}
