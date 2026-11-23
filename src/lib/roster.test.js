import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addRosterNames,
  formatMemberName,
  normalizeMemberGenders,
  normalizeMemberName,
  normalizeRoster,
} from './roster.js';

test('roster trims, removes blanks and de-duplicates case-insensitively', () => {
  assert.deepEqual(
    normalizeRoster(['  Ana ', '', 'ANA', 'Ben', 'ben', '  ']),
    ['Ana', 'Ben'],
  );
});

test('bulk add splits new lines and commas', () => {
  assert.deepEqual(
    addRosterNames(['Ana'], 'Ben\nCara, ana\n\nDAN'),
    ['Ana', 'Ben', 'Cara', 'DAN'],
  );
});

test('gender prefixes are formatted and normalized for roster assignments', () => {
  const memberGenders = normalizeMemberGenders(
    ['JULIAN', 'MAYA'],
    { julian: 'MALE', MAYA: 'female', unknown: 'male' },
  );
  assert.deepEqual(memberGenders, { JULIAN: 'male', MAYA: 'female' });
  assert.equal(formatMemberName('julian', memberGenders), 'BRO JULIAN');
  assert.equal(formatMemberName('SIS maya', memberGenders), 'SIS MAYA');
  assert.equal(normalizeMemberName('SIS MAYA', memberGenders), 'MAYA');
  assert.equal(formatMemberName('ALEX', memberGenders), 'ALEX');
});
