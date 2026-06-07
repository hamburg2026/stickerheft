import { useState, useMemo, useEffect } from 'react';
import { SECTIONS, type Section } from '../data/stickers';

type Filter = 'all' | 'collected' | 'missing';

interface Props {
  collected: boolean[];
  total: number;
  totalCollected: number;
  onToggle: (num: number) => void;
  onBulkMark: (nums: number[]) => void;
}

export default function AlbumPage({ collected, total, totalCollected, onToggle, onBulkMark }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ src: string; title: string } | null>(null);
  const totalMissing = total - totalCollected;

  useEffect(() => {
    if (!zoomImage) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomImage(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoomImage]);

  const handleImport = () => {
    const nums = importText
      .split(/[\s,;]+/)
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= total);
    if (!nums.length) return;
    onBulkMark(nums);
    setImportText('');
    setShowImport(false);
  };

  const missingList = useMemo(
    () => Array.from({ length: total }, (_, i) => i + 1).filter(n => !collected[n]),
    [collected, total]
  );

  return (
    <>
      <div className="album-subheader">
        <div className="album-subheader-inner">
          <div className="filter-row">
            {(['all', 'collected', 'missing'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn${filter === f ? ' active' : ''}`}
              >
                {f === 'all'
                  ? `Alle (${total})`
                  : f === 'collected'
                  ? `✓ Vorhanden (${totalCollected})`
                  : `✗ Fehlend (${totalMissing})`}
              </button>
            ))}
            <button onClick={() => setShowImport(v => !v)} className="import-btn">
              + Nummern eintragen
            </button>
          </div>
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
      </div>

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
          const imgSrc = `${import.meta.env.BASE_URL}images/${section.image}`;

          return (
            <section key={section.id} className="album-section">
              <div
                className="section-header section-header-zoomable"
                style={{ backgroundImage: `url(${imgSrc})` }}
                onClick={() => setZoomImage({ src: imgSrc, title: section.name })}
                title="Foto vergrößern"
              >
                <span className="section-bar" style={{ backgroundColor: section.color }} />
                <h2 className="section-title" style={{ color: section.color }}>{section.name}</h2>
                <span className="section-count">{secCollected}/{nums.length}</span>
                <div className="section-line" />
                <span className="section-zoom-icon">&#128269;</span>
              </div>
              <div className="sticker-grid">
                {visible.map(num => (
                  <StickerCard
                    key={num}
                    num={num}
                    collected={collected[num]}
                    section={section}
                    onToggle={() => onToggle(num)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {totalMissing > 0 && (
          <div className="missing-list">
            <h3 className="missing-title">Fehlende Sticker ({totalMissing})</h3>
            <p className="missing-numbers">{missingList.join(', ')}</p>
          </div>
        )}
      </main>

      {zoomImage && (
        <div className="lightbox-overlay" onClick={() => setZoomImage(null)}>
          <div className="lightbox-box" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setZoomImage(null)}>✕</button>
            <img src={zoomImage.src} alt={zoomImage.title} className="lightbox-img" />
            <p className="lightbox-caption">{zoomImage.title}</p>
          </div>
        </div>
      )}
    </>
  );
}

interface CardProps {
  num: number;
  collected: boolean;
  section: Section;
  onToggle: () => void;
}

function StickerCard({ num, collected, section, onToggle }: CardProps) {
  return (
    <button
      onClick={onToggle}
      title={`#${num} – ${collected ? 'vorhanden (klicken zum Entfernen)' : 'fehlt (klicken zum Markieren)'}`}
      className={`sticker-card${collected ? ' sticker-collected' : ' sticker-missing'}`}
      style={collected ? {
        backgroundColor: section.bg,
        borderColor: section.color + 'AA',
        color: section.color,
      } : { color: '#4B5563' }}
    >
      <span className="sticker-num">{num}</span>
      {collected && (
        <span className="sticker-check" style={{ color: section.color }}>✓</span>
      )}
    </button>
  );
}
