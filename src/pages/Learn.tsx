import { useState } from 'react';
import { BookOpen, ExternalLink, FlaskConical, HeartHandshake, Search, ShieldAlert } from 'lucide-react';
import { EARTH_BENEFITS, HAZARD_LIST, HRP_RISKS, HRP_STUDIES } from '../domain/hrpData';
import { INDICATOR_LIST } from '../domain/knowledge';
import type { RiskCategory } from '../domain/types';

type TabId = 'hazards' | 'risks' | 'studies' | 'earth' | 'howto';

export function Learn() {
  const [tab, setTab] = useState<TabId>('hazards');
  const [query, setQuery] = useState('');
  const [riskCat, setRiskCat] = useState<RiskCategory | 'All'>('All');

  const q = query.trim().toLowerCase();

  const filteredRisks = HRP_RISKS.filter((r) => {
    if (riskCat !== 'All' && r.category !== riskCat) return false;
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.topRisks.toLowerCase().includes(q) ||
      r.whatCanBeDone.toLowerCase().includes(q) ||
      r.didYouKnow.toLowerCase().includes(q)
    );
  });

  const filteredStudies = HRP_STUDIES.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.agency.toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">NASA HRP &amp; Canadian Space Agency Encyclopedia</h1>
          <p className="page-subtitle">
            Grounded in NASA’s 5 Hazards, 17 Human System Risks, 22 HRP Studies, and CSA Science &amp; CANS Radiation Research
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { id: 'hazards', label: '5 Spaceflight Hazards', icon: ShieldAlert },
              { id: 'risks', label: `17 HRP Risks (${HRP_RISKS.length})`, icon: BookOpen },
              { id: 'studies', label: `Studies & CSA Tech (${HRP_STUDIES.length})`, icon: FlaskConical },
              { id: 'earth', label: 'Earth Benefits (CSA/NASA)', icon: HeartHandshake },
              { id: 'howto', label: 'How-To Measure Guides', icon: BookOpen },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`chip ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id as TabId)}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', minWidth: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 30 }}
              placeholder="Search hazards, risks, studies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {tab === 'hazards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {HAZARD_LIST.map((h) => (
            <div key={h.id} className="panel" style={{ borderLeft: `4px solid ${h.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{h.name}</h2>
                  <div style={{ fontSize: '0.84rem', color: h.color, fontWeight: 600 }}>{h.tagline}</div>
                </div>
                <a href={h.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>
                  NASA Source <ExternalLink size={13} />
                </a>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '10px 0' }}>{h.description}</p>
              <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: '0.84rem', color: '#cbd5e1' }}>
                {h.keyFacts.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Research Platforms: {h.platforms.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'risks' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(['All', 'Physiology', 'Behavioral Performance & Human Factors', 'Space Radiation'] as const).map((cat) => (
              <button key={cat} className={`chip ${riskCat === cat ? 'active' : ''}`} onClick={() => setRiskCat(cat)}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid-2">
            {filteredRisks.map((r) => (
              <div key={r.id} className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {r.category}
                    </div>
                    <h3 style={{ margin: '2px 0 4px', fontSize: '1rem' }}>{r.title}</h3>
                  </div>
                  <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>
                    <ExternalLink size={13} />
                  </a>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '6px 0' }}>
                  <strong>Top Risks:</strong> {r.topRisks}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '6px 0' }}>
                  <strong>What Can Be Done:</strong> {r.whatCanBeDone}
                </p>
                <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-space)', fontSize: '0.78rem', color: '#7dd3fc' }}>
                  <strong>Did you know?</strong> {r.didYouKnow}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'studies' && (
        <div className="grid-2">
          {filteredStudies.map((s) => (
            <div key={s.id} className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <span className="chip" style={{ fontSize: '0.7rem', marginBottom: 4 }}>
                    {s.agency} • {s.status}
                  </span>
                  <h3 style={{ margin: '4px 0', fontSize: '1.02rem' }}>{s.name}</h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{s.formalTitle}</div>
                </div>
                <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>
                  <ExternalLink size={13} />
                </a>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: '8px 0' }}>{s.description}</p>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '0 0 8px' }}>
                <strong>Impact:</strong> {s.impact}
              </p>
              <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                In AstroVitals: {s.appFeatureLink}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'earth' && (
        <div className="panel">
          <h2 className="panel-title">Why Space Health Research Improves Life on Earth (CSA &amp; NASA)</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Living in microgravity mimics accelerated aging and sedentary health issues—giving scientists six-month data that would otherwise take years to observe on Earth.
          </p>
          <div className="grid-2">
            {EARTH_BENEFITS.map((eb) => (
              <div key={eb.title} className="panel" style={{ background: 'var(--bg-space)' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '0.98rem', color: '#34d399' }}>{eb.title}</h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{eb.detail}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp" target="_blank" rel="noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>
              CSA: Why Conduct Science in Space <ExternalLink size={13} />
            </a>
            <a href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp" target="_blank" rel="noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>
              CSA: CANS Neutron Radiation Article <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      {tab === 'howto' && (
        <div className="grid-2">
          {INDICATOR_LIST.map((ind) => (
            <div key={ind.id} className="panel">
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                {ind.category}
              </div>
              <h3 style={{ margin: '2px 0 8px', fontSize: '1rem' }}>{ind.label} ({ind.unit})</h3>
              <ol style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: '0.83rem', color: '#cbd5e1' }}>
                {ind.howToMeasure.map((s, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                ))}
              </ol>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Space Context:</strong> {ind.whyInSpace}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
