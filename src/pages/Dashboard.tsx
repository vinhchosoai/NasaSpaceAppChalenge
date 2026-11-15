import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  CheckSquare,
  Flame,
  HelpCircle,
  ShieldAlert,
  Square,
  TrendingUp,
} from 'lucide-react';
import { IndicatorGuideModal } from '../components/IndicatorGuideModal';
import { StatusBadge } from '../components/StatusBadge';
import { assessEntry } from '../domain/assess';
import { ENVIRONMENTS } from '../domain/environments';
import { computeGamification } from '../domain/gamification';
import { HAZARDS } from '../domain/hrpData';
import { INDICATOR_LIST } from '../domain/knowledge';
import type { IndicatorId } from '../domain/types';
import { useAppStore } from '../store/useAppStore';

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 88;
  const h = 26;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Dashboard() {
  const {
    profiles,
    activeProfileId,
    environment,
    entriesByProfile,
    completedTasksByProfile,
    toggleTask,
  } = useAppStore();

  const [guideId, setGuideId] = useState<IndicatorId | null>(null);

  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const entries = entriesByProfile[profile.id] ?? [];
  const latest = entries[entries.length - 1];
  const assessment = latest ? assessEntry(latest, entries, environment, profile) : null;
  const envCfg = ENVIRONMENTS[environment];
  const completedTasks = completedTasksByProfile[profile.id] ?? [];
  const gamification = computeGamification(entries, completedTasks, assessment, environment);

  const recent7 = entries.slice(-7);
  const ringRadius = 52;
  const circumference = 2 * Math.PI * ringRadius;
  const score = assessment?.readinessScore ?? 100;
  const dashOffset = circumference * (1 - score / 100);
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mission Health Dashboard</h1>
          <p className="page-subtitle">
            {profile.name} ({profile.callsign}) • {profile.agency} • {envCfg.label}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/body" className="btn" style={{ textDecoration: 'none' }}>
            Inspect Body Map
          </Link>
          <Link to="/checkin" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Log New Check-In
          </Link>
        </div>
      </div>

      {!assessment ? (
        <div className="panel">
          <p>No check-in entries logged yet for {profile.name}. Start a check-in to generate an assessment.</p>
          <Link to="/checkin" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Complete First Check-In
          </Link>
        </div>
      ) : (
        <>
          {/* Top Readiness + Escalation Banner */}
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 126, height: 126, flexShrink: 0 }}>
                <svg width="126" height="126" viewBox="0 0 126 126">
                  <circle cx="63" cy="63" r={ringRadius} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="11" />
                  <motion.circle
                    cx="63"
                    cy="63"
                    r={ringRadius}
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    transform="rotate(-90 63 63)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                  <div>
                    <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: scoreColor }}>
                      {score}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Readiness
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <StatusBadge status={assessment.overall} />
                  <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Mission Day {latest.missionDay}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                  {assessment.escalationTitle}
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {assessment.escalationBanner}
                </p>
              </div>
            </div>

            {/* Cumulative Mission Risk Summary + Gamification Header */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={17} color="#f59e0b" /> {gamification.streakDays}-Day Check-In Streak
                </span>
                <span className="chip">
                  Lv {gamification.level} • {gamification.rankTitle} ({gamification.xp} XP)
                </span>
              </div>

              <div className="grid-3" style={{ gap: 10 }}>
                <div style={{ background: 'var(--bg-space)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Career Dose (600 mSv)</div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {assessment.cumulative.careerTotalMSv} mSv ({assessment.cumulative.careerLimitPct}%)
                  </div>
                </div>
                <div style={{ background: 'var(--bg-space)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Est. Bone Density Δ</div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
                    -{assessment.cumulative.estimatedBoneLossPct}%
                  </div>
                </div>
                <div style={{ background: 'var(--bg-space)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Spine Elongation</div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>
                    +{assessment.cumulative.estimatedSpineElongationPct}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compound Hazard Alerts & Trend Flags */}
          {(assessment.compoundAlerts.length > 0 || assessment.trendFlags.length > 0) && (
            <div className="panel status-border-alert" style={{ marginBottom: 16 }}>
              <h2 className="panel-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={18} color="#ef4444" /> Compound Spaceflight Hazards &amp; Multi-Day Trends
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  NASA HRP: Hazards feed off one another
                </span>
              </h2>
              <div className="grid-2" style={{ gap: 12 }}>
                {assessment.compoundAlerts.map((ca) => (
                  <div key={ca.id} className={`panel status-border-${ca.status}`} style={{ background: 'var(--bg-space)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.9rem' }}>{ca.title}</strong>
                      <StatusBadge status={ca.status} />
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{ca.summary}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {ca.hazards.map((h) => (
                        <span key={h} className="chip" style={{ borderColor: HAZARDS[h].color, fontSize: '0.72rem' }}>
                          {HAZARDS[h].shortName}
                        </span>
                      ))}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {ca.countermeasures.map((cm, idx) => (
                        <li key={idx}>{cm}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {assessment.trendFlags.map((tf) => (
                  <div key={tf.id} className={`panel status-border-${tf.status}`} style={{ background: 'var(--bg-space)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={15} /> {tf.title}
                      </strong>
                      <StatusBadge status={tf.status} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{tf.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color-coded Indicators Grid */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <h2 className="panel-title">
              <span>Standard Measures &amp; Vitals ({INDICATOR_LIST.length} Indicators)</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Click ? on any metric for how-to-measure instructions
              </span>
            </h2>
            <div className="grid-4">
              {INDICATOR_LIST.map((ind) => {
                const cls = assessment.perIndicator[ind.id];
                const series = recent7.map((e) => e.values[ind.id]);
                const color = cls.status === 'ok' ? '#10b981' : cls.status === 'warn' ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={ind.id}
                    className={`panel status-border-${cls.status} ${cls.status === 'alert' ? 'pulse-alert' : ''}`}
                    style={{ background: 'var(--bg-panel-alt)', padding: 12 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{ind.shortLabel}</div>
                      <button
                        className="btn btn-sm"
                        style={{ padding: '2px 6px' }}
                        onClick={() => setGuideId(ind.id)}
                        aria-label={`How to measure ${ind.label}`}
                        title="How to measure & why in space"
                      >
                        <HelpCircle size={13} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '8px 0 6px' }}>
                      <div>
                        <span className="mono" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                          {cls.value}
                        </span>{' '}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{ind.unit}</span>
                      </div>
                      <Sparkline values={series} color={color} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <StatusBadge status={cls.status} />
                      {cls.baselineDelta !== undefined && (
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Δ {cls.baselineDelta >= 0 ? `+${cls.baselineDelta}` : cls.baselineDelta}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>{cls.note}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions + Daily Gamified Routine */}
          <div className="grid-2">
            <div className="panel">
              <h2 className="panel-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={17} color="#f59e0b" /> Prioritized Treatments &amp; Countermeasures
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assessment.actions.map((act) => (
                  <div
                    key={act.id}
                    className={`panel status-border-${act.priority}`}
                    style={{ background: 'var(--bg-space)', padding: 12 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: '0.88rem' }}>{act.title}</strong>
                      <StatusBadge status={act.priority} label={act.category} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{act.detail}</p>
                    {act.studyRef && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 4 }}>
                        Evidence Basis: {act.studyRef}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2 className="panel-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={17} color="#38bdf8" /> Daily Countermeasure Missions &amp; Badges
                </span>
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {completedTasks.length}/{gamification.tasks.length} Done
                </span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {gamification.tasks.map((task) => {
                  const done = completedTasks.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="panel"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        textAlign: 'left',
                        background: done ? 'rgba(16,185,129,0.1)' : 'var(--bg-space)',
                        borderColor: done ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)',
                        padding: 10,
                      }}
                    >
                      {done ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="#64748b" />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, textDecoration: done ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.detail}</div>
                      </div>
                      <span className="chip" style={{ fontSize: '0.72rem' }}>+{task.xp} XP</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>Mission Badges</div>
              <div className="grid-2" style={{ gap: 8 }}>
                {gamification.badges.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: b.unlocked ? 'var(--ok-soft)' : 'var(--bg-space)',
                      border: `1px solid ${b.unlocked ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)'}`,
                      opacity: b.unlocked ? 1 : 0.65,
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{b.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{b.progressText}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <IndicatorGuideModal indicatorId={guideId} onClose={() => setGuideId(null)} />
    </div>
  );
}
