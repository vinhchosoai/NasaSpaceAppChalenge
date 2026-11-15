import { describe, expect, it } from 'vitest';
import {
  assessEntry,
  classifyIndicator,
  computeCumulativeMetrics,
  detectCompoundHazards,
  detectTrendFlags,
} from '../assess';
import { computeGamification, computeStreak } from '../gamification';
import { DEMO_PROFILES, generateSeedData } from '../seed';
import type { Entry } from '../types';

function makeEntry(overrides: Partial<Entry> = {}, valueOverrides: Partial<Entry['values']> = {}): Entry {
  return {
    id: 'test-entry',
    profileId: 'astro-elena',
    ts: '2026-11-14T08:00:00.000Z',
    missionDay: 10,
    env: 'station',
    exerciseModality: 'resistance',
    circadianLightUsed: true,
    lateCaffeine: false,
    crewInteractionScore: 4,
    evaToday: false,
    partialDepressurizedCabin: false,
    symptoms: [],
    ...overrides,
    values: {
      systolic: 115,
      diastolic: 75,
      heartRate: 62,
      glucose: 85,
      temperature: 36.6,
      sleep: 7.5,
      mood: 4,
      spo2: 98,
      exercise: 95,
      hydration: 2.5,
      foodAcceptability: 4,
      radiationDose: 0.5,
      neutronDose: 0.15,
      visionScore: 0,
      reactionMs: 250,
      ...valueOverrides,
    },
  };
}

describe('classifyIndicator boundaries', () => {
  const profile = DEMO_PROFILES[0];

  it('flags hypertensive crisis (≥180/120) as alert with escalateUrgent', () => {
    const sys = classifyIndicator('systolic', 185, 'station', profile);
    const dia = classifyIndicator('diastolic', 122, 'station', profile);
    expect(sys.status).toBe('alert');
    expect(sys.escalateUrgent).toBe(true);
    expect(dia.status).toBe('alert');
    expect(dia.escalateUrgent).toBe(true);
  });

  it('enforces NASA 90-minute exercise threshold (≥90 ok, 45–89 warn, <45 alert)', () => {
    expect(classifyIndicator('exercise', 90, 'station', profile).status).toBe('ok');
    expect(classifyIndicator('exercise', 75, 'station', profile).status).toBe('warn');
    expect(classifyIndicator('exercise', 40, 'station', profile).status).toBe('alert');
  });

  it('evaluates glucose, SpO2, temperature, and CANS neutron radiation thresholds', () => {
    expect(classifyIndicator('glucose', 50, 'station', profile).status).toBe('alert');
    expect(classifyIndicator('glucose', 110, 'station', profile).status).toBe('warn');
    expect(classifyIndicator('spo2', 93, 'rover', profile).status).toBe('warn');
    expect(classifyIndicator('spo2', 90, 'rover', profile).status).toBe('alert');
    expect(classifyIndicator('neutronDose', 0.8, 'station', profile).status).toBe('alert');
    expect(classifyIndicator('radiationDose', 2.4, 'station', profile).status).toBe('alert');
  });
});

describe('environment-aware escalation', () => {
  const profile = DEMO_PROFILES[0];
  const crisisEntry = makeEntry({}, { systolic: 185, diastolic: 122 });

  it('recommends real-time Flight Surgeon consult on ISS vs autonomous-first on Mars Base', () => {
    const issAssessment = assessEntry(crisisEntry, [], 'station', profile);
    const marsAssessment = assessEntry(crisisEntry, [], 'marsBase', profile);

    expect(issAssessment.overall).toBe('alert');
    expect(issAssessment.escalationTier).toBe('ground-consult');
    expect(issAssessment.escalationTitle).toMatch(/FLIGHT SURGEON/i);

    expect(marsAssessment.overall).toBe('alert');
    expect(marsAssessment.escalationTier).toBe('autonomous-emergency');
    expect(marsAssessment.escalationTitle).toMatch(/AUTONOMOUS/i);
    expect(marsAssessment.escalationBanner).toMatch(/20 min/i);
  });
});

describe('compound hazards & multi-day trend flags', () => {
  it('detects SANS compound cluster when 0g fluid shift pairs with vision distortion & elevated BP', () => {
    const sansEntry = makeEntry(
      { symptoms: ['blurred-vision', 'headache'] },
      { systolic: 138, visionScore: 2 }
    );
    const alerts = detectCompoundHazards(sansEntry, [], 'station');
    expect(alerts.some((a) => a.id === 'compound-sans')).toBe(true);
  });

  it('detects Bone + Dehydration kidney stone risk when exercise < 90 & hydration < 2.2 in microgravity', () => {
    const entry = makeEntry({}, { exercise: 40, hydration: 1.4 });
    const alerts = detectCompoundHazards(entry, [], 'spacecraft');
    expect(alerts.some((a) => a.id === 'compound-bone-renal')).toBe(true);
  });

  it('detects EVA / Partial Depressurization Hypoxia & DCS cluster', () => {
    const evaEntry = makeEntry(
      { evaToday: true, symptoms: ['joint-pain-eva'] },
      { spo2: 93 }
    );
    const alerts = detectCompoundHazards(evaEntry, [], 'rover');
    expect(alerts.some((a) => a.id === 'compound-eva-dcs')).toBe(true);
  });

  it('detects 3-day sleep debt and mood decline trends', () => {
    const history = [
      makeEntry({ id: 'd1', missionDay: 1 }, { sleep: 7.5, mood: 5 }),
      makeEntry({ id: 'd2', missionDay: 2 }, { sleep: 5.5, mood: 4 }),
      makeEntry({ id: 'd3', missionDay: 3 }, { sleep: 5.2, mood: 3 }),
      makeEntry({ id: 'd4', missionDay: 4 }, { sleep: 5.4, mood: 2 }),
    ];
    const flags = detectTrendFlags(history);
    expect(flags.some((f) => f.id === 'sleep-debt-3d')).toBe(true);
    expect(flags.some((f) => f.id === 'mood-decline-trend')).toBe(true);
  });

  it('computes cumulative radiation, neutron share, bone loss, and spine elongation', () => {
    const seed = generateSeedData('station');
    const marcusEntries = seed.entriesByProfile['astro-marcus'];
    const cumulative = computeCumulativeMetrics(marcusEntries, DEMO_PROFILES[1]);

    expect(cumulative.missionDays).toBe(30);
    expect(cumulative.missionRadiationMSv).toBeGreaterThan(10);
    expect(cumulative.missionNeutronMSv).toBeGreaterThan(3);
    expect(cumulative.estimatedSpineElongationPct).toBeGreaterThan(2);
    expect(cumulative.estimatedSpineElongationPct).toBeLessThanOrEqual(3);
  });
});

describe('gamification & seed consistency', () => {
  it('computes streaks, XP, and unlocks badges for consistent crew', () => {
    const seed = generateSeedData('station');
    const elenaEntries = seed.entriesByProfile['astro-elena'];
    expect(computeStreak(elenaEntries)).toBe(30);

    const latestAssessment = assessEntry(
      elenaEntries[elenaEntries.length - 1],
      elenaEntries,
      'station',
      DEMO_PROFILES[0]
    );
    const gam = computeGamification(
      elenaEntries,
      seed.completedTasksByProfile['astro-elena'],
      latestAssessment,
      'station'
    );

    expect(gam.streakDays).toBe(30);
    expect(gam.xp).toBeGreaterThan(500);
    expect(gam.badges.find((b) => b.id === 'badge-streak-7')?.unlocked).toBe(true);
    expect(gam.badges.find((b) => b.id === 'badge-iron-bones')?.unlocked).toBe(true);
  });
});
