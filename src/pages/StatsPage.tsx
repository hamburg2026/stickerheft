import { useMemo } from 'react';
import { SECTIONS } from '../data/stickers';
import type { PackInfo } from '../App';

interface Props {
  collected: boolean[];
  total: number;
  totalCollected: number;
  packs: PackInfo;
  onPacksChange: (p: PackInfo) => void;
}

// ── Maths ────────────────────────────────────────────────────────────────────

function harmonicSum(n: number): number {
  let s = 0;
  for (let i = 1; i <= n; i++) s += 1 / i;
  return s;
}

interface Forecast {
  expectedMoreStickers: number;
  expectedMorePacks: number;
  p50Packs: number;
  p75Packs: number;
  p90Packs: number;
  p95Packs: number;
}

function calcForecast(total: number, collected: number, spp: number): Forecast {
  const remaining = total - collected;
  if (remaining <= 0 || spp <= 0)
    return { expectedMoreStickers: 0, expectedMorePacks: 0, p50Packs: 0, p75Packs: 0, p90Packs: 0, p95Packs: 0 };

  const expectedMoreStickers = total * harmonicSum(remaining);

  let variance = 0;
  for (let i = collected; i < total; i++) {
    const p = (total - i) / total;
    variance += (1 - p) / (p * p);
  }
  const std = Math.sqrt(variance);

  const packs = (stickers: number) => Math.ceil(Math.max(0, stickers) / spp);

  return {
    expectedMoreStickers,
    expectedMorePacks: expectedMoreStickers / spp,
    p50Packs: packs(expectedMoreStickers),
    p75Packs: packs(expectedMoreStickers + 0.674 * std),
    p90Packs: packs(expectedMoreStickers + 1.282 * std),
    p95Packs: packs(expectedMoreStickers + 1.645 * std),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function eur(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function num(n: number, dec = 1) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ── Circular progress SVG ────────────────────────────────────────────────────

function CircularProgress({ pct }: { pct: number }) {
  const SIZE = 140, STROKE = 14;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#facc15' : '#E31621';

  return (
    <div className="circ-wrap">
      <svg width={SIZE} height={SIZE}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none"
          stroke={color} strokeWidth={STROKE}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="circ-text">
        <span className="circ-pct" style={{ color }}>{pct}%</span>
        <span className="circ-label">komplett</span>
      </div>
    </div>
  );
}

// ── Probability range bar ────────────────────────────────────────────────────

function ProbBar({ p50, p75, p90, p95 }: { p50: number; p75: number; p90: number; p95: number }) {
  if (p95 === 0) return null;
  const markers = [
    { label: '50 %', packs: p50, color: '#22c55e' },
    { label: '75 %', packs: p75, color: '#86efac' },
    { label: '90 %', packs: p90, color: '#facc15' },
    { label: '95 %', packs: p95, color: '#f87171' },
  ];
  const max = p95;
  return (
    <div className="prob-bar-wrap">
      <div className="prob-track">
        <div className="prob-fill" style={{ width: '100%' }} />
        {markers.map(m => (
          <div
            key={m.label}
            className="prob-marker"
            style={{ left: `${(m.packs / max) * 100}%`, color: m.color }}
          >
            <div className="prob-dot" style={{ backgroundColor: m.color }} />
            <span className="prob-marker-label">{m.label}</span>
          </div>
        ))}
      </div>
      <div className="prob-legend">
        {markers.map(m => (
          <div key={m.label} className="prob-legend-item">
            <span className="prob-legend-dot" style={{ backgroundColor: m.color }} />
            <span>{m.label}</span>
            <strong style={{ color: m.color }}>{m.packs} Tüten</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StatsPage({ collected, total, totalCollected, packs, onPacksChange }: Props) {
  const pct = Math.round((totalCollected / total) * 100);
  const totalMissing = total - totalCollected;

  const stickersFromPacks = packs.count * packs.stickersPerPack;
  const totalSpent = packs.count * packs.pricePerPack;
  const duplicates = Math.max(0, stickersFromPacks - totalCollected);
  const dupeRate = stickersFromPacks > 0 ? Math.round((duplicates / stickersFromPacks) * 100) : 0;
  const costPerUnique = totalCollected > 0 && totalSpent > 0 ? totalSpent / totalCollected : 0;

  const forecast = useMemo(
    () => calcForecast(total, totalCollected, packs.stickersPerPack),
    [total, totalCollected, packs.stickersPerPack]
  );

  const moreCost = (morePacks: number) => morePacks * packs.pricePerPack;
  const totalCostAt = (morePacks: number) => totalSpent + moreCost(morePacks);

  function setPack(key: keyof PackInfo, raw: string) {
    const val = parseFloat(raw.replace(',', '.'));
    if (!isNaN(val) && val >= 0) onPacksChange({ ...packs, [key]: key === 'count' ? Math.round(val) : val });
  }

  // Section stats
  const sectionStats = SECTIONS.map(s => {
    const nums = Array.from({ length: s.end - s.start + 1 }, (_, i) => s.start + i);
    const c = nums.filter(n => collected[n]).length;
    return { ...s, sectionCollected: c, sectionTotal: nums.length, sectionPct: Math.round((c / nums.length) * 100) };
  });

  return (
    <div className="stats-page">

      {/* ── Fortschritt ─────────────────────────────── */}
      <div className="stats-card hero-card">
        <h2 className="stats-card-title">Fortschritt</h2>
        <div className="hero-row">
          <CircularProgress pct={pct} />
          <div className="hero-numbers">
            <div className="hero-num">
              <span className="hero-val collected-color">{totalCollected}</span>
              <span className="hero-label">vorhanden</span>
            </div>
            <div className="hero-num">
              <span className="hero-val missing-color">{totalMissing}</span>
              <span className="hero-label">fehlen noch</span>
            </div>
            <div className="hero-num">
              <span className="hero-val" style={{ color: '#94a3b8' }}>{total}</span>
              <span className="hero-label">gesamt</span>
            </div>
          </div>
        </div>
        {/* section mini-bars */}
        <div className="section-mini-bars">
          {sectionStats.map(s => (
            <div key={s.id} className="smb-row">
              <span className="smb-name" title={s.name}>{s.name}</span>
              <div className="smb-track">
                <div className="smb-fill" style={{ width: `${s.sectionPct}%`, backgroundColor: s.color }} />
              </div>
              <span className="smb-pct" style={{ color: s.color }}>{s.sectionPct}%</span>
              <span className="smb-count">{s.sectionCollected}/{s.sectionTotal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tüten & Kosten ──────────────────────────── */}
      <div className="stats-card">
        <h2 className="stats-card-title">Tüten &amp; Kosten</h2>

        <div className="pack-form">
          <div className="pack-field">
            <label className="pack-label">Anzahl Tüten gekauft</label>
            <input
              type="number" min="0" step="1"
              value={packs.count || ''}
              onChange={e => setPack('count', e.target.value)}
              placeholder="0"
              className="pack-input"
            />
          </div>
          <div className="pack-field">
            <label className="pack-label">Preis pro Tüte (€)</label>
            <input
              type="number" min="0" step="0.10"
              value={packs.pricePerPack || ''}
              onChange={e => setPack('pricePerPack', e.target.value)}
              placeholder="1,00"
              className="pack-input"
            />
          </div>
          <div className="pack-field">
            <label className="pack-label">Sticker pro Tüte</label>
            <input
              type="number" min="1" step="1"
              value={packs.stickersPerPack || ''}
              onChange={e => setPack('stickersPerPack', e.target.value)}
              placeholder="5"
              className="pack-input"
            />
          </div>
        </div>

        {packs.count > 0 && (
          <div className="cost-grid">
            <CostItem label="Gesamt ausgegeben" value={eur(totalSpent)} accent="amber" />
            <CostItem label="Sticker gezogen" value={`${stickersFromPacks}`} accent="blue" />
            <CostItem
              label="Davon Duplikate"
              value={`${duplicates} (${dupeRate} %)`}
              accent="orange"
            />
            <CostItem
              label="Kosten je Unikat"
              value={costPerUnique > 0 ? eur(costPerUnique) : '–'}
              accent="green"
            />
          </div>
        )}
        {packs.count === 0 && (
          <p className="pack-hint">Trag deine gekauften Tüten ein, um die Kostenanalyse zu sehen.</p>
        )}
      </div>

      {/* ── Prognose ────────────────────────────────── */}
      <div className="stats-card">
        <h2 className="stats-card-title">Prognose bis Album voll</h2>
        <p className="stats-note">
          Coupon-Collector-Modell (zufällig gleichverteilte Sticker, ohne Tauschaktionen)
        </p>

        {totalMissing > 0 ? (
          <>
            <div className="forecast-hero">
              <div className="forecast-val">
                <span className="forecast-big">{num(forecast.expectedMorePacks, 0)}</span>
                <span className="forecast-unit">Tüten erwartet</span>
              </div>
              {packs.pricePerPack > 0 && (
                <div className="forecast-val">
                  <span className="forecast-big" style={{ color: '#fbbf24' }}>
                    {eur(moreCost(forecast.expectedMorePacks))}
                  </span>
                  <span className="forecast-unit">Kosten noch</span>
                </div>
              )}
              {packs.pricePerPack > 0 && packs.count > 0 && (
                <div className="forecast-val">
                  <span className="forecast-big" style={{ color: '#f87171' }}>
                    {eur(totalCostAt(forecast.expectedMorePacks))}
                  </span>
                  <span className="forecast-unit">Gesamt erwartet</span>
                </div>
              )}
            </div>

            <div className="prob-table">
              <div className="prob-table-header">
                <span>Wahrscheinlichkeit</span>
                <span>Tüten noch</span>
                {packs.pricePerPack > 0 && <span>Kosten noch</span>}
                {packs.pricePerPack > 0 && packs.count > 0 && <span>Gesamt</span>}
              </div>
              {[
                { label: '50 %', packs: forecast.p50Packs, color: '#22c55e' },
                { label: '75 %', packs: forecast.p75Packs, color: '#86efac' },
                { label: '90 %', packs: forecast.p90Packs, color: '#facc15' },
                { label: '95 %', packs: forecast.p95Packs, color: '#f87171' },
              ].map(row => (
                <div className="prob-table-row" key={row.label} style={{ borderLeftColor: row.color }}>
                  <span className="prob-table-prob" style={{ color: row.color }}>{row.label}</span>
                  <span className="prob-table-val" style={{ color: row.color }}>{row.packs}</span>
                  {packs.pricePerPack > 0 && (
                    <span className="prob-table-val">{eur(moreCost(row.packs))}</span>
                  )}
                  {packs.pricePerPack > 0 && packs.count > 0 && (
                    <span className="prob-table-val">{eur(totalCostAt(row.packs))}</span>
                  )}
                </div>
              ))}
            </div>

            <ProbBar
              p50={forecast.p50Packs}
              p75={forecast.p75Packs}
              p90={forecast.p90Packs}
              p95={forecast.p95Packs}
            />

            <p className="stats-note" style={{ marginTop: 12 }}>
              Noch {totalMissing} von {total} Stickern offen.
              Die letzten seltenen Sticker erfordern statistisch viele Tüten — Tauschen lohnt sich!
            </p>
          </>
        ) : (
          <p className="forecast-complete">Album ist vollständig! Herzlichen Glückwunsch!</p>
        )}
      </div>

    </div>
  );
}

function CostItem({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    amber: '#fbbf24', blue: '#60a5fa', orange: '#fb923c', green: '#4ade80',
  };
  return (
    <div className="cost-item">
      <span className="cost-label">{label}</span>
      <span className="cost-value" style={{ color: colors[accent] ?? '#fff' }}>{value}</span>
    </div>
  );
}
