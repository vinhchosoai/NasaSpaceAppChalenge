import { useEffect, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bell,
  BookOpen,
  ClipboardPlus,
  FileText,
  Globe2,
  LineChart,
  Rocket,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { assessEntry } from '../domain/assess';
import { ENV_LIST, ENVIRONMENTS } from '../domain/environments';
import { useAppStore } from '../store/useAppStore';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const {
    profiles,
    activeProfileId,
    environment,
    entriesByProfile,
    setActiveProfile,
    setEnvironment,
    medicalOfficerMode,
    toggleMedicalOfficerMode,
    toastMessage,
    clearToast,
  } = useAppStore();

  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const entries = entriesByProfile[profile.id] ?? [];
  const latest = entries[entries.length - 1];
  const assessment = latest ? assessEntry(latest, entries, environment, profile) : null;
  const envCfg = ENVIRONMENTS[environment];

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => clearToast(), 3600);
    return () => clearTimeout(t);
  }, [toastMessage, clearToast]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/body', label: 'Human Body Map', icon: User },
    { to: '/checkin', label: 'Self Check-In & Exams', icon: ClipboardPlus },
    { to: '/trends', label: 'Trends & Dosimetry', icon: LineChart },
    { to: '/crew', label: 'Crew & Profiles', icon: Users },
    { to: '/learn', label: 'NASA HRP & CSA Learn', icon: BookOpen },
    { to: '/report', label: 'Tempus Pro Downlink', icon: FileText },
  ];

  const readinessColor =
    !assessment
      ? '#38bdf8'
      : assessment.readinessScore >= 80
        ? '#10b981'
        : assessment.readinessScore >= 60
          ? '#f59e0b'
          : '#ef4444';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Rocket size={20} color="#fff" />
          </div>
          <div>
            <div className="brand-title">ASTROVitals</div>
            <div className="brand-sub">NASA HRP Self-Assessment Console</div>
          </div>
        </div>

        <div className="telemetry-strip">
          <span className="tele-pill mono">
            MD <strong>{latest?.missionDay ?? 0}</strong>
          </span>
          <span className="tele-pill">
            Gravity: <strong>{envCfg.gravityLabel}</strong>
          </span>
          <span className="tele-pill">
            Rad Base: <strong>{envCfg.radBaselineMSvDay} mSv/d</strong>
          </span>
          <span className="tele-pill">
            Comms Lag: <strong>{envCfg.commsDelayLabel}</strong>
          </span>
          <span className="tele-pill" style={{ borderColor: readinessColor }}>
            Readiness:{' '}
            <strong style={{ color: readinessColor }}>
              {assessment ? `${assessment.readinessScore}/100` : '--'}
            </strong>
          </span>
        </div>

        <div className="topbar-controls">
          <label className="control-chip" title="Switch active astronaut profile">
            <User size={15} color={profile.avatarColor} />
            <select
              aria-label="Active Crew Member"
              value={profile.id}
              onChange={(e) => setActiveProfile(e.target.value)}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </label>

          <label className="control-chip" title="Switch mission environment">
            <Globe2 size={15} color="#38bdf8" />
            <select
              aria-label="Mission Environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as typeof environment)}
            >
              {ENV_LIST.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.label}
                </option>
              ))}
            </select>
          </label>

          <button
            className={`btn btn-sm ${medicalOfficerMode ? 'btn-primary' : ''}`}
            onClick={toggleMedicalOfficerMode}
            title="Toggle Crew Medical Officer detailed clinical access (Tempus Pro)"
          >
            <Stethoscope size={14} />
            <span>{medicalOfficerMode ? 'CMO Mode: ON' : 'CMO Mode'}</span>
          </button>
        </div>
      </header>

      <nav className="sidenav" aria-label="Primary Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="nav-spacer" />

        <div className="reminder-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
            <Bell size={14} color="#38bdf8" /> Routine Prompt
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            Next Standard Measures window: <strong>20:00 UTC</strong> (Evening Mood, Food Acceptability & CANS Dose).
          </div>
          <NavLink to="/checkin" className="btn btn-primary btn-sm" style={{ width: '100%', textDecoration: 'none' }}>
            Start Check-In
          </NavLink>
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <footer className="disclaimer-footer">
        <span>
          <strong>Medical & Simulation Disclaimer:</strong> AstroVitals combines NASA HRP &amp; Canadian Space Agency research with public AHA/ADA/WHO clinical guidelines for astronaut self-assessment training. It does not replace a flight surgeon’s medical diagnosis.
        </span>
        <span className="mono">
          {envCfg.insideMagnetosphere ? 'Inside Magnetosphere (LEO)' : 'Deep Space — Beyond Magnetosphere'} • 100% Offline IndexedDB
        </span>
      </footer>

      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
