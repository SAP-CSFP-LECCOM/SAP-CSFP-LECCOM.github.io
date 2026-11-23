import { useEffect, useRef, useState } from 'react';
import { ROSTER } from '../lib/defaults.js';
import { addRosterNames, normalizeRoster } from '../lib/roster.js';

export default function RosterDialog({ open, roster, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [draft, setDraft] = useState([]);
  const [newName, setNewName] = useState('');
  const [bulk, setBulk] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (open) {
      setDraft([...roster]);
      setNewName('');
      setBulk('');
      setFeedback('');
      if (!dialogRef.current.open) dialogRef.current.showModal();
    } else if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [open, roster]);

  const addOne = () => {
    if (!newName.trim()) {
      setFeedback('Enter a name first.');
      return;
    }
    const next = addRosterNames(draft, newName);
    if (next.length === draft.length) {
      setFeedback('That name is already in the roster.');
      return;
    }
    setDraft(next);
    setNewName('');
    setFeedback('');
  };

  const addBulk = () => {
    if (!bulk.trim()) {
      setFeedback('Paste one name per line first.');
      return;
    }
    const next = addRosterNames(draft, bulk);
    if (next.length === draft.length) {
      setFeedback('Those names are already in the roster.');
      return;
    }
    setDraft(next);
    setBulk('');
    setFeedback('');
  };

  const rename = (index, value) => {
    setDraft(draft.map((name, current) => (current === index ? value : name)));
  };

  const remove = (index) => {
    setDraft(draft.filter((_, current) => current !== index));
  };

  const reset = () => {
    setDraft([...ROSTER]);
    setFeedback('Template roster loaded. Click Save roster to apply.');
  };

  const save = () => {
    onSave(normalizeRoster(draft));
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
            <h2 id="roster-title">Roster</h2>
            <p className="roster-count">{draft.length} names</p>
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
          {draft.map((name, index) => (
            <li className="roster-row" key={index}>
              <input
                value={name}
                onChange={(event) => rename(index, event.target.value)}
                aria-label={`Roster name ${index + 1}`}
              />
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
