import { useState, type ChangeEvent } from 'react';
import { Download, Printer, Radio, Upload } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { assessEntry } from '../domain/assess';
import { ENVIRONMENTS } from '../domain/environments';
import { INDICATOR_LIST } from '../domain/knowledge';
import { useAppStore, type PersistedPayload } from '../store/useAppStore';

export function Report() {
  const {
    profiles,
    activeProfileId,
    environment,
    entriesByProfile,
    completedTasksByProfile,
    medicalOfficerMode,
    importJsonData,
    showToast,
  } = useAppStore();

  const [downlinkState, setDownlinkState] = useState<'idle' | 'transmitting' | 'queued'>('idle');

  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const entries = entriesByProfile[profile.id] ?? [];
  const latest = entries[entries.length - 1];
  const envCfg = ENVIRONMENTS[environment];
  const assessment = latest ? assessEntry(latest, entries, environment, profile) : null;

  const handleExportJson = () => {
    const payload: PersistedPayload = {
      profiles,
      activeProfileId,
      environment,
      entriesByProfile,
      completedTasksByProfile,
      medicalOfficerMode,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astrovitals-tempus-downlink-${profile.callsign.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Tempus Pro JSON telemetry packet.');
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as PersistedPayload;
        importJsonData(parsed);
      } catch {
        showToast('Invalid JSON telemetry file.');
      }
    };
    reader.readAsText(file);
  };

  const simulateDownlink = () => {
    setDownlinkState('transmitting');
    setTimeout(() => {
      setDownlinkState('queued');
      showToast(
        envCfg.commsDelaySec > 60
          ? `Tempus Pro packet queued across ${envCfg.commsDelayLabel} deep-space link.`
          : 'Tempus Pro packet received in real time by Flight Surgeon console.'
      );
    }, 900);
  };

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Tempus Pro Telemedicine Downlink Report</h1>
          <p className="page-subtitle">
            Formatted crew medical packet for asynchronous or real-time Flight Surgeon review ({envCfg.commsDelayLabel} comms lag)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={simulateDownlink}>
            <Radio size={15} />
            {downlinkState === 'transmitting'
              ? 'Encoding Packet...'
              : downlinkState === 'queued'
                ? 'Packet Transmitted'
                : 'Simulate Downlink'}
          </button>
          <button className="btn" onClick={() => window.print()}>
            <Printer size={15} /> Print / PDF
          </button>
          <button className="btn" onClick={handleExportJson}>
            <Download size={15} /> Export JSON
          </button>
          <label className="btn">
            <Upload size={15} /> Import JSON
            <input type="file" accept="application/json" hidden onChange={handleImportJson} />
          </label>
        </div>
      </div>

      {downlinkState === 'queued' && (
        <div className="panel status-border-ok no-print" style={{ marginBottom: 16, background: 'var(--ok-soft)' }}>
          <strong>Downlink Queued:</strong> Packet for {profile.name} transmitted via Deep Space Network ({envCfg.commsDelayLabel}).{' '}
          {envCfg.autonomousFirst
            ? 'Because comms delay prevents real-time direction, follow autonomous Crew Medical Officer protocol locally.'
            : 'Flight Surgeon real-time acknowledgement expected shortly.'}
        </div>
      )}

      {!latest || !assessment ? (
        <div className="panel">No check-in logs available for {profile.name}.</div>
      ) : (
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
            <div>
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                ASTROVitals // TEMPUS PRO MEDICAL DOWNLINK • MD {latest.missionDay}
              </div>
              <h2 style={{ margin: '4px 0', fontSize: '1.35rem' }}>
                {profile.name} ({profile.callsign}) — {profile.role}
              </h2>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Environment: {envCfg.label} • Age: {profile.age} • Agency: {profile.agency} • Logged: {new Date(latest.ts).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatusBadge status={assessment.overall} />
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 6 }}>
                Readiness: {assessment.readinessScore}/100
              </div>
            </div>
          </div>

          <div className={`panel status-border-${assessment.overall}`} style={{ background: 'var(--bg-space)', marginBottom: 16 }}>
            <strong>{assessment.escalationTitle}</strong>
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              {assessment.escalationBanner}
            </p>
          </div>

          <h3 style={{ fontSize: '0.96rem', marginBottom: 8 }}>Standard Measures &amp; Dosimetry Snapshot</h3>
          <div className="grid-3" style={{ gap: 8, marginBottom: 16 }}>
            {INDICATOR_LIST.map((ind) => {
              const cls = assessment.perIndicator[ind.id];
              return (
                <div key={ind.id} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span>{ind.shortLabel}</span>
                    <StatusBadge status={cls.status} />
                  </div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 4 }}>
                    {cls.value} {ind.unit}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div>
              <h3 style={{ fontSize: '0.96rem', marginBottom: 8 }}>Active Countermeasures &amp; Treatments</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem' }}>
                {assessment.actions.map((a) => (
                  <li key={a.id} style={{ marginBottom: 6 }}>
                    <strong>{a.title}:</strong> {a.detail}
                  </li>
                ))}
              </ul>
              {latest.journalNote && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'var(--bg-space)', fontSize: '0.83rem' }}>
                  <strong>Crew Journal:</strong> “{latest.journalNote}”
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '0.96rem', marginBottom: 8 }}>Cumulative Exposure &amp; Imaging</h3>
              <div style={{ fontSize: '0.84rem', marginBottom: 10 }}>
                • Mission Radiation: <strong>{assessment.cumulative.missionRadiationMSv} mSv</strong> (CANS Neutron: {assessment.cumulative.missionNeutronMSv} mSv)<br />
                • Career Total vs. 600 mSv Limit: <strong>{assessment.cumulative.careerTotalMSv} mSv ({assessment.cumulative.careerLimitPct}%)</strong><br />
                • Est. Bone Density Change: <strong>-{assessment.cumulative.estimatedBoneLossPct}%</strong> • Spine Elongation: <strong>+{assessment.cumulative.estimatedSpineElongationPct}%</strong>
              </div>
              {latest.image && (
                <div>
                  <img src={latest.image.dataUrl} alt={latest.image.label} style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border-subtle)' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Attached Scan: {latest.image.label} ({latest.image.category})
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
