import { PARISH, ROSTER, ROLE_KEYS, getMassRoleKeys, newId } from './defaults.js';
import {
  createDefaultMonth,
  daysInMonth,
  isoDate,
  monthKey,
} from './calendar.js';
import { normalizeRoster } from './roster.js';

export const STORAGE_KEY = 'leccom.schedule.v1';
export const VERSION = 1;

function normalizeHeader(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const header = {};
  for (const [key, fallback] of Object.entries(PARISH)) {
    header[key] = typeof source[key] === 'string' ? source[key] : fallback;
  }
  return header;
}

function normalizeMass(raw) {
  const roles = {};
  for (const key of ROLE_KEYS) {
    roles[key] = String(raw?.roles?.[key] ?? '');
  }
  return {
    id: String(raw?.id ?? newId('mass')),
    time: typeof raw?.time === 'string' ? raw.time : '6:00 AM',
    language: typeof raw?.language === 'string' ? raw.language : 'E',
    special: Boolean(raw?.special),
    label: String(raw?.label ?? ''),
    roles,
    roleKeys: getMassRoleKeys(raw),
    extraRows: Array.isArray(raw?.extraRows)
      ? raw.extraRows.map((row) => ({
          id: String(row?.id ?? newId('row')),
          label: String(row?.label ?? ''),
          name: String(row?.name ?? ''),
        }))
      : [],
  };
}

function normalizeDay(raw, fallback) {
  if (!raw || typeof raw !== 'object') return fallback;
  return {
    iso: fallback.iso,
    noMass: Boolean(raw.noMass),
    masses: Array.isArray(raw.masses)
      ? raw.masses.map(normalizeMass)
      : fallback.masses,
  };
}

function normalizeMonth(raw, year, month) {
  const fallback = createDefaultMonth(year, month);
  if (!raw || typeof raw !== 'object') return fallback;

  const days = {};
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day += 1) {
    const iso = isoDate(year, month, day);
    days[iso] = normalizeDay(raw.days?.[iso], fallback.days[iso]);
  }

  const source = raw.announcement && typeof raw.announcement === 'object'
    ? raw.announcement
    : {};

  return {
    days,
    feastDays: Array.isArray(raw.feastDays)
      ? raw.feastDays.map((entry) => ({
          id: String(entry?.id ?? newId('feast')),
          date: String(entry?.date ?? ''),
          title: String(entry?.title ?? ''),
        }))
      : [],
    announcement: {
      meetingDate: String(source.meetingDate ?? ''),
      massTime: String(source.massTime ?? ''),
      meetingTime: String(source.meetingTime ?? ''),
      reminder: String(source.reminder ?? ''),
    },
    birthdays: Array.isArray(raw.birthdays)
      ? raw.birthdays.map((entry) => ({
          id: String(entry?.id ?? newId('birthday')),
          date: String(entry?.date ?? ''),
          name: String(entry?.name ?? ''),
        }))
      : [],
    preparedBy: String(raw.preparedBy ?? ''),
    reviewedBy: String(raw.reviewedBy ?? ''),
  };
}

export function normalizeRoot(raw) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (
    Number.isInteger(raw?.lastMonth?.year) &&
    Number.isInteger(raw?.lastMonth?.month) &&
    raw.lastMonth.year >= 1900 &&
    raw.lastMonth.year <= 2100 &&
    raw.lastMonth.month >= 1 &&
    raw.lastMonth.month <= 12
  ) {
    year = raw.lastMonth.year;
    month = raw.lastMonth.month;
  }

  const months = {};
  if (raw?.months && typeof raw.months === 'object') {
    for (const [key, value] of Object.entries(raw.months)) {
      const match = key.match(/^(\d{4})-(\d{2})$/);
      if (!match) continue;
      const entryYear = Number(match[1]);
      const entryMonth = Number(match[2]);
      if (entryYear < 1900 || entryYear > 2100) continue;
      if (entryMonth < 1 || entryMonth > 12) continue;
      months[key] = normalizeMonth(value, entryYear, entryMonth);
    }
  }

  const lastKey = monthKey(year, month);
  if (!months[lastKey]) months[lastKey] = createDefaultMonth(year, month);

  return {
    version: VERSION,
    roster: Array.isArray(raw?.roster) ? normalizeRoster(raw.roster) : [...ROSTER],
    disabledRoster: Array.isArray(raw?.disabledRoster)
      ? [...new Set(raw.disabledRoster.filter((name) => typeof name === 'string').map((name) => name.trim()).filter(Boolean))]
      : [],
    header: normalizeHeader(raw?.header),
    lastMonth: { year, month },
    months,
  };
}

export function createDefaultRoot(now = new Date()) {
  return normalizeRoot({
    version: VERSION,
    roster: ROSTER,
    lastMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },
    months: {},
  });
}

export function loadRoot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultRoot();
    return normalizeRoot(JSON.parse(raw));
  } catch (error) {
    console.warn('Could not read saved schedule:', error);
    return createDefaultRoot();
  }
}

export function saveRoot(root) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
}

export function serializeRoot(root) {
  return JSON.stringify(root, null, 2);
}

export function parseRoot(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!data || typeof data !== 'object' || !data.months || typeof data.months !== 'object') {
    throw new Error('That file is not a LECCOM schedule backup.');
  }
  return normalizeRoot(data);
}
