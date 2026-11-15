import type { Entry, EnvId, ImageCategory, Profile } from './types';

function makeSampleMedicalSvgDataUrl(kind: ImageCategory): string {
  const configs: Record<ImageCategory, { title: string; sub: string; accent: string; shape: string }> = {
    'ultrasound-jugular': {
      title: 'US SCAN — R. INTERNAL JUGULAR VEIN',
      sub: 'Venous Haemostasis / CSA ACTIS Flow Check',
      accent: '#38bdf8',
      shape: `
        <ellipse cx="160" cy="95" rx="68" ry="34" fill="#091525" stroke="#38bdf8" stroke-width="2.5"/>
        <ellipse cx="160" cy="95" rx="46" ry="20" fill="#0f2942" stroke="#7dd3fc" stroke-width="1.5" stroke-dasharray="4 3"/>
        <path d="M55 95 Q110 75 160 95 T265 95" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
        <text x="160" y="99" text-anchor="middle" fill="#bae6fd" font-size="10" font-family="monospace">FLOW: STAGNANT / MILD TURBULENCE</text>
      `,
    },
    'ultrasound-ocular': {
      title: 'OCT / OCULAR ULTRASOUND — OPTIC DISC',
      sub: 'NASA SANS / ISAFE Nerve Sheath Diameter',
      accent: '#f59e0b',
      shape: `
        <circle cx="160" cy="88" r="52" fill="#0c1420" stroke="#94a3b8" stroke-width="2"/>
        <path d="M115 112 Q160 128 205 112" fill="none" stroke="#f59e0b" stroke-width="3"/>
        <rect x="148" y="116" width="24" height="32" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
        <line x1="125" y1="88" x2="195" y2="88" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="160" y="74" text-anchor="middle" fill="#fde68a" font-size="10" font-family="monospace">POSTERIOR FLATTENING / ONSD 5.9mm</text>
      `,
    },
    'skin-rash': {
      title: 'DERMAL INSPECTION — FOREARM LESION',
      sub: 'Immune Biomarkers / Viral Reactivation Screen',
      accent: '#fb7185',
      shape: `
        <rect x="75" y="45" width="170" height="96" rx="18" fill="#472d2d" stroke="#fb7185" stroke-width="1.5"/>
        <circle cx="145" cy="88" r="14" fill="#e11d48" opacity="0.55"/>
        <circle cx="168" cy="96" r="10" fill="#f43f5e" opacity="0.65"/>
        <circle cx="155" cy="76" r="7" fill="#fda4af" opacity="0.7"/>
        <text x="160" y="130" text-anchor="middle" fill="#fecdd3" font-size="9.5" font-family="monospace">LOCALIZED VESICULAR CLUSTER (2.1 cm)</text>
      `,
    },
    general: {
      title: 'CREW MEDICAL LOG ATTACHMENT',
      sub: 'Tempus Pro Diagnostic Capture',
      accent: '#10b981',
      shape: `
        <rect x="70" y="50" width="180" height="90" rx="8" fill="#0f2922" stroke="#10b981" stroke-width="1.5"/>
        <polyline points="85,98 115,98 128,70 142,120 155,82 168,98 235,98" fill="none" stroke="#34d399" stroke-width="2.5"/>
      `,
    },
  };
  const cfg = configs[kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
    <rect width="320" height="180" fill="#060c16"/>
    <rect x="6" y="6" width="308" height="168" rx="6" fill="none" stroke="${cfg.accent}" stroke-opacity="0.45" stroke-width="1.2"/>
    <text x="16" y="24" fill="${cfg.accent}" font-size="10.5" font-weight="bold" font-family="monospace">${cfg.title}</text>
    <text x="16" y="38" fill="#94a3b8" font-size="9" font-family="monospace">${cfg.sub}</text>
    ${cfg.shape}
    <text x="16" y="164" fill="#64748b" font-size="8.5" font-family="monospace">ASTROVITAL TELEMEDICINE PACKET • CALIBRATED</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_MEDICAL_IMAGES: Record<Exclude<ImageCategory, 'general'>, { label: string; category: ImageCategory; dataUrl: string }> = {
  'ultrasound-jugular': {
    label: 'Jugular Vein Ultrasound (Venous Haemostasis)',
    category: 'ultrasound-jugular',
    dataUrl: makeSampleMedicalSvgDataUrl('ultrasound-jugular'),
  },
  'ultrasound-ocular': {
    label: 'Ocular OCT / Ultrasound (SANS Check)',
    category: 'ultrasound-ocular',
    dataUrl: makeSampleMedicalSvgDataUrl('ultrasound-ocular'),
  },
  'skin-rash': {
    label: 'Forearm Rash Photo (Immune / Viral Screen)',
    category: 'skin-rash',
    dataUrl: makeSampleMedicalSvgDataUrl('skin-rash'),
  },
};

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'astro-elena',
    name: 'CDR Elena Vance',
    callsign: 'VANCE-01',
    role: 'Commander',
    agency: 'NASA',
    age: 41,
    sex: 'F',
    avatarColor: '#38bdf8',
    missionDay0: '2026-10-15T08:00:00.000Z',
    priorCareerDoseMSv: 68,
    baseline: {
      systolic: 114,
      diastolic: 74,
      heartRate: 60,
      glucose: 84,
      temperature: 36.6,
      spo2: 98,
      reactionMs: 245,
    },
  },
  {
    id: 'astro-marcus',
    name: 'PLT Marcus Chen',
    callsign: 'CHEN-02',
    role: 'Pilot',
    agency: 'NASA',
    age: 38,
    sex: 'M',
    avatarColor: '#f59e0b',
    missionDay0: '2026-10-15T08:00:00.000Z',
    priorCareerDoseMSv: 112,
    baseline: {
      systolic: 122,
      diastolic: 78,
      heartRate: 64,
      glucose: 91,
      temperature: 36.7,
      spo2: 98,
      reactionMs: 255,
    },
  },
  {
    id: 'astro-amara',
    name: 'Dr. Amara Okafor',
    callsign: 'OKAFOR-MD',
    role: 'Medical Officer',
    agency: 'ESA / NASA',
    age: 36,
    sex: 'F',
    avatarColor: '#10b981',
    missionDay0: '2026-10-15T08:00:00.000Z',
    priorCareerDoseMSv: 44,
    baseline: {
      systolic: 110,
      diastolic: 70,
      heartRate: 58,
      glucose: 82,
      temperature: 36.5,
      spo2: 99,
      reactionMs: 238,
    },
  },
  {
    id: 'astro-david',
    name: 'MS David St-Laurent',
    callsign: 'STLAURENT-04',
    role: 'Mission Specialist',
    agency: 'CSA',
    age: 43,
    sex: 'M',
    avatarColor: '#a855f7',
    missionDay0: '2026-10-15T08:00:00.000Z',
    priorCareerDoseMSv: 89,
    baseline: {
      systolic: 118,
      diastolic: 76,
      heartRate: 63,
      glucose: 89,
      temperature: 36.6,
      spo2: 98,
      reactionMs: 252,
    },
  },
];

// Deterministic pseudo-random helper so demo data is reproducible in tests & UI
function wave(day: number, offset: number, amp: number): number {
  return Math.sin((day + offset) * 0.73) * amp;
}

export function generateSeedData(env: EnvId = 'station'): {
  profiles: Profile[];
  entriesByProfile: Record<string, Entry[]>;
  completedTasksByProfile: Record<string, string[]>;
} {
  const entriesByProfile: Record<string, Entry[]> = {};
  const baseDate = new Date('2026-10-15T08:00:00.000Z').getTime();

  for (const profile of DEMO_PROFILES) {
    const entries: Entry[] = [];

    for (let day = 1; day <= 30; day++) {
      const ts = new Date(baseDate + (day - 1) * 86400_000).toISOString();
      // Day 22 simulated Solar Particle Event across crew
      const isSpeDay = day === 22;

      let systolic = Math.round(profile.baseline.systolic + wave(day, 1, 4));
      let diastolic = Math.round(profile.baseline.diastolic + wave(day, 2, 3));
      let heartRate = Math.round(profile.baseline.heartRate + wave(day, 3, 4));
      let glucose = Math.round(profile.baseline.glucose + wave(day, 4, 5));
      let temperature = Number((profile.baseline.temperature + wave(day, 5, 0.15)).toFixed(1));
      let sleep = Number((7.4 + wave(day, 6, 0.6)).toFixed(1));
      let mood = 4;
      let spo2 = 98;
      let exercise = 95;
      let hydration = 2.4;
      let foodAcceptability = 4;
      let radiationDose = isSpeDay ? 2.45 : Number((0.5 + Math.abs(wave(day, 7, 0.12))).toFixed(2));
      let neutronDose = Number((radiationDose * 0.3).toFixed(2)); // ~30% CSA CANS ISS neutron share
      let visionScore = 0;
      let reactionMs = Math.round(profile.baseline.reactionMs + wave(day, 8, 14));
      let symptoms: Entry['symptoms'] = [];
      let image: Entry['image'] | undefined;
      let journalNote = 'Standard Measures completed; steady orbit cadence.';
      let circadianLightUsed = true;
      let lateCaffeine = false;
      let crewInteractionScore = 4;

      // Tailored crew arcs to showcase multi-crew diagnostics
      if (profile.id === 'astro-elena') {
        if (day === 30) {
          exercise = 95;
          hydration = 2.5;
          mood = 5;
          journalNote = 'Tended mizuna greens in Veggie; full 90-min ARED + T2 block complete.';
        }
      } else if (profile.id === 'astro-marcus') {
        // Gradual SANS ocular + BP progression in final week
        if (day >= 25) {
          systolic += 18;
          diastolic += 11;
          visionScore = day >= 28 ? 2 : 1;
          hydration = 1.9;
          exercise = 75;
          symptoms = day >= 28 ? ['headache', 'blurred-vision'] : ['headache'];
          journalNote = 'Mild near-vision blur & head fullness after sleep period; logged Amsler check.';
        }
        if (day === 30) {
          image = {
            ...SAMPLE_MEDICAL_IMAGES['ultrasound-ocular'],
            capturedAt: ts,
          };
        }
      } else if (profile.id === 'astro-david') {
        // Circadian sleep debt + menu fatigue + mild immune rash in last 4 days
        if (day >= 27) {
          sleep = 5.4;
          mood = day >= 29 ? 2 : 3;
          foodAcceptability = 2;
          circadianLightUsed = false;
          lateCaffeine = true;
          crewInteractionScore = 3;
          reactionMs = 345;
          temperature = 37.7;
          glucose = 66;
          symptoms = ['rash-cold-sore'];
          journalNote = '16 sunrises disrupting sleep; tired of standard rations, small forearm rash noted.';
        }
        if (day === 30) {
          image = {
            ...SAMPLE_MEDICAL_IMAGES['skin-rash'],
            capturedAt: ts,
          };
        }
      } else if (profile.id === 'astro-amara') {
        // Medical Officer remains nominal, logs jugular ultrasound practice on day 29
        mood = 5;
        sleep = 7.6;
        exercise = 100;
        hydration = 2.6;
        if (day === 29) {
          image = {
            ...SAMPLE_MEDICAL_IMAGES['ultrasound-jugular'],
            capturedAt: ts,
          };
          journalNote = 'Routine Venous Haemostasis jugular ultrasound scan captured.';
        }
      }

      if (isSpeDay) {
        journalNote = 'Solar Particle Event advisory — crew sheltered in water-wall module; CANS neutron tracking active.';
      }

      entries.push({
        id: `${profile.id}-d${day}`,
        profileId: profile.id,
        ts,
        missionDay: day,
        env,
        values: {
          systolic,
          diastolic,
          heartRate,
          glucose,
          temperature,
          sleep,
          mood,
          spo2,
          exercise,
          hydration,
          foodAcceptability,
          radiationDose,
          neutronDose,
          visionScore,
          reactionMs,
        },
        exerciseModality: day % 2 === 0 ? 'resistance' : 'treadmill',
        circadianLightUsed,
        lateCaffeine,
        crewInteractionScore,
        evaToday: day === 14 || day === 26,
        partialDepressurizedCabin: false,
        symptoms,
        journalNote,
        image,
      });
    }

    entriesByProfile[profile.id] = entries;
  }

  return {
    profiles: DEMO_PROFILES,
    entriesByProfile,
    completedTasksByProfile: {
      'astro-elena': ['task-exercise-90', 'task-hydrate', 'task-circadian', 'task-veggie'],
      'astro-amara': ['task-exercise-90', 'task-hydrate', 'task-sans-amsler'],
      'astro-marcus': ['task-sans-amsler'],
      'astro-david': [],
    },
  };
}
