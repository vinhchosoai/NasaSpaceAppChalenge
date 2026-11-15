import { ENVIRONMENTS } from './environments';
import { BODY_REGIONS } from './hrpData';
import { INDICATORS } from './knowledge';
import type {
  Assessment,
  BodyRegionAssessment,
  BodyRegionId,
  CompoundHazardAlert,
  CumulativeMetrics,
  Entry,
  EnvId,
  EscalationTier,
  IndicatorClassification,
  IndicatorId,
  Profile,
  RecommendedAction,
  Status,
  TrendFlag,
} from './types';

const STATUS_ORDER: Record<Status, number> = { ok: 0, warn: 1, alert: 2 };

export function worstStatus(statuses: Status[]): Status {
  return statuses.reduce<Status>(
    (acc, cur) => (STATUS_ORDER[cur] > STATUS_ORDER[acc] ? cur : acc),
    'ok'
  );
}

export function classifyIndicator(
  id: IndicatorId,
  value: number,
  envId: EnvId,
  profile?: Profile
): IndicatorClassification {
  const env = ENVIRONMENTS[envId];
  let status: Status = 'ok';
  let note = 'Within nominal operational band.';
  let escalateUrgent = false;
  let baselineDelta: number | undefined;

  if (profile && id in profile.baseline) {
    const base = profile.baseline[id as keyof Profile['baseline']];
    if (typeof base === 'number') {
      baselineDelta = Number((value - base).toFixed(1));
    }
  }

  switch (id) {
    case 'systolic':
      if (value >= 180) {
        status = 'alert';
        escalateUrgent = true;
        note = 'Hypertensive crisis threshold (≥180 mmHg). Immediate medical intervention.';
      } else if (value >= 140 || value < 80) {
        status = 'alert';
        note = value < 80 ? 'Severe hypotension — acute fainting/shock risk.' : 'Stage 2 elevated systolic BP (≥140 mmHg).';
      } else if (value >= 130 || value < 90) {
        status = 'warn';
        note = value < 90 ? 'Low systolic BP — orthostatic fainting risk in gravity.' : 'Elevated systolic BP (130–139 mmHg).';
      }
      break;

    case 'diastolic':
      if (value >= 120) {
        status = 'alert';
        escalateUrgent = true;
        note = 'Hypertensive crisis threshold (≥120 mmHg diastolic).';
      } else if (value >= 90 || value < 50) {
        status = 'alert';
        note = value < 50 ? 'Critically low diastolic pressure.' : 'Elevated diastolic BP (≥90 mmHg).';
      } else if (value >= 85 || value < 60) {
        status = 'warn';
        note = value < 60 ? 'Mildly low diastolic BP.' : 'Borderline elevated diastolic BP (85–89 mmHg).';
      }
      break;

    case 'heartRate':
      if (value < 40 || value > 120) {
        status = 'alert';
        escalateUrgent = value > 135 || value < 35;
        note = value > 120 ? 'Resting tachycardia (>120 bpm) — check arrhythmia/dehydration.' : 'Marked bradycardia (<40 bpm).';
      } else if (value < 50 || value > 100 || (baselineDelta !== undefined && baselineDelta >= 15)) {
        status = 'warn';
        note =
          baselineDelta !== undefined && baselineDelta >= 15
            ? `Resting HR is +${baselineDelta} bpm above pre-flight baseline.`
            : 'Outside typical 50–100 bpm resting window.';
      }
      break;

    case 'glucose':
      if (value < 54 || value >= 126) {
        status = 'alert';
        escalateUrgent = value < 50 || value >= 220;
        note = value < 54 ? 'Clinically significant hypoglycemia (<54 mg/dL).' : 'Elevated fasting glucose (≥126 mg/dL).';
      } else if (value < 70 || value >= 100) {
        status = 'warn';
        note = value < 70 ? 'Low fasting glucose — risk from menu fatigue/undereating.' : 'Impaired fasting glucose (100–125 mg/dL).';
      }
      break;

    case 'temperature':
      if (value > 38.0 || value < 35.5) {
        status = 'alert';
        escalateUrgent = value >= 39.2 || value < 35.0;
        note = value > 38.0 ? 'Fever (>38.0 °C) — check infection or viral reactivation.' : 'Hypothermia threshold (<35.5 °C).';
      } else if (value > 37.5 || value < 36.1) {
        status = 'warn';
        note = value > 37.5 ? 'Mild elevation (monitor for infection vs. 0 g cooling lag).' : 'Mildly below baseline temperature.';
      }
      break;

    case 'spo2':
      if (value < 92) {
        status = 'alert';
        escalateUrgent = value < 89;
        note = 'Hypoxemia (<92%) — check cabin O₂, suit leak, or DCS immediately.';
      } else if (value <= 94) {
        status = 'warn';
        note = 'Mild hypoxia range (92–94%) — common if cabin is partially depressurized.';
      }
      break;

    case 'sleep':
      if (value < 5.5) {
        status = 'alert';
        note = 'Severe sleep deficit (<5.5 hrs) — impairs cognition & immunity.';
      } else if (value < 7.0) {
        status = 'warn';
        note = 'Below NASA 7 hr target (16 sunrises/day circadian strain).';
      }
      break;

    case 'mood':
      if (value <= 2) {
        status = 'alert';
        note = 'Significant behavioral strain — activate isolation countermeasures.';
      } else if (value === 3) {
        status = 'warn';
        note = 'Moderate morale dip — prioritize rest, journaling, or Veggie care.';
      }
      break;

    case 'exercise':
      if (value < 45) {
        status = 'alert';
        note = 'Severe countermeasure shortfall (<45 min vs. 90 min NASA protocol).';
      } else if (value < 90) {
        status = 'warn';
        note = 'Below 1.5 hr (90 min) NASA daily bone/muscle preservation goal.';
      }
      break;

    case 'hydration':
      if (value < 1.6) {
        status = 'alert';
        note = 'Dehydration (<1.6 L) — elevated kidney stone risk from bone Ca²⁺ loss.';
      } else if (value < 2.2) {
        status = 'warn';
        note = 'Sub-optimal fluid intake (<2.2 L target).';
      }
      break;

    case 'foodAcceptability':
      if (value <= 2) {
        status = 'alert';
        note = 'Severe menu fatigue — high risk of caloric deficit & mass loss.';
      } else if (value === 3) {
        status = 'warn';
        note = 'Early menu fatigue — rotate meal variety and flavors.';
      }
      break;

    case 'radiationDose': {
      const warnLim = Math.max(1.0, Number((env.radBaselineMSvDay * 1.5).toFixed(2)));
      if (value >= 2.0) {
        status = 'alert';
        escalateUrgent = value >= 4.0;
        note = `Solar Particle Event / elevated flux (≥2.0 mSv/d, ${env.insideMagnetosphere ? 'inside LEO' : 'outside Earth magnetosphere'}).`;
      } else if (value > warnLim) {
        status = 'warn';
        note = `Above 1.5× ${env.shortLabel} baseline (${env.radBaselineMSvDay} mSv/d).`;
      }
      break;
    }

    case 'neutronDose':
      if (value > 0.75) {
        status = 'alert';
        note = 'High secondary neutron flux (>0.75 mSv/d via CANS) — elevated biological RBE.';
      } else if (value > 0.5) {
        status = 'warn';
        note = 'Elevated neutron dose (>0.5 mSv/d; ~30% typical ISS share).';
      }
      break;

    case 'visionScore':
      if (value >= 2) {
        status = 'alert';
        note = 'Amsler Grid distortion/scotoma — high SANS concern.';
      } else if (value === 1) {
        status = 'warn';
        note = 'Mild near-vision / hyperopic shift — monitor for SANS.';
      }
      break;

    case 'reactionMs':
      if (value > 420) {
        status = 'alert';
        note = 'Significant sensorimotor/cognitive slowing (>420 ms) — defer manual piloting/EVA.';
      } else if (value >= 320) {
        status = 'warn';
        note = 'Mild reaction latency elevation (320–420 ms).';
      }
      break;
  }

  return { id, value, status, note, escalateUrgent, baselineDelta };
}

export function detectTrendFlags(entries: Entry[]): TrendFlag[] {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => a.missionDay - b.missionDay);
  const recent3 = sorted.slice(-3);
  const recent5 = sorted.slice(-5);
  const recent7 = sorted.slice(-7);
  const flags: TrendFlag[] = [];

  if (recent3.length === 3 && recent3.every((e) => e.values.sleep < 6.0)) {
    flags.push({
      id: 'sleep-debt-3d',
      title: '3-Day Cumulative Sleep Debt',
      status: 'alert',
      detail: 'Sleep stayed below 6.0 hrs for 3 consecutive days, raising circadian desynchronization and immune alteration risk.',
      relatedIndicators: ['sleep', 'reactionMs', 'mood'],
      relatedHazards: ['isolation', 'closedEnv'],
    });
  }

  if (recent5.length >= 4) {
    const firstMood = recent5[0].values.mood;
    const lastMood = recent5[recent5.length - 1].values.mood;
    if (firstMood - lastMood >= 2 || recent3.every((e) => e.values.mood <= 3)) {
      flags.push({
        id: 'mood-decline-trend',
        title: 'Sustained Morale / Mood Decline',
        status: lastMood <= 2 ? 'alert' : 'warn',
        detail: `Mood dropped from ${firstMood}/5 to ${lastMood}/5 over the past ${recent5.length} logs.`,
        relatedIndicators: ['mood', 'sleep'],
        relatedHazards: ['isolation', 'distance'],
      });
    }
  }

  if (recent5.length >= 3 && recent5.slice(-3).every((e) => e.values.exercise < 60)) {
    flags.push({
      id: 'exercise-gap-3d',
      title: '3-Day Exercise Deficit',
      status: 'warn',
      detail: 'Exercise fell under 60 min/day for 3 days straight (NASA target: 90 min/day to prevent 1–1.5%/mo bone loss & 10–12% fitness loss).',
      relatedIndicators: ['exercise'],
      relatedHazards: ['gravity'],
    });
  }

  if (recent5.length >= 3 && recent5.slice(-3).every((e) => e.values.foodAcceptability <= 3)) {
    flags.push({
      id: 'menu-fatigue-trend',
      title: 'Persistent Menu Fatigue Trend',
      status: recent5[recent5.length - 1].values.foodAcceptability <= 2 ? 'alert' : 'warn',
      detail: 'Repeated low food acceptability scores increase caloric deficit and micronutrient loss risk.',
      relatedIndicators: ['foodAcceptability', 'glucose'],
      relatedHazards: ['distance'],
    });
  }

  if (recent7.length >= 5) {
    const avgEarlyHr = (recent7[0].values.heartRate + recent7[1].values.heartRate) / 2;
    const avgLateHr = (recent7[recent7.length - 2].values.heartRate + recent7[recent7.length - 1].values.heartRate) / 2;
    if (avgLateHr - avgEarlyHr >= 10) {
      flags.push({
        id: 'hr-creep-7d',
        title: '7-Day Resting HR Drift (+' + Math.round(avgLateHr - avgEarlyHr) + ' bpm)',
        status: 'warn',
        detail: 'Progressive resting heart rate rise can indicate cardiovascular deconditioning, dehydration, or incipient infection.',
        relatedIndicators: ['heartRate', 'hydration'],
        relatedHazards: ['gravity', 'closedEnv'],
      });
    }
  }

  return flags;
}

export function detectCompoundHazards(
  entry: Entry,
  trendFlags: TrendFlag[],
  envId: EnvId
): CompoundHazardAlert[] {
  const env = ENVIRONMENTS[envId];
  const v = entry.values;
  const alerts: CompoundHazardAlert[] = [];

  // 1. SANS & Intracranial Pressure Cluster (Gravity fluid shift + vision/BP/headache)
  const hasVisionOrHeadache =
    v.visionScore >= 1 ||
    entry.symptoms.includes('blurred-vision') ||
    entry.symptoms.includes('headache');
  if (env.gravityG <= 0.2 && hasVisionOrHeadache && (v.visionScore >= 2 || v.systolic >= 130 || entry.symptoms.includes('blurred-vision'))) {
    alerts.push({
      id: 'compound-sans',
      title: 'Compound Hazard: Headward Fluid Shift + SANS Risk',
      status: v.visionScore >= 2 || entry.symptoms.includes('blurred-vision') ? 'alert' : 'warn',
      hazards: ['gravity', 'distance'],
      summary:
        'Microgravity cephalad fluid shift combined with visual changes, head pressure, or elevated BP signals potential Spaceflight Associated Neuro-ocular Syndrome (SANS).',
      countermeasures: [
        'Initiate 6-hour veno-constrictive Thigh Cuff session (NASA Thigh Cuff study) to pool fluids in lower extremities.',
        'Verify daily B-Complex vitamin supplement intake (NASA B-Complex study).',
        'Acquire Ocular Ultrasound / OCT scan and attach to Tempus Pro downlink.',
      ],
    });
  }

  // 2. Bone Loss + Dehydration → Fracture & Kidney Stone Cluster
  if (env.gravityG < 0.5 && v.exercise < 90 && v.hydration < 2.2) {
    alerts.push({
      id: 'compound-bone-renal',
      title: 'Compound Hazard: Bone Calcium Release + Dehydration (Kidney Stone Risk)',
      status: v.exercise < 45 || v.hydration < 1.6 ? 'alert' : 'warn',
      hazards: ['gravity', 'distance'],
      summary:
        'Unloaded bones lose 1–1.5% density/month and excrete calcium into urine; combined with sub-optimal hydration (<2.2 L), kidney stone and fracture risks multiply.',
      countermeasures: [
        'Immediately increase fluid intake toward ≥2.2–2.5 L today.',
        env.hasTreadmill
          ? 'Complete 90-min ARED resistive + T2/cycle aerobic loading.'
          : 'Complete 90-min compact resistive/flywheel + cycle workout (Zero T2 protocol).',
        'Review potassium citrate / bisphosphonate prophylaxis with Medical Officer.',
      ],
    });
  }

  // 3. Isolation + Circadian Sleep Debt + Morale/Menu Fatigue Cluster
  const sleepStrain = v.sleep < 6.5 || trendFlags.some((f) => f.id === 'sleep-debt-3d');
  const moodStrain = v.mood <= 3 || entry.crewInteractionScore <= 2 || v.foodAcceptability <= 2;
  if (sleepStrain && moodStrain) {
    alerts.push({
      id: 'compound-behavioral',
      title: 'Compound Hazard: Isolation + Circadian Sleep Debt + Behavioral Strain',
      status: v.mood <= 2 || v.sleep < 5.5 ? 'alert' : 'warn',
      hazards: ['isolation', 'distance', 'closedEnv'],
      summary:
        'NASA HRP notes sleep loss, circadian desynchronization (16 orbital sunrises/day), and confinement feed off each other to degrade morale, teamwork, and cognition.',
      countermeasures: [
        'Run blue-enriched morning LED circadian light therapy and eliminate caffeine ≥8 hrs before sleep.',
        'Spend 20 min tending Veggie space garden / journaling and schedule protected private downtime.',
        'Hold a low-friction crew check-in and rotate preferred meal items to counter menu fatigue.',
      ],
    });
  }

  // 4. Radiation + Sleep/Stress + Altered Immunity / Viral Reactivation
  const radElevated = v.radiationDose > env.radBaselineMSvDay * 1.5 || v.neutronDose > 0.5;
  const immuneSignal =
    v.temperature > 37.5 ||
    entry.symptoms.includes('rash-cold-sore') ||
    v.sleep < 6.0;
  if (radElevated && immuneSignal) {
    alerts.push({
      id: 'compound-immune-rad',
      title: 'Compound Hazard: Radiation + Sleep/Immune Stress (Viral Reactivation Risk)',
      status: v.radiationDose >= 2.0 || entry.symptoms.includes('rash-cold-sore') ? 'alert' : 'warn',
      hazards: ['radiation', 'closedEnv', 'isolation'],
      summary:
        'Space radiation and circadian stress blunt white-blood-cell immunity, increasing risk of latent virus reactivation (cold sores, shingles) and microbial infection.',
      countermeasures: [
        'Photograph any rash or cold-sore lesions and tag as Skin/Rash Inspection.',
        'Collect dry saliva booklet & blood/urine immune biomarker samples if available.',
        'Follow radiation storm-shelter protocol if Solar Particle Event threshold (≥2.0 mSv/d) is active.',
      ],
    });
  }

  // 5. EVA / Partial Cabin Depressurization + Hypoxia / DCS Cluster
  const evaContext = entry.evaToday || entry.partialDepressurizedCabin;
  const hypoxiaOrDcsSymptom =
    v.spo2 <= 94 ||
    entry.symptoms.includes('joint-pain-eva') ||
    entry.symptoms.includes('shortness-of-breath') ||
    entry.symptoms.includes('leg-swelling');
  if ((evaContext && hypoxiaOrDcsSymptom) || entry.symptoms.includes('joint-pain-eva')) {
    alerts.push({
      id: 'compound-eva-dcs',
      title: 'Compound Hazard: EVA / Cabin Pressure Shift + Hypoxia / DCS Risk',
      status:
        v.spo2 < 92 || entry.symptoms.includes('joint-pain-eva') || entry.symptoms.includes('shortness-of-breath')
          ? 'alert'
          : 'warn',
      hazards: ['closedEnv'],
      summary:
        'Pressure transitions between spacecraft and spacesuit risk nitrogen bubbling (Decompression Sickness), while partial cabin depressurization elevates mild hypoxia.',
      countermeasures: [
        'Terminate EVA immediately if joint pain, dyspnea, or neurologic signs appear; repressurize to nominal cabin pressure.',
        'Administer 100% oxygen mask and recheck SpO₂ + reaction latency every 15 minutes.',
        'If leg/neck swelling is present, perform Venous Haemostasis ultrasound scan.',
      ],
    });
  }

  return alerts;
}

export function computeCumulativeMetrics(entries: Entry[], profile: Profile): CumulativeMetrics {
  const sorted = [...entries].sort((a, b) => a.missionDay - b.missionDay);
  const missionDays = sorted.length > 0 ? sorted[sorted.length - 1].missionDay : 0;

  // Model bone loss: base 1.25%/month (~0.0417%/day), reduced up to 75% by meeting 90 min/day exercise
  let boneLoss = 0;
  let missionRad = 0;
  let missionNeutron = 0;

  for (const e of sorted) {
    const protectionFactor = Math.min(1, e.values.exercise / 90) * 0.75;
    boneLoss += (1.25 / 30) * (1 - protectionFactor);
    missionRad += e.values.radiationDose;
    missionNeutron += e.values.neutronDose;
  }

  // Spine elongates rapidly in first 2 weeks of 0g up to ~3% (less in partial g)
  const latestEnv = sorted.length > 0 ? ENVIRONMENTS[sorted[sorted.length - 1].env] : ENVIRONMENTS.station;
  const gravFactor = Math.max(0.15, 1 - latestEnv.gravityG);
  const spineElongation = Math.min(3.0, (missionDays / 14) * 2.6 * gravFactor);

  const careerTotal = profile.priorCareerDoseMSv + missionRad;
  return {
    missionDays,
    estimatedBoneLossPct: Number(boneLoss.toFixed(2)),
    estimatedSpineElongationPct: Number(spineElongation.toFixed(2)),
    missionRadiationMSv: Number(missionRad.toFixed(2)),
    missionNeutronMSv: Number(missionNeutron.toFixed(2)),
    careerTotalMSv: Number(careerTotal.toFixed(2)),
    careerLimitPct: Number(((careerTotal / 600) * 100).toFixed(1)),
  };
}

export function computeBodyRegionStatus(
  entry: Entry,
  perIndicator: Record<IndicatorId, IndicatorClassification>
): Record<BodyRegionId, BodyRegionAssessment> {
  const result = {} as Record<BodyRegionId, BodyRegionAssessment>;

  for (const region of Object.values(BODY_REGIONS)) {
    const linkedStatuses: Status[] = [];
    const drivers: string[] = [];

    for (const indId of region.linkedIndicators) {
      const cls = perIndicator[indId];
      if (cls) {
        linkedStatuses.push(cls.status);
        if (cls.status !== 'ok') {
          drivers.push(`${INDICATORS[indId].shortLabel}: ${cls.value} ${INDICATORS[indId].unit}`);
        }
      }
    }

    // Symptom overrides mapped to anatomical regions
    if (region.id === 'eyes' && entry.symptoms.includes('blurred-vision')) {
      linkedStatuses.push('alert');
      drivers.push('Symptom: Blurred vision / SANS shift');
    }
    if (region.id === 'brain' && entry.symptoms.includes('headache')) {
      linkedStatuses.push('warn');
      drivers.push('Symptom: Head pressure / headache');
    }
    if (region.id === 'innerEar' && (entry.symptoms.includes('dizziness') || entry.symptoms.includes('nausea'))) {
      linkedStatuses.push('warn');
      drivers.push('Symptom: Vestibular dizziness / motion sickness');
    }
    if (region.id === 'heart' && entry.symptoms.includes('chest-palpitation')) {
      linkedStatuses.push('alert');
      drivers.push('Symptom: Chest pain / palpitations');
    }
    if (region.id === 'vessels' && entry.symptoms.includes('leg-swelling')) {
      linkedStatuses.push('alert');
      drivers.push('Symptom: Neck/leg venous swelling (clot screen)');
    }
    if (region.id === 'lungs' && entry.symptoms.includes('shortness-of-breath')) {
      linkedStatuses.push('alert');
      drivers.push('Symptom: Shortness of breath / hypoxia sign');
    }
    if (region.id === 'bones' && entry.symptoms.includes('joint-pain-eva')) {
      linkedStatuses.push('alert');
      drivers.push('Symptom: Post-EVA joint pain (DCS alert)');
    }
    if (region.id === 'spine' && entry.symptoms.includes('back-pain')) {
      linkedStatuses.push('warn');
      drivers.push('Symptom: Spinal elongation back discomfort');
    }
    if (region.id === 'immuneSkin' && entry.symptoms.includes('rash-cold-sore')) {
      linkedStatuses.push('warn');
      drivers.push('Symptom: Skin rash / cold sore (viral reactivation)');
    }

    result[region.id] = {
      regionId: region.id,
      status: worstStatus(linkedStatuses.length ? linkedStatuses : ['ok']),
      drivers: drivers.length ? drivers : ['All linked biomarkers within nominal baseline.'],
    };
  }

  return result;
}

export function assessEntry(
  entry: Entry,
  history: Entry[],
  envId: EnvId,
  profile: Profile
): Assessment {
  const env = ENVIRONMENTS[envId];
  const perIndicator = {} as Record<IndicatorId, IndicatorClassification>;
  const keys = Object.keys(INDICATORS) as IndicatorId[];

  for (const key of keys) {
    perIndicator[key] = classifyIndicator(key, entry.values[key], envId, profile);
  }

  const trendFlags = detectTrendFlags([...history.filter((h) => h.id !== entry.id), entry]);
  const compoundAlerts = detectCompoundHazards(entry, trendFlags, envId);
  const bodyRegions = computeBodyRegionStatus(entry, perIndicator);
  const cumulative = computeCumulativeMetrics([...history.filter((h) => h.id !== entry.id), entry], profile);

  const symptomStatuses: Status[] = entry.symptoms.map((s) =>
    s === 'blurred-vision' || s === 'joint-pain-eva' || s === 'chest-palpitation' || s === 'leg-swelling' || s === 'shortness-of-breath'
      ? 'alert'
      : 'warn'
  );

  const allStatuses: Status[] = [
    ...Object.values(perIndicator).map((c) => c.status),
    ...trendFlags.map((t) => t.status),
    ...compoundAlerts.map((c) => c.status),
    ...symptomStatuses,
  ];

  const overall = worstStatus(allStatuses);
  const anyUrgent =
    Object.values(perIndicator).some((c) => c.escalateUrgent) ||
    entry.symptoms.includes('chest-palpitation') ||
    entry.symptoms.includes('joint-pain-eva') ||
    entry.symptoms.includes('shortness-of-breath');

  // Environment-aware escalation logic
  let escalationTier: EscalationTier = 'self';
  let escalationTitle = 'Nominal Self-Care & Routine Countermeasures';
  let escalationBanner = `All systems nominal in ${env.shortLabel}. Continue daily 90-min exercise, hydration, and scheduled Standard Measures logging.`;

  if (overall === 'warn') {
    escalationTier = env.autonomousFirst ? 'crew-medical' : 'self';
    escalationTitle = env.autonomousFirst
      ? `Monitor & Notify Crew Medical Officer (${env.commsDelayLabel} comms lag)`
      : 'Monitor & Adjust Daily Countermeasures';
    escalationBanner = env.autonomousFirst
      ? `One or more indicators need close monitoring. Because ${env.shortLabel} has ${env.commsDelayLabel} comms latency, review countermeasures with the Crew Medical Officer and recheck in 4–6 hours.`
      : `Caution indicators detected. Apply recommended countermeasures, recheck in 4–6 hours, and include in the next scheduled Flight Surgeon sync.`;
  } else if (overall === 'alert') {
    if (env.autonomousFirst) {
      escalationTier = 'autonomous-emergency';
      escalationTitle = anyUrgent
        ? `AUTONOMOUS PROTOCOL FIRST — Immediate Crew Medical Intervention`
        : `Autonomous Crew Medical Officer Treatment (${env.commsDelayLabel} lag)`;
      escalationBanner = `CRITICAL: ${env.shortLabel} faces ${env.commsDelayLabel} communication delay (${env.evacWindow}). Do NOT wait for Earth reply—initiate Crew Medical Officer stabilization protocol immediately, then transmit a Tempus Pro Downlink packet.`;
    } else {
      escalationTier = 'ground-consult';
      escalationTitle = anyUrgent
        ? `URGENT FLIGHT SURGEON CONSULT — Real-Time Ground Link`
        : `Flight Surgeon Review Required (${env.shortLabel})`;
      escalationBanner = `Alert status active. ${env.shortLabel} maintains ${env.commsDelayLabel} contact (${env.evacWindow}). Initiate onboard countermeasure and contact Flight Surgeon on Mission Control medical loop immediately.`;
    }
  }

  // Ranked recommendations
  const actions: RecommendedAction[] = [];

  for (const ca of compoundAlerts) {
    actions.push({
      id: `act-${ca.id}`,
      title: ca.title,
      detail: ca.countermeasures[0],
      priority: ca.status,
      category: 'treatment',
    });
  }

  if (perIndicator.systolic.status === 'alert' || perIndicator.diastolic.status === 'alert') {
    actions.push({
      id: 'act-bp',
      title: perIndicator.systolic.value < 90 ? 'Orthostatic Hypotension Countermeasure' : 'Elevated Blood Pressure Protocol',
      detail:
        perIndicator.systolic.value < 90
          ? 'Don lower-body compression garment, hydrate 500 mL electrolyte fluid, and avoid rapid standing/egress.'
          : 'Rest calmly 10 min, re-verify cuff placement at heart level, avoid caffeine, and check SANS ocular symptoms.',
      priority: 'alert',
      category: 'treatment',
      relatedBodyRegion: 'heart',
      studyRef: 'Cardiovascular Adaptations',
    });
  }

  if (perIndicator.radiationDose.status === 'alert' || perIndicator.neutronDose.status === 'alert') {
    actions.push({
      id: 'act-rad',
      title: 'Solar Particle Event / High Neutron Shelter Protocol',
      detail:
        'Relocate to maximum hydrogen-shielded storm shelter bay (water/polyethylene walls) and keep CSA CANS continuous dosimetry active.',
      priority: 'alert',
      category: 'treatment',
      relatedBodyRegion: 'brain',
      studyRef: 'CSA CANS & NASA SRAG',
    });
  }

  if (perIndicator.spo2.status !== 'ok' || entry.symptoms.includes('joint-pain-eva')) {
    actions.push({
      id: 'act-hypoxia-dcs',
      title: 'Oxygenation & Cabin Pressure Triage',
      detail:
        entry.symptoms.includes('joint-pain-eva')
          ? 'Suspected EVA Decompression Sickness: abort EVA, repressurize to full habitat pressure, breathe 100% O₂.'
          : 'Check cabin O₂/CO₂ partial pressures, administer supplemental O₂ if <92%, and retest reaction latency.',
      priority: perIndicator.spo2.status === 'alert' || entry.symptoms.includes('joint-pain-eva') ? 'alert' : 'warn',
      category: 'treatment',
      relatedBodyRegion: 'lungs',
      studyRef: 'Risk of Hypoxia & DCS',
    });
  }

  if (perIndicator.visionScore.status !== 'ok' || entry.symptoms.includes('blurred-vision')) {
    actions.push({
      id: 'act-sans',
      title: 'SANS Ocular Protection Protocol',
      detail: 'Wear veno-constrictive Thigh Cuffs for 6 hrs, confirm daily B-Complex supplement, and capture ocular ultrasound.',
      priority: perIndicator.visionScore.status,
      category: 'treatment',
      relatedBodyRegion: 'eyes',
      studyRef: 'Thigh Cuff & B-Complex',
    });
  }

  if (perIndicator.exercise.status !== 'ok') {
    actions.push({
      id: 'act-exercise',
      title: 'Complete 90-Minute Daily Exercise Countermeasure',
      detail: env.hasTreadmill
        ? 'Target 1.5 hrs/day combined ARED resistance + T2 treadmill/cycle to counter 1–1.5%/mo bone loss.'
        : 'Use Zero T2 compact resistance + cycle ergometer protocol (no treadmill aboard this vehicle).',
      priority: perIndicator.exercise.status,
      category: 'prevention',
      relatedBodyRegion: 'bones',
      studyRef: 'Zero T2 & Reduced Fitness',
    });
  }

  if (perIndicator.hydration.status !== 'ok') {
    actions.push({
      id: 'act-hydration',
      title: 'Boost Fluid Intake to ≥ 2.2 L/day',
      detail: 'Counter microgravity fluid deficit and dilute urinary calcium to prevent kidney stones.',
      priority: perIndicator.hydration.status,
      category: 'prevention',
      relatedBodyRegion: 'bones',
      studyRef: 'Hazard: Gravity Fields',
    });
  }

  if (perIndicator.sleep.status !== 'ok' || perIndicator.mood.status !== 'ok') {
    actions.push({
      id: 'act-sleep-mood',
      title: 'Circadian Reset & Behavioral Self-Care',
      detail: 'Use morning LED circadian light, stop caffeine 8 hrs pre-sleep, log a mission journal note, and tend Veggie plants.',
      priority: worstStatus([perIndicator.sleep.status, perIndicator.mood.status]),
      category: 'prevention',
      relatedBodyRegion: 'brain',
      studyRef: 'ARCHeR & Space Gardening',
    });
  }

  if (perIndicator.foodAcceptability.status !== 'ok') {
    actions.push({
      id: 'act-food',
      title: 'Counter Menu Fatigue & Maintain Nutrition',
      detail: 'Select higher-variety flavor pouches and flavonoid/omega-3 enhanced menu items (Food Physiology) to prevent mass loss.',
      priority: perIndicator.foodAcceptability.status,
      category: 'prevention',
      relatedBodyRegion: 'gut',
      studyRef: 'Food Acceptability & Food Physiology',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'act-nominal',
      title: 'Continue Preventive Spaceflight Routine',
      detail: 'Maintain 90-min exercise, ≥2.2 L hydration, circadian LED schedule, and next Standard Measures check-in.',
      priority: 'ok',
      category: 'monitoring',
      studyRef: 'Standard Measures',
    });
  }

  actions.sort((a, b) => STATUS_ORDER[b.priority] - STATUS_ORDER[a.priority]);

  // Readiness Score (0-100)
  let score = 100;
  for (const cls of Object.values(perIndicator)) {
    if (cls.status === 'warn') score -= 5;
    if (cls.status === 'alert') score -= 14;
    if (cls.escalateUrgent) score -= 10;
  }
  for (const tf of trendFlags) {
    score -= tf.status === 'alert' ? 7 : 3;
  }
  for (const ca of compoundAlerts) {
    score -= ca.status === 'alert' ? 8 : 4;
  }
  for (const sym of symptomStatuses) {
    score -= sym === 'alert' ? 8 : 3;
  }
  const readinessScore = Math.max(5, Math.min(100, Math.round(score)));

  return {
    perIndicator,
    overall,
    escalationTier,
    escalationTitle,
    escalationBanner,
    actions,
    trendFlags,
    compoundAlerts,
    bodyRegions,
    cumulative,
    readinessScore,
  };
}
