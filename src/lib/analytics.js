import { getMonthGrid, monthShort } from './calendar.js';
import { getMassRoleKeys } from './defaults.js';

function nameKey(name) {
  return String(name ?? '').trim().toUpperCase();
}

export function buildWeeklyAnalytics({ roster, monthData, year, month }) {
  const weeks = getMonthGrid(year, month).map((week, index) => {
    const dates = week.filter(Boolean);
    const short = monthShort(month);
    const range = dates.length
      ? dates[0].day === dates[dates.length - 1].day
        ? `${short} ${dates[0].day}`
        : `${short} ${dates[0].day}\u2013${dates[dates.length - 1].day}`
      : '';
    return { label: `W${index + 1}`, title: range, dates };
  });

  const counts = new Map();

  const bump = (value, weekIndex) => {
    const key = nameKey(value);
    if (!key) return;
    if (!counts.has(key)) counts.set(key, Array(weeks.length).fill(0));
    counts.get(key)[weekIndex] += 1;
  };

  weeks.forEach((week, weekIndex) => {
    for (const date of week.dates) {
      const day = monthData.days?.[date.iso];
      if (!day || day.noMass) continue;
      for (const mass of day.masses ?? []) {
        for (const roleKey of getMassRoleKeys(mass)) {
          bump(mass.roles?.[roleKey], weekIndex);
        }
        for (const row of mass.extraRows ?? []) {
          bump(row.name, weekIndex);
        }
      }
    }
  });

  const rows = roster.map((name) => {
    const rowCounts = counts.get(nameKey(name)) ?? Array(weeks.length).fill(0);
    return {
      name,
      counts: [...rowCounts],
      total: rowCounts.reduce((sum, value) => sum + value, 0),
    };
  });

  const weekTotals = weeks.map((_, index) =>
    rows.reduce((sum, row) => sum + row.counts[index], 0),
  );

  return {
    weeks: weeks.map(({ label, title }) => ({ label, title })),
    rows,
    weekTotals,
    totalAssignments: rows.reduce((sum, row) => sum + row.total, 0),
  };
}
