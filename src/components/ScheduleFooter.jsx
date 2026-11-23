export default function ScheduleFooter({ preparedBy, reviewedBy, onChange }) {
  return (
    <footer className="schedule-footer">
      <div className="footer-field">
        <label>Prepared by:</label>
        <input
          value={preparedBy}
          onChange={(event) => onChange('preparedBy', event.target.value)}
          aria-label="Prepared by"
        />
      </div>
      <div className="footer-field">
        <label>Reviewed by:</label>
        <input
          value={reviewedBy}
          onChange={(event) => onChange('reviewedBy', event.target.value)}
          aria-label="Reviewed by"
        />
      </div>
    </footer>
  );
}
