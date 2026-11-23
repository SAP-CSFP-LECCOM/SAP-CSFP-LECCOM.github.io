import { makeMass } from '../lib/defaults.js';
import { addMassToDay } from '../lib/calendar.js';
import MassCard from './MassCard.jsx';

export default function DayCell({
  date,
  day,
  dayLabel,
  memberGenders,
  onChange,
  rosterId,
}) {
  const isNoMass = day.noMass || day.masses.length === 0;

  const patchDay = (updater) => onChange(updater);

  const patchMass = (id, patch) => {
    patchDay((current) => ({
      ...current,
      masses: current.masses.map((mass) =>
        mass.id === id
          ? { ...mass, ...(typeof patch === 'function' ? patch(mass) : patch) }
          : mass,
      ),
    }));
  };

  const removeMass = (id) => {
    patchDay((current) => ({
      ...current,
      masses: current.masses.filter((mass) => mass.id !== id),
    }));
  };

  const addMass = (special = false) => {
    const mass = makeMass({
      time: '6:00 AM',
      language: 'K',
      special,
      label: special ? 'Special Mass' : '',
    });
    patchDay((current) => addMassToDay(current, mass, date));
  };

  const toggleNoMass = () => {
    patchDay((current) => {
      const empty = current.noMass || current.masses.length === 0;
      if (empty) {
        return {
          ...current,
          noMass: false,
          masses:
            current.masses.length > 0
              ? current.masses
              : [makeMass({ time: '6:00 AM', language: 'K' })],
        };
      }
      return { ...current, noMass: true };
    });
  };

  const layoutClass =
    date.weekday === 0
      ? 'masses-sunday'
      : date.weekday === 6
        ? 'masses-saturday'
        : 'masses-weekday';

  return (
    <td
      className={`day-cell weekday-${date.weekday} ${isNoMass ? 'day-no-mass' : ''} ${
        date.weekday === 0 && !isNoMass ? 'has-masses' : ''
      }`}
    >
      <div className="day-top">
        <span className="day-date">{date.day}</span>
        <div className="day-tools screen-only">
          {!isNoMass && date.weekday !== 0 && (
            <button
              type="button"
              className="tiny"
              onClick={toggleNoMass}
              title="Set this date to NO MASS"
            >
              <span aria-hidden="true">⊘</span>
              <span className="tiny-text"> NO MASS</span>
            </button>
          )}
          <button
            type="button"
            className="tiny"
            onClick={() => addMass(false)}
            title="Add a mass"
            aria-label="Add a mass"
          >
            <span aria-hidden="true">+</span>
            <span className="tiny-text"> Mass</span>
          </button>
          <button
            type="button"
            className="tiny"
            onClick={() => addMass(true)}
            title="Add a special mass"
            aria-label="Add a special mass"
          >
            <span aria-hidden="true">✦</span>
            <span className="tiny-text"> Special</span>
          </button>
        </div>
      </div>

      {isNoMass ? (
        <button
          type="button"
          className="no-mass"
          onClick={toggleNoMass}
          title="Restore the usual masses for this date"
        >
          <span>NO MASS</span>
          <span className="no-mass-hint screen-only">click to restore</span>
        </button>
      ) : (
        <div
          className={`masses ${layoutClass} ${
            date.weekday === 0 && day.masses.length > 5 ? 'has-extra-row' : ''
          }`}
        >
          {day.masses.map((mass) => (
            <MassCard
              key={mass.id}
              mass={mass}
              allowNoMass={date.weekday === 0}
              dayLabel={dayLabel}
              memberGenders={memberGenders}
              rosterId={rosterId}
              onPatch={(patch) => patchMass(mass.id, patch)}
              onRemove={() => removeMass(mass.id)}
            />
          ))}
        </div>
      )}
    </td>
  );
}
