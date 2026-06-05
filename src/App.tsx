import { useState, useEffect, useCallback, useMemo } from 'react';
import { SECTIONS, MISSING_STICKERS, type Section } from './data/stickers';

type Filter = 'all' | 'collected' | 'missing';

const TOTAL = 276;
const STORAGE_KEY = 'reeperbahn-stickerheft';

function initCollected(): boolean[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as boolean[];
      if (Array.isArray(parsed) && parsed.length === TOTAL + 1) return parsed;
    }
  } catch { /* ignore */ }
  const state = new Array(TOTAL + 1).fill(true);
  MISSING_STICKERS.forEach(n => { state[n] = false; });
  return state;
}

export default function App() {
  const [collected, setCollected] = useState<boolean[]>(initCollected);
  const [filter, setFilter] = useState<Filter>('all');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collected));
  }, [collected]);

  const toggle = useCallback((num: number) => {
    setCollected(prev => {
      const next = [...prev];
      next[num] = !next[num];
      return next;
    });
  }, []);

  const totalCollected = useMemo(
    () => collected.slice(1, TOTAL + 1).filter(Boolean).length,
    [collected]
  );
  const totalMissing = TOTAL - totalCollected;
  const pct = Math.round((totalCollected / TOTAL) * 100);

  const handleImport = () => {
    const nums = importText
      .split(/[\s,;]+/)
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= TOTAL);
    if (!nums.length) return;
    setCollected(prev => {
      const next = [...prev];
      nums.forEach(n => { next[n] = true; });
      return next;
    });
    setImportText('');
    setShowImport(false);
  };

  const missingList = useMemo(
    () => Array.from({ length: TOTAL }, (_, i) => i + 1).filter(n => !collected[n]),
    [collected]
  );

  return (
    <div className="app">
      {/* Sticky header */}
      <header className="header">
        <div className="header-inner">
          {/* Title + stats */}
          <div className="header-top">
            <div>
              <h1 className="album-title">400 Jahre Reeperbahn</h1>
              <p className="album-subtitle">Stickeralbum · 276 Sticker</p>
            </div>
            <div className="stats-row">
              <div className="stat">
                <span className="stat-num collected-color">{totalCollected}</span>
                <span className="stat-label">vorhanden</span>
              </div>
              <span className="stat-sep">·</span>
              <div className="stat">
                <span className="stat-num missing-color">{totalMissing}</span>
                <span className="stat-label">fehlen</span>
              </div>
              <span className="stat-sep">·</span>
              <div className="stat">
                <span className="stat-num pct-color">{pct}%</span>
                <span className="stat-label">komplett</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(totalCollected / TOTAL) * 100}%` }}
            />
          </div>

          {/* Filter + import toggle */}
          <div className="filter-row">
            {(['all', 'collected', 'missing'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn${filter === f ? ' active' : ''}`}
              >
                {f === 'all'
                  ? `Alle (${TOTAL})`
                  : f === 'collected'
                  ? `✓ Vorhanden (${totalCollected})`
                  : `✗ Fehlend (${totalMissing})`}
              </button>
            ))}
            <button
              onClick={() => setShowImport(v => !v)}
              className="import-btn"
            >
              + Nummern eintragen
            </button>
          </div>

          {/* Bulk import */}
          {showImport && (
            <div className="import-row">
              <input
                autoFocus
                type="text"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImport()}
                placeholder="z.B. 5, 10, 11, 27, 30 …"
                className="import-input"
              />
              <button onClick={handleImport} className="import-confirm">
                Als vorhanden markieren
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        {SECTIONS.map(section => {
          const nums = Array.from(
            { length: section.end - section.start + 1 },
            (_, i) => section.start + i
          );
          const visible = nums.filter(n =>
            filter === 'collected' ? collected[n] :
            filter === 'missing'   ? !collected[n] : true
          );
          if (!visible.length) return null;
          const secCollected = nums.filter(n => collected[n]).length;

          return (
            <section key={section.id} className="album-section">
              <div className="section-header">
                <span
                  className="section-bar"
                  style={{ backgroundColor: section.color }}
                />
                <h2 className="section-title" style={{ color: section.color }}>
                  {section.name}
                </h2>
                <span className="section-count">{secCollected}/{nums.length}</span>
                <div className="section-line" />
              </div>
              <div className="sticker-grid">
                {visible.map(num => (
                  <StickerCard
                    key={num}
                    num={num}
                    collected={collected[num]}
                    section={section}
                    onToggle={() => toggle(num)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Missing list */}
        {totalMissing > 0 && (
          <div className="missing-list">
            <h3 className="missing-title">Fehlende Sticker ({totalMissing})</h3>
            <p className="missing-numbers">{missingList.join(', ')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

interface StickerCardProps {
  num: number;
  collected: boolean;
  section: Section;
  onToggle: () => void;
}

function StickerCard({ num, collected, section, onToggle }: StickerCardProps) {
  return (
    <button
      onClick={onToggle}
      title={`#${num} – ${collected ? 'vorhanden (klicken zum Entfernen)' : 'fehlt (klicken zum Markieren)'}`}
      className={`sticker-card${collected ? ' sticker-collected' : ' sticker-missing'}`}
      style={collected ? {
        backgroundColor: section.bg,
        borderColor: section.color + 'AA',
        color: section.color,
      } : undefined}
    >
      <span className="sticker-num">{num}</span>
      {collected && (
        <span className="sticker-check" style={{ color: section.color }}>✓</span>
      )}
    </button>
  );
}
