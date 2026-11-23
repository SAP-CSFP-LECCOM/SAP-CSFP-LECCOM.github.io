import { daysInMonth } from '../lib/calendar.js';
import { newId } from '../lib/defaults.js';
import { formatMemberName, normalizeMemberName } from '../lib/roster.js';

export default function AnnouncementPanel({
  announcement,
  birthdays,
  monthShort,
  year,
  month,
  roster,
  memberGenders,
  onChangeAnnouncement,
  onChangeBirthdays,
}) {
  const addBirthday = () => {
    onChangeBirthdays([
      ...birthdays,
      { id: newId('birthday'), date: '', name: '' },
    ]);
  };

  const updateBirthday = (id, field, value) => {
    onChangeBirthdays(
      birthdays.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    );
  };

  const removeBirthday = (id) => {
    onChangeBirthdays(birthdays.filter((entry) => entry.id !== id));
  };

  const birthdayColumns = [birthdays.slice(0, 4), birthdays.slice(4)];
  const monthDays = daysInMonth(year, month);

  return (
    <section className="announcement">
      <h2>ANNOUNCEMENT</h2>
      <div className="announcement-row">
        <span>LECCOM MONTHLY MEETING:</span>
        <input
          value={announcement.meetingDate}
          onChange={(event) => onChangeAnnouncement('meetingDate', event.target.value)}
          aria-label="Monthly meeting date"
        />
      </div>
      <div className="announcement-row announce-times">
        <span>MASS:</span>
        <input
          value={announcement.massTime}
          onChange={(event) => onChangeAnnouncement('massTime', event.target.value)}
          aria-label="Mass time"
        />
        <span>MEETING:</span>
        <input
          value={announcement.meetingTime}
          onChange={(event) => onChangeAnnouncement('meetingTime', event.target.value)}
          aria-label="Meeting time"
        />
      </div>
      <div className="announcement-label">BIRTHDAY CELEBRANT(S):</div>
      <div className="birthday-list">
        {birthdayColumns.map((column, columnIndex) => (
          <div className="birthday-column" key={columnIndex}>
            {column.map((entry) => {
              const dayMatch = String(entry.date ?? '').match(/(?:^|\D)(\d{1,2})\s*$/);
              const parsedDay = Number(dayMatch?.[1]);
              const day = parsedDay >= 1 && parsedDay <= 31 ? String(parsedDay) : '';
              const birthdayName = formatMemberName(entry.name, memberGenders);
              const normalizedName = normalizeMemberName(entry.name, memberGenders);
              const memberExists = roster.some(
                (name) => name.toLowerCase() === normalizedName.toLowerCase(),
              );

              return (
                <div className="birthday-row" key={entry.id}>
                  <select
                    className="birthday-date"
                    value={day}
                    onChange={(event) =>
                      updateBirthday(
                        entry.id,
                        'date',
                        event.target.value
                          ? `${monthShort} ${event.target.value}`
                          : '',
                      )
                    }
                    aria-label="Birthday day"
                  >
                    <option value="">Day</option>
                    {day && Number(day) > monthDays && (
                      <option value={day}>{day}</option>
                    )}
                    {Array.from({ length: monthDays }, (_, index) => index + 1).map(
                      (date) => (
                        <option key={date} value={date}>
                          {date}
                        </option>
                      ),
                    )}
                  </select>
                  <select
                    className="birthday-name"
                    value={birthdayName}
                    onChange={(event) =>
                      updateBirthday(
                        entry.id,
                        'name',
                        normalizeMemberName(event.target.value, memberGenders),
                      )
                    }
                    aria-label="Birthday celebrant"
                  >
                    <option value="">Select member</option>
                    {birthdayName && !memberExists && (
                      <option value={birthdayName}>{birthdayName}</option>
                    )}
                    {roster.map((name) => {
                      const formattedName = formatMemberName(name, memberGenders);
                      return (
                        <option key={name} value={formattedName}>
                          {formattedName}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    className="remove-row screen-only"
                    onClick={() => removeBirthday(entry.id)}
                    aria-label="Remove birthday"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="tiny screen-only"
        onClick={addBirthday}
        disabled={birthdays.length >= 8}
      >
        + Birthday
      </button>
      <textarea
        className="announcement-reminder"
        value={announcement.reminder}
        onChange={(event) => onChangeAnnouncement('reminder', event.target.value)}
        placeholder="Monthly reminder, attire, or special announcement"
        aria-label="Monthly reminder or announcement"
        rows={3}
      />
    </section>
  );
}
