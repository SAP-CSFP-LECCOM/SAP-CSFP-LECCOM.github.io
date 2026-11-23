import { useMemo, useState } from 'react';
import { buildWeeklyAnalytics } from '../lib/analytics.js';
import { monthName } from '../lib/calendar.js';

export default function AnalyticsPanel({
  year,
  month,
  roster,
  monthData,
  disabledRoster,
  onToggleDisabled,
}) {
  const [open, setOpen] = useState(true);
  const analytics = useMemo(
    () => buildWeeklyAnalytics({ roster, monthData, year, month }),
    [roster, monthData, year, month],
  );
  const disabled = new Set(disabledRoster);

  if (!open) {
    return (
      <button
        type="button"
        className="analytics-reopen no-print"
        onClick={() => setOpen(true)}
      >
        Analytics
      </button>
    );
  }

  return (
    <aside className="analytics no-print" aria-label="Scheduling analytics">
      <div className="analytics-head">
        <div>
          <h2>Analytics</h2>
          <p>
            {monthName(month)} {year} - {analytics.totalAssignments} assignments
          </p>
        </div>
        <button
          type="button"
          className="icon-button analytics-close"
          onClick={() => setOpen(false)}
          aria-label="Hide analytics"
          title="Hide analytics"
        >
          &rsaquo;
        </button>
      </div>

      <p className="analytics-help">
        Uncheck a name to remove it from assignment suggestions.
      </p>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th className="analytics-name-col" scope="col">
                Name
              </th>
              {analytics.weeks.map((week) => (
                <th key={week.label} scope="col" title={week.title}>
                  {week.label}
                </th>
              ))}
              <th className="analytics-total-col" scope="col">
                Total
              </th>
              <th className="analytics-toggle-col" scope="col">
                On
              </th>
            </tr>
          </thead>
          <tbody>
            {analytics.rows.map((row) => {
              const isDisabled = disabled.has(row.name);
              return (
                <tr key={row.name} className={isDisabled ? 'is-disabled' : ''}>
                  <th scope="row">{row.name}</th>
                  {row.counts.map((count, index) => (
                    <td
                      key={analytics.weeks[index].label}
                      className={count ? 'has-count' : ''}
                    >
                      {count || '\u2013'}
                    </td>
                  ))}
                  <td className="analytics-total-col">{row.total || '\u2013'}</td>
                  <td className="analytics-toggle-col">
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={() => onToggleDisabled(row.name)}
                      aria-label={`${isDisabled ? 'Enable' : 'Disable'} ${row.name} for scheduling`}
                      title={
                        isDisabled
                          ? `Enable ${row.name} for scheduling`
                          : `Disable ${row.name} for scheduling`
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Week total</th>
              {analytics.weekTotals.map((total, index) => (
                <td key={analytics.weeks[index].label}>{total}</td>
              ))}
              <td className="analytics-total-col">{analytics.totalAssignments}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </aside>
  );
}
