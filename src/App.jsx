import { useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import ScheduleHeader from './components/ScheduleHeader.jsx';
import AnnouncementPanel from './components/AnnouncementPanel.jsx';
import CalendarTable from './components/CalendarTable.jsx';
import FeastPanel from './components/FeastPanel.jsx';
import ScheduleFooter from './components/ScheduleFooter.jsx';
import RosterDialog from './components/RosterDialog.jsx';
import AnalyticsPanel from './components/AnalyticsPanel.jsx';
import { createDefaultMonth, monthKey, monthShort } from './lib/calendar.js';
import { createDefaultRoot, parseRoot, serializeRoot } from './lib/storage.js';
import { loadPersistedRoot, savePersistedRoot } from './lib/serverStorage.js';
import { downloadXlsx } from './lib/xlsx.js';

const PAGE_WIDTH_PX = 1069;
const PAGE_HEIGHT_PX = 741;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fetchLogo(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export default function App() {
  const [root, setRoot] = useState(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [storageReady, setStorageReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [message, setMessage] = useState('');
  const sheetRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentKey = root ? monthKey(year, month) : null;
  const monthData = root
    ? root.months[currentKey] ?? createDefaultMonth(year, month)
    : null;

  useEffect(() => {
    let active = true;
    loadPersistedRoot()
      .then((loaded) => {
        if (!active) return;
        setRoot(loaded);
        setYear(loaded.lastMonth.year);
        setMonth(loaded.lastMonth.month);
        setStorageReady(true);
      })
      .catch((error) => {
        if (!active) return;
        const fallback = createDefaultRoot();
        setRoot(fallback);
        setYear(fallback.lastMonth.year);
        setMonth(fallback.lastMonth.month);
        setStorageReady(true);
        setMessage(`Could not load saved schedule: ${error.message}`);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!root || !storageReady) return;
    setRoot((previous) => {
      if (!previous) return previous;
      const key = monthKey(year, month);
      const exists = previous.months[key];
      if (
        exists &&
        previous.lastMonth.year === year &&
        previous.lastMonth.month === month
      ) {
        return previous;
      }
      return {
        ...previous,
        lastMonth: { year, month },
        months: exists
          ? previous.months
          : { ...previous.months, [key]: createDefaultMonth(year, month) },
      };
    });
  }, [year, month, root, storageReady]);

  useEffect(() => {
    if (!root || !storageReady) return undefined;
    setSaved(false);
    const timer = setTimeout(() => {
      savePersistedRoot(root)
        .then(() => setSaved(true))
        .catch((error) => {
          setMessage(`Could not save schedule: ${error.message}`);
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [root, storageReady]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const beforePrint = () => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      sheet.style.zoom = '1';
      const rect = sheet.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scale = Math.min(1, PAGE_WIDTH_PX / rect.width, PAGE_HEIGHT_PX / rect.height);
      sheet.style.zoom = String(Math.max(0.5, scale));
    };
    const afterPrint = () => {
      if (sheetRef.current) sheetRef.current.style.zoom = '';
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  const updateMonth = useCallback(
    (updater) => {
      setRoot((previous) => {
        const key = monthKey(year, month);
        const current = previous.months[key] ?? createDefaultMonth(year, month);
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { ...previous, months: { ...previous.months, [key]: next } };
      });
    },
    [year, month],
  );

  const updateHeader = useCallback((key, value) => {
    setRoot((previous) => ({
      ...previous,
      header: { ...previous.header, [key]: value },
    }));
  }, []);

  const updateDay = useCallback(
    (iso, updater) => {
      updateMonth((current) => ({
        ...current,
        days: { ...current.days, [iso]: updater(current.days[iso]) },
      }));
    },
    [updateMonth],
  );

  const updateAnnouncement = (key, value) => {
    updateMonth((current) => ({
      ...current,
      announcement: { ...current.announcement, [key]: value },
    }));
  };

  const updateBirthdays = (birthdays) => {
    updateMonth((current) => ({
      ...current,
      birthdays: typeof birthdays === 'function' ? birthdays(current.birthdays) : birthdays,
    }));
  };

  const updateFeasts = (feasts) => {
    updateMonth((current) => ({
      ...current,
      feastDays: typeof feasts === 'function' ? feasts(current.feastDays) : feasts,
    }));
  };

  const updateFooter = (key, value) => {
    updateMonth((current) => ({ ...current, [key]: value }));
  };

  const changeYearMonth = (nextYear, nextMonth) => {
    let targetYear = nextYear;
    let targetMonth = nextMonth;
    while (targetMonth < 1) {
      targetMonth += 12;
      targetYear -= 1;
    }
    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear += 1;
    }
    targetYear = Math.min(2100, Math.max(1900, targetYear));
    setYear(targetYear);
    setMonth(targetMonth);
  };

  const handlePrev = () => changeYearMonth(year, month - 1);
  const handleNext = () => changeYearMonth(year, month + 1);

  const handlePrint = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setTimeout(() => window.print(), 50);
  };

  const handleReset = () => {
    if (
      !window.confirm(
        `Reset all assignments, announcements, birthdays, and feast days for ${monthShort(month)} ${year}?`,
      )
    ) {
      return;
    }
    updateMonth(() => createDefaultMonth(year, month));
    setMessage('Month reset to defaults.');
  };

  const handleRosterSave = (roster) => {
    const allowed = new Set(roster);
    setRoot((previous) => ({
      ...previous,
      roster,
      disabledRoster: previous.disabledRoster.filter((name) => allowed.has(name)),
    }));
    setMessage('Roster updated.');
  };

  const handleToggleDisabled = (name) => {
    setRoot((previous) => {
      const disabled = new Set(previous.disabledRoster ?? []);
      if (disabled.has(name)) disabled.delete(name);
      else disabled.add(name);
      return {
        ...previous,
        disabledRoster: previous.roster.filter((entry) => disabled.has(entry)),
      };
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([serializeRoot(root)], { type: 'application/json' });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `leccom_backup_${stamp}.json`);
    setMessage('JSON backup exported.');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseRoot(await file.text());
      if (!window.confirm('Replace all schedules in this browser with the imported backup?')) {
        return;
      }
      setRoot(imported);
      setYear(imported.lastMonth.year);
      setMonth(imported.lastMonth.month);
      setMessage('Backup imported.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleExportXlsx = async () => {
    setBusy(true);
    try {
      const [left, right] = await Promise.all([
        fetchLogo(`${import.meta.env.BASE_URL}logos/san-agustin-parish.jpeg`),
        fetchLogo(`${import.meta.env.BASE_URL}logos/leccom-ministry.jpeg`),
      ]);
      await downloadXlsx({
        year,
        month,
        monthData,
        header: root.header,
        logos: { left, right },
      });
      setMessage('Excel file exported.');
    } catch (error) {
      console.error(error);
      setMessage(`Excel export failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!root || !monthData) {
    return <div className="loading-screen">Loading schedule...</div>;
  }

  return (
    <div className="app">
      <Toolbar
        year={year}
        month={month}
        saved={saved}
        busy={busy}
        onYearMonth={changeYearMonth}
        onPrev={handlePrev}
        onNext={handleNext}
        onRoster={() => setRosterOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportClick}
        onExportXlsx={handleExportXlsx}
        onPrint={handlePrint}
        onReset={handleReset}
      />

      <div className="workspace">
        <main className="sheet-wrap">
          <div className="sheet" ref={sheetRef}>
            <div className="sheet-top">
              <ScheduleHeader
                header={root.header}
                month={month}
                year={year}
                onChange={updateHeader}
              />
              <AnnouncementPanel
                announcement={monthData.announcement}
                birthdays={monthData.birthdays}
                monthShort={monthShort(month)}
                onChangeAnnouncement={updateAnnouncement}
                onChangeBirthdays={updateBirthdays}
              />
            </div>

            <CalendarTable
              year={year}
              month={month}
              monthData={monthData}
              onChangeDay={updateDay}
              rosterId="roster"
            />

            <FeastPanel
              feasts={monthData.feastDays}
              monthShort={monthShort(month)}
              onChange={updateFeasts}
            />

            <ScheduleFooter
              preparedBy={monthData.preparedBy}
              reviewedBy={monthData.reviewedBy}
              onChange={updateFooter}
            />
          </div>
        </main>

        <AnalyticsPanel
          year={year}
          month={month}
          roster={root.roster}
          monthData={monthData}
          disabledRoster={root.disabledRoster ?? []}
          onToggleDisabled={handleToggleDisabled}
        />
      </div>

      <datalist id="roster">
        {root.roster
          .filter((name) => !(root.disabledRoster ?? []).includes(name))
          .map((name) => (
            <option key={name} value={name} />
          ))}
      </datalist>

      <RosterDialog
        open={rosterOpen}
        roster={root.roster}
        onClose={() => setRosterOpen(false)}
        onSave={handleRosterSave}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={handleImportFile}
      />

      {message && (
        <div className="toast no-print" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
