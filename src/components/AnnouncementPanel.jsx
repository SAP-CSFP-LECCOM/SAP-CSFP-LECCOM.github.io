import { newId } from '../lib/defaults.js';

export default function AnnouncementPanel({
  announcement,
  birthdays,
  monthShort,
  onChangeAnnouncement,
  onChangeBirthdays,
}) {
  const addBirthday = () => {
    onChangeBirthdays([
      ...birthdays,
      { id: newId('birthday'), date: `${monthShort} `, name: '' },
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
        {birthdays.map((entry) => (
          <div className="birthday-row" key={entry.id}>
            <input
              className="birthday-date"
              value={entry.date}
              onChange={(event) => updateBirthday(entry.id, 'date', event.target.value)}
              aria-label="Birthday date"
            />
            <input
              className="birthday-name"
              value={entry.name}
              onChange={(event) => updateBirthday(entry.id, 'name', event.target.value)}
              aria-label="Birthday celebrant"
            />
            <button
              type="button"
              className="remove-row screen-only"
              onClick={() => removeBirthday(entry.id)}
              aria-label="Remove birthday"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="tiny screen-only" onClick={addBirthday}>
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
