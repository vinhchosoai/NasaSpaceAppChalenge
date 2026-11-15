import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Filter, Layers, ShieldCheck } from 'lucide-react';
import { BodySvg } from '../components/BodySvg';
import { StatusBadge } from '../components/StatusBadge';
import { assessEntry } from '../domain/assess';
import { ENVIRONMENTS } from '../domain/environments';
import { BODY_REGIONS, BODY_REGION_LIST, HAZARD_LIST, HAZARDS, HRP_RISKS } from '../domain/hrpData';
import { INDICATORS } from '../domain/knowledge';
import type { BodyRegionId, HazardId } from '../domain/types';
import { useAppStore } from '../store/useAppStore';

export function BodyMap() {
  const { profiles, activeProfileId, environment, entriesByProfile } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const entries = entriesByProfile[profile.id] ?? [];
  const latest = entries[entries.length - 1];
  const assessment = latest ? assessEntry(latest, entries, environment, profile) : null;
  const envCfg = ENVIRONMENTS[environment];

  const [selectedRegion, setSelectedRegion] = useState<BodyRegionId>('eyes');
  const [hazardFilter, setHazardFilter] = useState<HazardId | null>(null);
  const [simGravityG, setSimGravityG] = useState<number>(envCfg.gravityG);

  useEffect(() => {
    setSimGravityG(envCfg.gravityG);
  }, [envCfg.gravityG]);

  const regionInfo = BODY_REGIONS[selectedRegion];
  const regionStatus = assessment?.bodyRegions[selectedRegion];
  const highlightedRegions = hazardFilter ? HAZARDS[hazardFilter].affectedRegions : null;
  const linkedRisks = HRP_RISKS.filter((r) => regionInfo.linkedRisks.includes(r.id));

  const gravityPresetLabel =
    simGravityG <= 0.02
      ? '0 g Orbit (Strong headward fluid shift & spine elongation)'
      : simGravityG <= 0.2
        ? '0.166 g Moon (Partial unloading, lunar EVA suit stress)'
        : simGravityG <= 0.5
          ? '0.38 g Mars (G-transition vestibular & orthostatic readaptation)'
          : '1.0 g Earth Return (Orthostatic fainting & dynamic load egress risk)';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Interactive Astronaut Body Map</h1>
          <p className="page-subtitle">
            Click any anatomical region (front or back) to inspect organ function, live biomarkers, NASA HRP risks, and countermeasures.
          </p>
        </div>
        <Link to="/checkin" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Update Vitals
        </Link>
      </div>

      {/* Hazard Filter Chips */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#38bdf8" /> Filter by NASA 5 Hazards:
          </span>
          <button
            className={`chip ${hazardFilter === null ? 'active' : ''}`}
            onClick={() => setHazardFilter(null)}
          >
            All Systems
          </button>
          {HAZARD_LIST.map((hz) => (
            <button
              key={hz.id}
              className={`chip ${hazardFilter === hz.id ? 'active' : ''}`}
              style={{ borderColor: hazardFilter === hz.id ? hz.color : undefined }}
              onClick={() => setHazardFilter(hazardFilter === hz.id ? null : hz.id)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hz.color }} />
              {hz.name}
            </button>
          ))}
        </div>
        {hazardFilter && (
          <p style={{ margin: '10px 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
            <strong>{HAZARDS[hazardFilter].name}:</strong> {HAZARDS[hazardFilter].description}
          </p>
        )}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Interactive SVG + Gravity Simulator */}
        <div className="panel">
          {assessment ? (
            <BodySvg
              regionStatuses={assessment.bodyRegions}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              highlightedRegions={highlightedRegions}
              simulatedGravityG={simGravityG}
            />
          ) : (
            <p>Log a check-in to populate body region statuses.</p>
          )}

          {/* Quick Region Pills for keyboard/accessibility */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {BODY_REGION_LIST.map((r) => {
              const st = assessment?.bodyRegions[r.id]?.status ?? 'ok';
              return (
                <button
                  key={r.id}
                  className={`chip ${selectedRegion === r.id ? 'active' : ''}`}
                  onClick={() => setSelectedRegion(r.id)}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: st === 'ok' ? '#10b981' : st === 'warn' ? '#f59e0b' : '#ef4444',
                    }}
                  />
                  {r.name.split(' ')[0].replace(/,$/, '')}
                </button>
              );
            })}
          </div>

          {/* Gravity Field Simulator */}
          <div className="panel" style={{ marginTop: 14, background: 'var(--bg-space)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={15} color="#38bdf8" /> Gravity Field &amp; Fluid-Shift Simulator
              </strong>
              <span className="mono" style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
                {simGravityG.toFixed(2)} g
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={simGravityG}
              aria-label="Simulate Gravity Field in g"
              onChange={(e) => setSimGravityG(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {[
                { label: '0 g Orbit', val: 0 },
                { label: '⅙ g Moon', val: 0.166 },
                { label: '⅜ g Mars', val: 0.38 },
                { label: '1 g Earth', val: 1 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  className="btn btn-sm"
                  onClick={() => setSimGravityG(preset.val)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              {gravityPresetLabel}
            </div>
          </div>
        </div>

        {/* Right: Detailed Organ / System Drawer */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                Anatomical Region Inspector ({regionInfo.view} view)
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: '1.3rem' }}>{regionInfo.name}</h2>
            </div>
            {regionStatus && <StatusBadge status={regionStatus.status} />}
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 10px' }}>
            <strong>Normal Function:</strong> {regionInfo.functionSummary}
          </p>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: '0 0 14px' }}>
            <strong>Spaceflight Adaptation:</strong> {regionInfo.spaceAdaptation}
          </p>

          {/* Live Drivers & Linked Indicators */}
          {assessment && regionStatus && (
            <div className={`panel status-border-${regionStatus.status}`} style={{ background: 'var(--bg-space)', marginBottom: 14 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#38bdf8" /> {profile.name} — Current Status Drivers
              </div>
              <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {regionStatus.drivers.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {regionInfo.linkedIndicators.map((indId) => {
                  const cls = assessment.perIndicator[indId];
                  const cfg = INDICATORS[indId];
                  return (
                    <span key={indId} className={`badge badge-${cls.status}`}>
                      {cfg.shortLabel}: {cls.value} {cfg.unit}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cumulative Estimators for Bone/Spine/Brain */}
          {assessment && (selectedRegion === 'bones' || selectedRegion === 'spine' || selectedRegion === 'brain') && (
            <div className="panel" style={{ background: 'var(--bg-panel-alt)', marginBottom: 14 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
                Mission Cumulative Estimators (Day {assessment.cumulative.missionDays})
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                • Estimated Bone Density Loss: <strong>-{assessment.cumulative.estimatedBoneLossPct}%</strong> (unmitigated rate: 1–1.5%/mo)<br />
                • Estimated Spinal Elongation: <strong>+{assessment.cumulative.estimatedSpineElongationPct}%</strong> (up to 3% in 0 g)<br />
                • Cumulative Career Radiation: <strong>{assessment.cumulative.careerTotalMSv} / 600 mSv</strong> ({assessment.cumulative.careerLimitPct}%)
              </div>
            </div>
          )}

          {/* Countermeasures */}
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ShieldCheck size={15} color="#10b981" /> Recommended Countermeasures
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#cbd5e1' }}>
              {regionInfo.countermeasures.map((cm, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{cm}</li>
              ))}
            </ul>
          </div>

          {/* Linked NASA HRP Risks */}
          <div>
            <h3 style={{ fontSize: '0.92rem', marginBottom: 8 }}>Linked NASA HRP Risks ({linkedRisks.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {linkedRisks.map((risk) => (
                <div key={risk.id} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-space)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{risk.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>{risk.didYouKnow}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <Link to="/learn" style={{ fontSize: '0.82rem' }}>Explore full NASA HRP Risks &amp; Studies →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
