import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultMonth } from './calendar.js';
import { ROSTER } from './defaults.js';
import { buildWeeklyAnalytics } from './analytics.js';

function rowsByName(analytics) {
  return Object.fromEntries(analytics.rows.map((row) => [row.name, row]));
}

test('weekly analytics counts standard and extra assignments', () => {
  const monthData = createDefaultMonth(2026, 11);
  const tuesday = monthData.days['2026-11-03'].masses[0];
  tuesday.roles.C = 'ANGELA';
  tuesday.roles.L1 = 'BUDDY';
  tuesday.extraRows = [{ id: 'row-1', label: 'PS', name: 'ANGELA' }];
  monthData.days['2026-11-04'].masses[0].roles.C = 'ANGELA';

  const analytics = buildWeeklyAnalytics({
    roster: ROSTER,
    monthData,
    year: 2026,
    month: 11,
  });
  const rows = rowsByName(analytics);

  assert.equal(analytics.weeks.length, 5);
  assert.equal(analytics.weeks[0].title, 'NOV 1\u20137');
  assert.equal(rows.ANGELA.counts[0], 3);
  assert.equal(rows.ANGELA.total, 3);
  assert.equal(rows.BUDDY.counts[0], 1);
  assert.equal(rows.ANGELA.counts[1], 0);
  assert.equal(analytics.weekTotals[0], 4);
  assert.equal(analytics.totalAssignments, 4);
});

test('weekly analytics ignores removed role rows', () => {
  const monthData = createDefaultMonth(2026, 11);
  const tuesday = monthData.days['2026-11-03'].masses[0];
  tuesday.roles.L1 = 'BUDDY';
  tuesday.roleKeys = ['C', 'RP', 'L2', 'PF'];

  const analytics = buildWeeklyAnalytics({
    roster: ROSTER,
    monthData,
    year: 2026,
    month: 11,
  });
  const rows = rowsByName(analytics);

  assert.equal(rows.BUDDY.total, 0);
  assert.equal(rows.ANGELA.total, 0);
  assert.equal(analytics.totalAssignments, 0);
});
