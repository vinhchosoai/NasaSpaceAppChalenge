import { useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon, Radiation } from 'lucide-react';
import { assessEntry, detectTrendFlags } from '../domain/assess';
import { INDICATOR_LIST, INDICATORS } from '../domain/knowledge';
import type { IndicatorId } from '../domain/types';
import { useAppStore } from '../store/useAppStore';

export function Trends() {
  const { profiles, activeProfileId, environment, entriesByProfile } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const allEntries = [...(entriesByProfile[profile.id] ?? [])].sort((a, b) => a.missionDay - b.missionDay);

  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorId>('systolic');
  const [windowDays, setWindowDays] = useState<number>(30);

  const sliced = windowDays === 0 ? allEntries : allEntries.slice(-windowDays);
  const indCfg = INDICATORS[selectedIndicator];
  const trendFlags = detectTrendFlags(allEntries);
  const latest = allEntries[allEntries.length - 1];
  const latestAssess = latest ? assessEntry(latest, allEntries, environment, profile) : null;

  const baselineValue =
    selectedIndicator in profile.baseline
      ? profile.baseline[selectedIndicator as keyof typeof profile.baseline]
      : undefined;

  const chartData = sliced.map((e) => ({
    day: `MD ${e.missionDay}`,
    value: e.values[selectedIndicator],
    systolic: e.values.systolic,
    diastolic: e.values.diastolic,
    chargedRad: Number(Math.max(0, e.values.radiationDose - e.values.neutronDose).toFixed(2)),
    neutronRad: e.values.neutronDose,
    totalRad: e.values.radiationDose,
  }));

  let runningRad = profile.priorCareerDoseMSv;
  const cumulativeRadData = allEntries.map((e) => {
    runningRad += e.values.radiationDose;
    return {
      day: `MD ${e.missionDay}`,
      dailyTotal: e.values.radiationDose,
      dailyNeutron: e.values.neutronDose,
      careerTotal: Number(runningRad.toFixed(2)),
    };
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dynamic Health Trends &amp; Dosimetry</h1>
          <p className="page-subtitle">
            {profile.name} • Shaded green band marks nominal range • Dashed line marks pre-flight personal baseline
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: '7 Days', days: 7 },
            { label: '14 Days', days: 14 },
            { label: '30 Days', days: 30 },
            { label: 'All Mission', days: 0 },
          ].map((opt) => (
            <button
              key={opt.label}
              className={`chip ${windowDays === opt.days ? 'active' : ''}`}
              onClick={() => setWindowDays(opt.days)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator Selector */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {INDICATOR_LIST.map((ind) => (
            <button
              key={ind.id}
              className={`chip ${selectedIndicator === ind.id ? 'active' : ''}`}
              onClick={() => setSelectedIndicator(ind.id)}
            >
              {ind.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dynamic Chart */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <h2 className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LineChartIcon size={17} color="#38bdf8" />
            {selectedIndicator === 'systolic' || selectedIndicator === 'diastolic'
              ? 'Blood Pressure Trend (Systolic & Diastolic mmHg)'
              : `${indCfg.label} (${indCfg.unit})`}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Nominal: {indCfg.nominalText}
          </span>
        </h2>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1424',
                  borderColor: 'rgba(56,189,248,0.4)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                }}
              />
              <ReferenceArea
                y1={indCfg.nominalBand[0]}
                y2={indCfg.nominalBand[1]}
                fill="#10b981"
                fillOpacity={0.12}
              />
              {baselineValue !== undefined && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  label={{ value: `Baseline (${baselineValue})`, fill: '#94a3b8', fontSize: 11, position: 'insideTopRight' }}
                />
              )}
              {selectedIndicator === 'systolic' || selectedIndicator === 'diastolic' ? (
                <>
                  <Line type="monotone" dataKey="systolic" name="Systolic (mmHg)" stroke="#38bdf8" strokeWidth={2.4} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="diastolic" name="Diastolic (mmHg)" stroke="#a855f7" strokeWidth={2.2} dot={{ r: 3 }} isAnimationActive={false} />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="value"
                  name={`${indCfg.shortLabel} (${indCfg.unit})`}
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.18}
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {trendFlags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {trendFlags.map((tf) => (
              <span key={tf.id} className={`badge badge-${tf.status}`}>
                {tf.title}: {tf.detail}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CSA CANS Neutron + Charged Radiation Chart */}
      <div className="panel">
        <h2 className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radiation size={17} color="#a855f7" /> Radiation Dosimetry: Charged Particles vs. CSA CANS Neutron Share (~30% ISS)
          </span>
          {latestAssess && (
            <span className="mono" style={{ fontSize: '0.82rem' }}>
              Career Total: {latestAssess.cumulative.careerTotalMSv} / 600 mSv ({latestAssess.cumulative.careerLimitPct}%)
            </span>
          )}
        </h2>

        <div className="grid-2">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1424', borderColor: 'rgba(168,85,247,0.4)', borderRadius: 8 }}
                />
                <ReferenceLine y={2.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'SPE Alert (2.0)', fill: '#f87171', fontSize: 10 }} />
                <Bar dataKey="chargedRad" stackId="rad" name="Charged Particles (mSv/d)" fill="#38bdf8" isAnimationActive={false} />
                <Bar dataKey="neutronRad" stackId="rad" name="CANS Neutron Dose (mSv/d)" fill="#a855f7" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <ComposedChart data={cumulativeRadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1424', borderColor: 'rgba(168,85,247,0.4)', borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="careerTotal"
                  name="Cumulative Career Dose (mSv)"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                  strokeWidth={2.2}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
