import test from 'node:test';
import assert from 'node:assert/strict';
import { getMassRoleKeys, reorderRoleKeys } from './defaults.js';

test('mass role order is preserved and can be reordered', () => {
  const keys = ['C', 'RP', 'L1', 'PF'];
  assert.deepEqual(getMassRoleKeys({ roleKeys: keys }), keys);
  assert.deepEqual(reorderRoleKeys(keys, 'C', 'RP'), ['RP', 'C', 'L1', 'PF']);
  assert.deepEqual(reorderRoleKeys(keys, 'PF', 'missing'), keys);
});
