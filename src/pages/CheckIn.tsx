import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Eye,
  HelpCircle,
  Radio,
  Sparkles,
  Timer,
  Upload,
} from 'lucide-react';
import { IndicatorGuideModal } from '../components/IndicatorGuideModal';
import { StatusBadge } from '../components/StatusBadge';
import { assessEntry, classifyIndicator } from '../domain/assess';
import { ENVIRONMENTS } from '../domain/environments';
import { INDICATORS, SYMPTOM_CATALOG } from '../domain/knowledge';
import { SAMPLE_MEDICAL_IMAGES } from '../domain/seed';
import type {
  AttachedImage,
  Entry,
  ExerciseModality,
  ImageCategory,
  IndicatorId,
  SymptomId,
} from '../domain/types';
import { useAppStore } from '../store/useAppStore';

type FormValues = Entry['values'];

function defaultValuesForProfile(profileBaseline: {
  systolic: number;
  diastolic: number;
  heartRate: number;
  glucose: number;
  temperature: number;
  spo2: number;
  reactionMs: number;
}, radBase: number, neutronShare: number): FormValues {
  return {
    systolic: profileBaseline.systolic,
    diastolic: profileBaseline.diastolic,
    heartRate: profileBaseline.heartRate,
    glucose: profileBaseline.glucose,
    temperature: profileBaseline.temperature,
    sleep: 7.4,
    mood: 4,
    spo2: profileBaseline.spo2,
    exercise: 90,
    hydration: 2.3,
    foodAcceptability: 4,
    radiationDose: radBase,
    neutronDose: Number((radBase * neutronShare).toFixed(2)),
    visionScore: 0,
    reactionMs: profileBaseline.reactionMs,
  };
}

export function CheckIn() {
  const { profiles, activeProfileId, environment, entriesByProfile, addEntry, showToast } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const entries = entriesByProfile[profile.id] ?? [];
  const nextMissionDay = (entries[entries.length - 1]?.missionDay ?? 0) + 1;
  const envCfg = ENVIRONMENTS[environment];

  const [values, setValues] = useState<FormValues>(() =>
    defaultValuesForProfile(profile.baseline, envCfg.radBaselineMSvDay, envCfg.neutronShare)
  );
  const [exerciseModality, setExerciseModality] = useState<ExerciseModality>(
    envCfg.hasTreadmill ? 'treadmill' : 'resistance'
  );
  const [circadianLightUsed, setCircadianLightUsed] = useState(true);
  const [lateCaffeine, setLateCaffeine] = useState(false);
  const [crewInteractionScore, setCrewInteractionScore] = useState(4);
  const [evaToday, setEvaToday] = useState(false);
  const [partialDepressurizedCabin, setPartialDepressurizedCabin] = useState(false);
  const [symptoms, setSymptoms] = useState<SymptomId[]>([]);
  const [journalNote, setJournalNote] = useState('');
  const [image, setImage] = useState<AttachedImage | undefined>(undefined);
  const [imageCategory, setImageCategory] = useState<ImageCategory>('ultrasound-ocular');
  const [guideId, setGuideId] = useState<IndicatorId | null>(null);
  const [submittedEntryId, setSubmittedEntryId] = useState<string | null>(null);

  // Interactive Amsler Grid state
  const [flaggedCells, setFlaggedCells] = useState<number[]>([]);

  // Interactive 15s Reaction Test state
  const [reactionPhase, setReactionPhase] = useState<'idle' | 'waiting' | 'ready' | 'done'>('idle');
  const [reactionTrials, setReactionTrials] = useState<number[]>([]);
  const readyTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Live Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const draftEntry: Entry = {
    id: 'draft-preview',
    profileId: profile.id,
    ts: new Date().toISOString(),
    missionDay: nextMissionDay,
    env: environment,
    values,
    exerciseModality,
    circadianLightUsed,
    lateCaffeine,
    crewInteractionScore,
    evaToday,
    partialDepressurizedCabin,
    symptoms,
    journalNote,
    image,
  };

  const liveAssessment = assessEntry(draftEntry, entries, environment, profile);

  const updateVal = (id: IndicatorId, num: number) => {
    setValues((prev) => ({ ...prev, [id]: Number.isFinite(num) ? num : 0 }));
  };

  const toggleSymptom = (id: SymptomId) => {
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const toggleAmslerCell = (idx: number) => {
    setFlaggedCells((prev) => {
      const next = prev.includes(idx) ? prev.filter((c) => c !== idx) : [...prev, idx];
      const nextScore = next.length >= 2 ? 2 : next.length === 1 ? 1 : 0;
      setValues((v) => ({ ...v, visionScore: nextScore }));
      return next;
    });
  };

  const startReactionTrial = (existingTrials: number[] = []) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setReactionPhase('waiting');
    const delay = 800 + Math.round(Math.random() * 1400);
    timerRef.current = window.setTimeout(() => {
      readyTimeRef.current = performance.now();
      setReactionPhase('ready');
    }, delay);
    if (existingTrials.length === 0) setReactionTrials([]);
  };

  const handleReactionTap = () => {
    if (reactionPhase === 'waiting') {
      // Early tap penalty
      const next = [...reactionTrials, 460];
      if (next.length >= 3) {
        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
        setReactionTrials(next);
        setReactionPhase('done');
        updateVal('reactionMs', avg);
      } else {
        setReactionTrials(next);
        startReactionTrial(next);
      }
      return;
    }
    if (reactionPhase === 'ready') {
      const ms = Math.max(150, Math.round(performance.now() - readyTimeRef.current));
      const next = [...reactionTrials, ms];
      setReactionTrials(next);
      if (next.length >= 3) {
        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
        setReactionPhase('done');
        updateVal('reactionMs', avg);
      } else {
        startReactionTrial(next);
      }
    }
  };

  const syncBioMonitorAndCans = () => {
    const jitter = (base: number, span: number) =>
      Math.round(base + (Math.random() * 2 - 1) * span);
    const totalRad = Number((envCfg.radBaselineMSvDay * (0.95 + Math.random() * 0.25)).toFixed(2));
    const neutron = Number((totalRad * envCfg.neutronShare).toFixed(2));
    setValues((prev) => ({
      ...prev,
      systolic: jitter(profile.baseline.systolic, 5),
      diastolic: jitter(profile.baseline.diastolic, 4),
      heartRate: jitter(profile.baseline.heartRate, 5),
      spo2: 98,
      temperature: Number((profile.baseline.temperature + (Math.random() * 0.2 - 0.1)).toFixed(1)),
      radiationDose: totalRad,
      neutronDose: neutron,
    }));
    showToast('Synced live telemetry from CSA Bio-Monitor smart shirt & CANS spectrometer.');
  };

  const applyPreset = (preset: 'nominal' | 'sans-bp' | 'spe' | 'eva-dcs' | 'sleep-menu') => {
    setSubmittedEntryId(null);
    if (preset === 'nominal') {
      setValues(defaultValuesForProfile(profile.baseline, envCfg.radBaselineMSvDay, envCfg.neutronShare));
      setSymptoms([]);
      setEvaToday(false);
      setPartialDepressurizedCabin(false);
      setFlaggedCells([]);
      setJournalNote('All Standard Measures nominal; 90-min workout complete.');
    } else if (preset === 'sans-bp') {
      setValues({
        ...defaultValuesForProfile(profile.baseline, envCfg.radBaselineMSvDay, envCfg.neutronShare),
        systolic: 185,
        diastolic: 122,
        visionScore: 2,
        hydration: 1.9,
      });
      setSymptoms(['blurred-vision', 'headache']);
      setFlaggedCells([44, 45, 54]);
      setImage({ ...SAMPLE_MEDICAL_IMAGES['ultrasound-ocular'], capturedAt: new Date().toISOString() });
      setJournalNote('Acute headache and wavy Amsler central lines; urgent BP & ocular check.');
    } else if (preset === 'spe') {
      setValues({
        ...defaultValuesForProfile(profile.baseline, envCfg.radBaselineMSvDay, envCfg.neutronShare),
        radiationDose: 3.1,
        neutronDose: 0.93,
        sleep: 5.8,
        temperature: 37.7,
      });
      setSymptoms(['rash-cold-sore']);
      setImage({ ...SAMPLE_MEDICAL_IMAGES['skin-rash'], capturedAt: new Date().toISOString() });
      setJournalNote('Solar Particle Event alert on CANS; storm shelter activated, skin rash noted.');
    } else if (preset === 'eva-dcs') {
      setValues({
        ...defaultValuesForProfile(profile.baseline, envCfg.radBaselineMSvDay, envCfg.neutronShare),
        spo2: 90,
        reactionMs: 435,
        heartRate: 108,
      });
      setEvaToday(true);
      setPartialDepressurizedCabin(true);
      setSymptoms(['joint-pain-eva', 'shortness-of-breath']);
      setJournalNote('Post-EVA shoulder joint ache and mild dyspnea in partial-pressure cabin.');
    } else if (preset === 'sleep-menu') {
      setValues({
        ...defaultValuesForProfile(profile.baseline, envCfg.radBaselineMSvDay, envCfg.neutronShare),
        sleep: 5.1,
        mood: 2,
        foodAcceptability: 2,
        exercise: 40,
        hydration: 1.5,
        glucose: 65,
        reactionMs: 365,
      });
      setCircadianLightUsed(false);
      setLateCaffeine(true);
      setCrewInteractionScore(2);
      setSymptoms([]);
      setJournalNote('Exhausted from 16 sunrises/day; low appetite for standard rations.');
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 60);
    } catch {
      setCameraError('Camera unavailable or permission denied. Use File Upload or Sample Space Scans below.');
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      setImage({
        dataUrl,
        category: imageCategory,
        label: `Camera Capture (${imageCategory})`,
        capturedAt: new Date().toISOString(),
      });
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraOpen(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage({
          dataUrl: reader.result,
          category: imageCategory,
          label: file.name,
          capturedAt: new Date().toISOString(),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const entry: Entry = {
      ...draftEntry,
      id: `${profile.id}-d${nextMissionDay}-${Date.now()}`,
      ts: new Date().toISOString(),
    };
    addEntry(entry);
    setSubmittedEntryId(entry.id);
  };

  const numericInputs: IndicatorId[] = [
    'systolic',
    'diastolic',
    'heartRate',
    'glucose',
    'temperature',
    'spo2',
    'sleep',
    'exercise',
    'hydration',
    'radiationDose',
    'neutronDose',
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Modal Self Check-In &amp; Exams</h1>
          <p className="page-subtitle">
            Logging Mission Day {nextMissionDay} for <strong>{profile.name}</strong> in <strong>{envCfg.label}</strong>
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={syncBioMonitorAndCans}>
          <Radio size={16} /> Sync CSA Bio-Monitor + CANS
        </button>
      </div>

      {/* Scenario Presets */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#38bdf8" /> Test Scenarios:
          </span>
          <button type="button" className="btn btn-sm" onClick={() => applyPreset('nominal')}>Nominal Day</button>
          <button type="button" className="btn btn-sm" onClick={() => applyPreset('sans-bp')}>Crisis BP 185/122 + SANS</button>
          <button type="button" className="btn btn-sm" onClick={() => applyPreset('spe')}>Solar Particle Event (CANS)</button>
          <button type="button" className="btn btn-sm" onClick={() => applyPreset('eva-dcs')}>Post-EVA Hypoxia / DCS</button>
          <button type="button" className="btn btn-sm" onClick={() => applyPreset('sleep-menu')}>Sleep Debt &amp; Menu Fatigue</button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <h2 className="panel-title">1. Core Vitals, Sleep, Exercise &amp; Radiation</h2>
            <div className="grid-2" style={{ gap: 12 }}>
              {numericInputs.map((id) => {
                const ind = INDICATORS[id];
                const cls = classifyIndicator(id, values[id], environment, profile);
                return (
                  <div key={id} className="field">
                    <div className="field-label">
                      <span>{ind.shortLabel} ({ind.unit})</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <StatusBadge status={cls.status} />
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ padding: '2px 5px' }}
                          onClick={() => setGuideId(id)}
                          aria-label={`Guide for ${ind.label}`}
                        >
                          <HelpCircle size={12} />
                        </button>
                      </span>
                    </div>
                    <input
                      type="number"
                      aria-label={ind.label}
                      className="input mono"
                      min={ind.minInput}
                      max={ind.maxInput}
                      step="any"
                      value={values[id]}
                      onChange={(ev) => updateVal(id, Number(ev.target.value))}
                    />
                  </div>
                );
              })}

              <div className="field">
                <div className="field-label">Exercise Hardware (Zero T2)</div>
                <select
                  className="input"
                  value={exerciseModality}
                  onChange={(ev) => setExerciseModality(ev.target.value as ExerciseModality)}
                >
                  <option value="resistance">ARED / Compact Resistive</option>
                  <option value="cycle">CEVIS / Cycle Ergometer</option>
                  <option value="treadmill" disabled={!envCfg.hasTreadmill}>
                    {envCfg.hasTreadmill ? 'T2 Treadmill' : 'T2 Treadmill (Unavailable on vehicle)'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Behavioral, Mood, Food Acceptability & EVA Context */}
          <div className="panel">
            <h2 className="panel-title">2. Behavioral (ARCHeR), Food Acceptability &amp; Cabin Context</h2>
            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div className="field">
                <div className="field-label">Mood &amp; Morale (1 = Distressed, 5 = Great)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`chip ${values.mood === n ? 'active' : ''}`}
                      onClick={() => updateVal('mood', n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="field-label">Food Acceptability / Appetite (Menu Fatigue)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`chip ${values.foodAcceptability === n ? 'active' : ''}`}
                      onClick={() => updateVal('foodAcceptability', n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <label className="chip" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={circadianLightUsed} onChange={(ev) => setCircadianLightUsed(ev.target.checked)} />
                LED Circadian Light Used
              </label>
              <label className="chip" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={lateCaffeine} onChange={(ev) => setLateCaffeine(ev.target.checked)} />
                Caffeine &lt;8h Before Sleep
              </label>
              <label className="chip" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={evaToday} onChange={(ev) => setEvaToday(ev.target.checked)} />
                EVA Performed Today
              </label>
              <label className="chip" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={partialDepressurizedCabin}
                  onChange={(ev) => setPartialDepressurizedCabin(ev.target.checked)}
                />
                Partial Cabin Depressurization
              </label>
            </div>

            <div className="field" style={{ marginBottom: 12 }}>
              <div className="field-label">Crew Interaction Quality (ARCHeR): {crewInteractionScore}/5</div>
              <input
                type="range"
                min={1}
                max={5}
                value={crewInteractionScore}
                onChange={(ev) => setCrewInteractionScore(Number(ev.target.value))}
              />
            </div>

            <div className="field">
              <div className="field-label">Symptoms Checklist</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SYMPTOM_CATALOG.map((sym) => {
                  const checked = symptoms.includes(sym.id);
                  return (
                    <button
                      type="button"
                      key={sym.id}
                      className={`chip ${checked ? 'active' : ''}`}
                      style={checked ? { borderColor: sym.severity === 'alert' ? '#ef4444' : '#f59e0b' } : undefined}
                      onClick={() => toggleSymptom(sym.id)}
                      title={sym.hint}
                    >
                      {sym.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Self-Exams: SANS Amsler Grid & Reaction Test */}
          <div className="panel">
            <h2 className="panel-title">3. Interactive Self-Exams (SANS Amsler Grid &amp; Reaction Test)</h2>
            <div className="grid-2" style={{ gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Eye size={15} color="#38bdf8" /> SANS Amsler Vision Grid
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                  Focus on the white center dot. Tap any grid squares that look wavy, blurred, or blank.
                </p>
                <div style={{ position: 'relative', width: 240 }}>
                  <div className="amsler-grid" role="group" aria-label="SANS Amsler Vision Grid">
                    {Array.from({ length: 100 }).map((_, idx) => (
                      <button
                        type="button"
                        key={idx}
                        aria-label={`Amsler cell ${idx + 1}`}
                        className={`amsler-cell ${flaggedCells.includes(idx) ? 'flagged' : ''}`}
                        onClick={() => toggleAmslerCell(idx)}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.76rem', marginTop: 6 }}>
                  Vision Score: <strong>{values.visionScore}</strong> ({flaggedCells.length} sectors flagged)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Timer size={15} color="#38bdf8" /> Vestibular / Reaction Tap Test (3 trials)
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                  Tap when the target flashes green (Simulating Manual Piloting readiness).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (reactionPhase === 'idle' || reactionPhase === 'done') startReactionTrial([]);
                    else handleReactionTap();
                  }}
                  style={{
                    width: '100%',
                    height: 110,
                    borderRadius: 10,
                    border: '1px solid var(--border-bright)',
                    background:
                      reactionPhase === 'ready'
                        ? '#10b981'
                        : reactionPhase === 'waiting'
                          ? '#92400e'
                          : 'var(--bg-space)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}
                >
                  {reactionPhase === 'idle' && 'Start Reaction Test'}
                  {reactionPhase === 'waiting' && `Wait for GREEN... (Trial ${reactionTrials.length + 1}/3)`}
                  {reactionPhase === 'ready' && 'TAP NOW!'}
                  {reactionPhase === 'done' && `Avg: ${values.reactionMs} ms (Click to Retest)`}
                </button>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="field-label">Manual / Measured Latency (ms)</div>
                  <input
                    type="number"
                    className="input mono"
                    min={140}
                    max={1000}
                    step="any"
                    value={values.reactionMs}
                    onChange={(ev) => updateVal('reactionMs', Number(ev.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Camera / Ultrasound / Skin Photo Capture + Journal */}
          <div className="panel">
            <h2 className="panel-title">4. Medical Imaging (Camera, Upload or Ultrasound) &amp; Journal</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <select
                className="input"
                style={{ width: 'auto', minWidth: 220 }}
                value={imageCategory}
                onChange={(ev) => setImageCategory(ev.target.value as ImageCategory)}
                aria-label="Image Category"
              >
                <option value="ultrasound-ocular">Ultrasound: Ocular / SANS</option>
                <option value="ultrasound-jugular">Ultrasound: Jugular Vein (Venous Haemostasis)</option>
                <option value="skin-rash">Skin / Viral Rash Inspection</option>
                <option value="general">General Log Photo</option>
              </select>

              <button type="button" className="btn btn-sm" onClick={openCamera}>
                <Camera size={14} /> Open Camera
              </button>

              <label className="btn btn-sm">
                <Upload size={14} /> Upload Image
                <input type="file" accept="image/*" capture="environment" hidden onChange={handleFileUpload} />
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Sample Space Captures:</span>
              {Object.values(SAMPLE_MEDICAL_IMAGES).map((sample) => (
                <button
                  type="button"
                  key={sample.category}
                  className="btn btn-sm"
                  onClick={() =>
                    setImage({
                      ...sample,
                      capturedAt: new Date().toISOString(),
                    })
                  }
                >
                  Attach {sample.category}
                </button>
              ))}
            </div>

            {cameraError && <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginBottom: 8 }}>{cameraError}</div>}

            {cameraOpen && (
              <div style={{ marginBottom: 10 }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: 320, borderRadius: 8 }} />
                <div style={{ marginTop: 6 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={captureSnapshot}>
                    Capture Snapshot
                  </button>
                </div>
              </div>
            )}

            {image && (
              <div style={{ marginBottom: 12 }}>
                <img src={image.dataUrl} alt={image.label} style={{ maxWidth: 320, borderRadius: 8, border: '1px solid var(--border-subtle)' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Attached: {image.label} ({image.category})
                </div>
              </div>
            )}

            <div className="field">
              <div className="field-label">Mission Journal Note (Behavioral &amp; Symptom Context)</div>
              <textarea
                rows={3}
                className="input"
                placeholder="Note workload, sleep quality, menu preferences, or symptoms..."
                value={journalNote}
                onChange={(ev) => setJournalNote(ev.target.value)}
              />
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">
                <CheckCircle2 size={16} /> Submit Check-In (+30 XP)
              </button>
            </div>
          </div>
        </form>

        {/* Right: Live Real-Time Assessment Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 76 }}>
          <div className={`panel status-border-${liveAssessment.overall}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 className="panel-title" style={{ margin: 0 }}>Live Assessment Preview</h2>
              <StatusBadge status={liveAssessment.overall} />
            </div>

            <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 6 }}>
              Projected Readiness: {liveAssessment.readinessScore}/100
            </div>

            <div className="panel" style={{ background: 'var(--bg-space)', padding: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                {liveAssessment.escalationTitle}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {liveAssessment.escalationBanner}
              </div>
            </div>

            {liveAssessment.compoundAlerts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', marginBottom: 6 }}>
                  Compound Hazards Triggered ({liveAssessment.compoundAlerts.length})
                </div>
                {liveAssessment.compoundAlerts.map((ca) => (
                  <div key={ca.id} style={{ fontSize: '0.8rem', padding: 8, borderRadius: 8, background: 'var(--alert-soft)', marginBottom: 6 }}>
                    <strong>{ca.title}</strong>
                    <div style={{ color: '#cbd5e1', marginTop: 2 }}>{ca.summary}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
              Recommended Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {liveAssessment.actions.map((act) => (
                <div key={act.id} className={`panel status-border-${act.priority}`} style={{ background: 'var(--bg-space)', padding: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{act.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{act.detail}</div>
                </div>
              ))}
            </div>

            {submittedEntryId && (
              <div className="panel status-border-ok" style={{ marginTop: 14, background: 'var(--ok-soft)' }}>
                <strong>Check-In Saved to Offline Mission Log!</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Link to="/" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>View Dashboard</Link>
                  <Link to="/report" className="btn btn-sm" style={{ textDecoration: 'none' }}>Tempus Pro Downlink</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <IndicatorGuideModal indicatorId={guideId} onClose={() => setGuideId(null)} />
    </div>
  );
}
