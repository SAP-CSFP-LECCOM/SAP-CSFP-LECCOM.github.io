import {
  MONTH_NAMES,
  MONTH_SHORT,
  ROLE_KEYS,
  getMassRoleKeys,
} from './defaults.js';
import { formatTime, getMonthGrid } from './calendar.js';
import { formatMemberName } from './roster.js';

const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const FILL_SPECIAL = 'FFFEEDC6';
const FILL_NO_MASS = 'FFFFFF00';
const FILL_REMINDER = 'FFFFF1CC';

const FONT_TITLE = { name: 'Times New Roman', size: 12 };
const FONT_HEADING = { name: 'Verdana', size: 9, bold: true };
const FONT_LABEL = { name: 'Verdana', size: 8, bold: true };
const FONT_BODY = { name: 'Tahoma', size: 8 };
const FONT_DATE = { name: 'Tahoma', size: 9, bold: true };
const FONT_TIME = { name: 'Verdana', size: 9, bold: true, italic: true };

const DAY_COLUMNS = [
  { start: 1, end: 5, lanes: 5 },
  { start: 6, end: 6, lanes: 1 },
  { start: 7, end: 7, lanes: 1 },
  { start: 8, end: 8, lanes: 1 },
  { start: 9, end: 9, lanes: 1 },
  { start: 10, end: 10, lanes: 1 },
  { start: 11, end: 12, lanes: 2 },
];

function columnLetter(index) {
  let value = index;
  let label = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

function rangeRef(top, left, bottom, right) {
  return `${columnLetter(left)}${top}:${columnLetter(right)}${bottom}`;
}

function fillStyle(color) {
  return color ? { type: 'pattern', pattern: 'solid', fgColor: { argb: color } } : undefined;
}

function applyStyle(worksheet, top, left, bottom, right, style = {}) {
  const { font, alignment, fill, border = true } = style;
  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) {
      const cell = worksheet.getCell(row, column);
      if (font) cell.font = font;
      if (alignment) cell.alignment = alignment;
      if (fill) cell.fill = fillStyle(fill);
      if (border) cell.border = BORDER;
    }
  }
}

function mergeCell(worksheet, top, left, bottom, right, value, style = {}) {
  if (top !== bottom || left !== right) {
    worksheet.mergeCells(rangeRef(top, left, bottom, right));
  }
  const cell = worksheet.getCell(top, left);
  cell.value = value ?? '';
  applyStyle(worksheet, top, left, bottom, right, style);
  return cell;
}

function roleValue(key, name, memberGenders) {
  return name ? `${key}- ${formatMemberName(name, memberGenders)}` : `${key}-`;
}

function extraValue(row, memberGenders) {
  if (!row) return '';
  const name = formatMemberName(row.name, memberGenders);
  if (row.label && name) return `${row.label}- ${name}`;
  return name || row.label || '';
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function logoData(logo) {
  if (!logo) return null;
  if (typeof logo === 'string') return logo;
  const bytes = logo instanceof Uint8Array ? logo : new Uint8Array(logo);
  return `data:image/jpeg;base64,${bytesToBase64(bytes)}`;
}

export function buildWorkbook(
  ExcelJS,
  { year, month, monthData, header = {}, logos = {}, memberGenders = {} },
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LECCOM Schedule Builder';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`${MONTH_SHORT[month - 1]} ${year}`);
  worksheet.views = [{ showGridLines: false }];
  worksheet.properties.defaultRowHeight = 12;

  const widths = [18.7, 14, 14, 14, 14, 16, 14, 14, 14, 14, 18.7, 18.7];
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  for (let row = 1; row <= 6; row += 1) worksheet.getRow(row).height = 14.25;
  worksheet.getRow(7).height = 26.25;

  const titleLines = [
    header.archdiocese,
    header.ministry,
    header.guild,
    header.parish,
    header.address,
    `${MONTH_NAMES[month - 1]} ${year} SCHEDULE`,
  ].filter((line) => line !== undefined && line !== null).join('\n');

  mergeCell(worksheet, 1, 1, 7, 7, titleLines, {
    font: FONT_TITLE,
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
  });

  const announcement = monthData.announcement ?? {};
  const birthRows = (monthData.birthdays ?? []).filter((entry) => entry.date || entry.name);
  const birthdayText = birthRows.map((entry) => `${entry.date}  ${entry.name}`.trim()).join('\n');
  const birthdayLineCount = Math.max(1, birthdayText ? birthdayText.split('\n').length : 1);
  const birthdayHeight = Math.max(14.25, Math.min(34, (birthdayLineCount * 11) / 2 + 2));
  worksheet.getRow(5).height = birthdayHeight;
  worksheet.getRow(6).height = birthdayHeight;

  const reminder = announcement.reminder ?? '';
  const reminderLines = reminder
    ? reminder.split('\n').reduce((count, line) => count + Math.max(1, Math.ceil(line.length / 80)), 0)
    : 1;
  worksheet.getRow(7).height = Math.max(26.25, Math.min(90, reminderLines * 11 + 8));

  mergeCell(worksheet, 1, 8, 1, 12, 'ANNOUNCEMENT', {
    font: FONT_HEADING,
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
  });
  mergeCell(worksheet, 2, 8, 2, 12, `LECCOM MONTHLY MEETING: ${announcement.meetingDate ?? ''}`, {
    font: FONT_LABEL,
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
  });
  mergeCell(
    worksheet,
    3,
    8,
    3,
    12,
    `MASS: ${announcement.massTime ?? ''}        MEETING: ${announcement.meetingTime ?? ''}`,
    {
      font: FONT_LABEL,
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    },
  );
  mergeCell(worksheet, 4, 8, 4, 12, 'BIRTHDAY CELEBRANT(S):', {
    font: FONT_LABEL,
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
  });
  mergeCell(worksheet, 5, 8, 6, 12, birthdayText, {
    font: FONT_BODY,
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
  });
  mergeCell(worksheet, 7, 8, 7, 12, reminder, {
    font: { ...FONT_BODY, bold: true },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    fill: FILL_REMINDER,
  });
  applyStyle(worksheet, 1, 8, 7, 12);

  const headerStyle = {
    font: { ...FONT_HEADING, size: 10 },
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
  };
  mergeCell(worksheet, 8, 1, 8, 5, 'SUNDAY', headerStyle);
  mergeCell(worksheet, 8, 6, 8, 6, 'MONDAY', headerStyle);
  mergeCell(worksheet, 8, 7, 8, 7, 'TUESDAY', headerStyle);
  mergeCell(worksheet, 8, 8, 8, 8, 'WEDNESDAY', headerStyle);
  mergeCell(worksheet, 8, 9, 8, 9, 'THURSDAY', headerStyle);
  mergeCell(worksheet, 8, 10, 8, 10, 'FRIDAY', headerStyle);
  mergeCell(worksheet, 8, 11, 8, 12, 'SATURDAY', headerStyle);

  const weeks = getMonthGrid(year, month);
  let row = 9;

  const logoLeft = logoData(logos.left);
  if (logoLeft) {
    const imageId = workbook.addImage({ base64: logoLeft, extension: 'jpeg' });
    worksheet.addImage(imageId, {
      tl: { col: 0.35, row: 1.05 },
      ext: { width: 84, height: 76 },
    });
  }
  const logoRight = logoData(logos.right);
  if (logoRight) {
    const imageId = workbook.addImage({ base64: logoRight, extension: 'jpeg' });
    worksheet.addImage(imageId, {
      tl: { col: 4.85, row: 0.2 },
      ext: { width: 86, height: 72 },
    });
  }

  for (const week of weeks) {
    const entries = week.map((date) => {
      if (!date) return null;
      const dayData = monthData.days?.[date.iso];
      const masses = Array.isArray(dayData?.masses) ? dayData.masses : [];
      return {
        date,
        masses,
        noMass: !dayData || dayData.noMass || masses.length === 0,
      };
    });

    const dateRow = row;
    for (let index = 0; index < 7; index += 1) {
      const spec = DAY_COLUMNS[index];
      const entry = entries[index];
      mergeCell(worksheet, dateRow, spec.start, dateRow, spec.end, entry ? entry.date.day : '', {
        font: FONT_DATE,
        alignment: { horizontal: 'left', vertical: 'top' },
      });
    }
    worksheet.getRow(dateRow).height = 12;
    row += 1;

    const blockCounts = entries.map((entry, index) => {
      if (!entry || entry.noMass) return 1;
      const spec = DAY_COLUMNS[index];
      return Math.max(1, Math.ceil(entry.masses.length / spec.lanes));
    });
    const weekBlocks = Math.max(...blockCounts);

    for (let block = 0; block < weekBlocks; block += 1) {
      const blockMasses = entries.map((entry, index) => {
        if (!entry || entry.noMass) return [];
        const spec = DAY_COLUMNS[index];
        if (spec.lanes > 1) {
          return entry.masses.slice(block * spec.lanes, (block + 1) * spec.lanes);
        }
        return entry.masses[block] ? [entry.masses[block]] : [];
      });

      const flatMasses = blockMasses.flat();
      const weekRoleKeys = ROLE_KEYS.filter((key) =>
        flatMasses.some((mass) => getMassRoleKeys(mass).includes(key)),
      );
      const extraCount = Math.max(
        0,
        ...flatMasses.map((mass) => mass.extraRows?.length ?? 0),
      );
      const roleCount = Math.max(1, weekRoleKeys.length + extraCount);

      const timeRow = row;
      for (let index = 0; index < 7; index += 1) {
        const spec = DAY_COLUMNS[index];
        const entry = entries[index];

        if (!entry || entry.noMass) {
          const value = block === 0 && entry?.noMass ? 'NO MASS' : '';
          mergeCell(worksheet, timeRow, spec.start, timeRow + roleCount - 1, spec.end, value, {
            font: { ...FONT_BODY, bold: Boolean(value) },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            fill: value ? FILL_NO_MASS : undefined,
          });
          continue;
        }

        if (spec.lanes > 1) {
          for (let lane = 0; lane < spec.lanes; lane += 1) {
            const mass = blockMasses[index][lane];
            const column = spec.start + lane;
            for (let offset = 0; offset < roleCount; offset += 1) {
              applyStyle(worksheet, timeRow + 1 + offset, column, timeRow + 1 + offset, column, {
                fill: mass?.special ? FILL_SPECIAL : undefined,
              });
            }
            if (mass) {
              mergeCell(
                worksheet,
                timeRow,
                column,
                timeRow,
                column,
                formatTime(mass.time, mass.language),
                {
                  font: FONT_TIME,
                  alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
                  fill: mass.special ? FILL_SPECIAL : undefined,
                },
              );
            } else {
              applyStyle(worksheet, timeRow, column, timeRow, column, {});
            }
          }
        } else {
          const mass = blockMasses[index][0];
          for (let offset = 0; offset < roleCount; offset += 1) {
            applyStyle(worksheet, timeRow + 1 + offset, spec.start, timeRow + 1 + offset, spec.end, {
              fill: mass?.special ? FILL_SPECIAL : undefined,
            });
          }
          mergeCell(
            worksheet,
            timeRow,
            spec.start,
            timeRow,
            spec.end,
            mass ? formatTime(mass.time, mass.language) : '',
            {
              font: FONT_TIME,
              alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
              fill: mass?.special ? FILL_SPECIAL : undefined,
            },
          );
        }
      }
      worksheet.getRow(timeRow).height = 12;

      for (let roleIndex = 0; roleIndex < roleCount; roleIndex += 1) {
        const roleRow = timeRow + 1 + roleIndex;
        for (let index = 0; index < 7; index += 1) {
          const spec = DAY_COLUMNS[index];
          const entry = entries[index];
          if (!entry || entry.noMass) continue;

          if (spec.lanes > 1) {
            for (let lane = 0; lane < spec.lanes; lane += 1) {
              const mass = blockMasses[index][lane];
              const column = spec.start + lane;
              let value = '';
              if (mass) {
                if (roleIndex < weekRoleKeys.length) {
                  const key = weekRoleKeys[roleIndex];
                  if (getMassRoleKeys(mass).includes(key)) {
                    value = roleValue(key, mass.roles?.[key], memberGenders);
                  }
                } else {
                  value = extraValue(
                    mass.extraRows?.[roleIndex - weekRoleKeys.length],
                    memberGenders,
                  );
                }
              }
              mergeCell(worksheet, roleRow, column, roleRow, column, value, {
                font: FONT_BODY,
                alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
                fill: mass?.special ? FILL_SPECIAL : undefined,
              });
            }
          } else {
            const mass = blockMasses[index][0];
            let value = '';
            if (mass) {
              if (roleIndex < weekRoleKeys.length) {
                const key = weekRoleKeys[roleIndex];
                if (getMassRoleKeys(mass).includes(key)) {
                  value = roleValue(key, mass.roles?.[key], memberGenders);
                }
              } else {
                value = extraValue(
                  mass.extraRows?.[roleIndex - weekRoleKeys.length],
                  memberGenders,
                );
              }
            }
            mergeCell(worksheet, roleRow, spec.start, roleRow, spec.end, value, {
              font: FONT_BODY,
              alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
              fill: mass?.special ? FILL_SPECIAL : undefined,
            });
          }
        }
        worksheet.getRow(roleRow).height = 12;
      }

      row = timeRow + roleCount + 1;
    }
  }

  mergeCell(worksheet, row, 1, row, 12, 'FEAST DAYS / SPECIAL CELEBRATIONS', {
    font: FONT_HEADING,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  });
  worksheet.getRow(row).height = 16;
  row += 1;

  const feastDays = monthData.feastDays ?? [];
  if (feastDays.length === 0) {
    mergeCell(worksheet, row, 1, row, 12, '', {});
    worksheet.getRow(row).height = 12;
    row += 1;
  } else {
    for (const feast of feastDays) {
      mergeCell(worksheet, row, 1, row, 3, feast.date, {
        font: FONT_BODY,
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
      });
      mergeCell(worksheet, row, 4, row, 12, feast.title, {
        font: FONT_BODY,
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
      });
      worksheet.getRow(row).height = 12;
      row += 1;
    }
  }

  mergeCell(worksheet, row, 1, row, 3, 'Prepared by:', {
    font: FONT_LABEL,
    alignment: { horizontal: 'left', vertical: 'top' },
  });
  mergeCell(worksheet, row, 4, row, 12, 'Reviewed by:', {
    font: FONT_LABEL,
    alignment: { horizontal: 'left', vertical: 'top' },
  });
  worksheet.getRow(row).height = 12;
  row += 1;

  mergeCell(worksheet, row, 1, row, 3, monthData.preparedBy ?? '', {
    font: FONT_BODY,
    alignment: { horizontal: 'left', vertical: 'top' },
  });
  mergeCell(worksheet, row, 4, row, 12, monthData.reviewedBy ?? '', {
    font: FONT_BODY,
    alignment: { horizontal: 'left', vertical: 'top' },
  });
  worksheet.getRow(row).height = 12;

  worksheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 },
    printArea: `A1:L${row}`,
  };

  return workbook;
}

export async function downloadXlsx({
  year,
  month,
  monthData,
  header,
  logos,
  memberGenders,
}) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const workbook = buildWorkbook(ExcelJS, {
    year,
    month,
    monthData,
    header,
    logos,
    memberGenders,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `LECCOM_Schedule_${year}-${String(month).padStart(2, '0')}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
