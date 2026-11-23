import { useEffect, useRef, useState } from 'react';
import { ROSTER } from '../lib/defaults.js';
import {
  addRosterNames,
  cleanName,
  normalizeMemberGenders,
  normalizeRoster,
} from '../lib/roster.js';

export default function RosterDialog({
  open,
  roster,
  memberGenders,
  onClose,
  onSave,
}) {
  const dialogRef = useRef(null);
  const [draft, setDraft] = useState([]);
  const [newName, setNewName] = useState('');
  const [bulk, setBulk] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(
        roster.map((name) => ({ name, gender: memberGenders[name] ?? '' })),
      );
      setNewName('');
      setBulk('');
      setFeedback('');
      if (!dialogRef.current.open) dialogRef.current.showModal();
    } else if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [open, roster, memberGenders]);

  const addNames = (text) => {
    const currentNames = normalizeRoster(draft.map((member) => member.name));
    const nextNames = addRosterNames(currentNames, text);
    if (nextNames.length === currentNames.length) return false;

    const existing = new Map(
      draft.map((member) => [cleanName(member.name).toLowerCase(), member]),
    );
    setDraft(
      nextNames.map(
        (name) => existing.get(name.toLowerCase()) ?? { name, gender: '' },
      ),
    );
    return true;
  };

  const addOne = () => {
    if (!newName.trim()) {
      setFeedback('Enter a name first.');
      return;
    }
    if (!addNames(newName)) {
      setFeedback('That name is already in the roster.');
      return;
    }
    setNewName('');
    setFeedback('');
  };

  const addBulk = () => {
    if (!bulk.trim()) {
      setFeedback('Paste one name per line first.');
      return;
    }
    if (!addNames(bulk)) {
      setFeedback('Those names are already in the roster.');
      return;
    }
    setBulk('');
    setFeedback('');
  };

  const rename = (index, value) => {
    setDraft(
      draft.map((member, current) =>
        current === index ? { ...member, name: value } : member,
      ),
    );
  };

  const setGender = (index, gender) => {
    setDraft(
      draft.map((member, current) =>
        current === index ? { ...member, gender } : member,
      ),
    );
  };

  const remove = (index) => {
    setDraft(draft.filter((_, current) => current !== index));
  };

  const reset = () => {
    setDraft(ROSTER.map((name) => ({ name, gender: '' })));
    setFeedback('Template roster loaded. Click Save roster to apply.');
  };

  const save = () => {
    const names = normalizeRoster(draft.map((member) => member.name));
    const genders = {};
    for (const name of names) {
      const member = draft.find(
        (entry) => cleanName(entry.name).toLowerCase() === name.toLowerCase(),
      );
      if (member?.gender) genders[name] = member.gender;
    }
    onSave(names, normalizeMemberGenders(names, genders));
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="roster-dialog no-print"
      aria-labelledby="roster-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="roster-dialog-inner">
        <div className="roster-dialog-head">
          <div>
            <h2 id="roster-title">Members</h2>
            <p className="roster-count">{draft.length} members</p>
          </div>
          <button type="button" className="icon-button" onClick={() => dialogRef.current?.close()}>
            ×
          </button>
        </div>

        <div className="roster-add">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addOne();
            }}
            placeholder="Add a name"
            aria-label="Add a name to the roster"
          />
          <button type="button" onClick={addOne}>
            Add
          </button>
        </div>

        <div className="roster-bulk">
          <textarea
            value={bulk}
            onChange={(event) => setBulk(event.target.value)}
            placeholder="Bulk add: one name per line"
            aria-label="Bulk add names, one per line"
            rows={3}
          />
          <button type="button" onClick={addBulk}>
            Add names
          </button>
        </div>

        {feedback && <p className="roster-feedback">{feedback}</p>}

        <ul className="roster-list">
          {draft.map(({ name, gender }, index) => (
            <li className="roster-row" key={index}>
              <input
                value={name}
                onChange={(event) => rename(index, event.target.value)}
                aria-label={`Roster name ${index + 1}`}
              />
              <select
                value={gender}
                onChange={(event) => setGender(index, event.target.value)}
                aria-label={`Gender for ${name || `member ${index + 1}`}`}
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <button
                type="button"
                className="remove-row"
                onClick={() => remove(index)}
                aria-label={`Remove ${name || 'name'}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="roster-actions">
          <button type="button" onClick={reset}>
            Reset to template roster
          </button>
          <span className="roster-spacer" />
          <button type="button" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={save}>
            Save roster
          </button>
        </div>
      </div>
    </dialog>
  );
}
