import {
  DAY_NAMES,
  MONTH_NAMES,
  MONTH_SHORT,
  SATURDAY_REGULAR,
  SATURDAY_SPECIAL,
  SUNDAY_MASSES,
  WEEKDAY_MASS,
  makeMass,
} from './defaults.js';

export function pad2(value) {
  return String(value).padStart(2, '0');
}

export function isoDate(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function monthKey(year, month) {
  return `${year}-${pad2(month)}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function getWeekday(year, month, day) {
  return new Date(year, month - 1, day).getDay();
}

export function monthName(month) {
  return MONTH_NAMES[month - 1] ?? '';
}

export function monthShort(month) {
  return MONTH_SHORT[month - 1] ?? '';
}

export function weekdayName(day) {
  return DAY_NAMES[day] ?? '';
}

export function getMonthGrid(year, month) {
  const total = daysInMonth(year, month);
  const leading = getWeekday(year, month, 1);
  const cells = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= total; day += 1) {
    cells.push({
      day,
      iso: isoDate(year, month, day),
      weekday: getWeekday(year, month, day),
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function createDefaultDay(year, month, day) {
  const weekday = getWeekday(year, month, day);
  const iso = isoDate(year, month, day);

  if (weekday === 0) {
    return {
      iso,
      noMass: false,
      masses: SUNDAY_MASSES.map((preset) =>
        makeMass({ time: preset.time, language: preset.language }),
      ),
    };
  }

  if (weekday === 1) {
    return { iso, noMass: true, masses: [] };
  }

  if (weekday === 6) {
    const masses = [makeMass({ ...SATURDAY_REGULAR })];
    if (day <= 7) {
      masses.unshift(
        makeMass({ ...SATURDAY_SPECIAL, special: true, label: 'First Saturday' }),
      );
    }
    return { iso, noMass: false, masses };
  }

  return {
    iso,
    noMass: false,
    masses: [makeMass({ ...WEEKDAY_MASS })],
  };
}

export function addMassToDay(day, mass, date) {
  const masses = date.weekday === 6 ? [mass, ...day.masses] : [...day.masses, mass];
  return { ...day, noMass: false, masses };
}

export function createDefaultMonth(year, month) {
  const days = {};
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day += 1) {
    const dayData = createDefaultDay(year, month, day);
    days[dayData.iso] = dayData;
  }

  return {
    days,
    feastDays: [],
    announcement: {
      meetingDate: '',
      massTime: '',
      meetingTime: '',
      reminder: '',
    },
    birthdays: [],
    preparedBy: '',
    reviewedBy: '',
  };
}

export function normalizeTime(raw) {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ');
  const match = value.match(/^(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)?$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minutes = match[2] ?? '00';
  const meridiem = match[3];

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    return `${hour}:${minutes} ${meridiem}`;
  }

  if (hour > 23) return null;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

export function formatTime(time, language) {
  const value = String(time ?? '').trim();
  const lang = String(language ?? '').trim();
  return lang ? `${value} (${lang})` : value;
}

export function toTimeInputValue(time) {
  const normalized = normalizeTime(String(time ?? ''));
  if (!normalized) return '';
  const [clock, meridiem] = normalized.split(' ');
  let [hour, minutes] = clock.split(':').map(Number);
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function feastDayNumber(text) {
  const match = String(text ?? '').match(/(\d{1,2})/);
  return match ? Number(match[1]) : 99;
}
