export function cleanName(name) {
  return String(name ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeRoster(names) {
  const out = [];
  const seen = new Set();
  for (const name of names || []) {
    const clean = cleanName(name);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

export function addRosterNames(roster, text) {
  const incoming = String(text ?? '')
    .split(/[\n,]+/)
    .map(cleanName)
    .filter(Boolean);
  return normalizeRoster([...(roster || []), ...incoming]);
}
