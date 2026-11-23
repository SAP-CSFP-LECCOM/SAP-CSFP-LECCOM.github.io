import test from 'node:test';
import assert from 'node:assert/strict';
import { addRosterNames, normalizeRoster } from './roster.js';

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
