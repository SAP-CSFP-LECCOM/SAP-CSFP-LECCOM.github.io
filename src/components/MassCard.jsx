import {
  ROLE_KEYS,
  ROLE_LABELS,
  getMassRoleKeys,
  newId,
  reorderRoleKeys,
} from '../lib/defaults.js';
import { formatTime, normalizeTime, toTimeInputValue } from '../lib/calendar.js';
import { formatMemberName, normalizeMemberName } from '../lib/roster.js';

export default function MassCard({
  mass,
  allowNoMass = false,
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
    onPatch({ roleKeys: [...roleKeys, key] });
  };

  const reorderRole = (draggedKey, targetKey) => {
    const reordered = reorderRoleKeys(roleKeys, draggedKey, targetKey);
    if (reordered !== roleKeys) onPatch({ roleKeys: reordered });
  };

  const moveRoleBy = (key, offset) => {
    const from = roleKeys.indexOf(key);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= roleKeys.length) return;
    const reordered = [...roleKeys];
    reordered.splice(to, 0, reordered.splice(from, 1)[0]);
    onPatch({ roleKeys: reordered });
  };

  const removeExtraRow = (id) => {
    onPatch({ extraRows: mass.extraRows.filter((row) => row.id !== id) });
  };

  const timeLabel = formatTime(mass.time, mass.language);

  if (mass.noMass) {
    return (
      <article className="mass-card mass-no-mass">
        <button
          type="button"
          className="no-mass mass-card-no-mass"
          onClick={() => onPatch({ noMass: false })}
          title="Restore this mass"
          aria-label={`Restore ${dayLabel}, ${timeLabel}`}
        >
          <span>NO MASS</span>
          <span className="no-mass-hint screen-only">click to restore</span>
        </button>
      </article>
    );
  }

  return (
    <article className={`mass-card ${mass.special ? 'mass-special' : ''}`}>
      <div className="mass-head">
        <div className="mass-time-language">
          <input
            className="mass-time screen-only"
            type="time"
            value={toTimeInputValue(mass.time)}
            onChange={(event) =>
              onPatch({ time: normalizeTime(event.target.value) ?? event.target.value })
            }
            aria-label={`Mass time, ${dayLabel}`}
          />
          <span className="mass-time print-only">{mass.time}</span>
          <span className="mass-language">(</span>
          <label className="mass-language-picker">
            <span className="mass-language-code">{mass.language}</span>
            <select
              className="mass-language-select screen-only"
              value={mass.language}
              onChange={(event) => onPatch({ language: event.target.value })}
              aria-label={`Language for ${dayLabel}, ${mass.time}`}
            >
              <option value="E">English</option>
              <option value="K">Kapampangan</option>
              {mass.language !== 'E' && mass.language !== 'K' && (
                <option value={mass.language}>{mass.language} (saved)</option>
              )}
            </select>
          </label>
          <span className="mass-language">)</span>
        </div>
        <label className="special-toggle screen-only">
          <input
            type="checkbox"
            checked={mass.special}
            onChange={(event) => onPatch({ special: event.target.checked })}
          />
          Special
        </label>
        {allowNoMass && (
          <button
            type="button"
            className="tiny mass-no-mass-toggle screen-only"
            onClick={() => onPatch({ noMass: true })}
            title="Set this mass to NO MASS"
            aria-label={`Set ${dayLabel}, ${timeLabel} to no mass`}
          >
            ⊘
          </button>
        )}
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
        <div
          className="role-line"
          key={key}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            reorderRole(event.dataTransfer.getData('text/plain'), key);
          }}
        >
          <button
            type="button"
            className="role-drag-handle screen-only"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', key);
              event.dataTransfer.effectAllowed = 'move';
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                moveRoleBy(key, -1);
              } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                moveRoleBy(key, 1);
              }
            }}
            aria-label={`Reorder ${ROLE_LABELS[key]}`}
            title="Drag to reorder; use arrow keys when focused"
          >
            ⋮⋮
          </button>
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
