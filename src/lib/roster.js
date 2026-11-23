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

export function normalizeMemberGenders(roster, raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const genders = new Map(
    Object.entries(source).map(([name, gender]) => [
      cleanName(name).toLowerCase(),
      String(gender).toLowerCase(),
    ]),
  );
  const out = {};
  for (const name of roster) {
    const gender = genders.get(name.toLowerCase());
    if (gender === 'male' || gender === 'female') out[name] = gender;
  }
  return out;
}

export function formatMemberName(name, memberGenders = {}) {
  const clean = cleanName(name);
  const base = clean.replace(/^(?:BRO|SIS)\s+/i, '');
  const member = Object.keys(memberGenders).find(
    (entry) => entry.toLowerCase() === base.toLowerCase(),
  );
  if (!member) return clean;

  const gender = memberGenders[member];
  if (gender === 'male') return `BRO ${member}`;
  if (gender === 'female') return `SIS ${member}`;
  return clean;
}

export function normalizeMemberName(name, memberGenders = {}) {
  const clean = cleanName(name);
  const base = clean.replace(/^(?:BRO|SIS)\s+/i, '');
  return (
    Object.keys(memberGenders).find(
      (member) => member.toLowerCase() === base.toLowerCase(),
    ) ?? clean
  );
}

export function addRosterNames(roster, text) {
  const incoming = String(text ?? '')
    .split(/[\n,]+/)
    .map(cleanName)
    .filter(Boolean);
  return normalizeRoster([...(roster || []), ...incoming]);
}
