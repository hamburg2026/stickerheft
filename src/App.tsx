import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MISSING_STICKERS } from './data/stickers';
import AlbumPage from './pages/AlbumPage';
import StatsPage from './pages/StatsPage';

type Tab = 'album' | 'stats';

export interface PackInfo {
  count: number;
  pricePerPack: number;
  stickersPerPack: number;
}

export interface AppData {
  version: 1;
  collected: boolean[];
  packs: PackInfo;
}

const TOTAL = 276;
const STORAGE_KEY = 'reeperbahn-stickerheft';
const DEFAULT_PACKS: PackInfo = { count: 0, pricePerPack: 1.0, stickersPerPack: 5 };

function buildInitial(): boolean[] {
  const s = new Array(TOTAL + 1).fill(true);
  MISSING_STICKERS.forEach(n => { s[n] = false; });
  return s;
}

function initData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      // backward compat: old format was raw boolean[]
      if (Array.isArray(p)) {
        return { version: 1, collected: p.length === TOTAL + 1 ? p : buildInitial(), packs: DEFAULT_PACKS };
      }
      const collected = Array.isArray(p.collected) && p.collected.length === TOTAL + 1
        ? p.collected as boolean[]
        : buildInitial();
      return { version: 1, collected, packs: p.packs ?? DEFAULT_PACKS };
    }
  } catch { /* ignore */ }
  return { version: 1, collected: buildInitial(), packs: DEFAULT_PACKS };
}

export default function App() {
  const [data, setData] = useState<AppData>(initData);
  const [tab, setTab] = useState<Tab>('album');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const toggleSticker = useCallback((num: number) => {
    setData(prev => {
      const next = [...prev.collected];
      next[num] = !next[num];
      return { ...prev, collected: next };
    });
  }, []);

  const markCollected = useCallback((nums: number[]) => {
    setData(prev => {
      const next = [...prev.collected];
      nums.forEach(n => { if (n >= 1 && n <= TOTAL) next[n] = true; });
      return { ...prev, collected: next };
    });
  }, []);

  const updatePacks = useCallback((packs: PackInfo) => {
    setData(prev => ({ ...prev, packs }));
  }, []);

  const exportBackup = () => {
    const payload = { ...data, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stickerheft-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const p = JSON.parse(evt.target?.result as string);
        const collected = Array.isArray(p.collected) && p.collected.length === TOTAL + 1
          ? (p.collected as boolean[])
          : null;
        if (!collected) { alert('Ungültige Backup-Datei'); return; }
        setData({ version: 1, collected, packs: p.packs ?? DEFAULT_PACKS });
      } catch { alert('Fehler beim Lesen der Backup-Datei'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalCollected = useMemo(
    () => data.collected.slice(1, TOTAL + 1).filter(Boolean).length,
    [data.collected]
  );
  const pct = Math.round((totalCollected / TOTAL) * 100);

  return (
    <div className="app">
      <nav className="top-nav">
        <div className="nav-inner">
          <div className="nav-left">
            <span className="nav-brand">400 Jahre Reeperbahn</span>
            <div className="nav-tabs">
              <button className={`nav-tab${tab === 'album' ? ' active' : ''}`} onClick={() => setTab('album')}>
                Album
              </button>
              <button className={`nav-tab${tab === 'stats' ? ' active' : ''}`} onClick={() => setTab('stats')}>
                Statistiken
              </button>
            </div>
          </div>
          <div className="nav-right">
            <span className="nav-progress-text">
              <strong>{totalCollected}</strong>/{TOTAL}
              <span className="nav-pct"> {pct}%</span>
            </span>
            <button onClick={exportBackup} className="nav-backup-btn" title="Backup herunterladen">
              &#8595; Backup
            </button>
            <button onClick={() => fileRef.current?.click()} className="nav-backup-btn nav-restore-btn" title="Backup laden">
              &#8593; Laden
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={importBackup} style={{ display: 'none' }} />
          </div>
        </div>
        <div className="nav-progress-bar">
          <div className="nav-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </nav>

      {tab === 'album' ? (
        <AlbumPage
          collected={data.collected}
          total={TOTAL}
          totalCollected={totalCollected}
          onToggle={toggleSticker}
          onBulkMark={markCollected}
        />
      ) : (
        <StatsPage
          collected={data.collected}
          total={TOTAL}
          totalCollected={totalCollected}
          packs={data.packs}
          onPacksChange={updatePacks}
        />
      )}
    </div>
  );
}
