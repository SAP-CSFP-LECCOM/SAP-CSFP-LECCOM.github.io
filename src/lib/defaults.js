export const ROSTER = [
  'ANDREA',
  'ANGELA',
  'BELLE',
  'BUDDY',
  'CELESTINE',
  'CRISTIAN',
  'CYTHNIA',
  'DAISY',
  'DETTE',
  'DOLLY',
  'EDITH',
  'ELVIE',
  'ERIC',
  'EVELYN',
  'FATIMA',
  'GARY',
  'GINO',
  'GLORIA',
  'IDA',
  'JANE',
  'JANINE',
  'JENG',
  'JENNY',
  'JOSHUA',
  'JP',
  'JULIAN',
  'LENIE',
  'LINDA M',
  'LINDA P',
  'LOIDA',
  'MAGDA',
  'MARGE',
  'MARIE',
  'MARIET',
  'MARKCEL',
  'MARLYN',
  'MHAI',
  'MIA',
  'MICHAEL',
  'MYRNA',
  'NOEMI',
  'ODESSA',
  'PETER',
  'PRINCESS',
  'REGIE',
  'RIZA',
  'RONNEL',
  'RUSS',
  'THELMA',
  'WAYNE',
  'YANG',
];

export const PARISH = {
  archdiocese: 'THE ROMAN CATHOLIC ARCHDIOCESE OF SAN FERNANDO',
  ministry: 'MINISTRY ON LITURGY',
  guild: 'Lectors and Commentators Guild',
  parish: 'SAN AGUSTIN PARISH',
  address: 'San Agustin, City of San Fernando, Pampanga',
};

export const ROLE_KEYS = ['C', 'L1', 'RP', 'L2', 'PF'];

export function reorderRoleKeys(keys, draggedKey, targetKey) {
  const sourceIndex = keys.indexOf(draggedKey);
  const targetIndex = keys.indexOf(targetKey);
  if (sourceIndex < 0 || targetIndex < 0 || draggedKey === targetKey) return keys;

  const reordered = [...keys];
  const [dragged] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, dragged);
  return reordered;
}

export const ROLE_LABELS = {
  C: 'Commentator',
  L1: 'Lector 1',
  RP: 'Reader of Prayer',
  L2: 'Lector 2',
  PF: 'Prayer of the Faithful',
};

export function getMassRoleKeys(mass) {
  const keys = Array.isArray(mass?.roleKeys) ? mass.roleKeys : ROLE_KEYS;
  return [...new Set(keys.filter((key) => ROLE_KEYS.includes(key)))];
}

export const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

export const MONTH_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export const SUNDAY_MASSES = [
  { time: '6:30 AM', language: 'K' },
  { time: '8:00 AM', language: 'E' },
  { time: '10:00 AM', language: 'E' },
  { time: '5:00 PM', language: 'E' },
  { time: '6:30 PM', language: 'E' },
];

export const WEEKDAY_MASS = {
  time: '6:00 AM',
  language: 'K',
  roleKeys: ['C', 'L1', 'RP', 'PF'],
};
export const SATURDAY_REGULAR = { time: '6:00 PM', language: 'E' };
export const SATURDAY_SPECIAL = { time: '6:00 AM', language: 'K' };

export const DAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

let fallbackCount = 0;

export function newId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  fallbackCount += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackCount}`;
}

export function makeMass({
  time = '6:00 AM',
  language = 'K',
  special = false,
  label = '',
  roles = {},
  roleKeys = ROLE_KEYS,
  extraRows = [],
} = {}) {
  return {
    id: newId('mass'),
    time,
    language,
    special,
    label,
    noMass: false,
    roles: { C: '', L1: '', RP: '', L2: '', PF: '', ...roles },
    roleKeys: [...roleKeys],
    extraRows,
  };
}
