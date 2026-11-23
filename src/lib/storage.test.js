import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoot } from './storage.js';

test('legacy schedules retain their roster and can add member genders', () => {
  const legacy = normalizeRoot({
    lastMonth: { year: 2026, month: 12 },
    roster: ['JULIAN', 'MAYA'],
    months: {},
  });
  assert.deepEqual(legacy.roster, ['JULIAN', 'MAYA']);
  assert.deepEqual(legacy.memberGenders, {});

  const updated = normalizeRoot({
    lastMonth: { year: 2026, month: 12 },
    roster: ['JULIAN', 'MAYA'],
    memberGenders: { julian: 'male', unknown: 'female' },
    months: {},
  });
  assert.deepEqual(updated.memberGenders, { JULIAN: 'male' });
});
