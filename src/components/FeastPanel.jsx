import { newId } from '../lib/defaults.js';

export default function FeastPanel({ feasts, monthShort, onChange }) {
  const updateFeast = (id, field, value) => {
    onChange(feasts.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
  };

  const addFeast = () => {
    onChange([...feasts, { id: newId('feast'), date: `${monthShort} 1`, title: '' }]);
  };

  const removeFeast = (id) => {
    onChange(feasts.filter((entry) => entry.id !== id));
  };

  return (
    <section className="feast-panel">
      <h2>FEAST DAYS / SPECIAL CELEBRATIONS</h2>
      {feasts.length === 0 && (
        <p className="empty-note screen-only">
          No feast days or celebrations added for this month.
        </p>
      )}
      <ul className="feast-list">
        {feasts.map((feast) => (
          <li className="feast-row" key={feast.id}>
            <input
              className="feast-date"
              value={feast.date}
              onChange={(event) => updateFeast(feast.id, 'date', event.target.value)}
              aria-label="Feast day date"
            />
            <span className="feast-dash">-</span>
            <input
              className="feast-title"
              value={feast.title}
              onChange={(event) => updateFeast(feast.id, 'title', event.target.value)}
              placeholder="Feast day or liturgical celebration"
              aria-label="Feast day or liturgical celebration"
            />
            <button
              type="button"
              className="remove-row screen-only"
              onClick={() => removeFeast(feast.id)}
              aria-label="Remove feast day"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="tiny screen-only" onClick={addFeast}>
        + Feast day
      </button>
    </section>
  );
}
