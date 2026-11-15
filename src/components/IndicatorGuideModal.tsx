import { X, BookOpen, ShieldAlert } from 'lucide-react';
import { HAZARDS } from '../domain/hrpData';
import { INDICATORS } from '../domain/knowledge';
import type { IndicatorId } from '../domain/types';

interface Props {
  indicatorId: IndicatorId | null;
  onClose: () => void;
}

export function IndicatorGuideModal({ indicatorId, onClose }: Props) {
  if (!indicatorId) return null;
  const ind = INDICATORS[indicatorId];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${ind.label} guide`} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
              {ind.category}
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '1.25rem' }}>{ind.label}</h2>
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label="Close guide">
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div className="panel status-border-ok" style={{ padding: 10 }}>
            <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>NOMINAL</div>
            <div style={{ fontSize: '0.82rem' }}>{ind.nominalText}</div>
          </div>
          <div className="panel status-border-warn" style={{ padding: 10 }}>
            <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>MONITOR</div>
            <div style={{ fontSize: '0.82rem' }}>{ind.monitorText}</div>
          </div>
          <div className="panel status-border-alert" style={{ padding: 10 }}>
            <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>ALERT</div>
            <div style={{ fontSize: '0.82rem' }}>{ind.alertText}</div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <BookOpen size={15} color="#38bdf8" /> How to Measure in Space
          </h3>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {ind.howToMeasure.map((step, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{step}</li>
            ))}
          </ol>
        </div>

        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <ShieldAlert size={15} color="#f59e0b" /> Why It Matters in Spaceflight
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{ind.whyInSpace}</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {ind.hazards.map((h) => (
            <span key={h} className="chip" style={{ borderColor: HAZARDS[h]?.color }}>
              {HAZARDS[h]?.name}
            </span>
          ))}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Source Basis: {ind.clinicalSource}
        </div>
      </div>
    </div>
  );
}
