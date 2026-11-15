import { ENVIRONMENTS } from './environments';
import type {
  Assessment,
  Badge,
  DailyTask,
  Entry,
  EnvId,
  GamificationSummary,
} from './types';

const RANKS = [
  { minXp: 0, title: 'Flight Cadet' },
  { minXp: 350, title: 'Payload Specialist' },
  { minXp: 800, title: 'Mission Specialist' },
  { minXp: 1500, title: 'Spaceflight Commander' },
  { minXp: 2500, title: 'Mars Pioneer' },
];

export function computeStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const days = Array.from(new Set(entries.map((e) => e.missionDay))).sort((a, b) => b - a);
  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    if (days[i] - days[i + 1] === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function computeGamification(
  entries: Entry[],
  completedTaskIds: string[],
  assessment: Assessment | null,
  envId: EnvId
): GamificationSummary {
  const streakDays = computeStreak(entries);
  const env = ENVIRONMENTS[envId];

  // XP: 30 per check-in + 20 per completed daily task + streak bonus
  const xp = entries.length * 30 + completedTaskIds.length * 20 + streakDays * 10;
  let rankIdx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) rankIdx = i;
  }
  const level = rankIdx + 1;
  const rankTitle = RANKS[rankIdx].title;
  const nextLevelXp = RANKS[Math.min(RANKS.length - 1, rankIdx + 1)].minXp;

  // Dynamic daily countermeasure tasks driven by current health & NASA HRP
  const tasks: DailyTask[] = [
    {
      id: 'task-exercise-90',
      title: env.hasTreadmill
        ? 'Complete 90-Min Resistance + Treadmill Workout'
        : 'Complete 90-Min Zero T2 Compact Resistance + Cycle',
      detail: 'Counters 1–1.5%/month bone density loss and 10–12% muscle/aerobic decline.',
      xp: 35,
      priority: assessment?.perIndicator.exercise.status ?? 'ok',
      linkedIndicator: 'exercise',
    },
    {
      id: 'task-hydrate',
      title: 'Drink ≥ 2.2 L Fluid Ration',
      detail: 'Prevents calcium-linked kidney stones and post-landing orthostatic fainting.',
      xp: 20,
      priority: assessment?.perIndicator.hydration.status ?? 'ok',
      linkedIndicator: 'hydration',
    },
    {
      id: 'task-circadian',
      title: 'LED Circadian Light Therapy + 7h Sleep Protection',
      detail: 'Offsets 16 orbital sunrises/day; avoid caffeine 8h before sleep.',
      xp: 25,
      priority: assessment?.perIndicator.sleep.status ?? 'ok',
      linkedIndicator: 'sleep',
    },
    {
      id: 'task-veggie',
      title: 'Tend Veggie Mustard Greens & Log Journal (5 min)',
      detail: 'Supports isolation resilience (Space Gardening) and crew morale (ARCHeR).',
      xp: 20,
      priority: assessment?.perIndicator.mood.status ?? 'ok',
      linkedIndicator: 'mood',
    },
    {
      id: 'task-sans-amsler',
      title: 'Run SANS Amsler Eye Check + Thigh Cuff Review',
      detail: 'Monitors the ~70% ISS SANS ocular swelling risk and B-Complex adherence.',
      xp: 25,
      priority: assessment?.perIndicator.visionScore.status ?? 'ok',
      linkedIndicator: 'visionScore',
    },
  ];

  // Badges
  const sorted = [...entries].sort((a, b) => a.missionDay - b.missionDay);
  const last5 = sorted.slice(-5);
  const last7 = sorted.slice(-7);

  const ironBones =
    last5.length === 5 && last5.every((e) => e.values.exercise >= 90);
  const sleepCommander =
    last5.length === 5 && last5.every((e) => e.values.sleep >= 7);
  const hydroHero =
    last5.length === 5 && last5.every((e) => e.values.hydration >= 2.2);
  const steadyHeart =
    last7.length >= 5 &&
    last7.every((e) => e.values.systolic >= 90 && e.values.systolic < 130 && e.values.heartRate <= 100);
  const sansSentinel = entries.some((e) => e.image?.category === 'ultrasound-ocular' || e.values.visionScore === 0);
  const radAware = entries.some((e) => e.values.neutronDose > 0);
  const veggieBotanist = completedTaskIds.includes('task-veggie');

  const badges: Badge[] = [
    {
      id: 'badge-streak-7',
      name: '7-Day Check-In Streak',
      description: 'Logged Standard Measures health check-ins for 7 consecutive mission days.',
      icon: 'Flame',
      unlocked: streakDays >= 7,
      progressText: `${Math.min(7, streakDays)}/7 days`,
    },
    {
      id: 'badge-iron-bones',
      name: 'Iron Bones (90m × 5d)',
      description: 'Met NASA’s 1.5 hr/day resistance & aerobic exercise target 5 days straight.',
      icon: 'Dumbbell',
      unlocked: ironBones,
      progressText: `${last5.filter((e) => e.values.exercise >= 90).length}/5 days`,
    },
    {
      id: 'badge-sleep-cmd',
      name: 'Circadian Commander',
      description: 'Maintained ≥ 7.0 hrs sleep across 5 consecutive mission days.',
      icon: 'Moon',
      unlocked: sleepCommander,
      progressText: `${last5.filter((e) => e.values.sleep >= 7).length}/5 days`,
    },
    {
      id: 'badge-hydro',
      name: 'Renal & Hydro Guard',
      description: 'Hit ≥ 2.2 L daily hydration for 5 consecutive days to block kidney stones.',
      icon: 'Droplets',
      unlocked: hydroHero,
      progressText: `${last5.filter((e) => e.values.hydration >= 2.2).length}/5 days`,
    },
    {
      id: 'badge-heart',
      name: 'Steady Cardiovascular',
      description: 'Kept BP <130/85 and resting HR nominal across recent check-ins.',
      icon: 'HeartPulse',
      unlocked: steadyHeart,
      progressText: steadyHeart ? 'Achieved' : 'Active tracking',
    },
    {
      id: 'badge-sans',
      name: 'SANS Sentinel',
      description: 'Completed Amsler Grid & ocular monitoring for neuro-ocular protection.',
      icon: 'Eye',
      unlocked: sansSentinel,
      progressText: sansSentinel ? 'Verified' : 'Pending check',
    },
    {
      id: 'badge-cans',
      name: 'CANS Radiation Aware',
      description: 'Tracked total + CSA CANS neutron radiation exposure across mission days.',
      icon: 'Radiation',
      unlocked: radAware,
      progressText: radAware ? 'Active telemetry' : 'Pending',
    },
    {
      id: 'badge-veggie',
      name: 'Veggie Crew Catalyst',
      description: 'Completed Veggie space gardening & isolation morale task.',
      icon: 'Sprout',
      unlocked: veggieBotanist,
      progressText: veggieBotanist ? 'Completed' : '0/1 today',
    },
  ];

  return {
    xp,
    level,
    rankTitle,
    nextLevelXp,
    streakDays,
    tasks,
    badges,
  };
}
