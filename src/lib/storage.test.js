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

test('saved mass role order survives loading', () => {
  const root = normalizeRoot({
    lastMonth: { year: 2026, month: 12 },
    roster: [],
    months: {
      '2026-12': {
        days: {
          '2026-12-01': {
            masses: [{ roleKeys: ['PF', 'C', 'RP'] }],
          },
        },
      },
    },
  });
  assert.deepEqual(
    root.months['2026-12'].days['2026-12-01'].masses[0].roleKeys,
    ['PF', 'C', 'RP'],
  );
});

test('legacy weekday defaults drop only an empty L2 role', () => {
  const root = normalizeRoot({
    version: 1,
    lastMonth: { year: 2026, month: 12 },
    roster: [],
    months: {
      '2026-12': {
        days: {
          '2026-12-01': {
            masses: [
              {
                roleKeys: ['C', 'L1', 'RP', 'L2', 'PF'],
                roles: { L2: '' },
              },
            ],
          },
          '2026-12-02': {
            masses: [
              {
                roleKeys: ['C', 'L1', 'RP', 'L2', 'PF'],
                roles: { L2: 'KEEP' },
              },
            ],
          },
        },
      },
    },
  });
  assert.deepEqual(
    root.months['2026-12'].days['2026-12-01'].masses[0].roleKeys,
    ['C', 'L1', 'RP', 'PF'],
  );
  assert.deepEqual(
    root.months['2026-12'].days['2026-12-02'].masses[0].roleKeys,
    ['C', 'L1', 'RP', 'L2', 'PF'],
  );
});
