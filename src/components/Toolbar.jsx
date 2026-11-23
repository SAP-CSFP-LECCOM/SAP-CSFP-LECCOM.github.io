import { useEffect, useState } from 'react';
import { MONTH_NAMES } from '../lib/defaults.js';

function titleCase(value) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function Toolbar({
  year,
  month,
  saved,
  busy,
  onYearMonth,
  onPrev,
  onNext,
  onRoster,
  onExportJson,
  onImportJson,
  onExportXlsx,
  onPrint,
  onReset,
}) {
  const [yearText, setYearText] = useState(String(year));

  useEffect(() => {
    setYearText(String(year));
  }, [year]);

  const commitYear = () => {
    const next = Number(yearText);
    if (Number.isInteger(next) && next >= 1900 && next <= 2100) {
      onYearMonth(next, month);
    } else {
      setYearText(String(year));
    }
  };

  return (
    <header className="toolbar no-print">
      <div className="brand">
        <strong>LECCOM</strong>
        <span>Schedule Builder</span>
      </div>

      <div className="month-picker">
        <button type="button" className="icon-button" onClick={onPrev} aria-label="Previous month">
          ‹
        </button>
        <select
          value={month}
          onChange={(event) => onYearMonth(year, Number(event.target.value))}
          aria-label="Month"
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index + 1}>
              {titleCase(name)}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="numeric"
          value={yearText}
          onChange={(event) => setYearText(event.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={commitYear}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          aria-label="Year"
        />
        <button type="button" className="icon-button" onClick={onNext} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="toolbar-actions">
        <button type="button" onClick={onRoster}>
          Members
        </button>
        <button type="button" onClick={onExportJson}>
          Export JSON
        </button>
        <button type="button" onClick={onImportJson}>
          Import JSON
        </button>
        <button type="button" onClick={onExportXlsx} disabled={busy}>
          {busy ? 'Building…' : 'Export .xlsx'}
        </button>
        <button type="button" className="primary" onClick={onPrint}>
          Print / PDF
        </button>
        <button type="button" className="danger" onClick={onReset}>
          Reset Month
        </button>
      </div>

      <span className={`save-status ${saved ? 'is-saved' : ''}`} role="status" aria-live="polite">
        {saved ? 'Saved' : 'Saving…'}
      </span>
    </header>
  );
}
