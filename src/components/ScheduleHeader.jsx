import { MONTH_NAMES } from '../lib/defaults.js';

export default function ScheduleHeader({ header, month, year, onChange }) {
  return (
    <section className="schedule-header">
      <img
        className="logo logo-left"
        src={`${import.meta.env.BASE_URL}logos/san-agustin-parish.jpeg`}
        alt="San Agustin Parish logo"
      />
      <div className="header-copy">
        <input
          className="header-line header-archdiocese"
          value={header.archdiocese}
          onChange={(event) => onChange('archdiocese', event.target.value)}
          aria-label="Archdiocese"
        />
        <input
          className="header-line header-ministry"
          value={header.ministry}
          onChange={(event) => onChange('ministry', event.target.value)}
          aria-label="Ministry"
        />
        <input
          className="header-line header-guild"
          value={header.guild}
          onChange={(event) => onChange('guild', event.target.value)}
          aria-label="Guild"
        />
        <input
          className="header-line header-parish"
          value={header.parish}
          onChange={(event) => onChange('parish', event.target.value)}
          aria-label="Parish"
        />
        <input
          className="header-line header-address"
          value={header.address}
          onChange={(event) => onChange('address', event.target.value)}
          aria-label="Parish address"
        />
        <div className="header-month">
          {MONTH_NAMES[month - 1]} {year} SCHEDULE
        </div>
      </div>
      <img
        className="logo logo-right"
        src={`${import.meta.env.BASE_URL}logos/leccom-ministry.jpeg`}
        alt="LECCOM Ministry logo"
      />
    </section>
  );
}
