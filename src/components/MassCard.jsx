import {
  ROLE_KEYS,
  ROLE_LABELS,
  getMassRoleKeys,
  newId,
} from '../lib/defaults.js';
import { formatTime, normalizeTime } from '../lib/calendar.js';
import { formatMemberName, normalizeMemberName } from '../lib/roster.js';

export default function MassCard({
  mass,
  dayLabel,
  memberGenders = {},
  rosterId,
  onPatch,
  onRemove,
}) {
  const patchRoles = (key, value) => {
    onPatch({
      roles: {
        ...mass.roles,
        [key]: normalizeMemberName(value, memberGenders),
      },
    });
  };

  const patchExtra = (id, field, value) => {
    onPatch({
      extraRows: mass.extraRows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === 'name'
                  ? normalizeMemberName(value, memberGenders)
                  : value,
            }
          : row,
      ),
    });
  };

  const addExtraRow = () => {
    onPatch({
      extraRows: [
        ...mass.extraRows,
        { id: newId('row'), label: '', name: '' },
      ],
    });
  };

  const roleKeys = getMassRoleKeys(mass);
  const removedRoleKeys = ROLE_KEYS.filter((key) => !roleKeys.includes(key));

  const removeRole = (key) => {
    onPatch({ roleKeys: roleKeys.filter((roleKey) => roleKey !== key) });
  };

  const addRole = (key) => {
    onPatch({
      roleKeys: ROLE_KEYS.filter(
        (roleKey) => roleKeys.includes(roleKey) || roleKey === key,
      ),
    });
  };

  const removeExtraRow = (id) => {
    onPatch({ extraRows: mass.extraRows.filter((row) => row.id !== id) });
  };

  const commitTime = () => {
    const normalized = normalizeTime(mass.time);
    if (normalized && normalized !== mass.time) onPatch({ time: normalized });
  };

  const timeLabel = formatTime(mass.time, mass.language);

  return (
    <article className={`mass-card ${mass.special ? 'mass-special' : ''}`}>
      <div className="mass-head">
        <input
          className="mass-time"
          value={mass.time}
          onChange={(event) => onPatch({ time: event.target.value })}
          onBlur={commitTime}
          aria-label={`Mass time, ${dayLabel}`}
        />
        <span className="mass-language">(</span>
        <input
          className="mass-language-input"
          value={mass.language}
          maxLength={1}
          onChange={(event) =>
            onPatch({ language: event.target.value.toUpperCase().slice(0, 1) })
          }
          aria-label={`Language, ${dayLabel}, ${mass.time}`}
        />
        <span className="mass-language">)</span>
        <label className="special-toggle screen-only">
          <input
            type="checkbox"
            checked={mass.special}
            onChange={(event) => onPatch({ special: event.target.checked })}
          />
          Special
        </label>
        <button
          type="button"
          className="remove-row screen-only"
          onClick={onRemove}
          aria-label={`Remove mass at ${timeLabel}, ${dayLabel}`}
        >
          ×
        </button>
      </div>

      {(mass.special || mass.label) && (
        <input
          className="mass-label"
          value={mass.label}
          onChange={(event) => onPatch({ label: event.target.value })}
          placeholder="Special mass label"
          aria-label={`Special mass label, ${dayLabel}, ${timeLabel}`}
        />
      )}

      {roleKeys.map((key) => (
        <div className="role-line" key={key}>
          <span className="role-label">{key}-</span>
          <input
            className="role-name"
            list={rosterId}
            value={formatMemberName(mass.roles[key] ?? '', memberGenders)}
            onChange={(event) => patchRoles(key, event.target.value)}
            aria-label={`${ROLE_LABELS[key]}, ${dayLabel}, ${timeLabel}`}
          />
          <button
            type="button"
            className="remove-row role-remove screen-only"
            onClick={() => removeRole(key)}
            title={`Remove ${ROLE_LABELS[key]} for this mass`}
            aria-label={`Remove ${ROLE_LABELS[key]} for ${dayLabel}, ${timeLabel}`}
          >
            ×
          </button>
        </div>
      ))}

      {removedRoleKeys.length > 0 && (
        <div className="removed-roles screen-only">
          <span>Removed:</span>
          {removedRoleKeys.map((key) => (
            <button
              type="button"
              className="tiny"
              key={key}
              onClick={() => addRole(key)}
              title={`Restore ${ROLE_LABELS[key]}`}
            >
              + {key}
            </button>
          ))}
        </div>
      )}

      {mass.extraRows.map((row) => (
        <div className="role-line extra-role-line" key={row.id}>
          <input
            className="extra-label"
            value={row.label}
            onChange={(event) => patchExtra(row.id, 'label', event.target.value)}
            placeholder="Role"
            aria-label={`Extra role label, ${dayLabel}, ${timeLabel}`}
          />
          <span className="role-label">-</span>
          <input
            className="role-name"
            list={rosterId}
            value={formatMemberName(row.name, memberGenders)}
            onChange={(event) => patchExtra(row.id, 'name', event.target.value)}
            aria-label={`Extra role name, ${dayLabel}, ${timeLabel}`}
          />
          <button
            type="button"
            className="remove-row screen-only"
            onClick={() => removeExtraRow(row.id)}
            aria-label="Remove extra role"
          >
            ×
          </button>
        </div>
      ))}

      <button type="button" className="tiny add-row screen-only" onClick={addExtraRow}>
        + Role
      </button>
    </article>
  );
}
