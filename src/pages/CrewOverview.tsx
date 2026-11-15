import { useState, type FormEvent } from 'react';
import { RotateCcw, Stethoscope, Trash2, UserPlus, Users } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { assessEntry } from '../domain/assess';
import { computeStreak } from '../domain/gamification';
import type { CrewRole, IndicatorId, Profile } from '../domain/types';
import { useAppStore } from '../store/useAppStore';

const HEATMAP_INDICATORS: { id: IndicatorId; label: string }[] = [
  { id: 'systolic', label: 'BP' },
  { id: 'heartRate', label: 'HR' },
  { id: 'spo2', label: 'SpO₂' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'mood', label: 'Mood' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'hydration', label: 'Hydration' },
  { id: 'visionScore', label: 'SANS' },
  { id: 'radiationDose', label: 'Rad' },
];

export function CrewOverview() {
  const {
    profiles,
    activeProfileId,
    environment,
    entriesByProfile,
    medicalOfficerMode,
    setActiveProfile,
    toggleMedicalOfficerMode,
    addOrUpdateProfile,
    deleteProfile,
    resetDemoData,
  } = useAppStore();

  const [showNewModal, setShowNewModal] = useState(false);
  const [name, setName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [role, setRole] = useState<CrewRole>('Mission Specialist');
  const [agency, setAgency] = useState('NASA');
  const [age, setAge] = useState(37);
  const [priorDose, setPriorDose] = useState(35);

  const crewAssessments = profiles.map((p) => {
    const entries = entriesByProfile[p.id] ?? [];
    const latest = entries[entries.length - 1];
    const assessment = latest ? assessEntry(latest, entries, environment, p) : null;
    return { profile: p, entries, latest, assessment, streak: computeStreak(entries) };
  });

  const avgReadiness = Math.round(
    crewAssessments.reduce((acc, c) => acc + (c.assessment?.readinessScore ?? 100), 0) /
      Math.max(1, crewAssessments.length)
  );

  const handleCreateProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = `astro-${Date.now()}`;
    const newProf: Profile = {
      id,
      name: name.trim(),
      callsign: (callsign.trim() || name.trim().slice(0, 6)).toUpperCase(),
      role,
      agency: agency.trim() || 'NASA',
      age,
      sex: 'X',
      avatarColor: '#38bdf8',
      missionDay0: new Date().toISOString(),
      priorCareerDoseMSv: priorDose,
      baseline: {
        systolic: 116,
        diastolic: 74,
        heartRate: 62,
        glucose: 86,
        temperature: 36.6,
        spo2: 98,
        reactionMs: 250,
      },
    };
    addOrUpdateProfile(newProf);
    setName('');
    setCallsign('');
    setShowNewModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Crew Overview &amp; Profile Console</h1>
          <p className="page-subtitle">
            Cooperative crew readiness (NASA Teamwork Risk) • Privacy-aware summary by default, full vitals in Crew Medical Officer Mode
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn ${medicalOfficerMode ? 'btn-primary' : ''}`}
            onClick={toggleMedicalOfficerMode}
          >
            <Stethoscope size={15} /> {medicalOfficerMode ? 'Medical Officer Mode: ON' : 'Unlock Medical Officer View'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <UserPlus size={15} /> Add Crew Profile
          </button>
          <button className="btn btn-danger" onClick={() => void resetDemoData()}>
            <RotateCcw size={15} /> Reset Demo Data
          </button>
        </div>
      </div>

      {/* Cooperative Crew Readiness Goal */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={17} color="#38bdf8" /> Crew Cooperative Readiness Score
          </strong>
          <span className="mono" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            {avgReadiness} / 100
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: 'var(--bg-space)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${avgReadiness}%`,
              height: '100%',
              background: avgReadiness >= 80 ? '#10b981' : avgReadiness >= 60 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Crew Profile Cards */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        {crewAssessments.map(({ profile, latest, assessment, streak }) => {
          const isActive = profile.id === activeProfileId;
          return (
            <div
              key={profile.id}
              className={`panel status-border-${assessment?.overall ?? 'ok'}`}
              style={{ borderColor: isActive ? 'var(--accent)' : undefined }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: profile.avatarColor,
                      color: '#050912',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{profile.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {profile.role} • {profile.agency} • {streak}d streak
                    </div>
                  </div>
                </div>
                {assessment && <StatusBadge status={assessment.overall} />}
              </div>

              {assessment ? (
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                  <div>
                    Readiness: <strong className="mono">{assessment.readinessScore}/100</strong> •{' '}
                    Career Rad: <strong className="mono">{assessment.cumulative.careerTotalMSv} mSv</strong>
                  </div>
                  <div style={{ marginTop: 4 }}>{assessment.escalationTitle}</div>
                  {medicalOfficerMode && latest && (
                    <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'var(--bg-space)', fontSize: '0.78rem' }}>
                      <div>
                        BP {latest.values.systolic}/{latest.values.diastolic} mmHg • HR {latest.values.heartRate} bpm • SpO₂ {latest.values.spo2}% • Sleep {latest.values.sleep} h • SANS lvl {latest.values.visionScore}
                      </div>
                      {latest.journalNote && <div style={{ marginTop: 4, color: '#cbd5e1' }}>Note: “{latest.journalNote}”</div>}
                      {latest.image && <div style={{ marginTop: 4, color: '#38bdf8' }}>Attached scan: {latest.image.label}</div>}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>No check-ins recorded yet.</p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`btn btn-sm ${isActive ? 'btn-primary' : ''}`}
                  onClick={() => setActiveProfile(profile.id)}
                >
                  {isActive ? 'Active Profile' : 'Switch to Astronaut'}
                </button>
                {profiles.length > 1 && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteProfile(profile.id)}
                    aria-label={`Delete ${profile.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Crew × Indicator Heatmap */}
      <div className="panel" style={{ overflowX: 'auto' }}>
        <h2 className="panel-title">Crew × Indicator Status Heatmap</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>Crew Member</th>
              {HEATMAP_INDICATORS.map((col) => (
                <th key={col.id} style={{ padding: '8px 6px', textAlign: 'center' }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crewAssessments.map(({ profile, assessment }) => (
              <tr key={profile.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 6px', fontWeight: 600 }}>{profile.name}</td>
                {HEATMAP_INDICATORS.map((col) => {
                  const cls = assessment?.perIndicator[col.id];
                  const st = cls?.status ?? 'ok';
                  const bg =
                    st === 'ok'
                      ? 'rgba(16,185,129,0.22)'
                      : st === 'warn'
                        ? 'rgba(245,158,11,0.26)'
                        : 'rgba(239,68,68,0.32)';
                  return (
                    <td key={col.id} style={{ padding: 4, textAlign: 'center' }}>
                      <div
                        className="mono"
                        style={{
                          padding: '5px 4px',
                          borderRadius: 6,
                          background: bg,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                        }}
                      >
                        {medicalOfficerMode && cls ? cls.value : st.toUpperCase()}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Add Crew Profile" onClick={() => setShowNewModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateProfile}>
            <h2 style={{ marginTop: 0 }}>Create Crew Astronaut Profile</h2>
            <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
              <div className="field">
                <label className="field-label">Full Name</label>
                <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PS Maya Patel" />
              </div>
              <div className="field">
                <label className="field-label">Callsign</label>
                <input className="input" value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="PATEL-05" />
              </div>
              <div className="field">
                <label className="field-label">Role</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value as CrewRole)}>
                  <option value="Commander">Commander</option>
                  <option value="Pilot">Pilot</option>
                  <option value="Mission Specialist">Mission Specialist</option>
                  <option value="Medical Officer">Medical Officer</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Agency</label>
                <input className="input" value={agency} onChange={(e) => setAgency(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Age</label>
                <input type="number" className="input" value={age} onChange={(e) => setAge(Number(e.target.value))} />
              </div>
              <div className="field">
                <label className="field-label">Prior Career Radiation (mSv)</label>
                <input type="number" className="input" value={priorDose} onChange={(e) => setPriorDose(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Profile</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
