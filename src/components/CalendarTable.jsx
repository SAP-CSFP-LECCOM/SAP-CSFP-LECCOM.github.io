import { useMemo } from 'react';
import { DAY_NAMES } from '../lib/defaults.js';
import { getMonthGrid, monthName, weekdayName } from '../lib/calendar.js';
import DayCell from './DayCell.jsx';

export default function CalendarTable({
  year,
  month,
  monthData,
  memberGenders,
  onChangeDay,
  rosterId,
}) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  return (
    <table className="calendar" aria-label={`${monthName(month)} ${year} mass schedule`}>
      <thead>
        <tr>
          {DAY_NAMES.map((name) => (
            <th key={name} scope="col" className={`weekday-header weekday-${DAY_NAMES.indexOf(name)}`}>
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, weekIndex) => (
          <tr key={week.map((date) => date?.iso ?? 'blank').join('-') || weekIndex}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return <td key={`blank-${weekIndex}-${dayIndex}`} className="blank-cell" />;
              }
              const day = monthData.days[date.iso];
              if (!day) {
                return <td key={date.iso} className="blank-cell" />;
              }
              return (
                <DayCell
                  key={date.iso}
                  date={date}
                  day={day}
                  dayLabel={`${weekdayName(date.weekday)}, ${monthName(month)} ${date.day}`}
                  memberGenders={memberGenders}
                  onChange={(updater) => onChangeDay(date.iso, updater)}
                  rosterId={rosterId}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
