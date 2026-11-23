import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMassToDay,
  createDefaultDay,
  daysInMonth,
  getMonthGrid,
  normalizeTime,
} from './calendar.js';

test('February 2026 is four weeks starting on Sunday', () => {
  const weeks = getMonthGrid(2026, 2);
  assert.equal(weeks.length, 4);
  assert.equal(weeks[0][0].day, 1);
  assert.equal(weeks[3][6].day, 28);
});

test('December 2026 starts under Tuesday in a five-week grid', () => {
  const weeks = getMonthGrid(2026, 12);
  assert.equal(weeks.length, 5);
  assert.equal(weeks[0][0], null);
  assert.equal(weeks[0][1], null);
  assert.equal(weeks[0][2].day, 1);
  assert.equal(weeks[4][4].iso, '2026-12-31');
  assert.equal(weeks[4][6], null);
});

test('August 2026 needs six weeks', () => {
  const weeks = getMonthGrid(2026, 8);
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0][6].day, 1);
});

test('leap year February 2028 has 29 days', () => {
  assert.equal(daysInMonth(2028, 2), 29);
  assert.equal(getMonthGrid(2028, 2).length, 5);
});

test('default Sunday has five masses', () => {
  const day = createDefaultDay(2026, 12, 6);
  assert.equal(day.masses.length, 5);
  assert.equal(day.masses[0].time, '6:30 AM');
  assert.equal(day.masses[0].language, 'K');
  assert.equal(day.masses[4].time, '6:30 PM');
});

test('default Monday is NO MASS', () => {
  const day = createDefaultDay(2026, 12, 7);
  assert.equal(day.noMass, true);
  assert.equal(day.masses.length, 0);
});

test('default weekday has one 6:00 AM mass', () => {
  const day = createDefaultDay(2026, 12, 1);
  assert.equal(day.noMass, false);
  assert.equal(day.masses.length, 1);
  assert.equal(day.masses[0].time, '6:00 AM');
});

test('first Saturday has special and regular masses', () => {
  const day = createDefaultDay(2026, 12, 5);
  assert.equal(day.masses.length, 2);
  assert.equal(day.masses[0].special, true);
  assert.equal(day.masses[0].time, '6:00 AM');
  assert.equal(day.masses[1].time, '6:00 PM');
});

test('later Saturdays only have the regular mass', () => {
  const day = createDefaultDay(2026, 12, 12);
  assert.equal(day.masses.length, 1);
  assert.equal(day.masses[0].time, '6:00 PM');
});

test('added later Saturday mass goes left of the existing mass', () => {
  const day = createDefaultDay(2026, 12, 12);
  const added = { id: 'added' };
  const updated = addMassToDay(day, added, { day: 12, weekday: 6 });
  assert.deepEqual(updated.masses, [added, day.masses[0]]);
});

test('added first Saturday mass goes left of the default special mass', () => {
  const day = createDefaultDay(2026, 12, 5);
  const added = { id: 'added' };
  const updated = addMassToDay(day, added, { day: 5, weekday: 6 });
  assert.deepEqual(updated.masses, [added, ...day.masses]);
});

test('time normalization accepts common input forms', () => {
  assert.equal(normalizeTime('6:30'), '6:30 AM');
  assert.equal(normalizeTime('6:30am'), '6:30 AM');
  assert.equal(normalizeTime('6:30 AM'), '6:30 AM');
  assert.equal(normalizeTime('18:30'), '6:30 PM');
  assert.equal(normalizeTime('12:00 PM'), '12:00 PM');
  assert.equal(normalizeTime('0:05'), '12:05 AM');
  assert.equal(normalizeTime('not a time'), null);
});
