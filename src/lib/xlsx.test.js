import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { createDefaultMonth } from './calendar.js';
import { PARISH } from './defaults.js';
import { buildWorkbook } from './xlsx.js';

test('December 2026 workbook mirrors the template layout', async () => {
  const monthData = createDefaultMonth(2026, 12);
  const workbook = buildWorkbook(ExcelJS, {
    year: 2026,
    month: 12,
    monthData,
    header: PARISH,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  const worksheet = reloaded.worksheets[0];

  assert.equal(worksheet.pageSetup.orientation, 'landscape');
  assert.equal(worksheet.pageSetup.fitToWidth, 1);
  assert.ok(worksheet.getCell('A1').isMerged);
  assert.match(worksheet.getCell('A1').value, /DECEMBER 2026 SCHEDULE/);
  assert.equal(worksheet.getCell('A8').value, 'SUNDAY');
  assert.equal(worksheet.getCell('G9').value, 1);
  assert.equal(worksheet.getCell('K9').value, 5);
  assert.ok(worksheet.getCell('K9').isMerged);
  assert.equal(worksheet.getCell('A17').value, '6:30 AM (K)');
  assert.equal(worksheet.getCell('B17').value, '8:00 AM (E)');
  assert.equal(worksheet.getCell('F16').value, 7);
  assert.equal(worksheet.getCell('F17').value, 'NO MASS');
  assert.equal(worksheet.getCell('K10').value, '6:00 AM (K)');
  assert.equal(worksheet.getCell('L10').value, '6:00 PM (E)');
});

test('removed roles stay omitted while other masses keep their role order', async () => {
  const monthData = createDefaultMonth(2026, 12);
  const firstSunday = monthData.days['2026-12-06'].masses[0];
  firstSunday.roles.L2 = 'TEST LECTOR';
  firstSunday.roleKeys = ['C', 'L1', 'RP', 'PF'];

  const workbook = buildWorkbook(ExcelJS, {
    year: 2026,
    month: 12,
    monthData,
    header: PARISH,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  const worksheet = reloaded.worksheets[0];

  assert.equal(worksheet.getCell('A21').value, 'PF-');
  assert.equal(worksheet.getCell('A22').value, '');
  assert.equal(worksheet.getCell('B21').value, 'L2-');
  assert.equal(worksheet.getCell('B22').value, 'PF-');
});

test('workbook uses member honorifics and each mass role order', async () => {
  const monthData = createDefaultMonth(2026, 12);
  const firstMass = monthData.days['2026-12-06'].masses[0];
  firstMass.roles.C = 'JULIAN';
  firstMass.roles.L1 = 'MAYA';
  firstMass.roleKeys = ['L1', 'C', 'RP', 'PF', 'L2'];

  const workbook = buildWorkbook(ExcelJS, {
    year: 2026,
    month: 12,
    monthData,
    memberGenders: { JULIAN: 'male', MAYA: 'female' },
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  const worksheet = reloaded.worksheets[0];
  assert.equal(worksheet.getCell('A18').value, 'L1- SIS MAYA');
  assert.equal(worksheet.getCell('A19').value, 'C- BRO JULIAN');
});

test('workbook splits birthday entries into two columns', async () => {
  const monthData = createDefaultMonth(2026, 12);
  monthData.birthdays = Array.from({ length: 6 }, (_, index) => ({
    id: `birthday-${index + 1}`,
    date: `DEC ${index + 1}`,
    name: `MEMBER ${index + 1}`,
  }));
  const workbook = buildWorkbook(ExcelJS, {
    year: 2026,
    month: 12,
    monthData,
    memberGenders: { 'MEMBER 1': 'female' },
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  const worksheet = reloaded.worksheets[0];
  assert.match(worksheet.getCell('H5').value, /MEMBER 1/);
  assert.match(worksheet.getCell('H5').value, /SIS MEMBER 1/);
  assert.match(worksheet.getCell('H5').value, /MEMBER 4/);
  assert.match(worksheet.getCell('K5').value, /MEMBER 5/);
  assert.match(worksheet.getCell('K5').value, /MEMBER 6/);
});

test('six-week month builds without errors', async () => {
  const monthData = createDefaultMonth(2026, 8);
  const workbook = buildWorkbook(ExcelJS, {
    year: 2026,
    month: 8,
    monthData,
    header: PARISH,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  const worksheet = reloaded.worksheets[0];
  assert.equal(worksheet.getCell('A44').value, 30);
  assert.equal(worksheet.getCell('F44').value, 31);
});
