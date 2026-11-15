export type Status = 'ok' | 'warn' | 'alert';

export type HazardId =
  | 'radiation'
  | 'isolation'
  | 'distance'
  | 'gravity'
  | 'closedEnv';

export type EnvId =
  | 'station'
  | 'spacecraft'
  | 'rover'
  | 'lunarBase'
  | 'marsBase';

export type BodyRegionId =
  | 'brain'
  | 'eyes'
  | 'innerEar'
  | 'heart'
  | 'vessels'
  | 'lungs'
  | 'spine'
  | 'bones'
  | 'muscles'
  | 'gut'
  | 'immuneSkin';

export type IndicatorId =
  | 'systolic'
  | 'diastolic'
  | 'heartRate'
  | 'glucose'
  | 'temperature'
  | 'sleep'
  | 'mood'
  | 'spo2'
  | 'exercise'
  | 'hydration'
  | 'foodAcceptability'
  | 'radiationDose'
  | 'neutronDose'
  | 'visionScore'
  | 'reactionMs';

export type ExerciseModality = 'resistance' | 'cycle' | 'treadmill';

export type ImageCategory =
  | 'ultrasound-jugular'
  | 'ultrasound-ocular'
  | 'skin-rash'
  | 'general';

export type CrewRole =
  | 'Commander'
  | 'Pilot'
  | 'Mission Specialist'
  | 'Medical Officer';

export type SymptomId =
  | 'headache'
  | 'blurred-vision'
  | 'dizziness'
  | 'joint-pain-eva'
  | 'rash-cold-sore'
  | 'chest-palpitation'
  | 'leg-swelling'
  | 'back-pain'
  | 'nausea'
  | 'shortness-of-breath';

export interface Profile {
  id: string;
  name: string;
  callsign: string;
  role: CrewRole;
  agency: string;
  age: number;
  sex: 'F' | 'M' | 'X';
  avatarColor: string;
  missionDay0: string; // ISO date
  priorCareerDoseMSv: number;
  baseline: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    glucose: number;
    temperature: number;
    spo2: number;
    reactionMs: number;
  };
}

export interface AttachedImage {
  dataUrl: string;
  category: ImageCategory;
  label: string;
  capturedAt: string;
}

export interface Entry {
  id: string;
  profileId: string;
  ts: string; // ISO timestamp
  missionDay: number;
  env: EnvId;
  values: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    glucose: number;
    temperature: number;
    sleep: number;
    mood: number; // 1-5
    spo2: number; // %
    exercise: number; // min
    hydration: number; // L
    foodAcceptability: number; // 1-5
    radiationDose: number; // total mSv/day
    neutronDose: number; // mSv/day (~30% on ISS per CSA CANS)
    visionScore: number; // 0 = normal, 1 = mild hyperopic shift, 2 = distortion/scotoma
    reactionMs: number; // ms tap latency
  };
  exerciseModality: ExerciseModality;
  circadianLightUsed: boolean;
  lateCaffeine: boolean;
  crewInteractionScore: number; // 1-5 (ARCHeR)
  evaToday: boolean;
  partialDepressurizedCabin: boolean;
  symptoms: SymptomId[];
  journalNote?: string;
  image?: AttachedImage;
}

export interface IndicatorClassification {
  id: IndicatorId;
  value: number;
  status: Status;
  note: string;
  escalateUrgent?: boolean;
  baselineDelta?: number;
}

export interface TrendFlag {
  id: string;
  title: string;
  status: Status;
  detail: string;
  relatedIndicators: IndicatorId[];
  relatedHazards: HazardId[];
}

export interface CompoundHazardAlert {
  id: string;
  title: string;
  status: Status;
  hazards: HazardId[];
  summary: string;
  countermeasures: string[];
}

export type EscalationTier =
  | 'self'
  | 'crew-medical'
  | 'ground-consult'
  | 'autonomous-emergency';

export interface RecommendedAction {
  id: string;
  title: string;
  detail: string;
  priority: Status;
  category: 'treatment' | 'prevention' | 'monitoring' | 'escalation';
  relatedBodyRegion?: BodyRegionId;
  studyRef?: string;
}

export interface BodyRegionAssessment {
  regionId: BodyRegionId;
  status: Status;
  drivers: string[];
}

export interface CumulativeMetrics {
  missionDays: number;
  estimatedBoneLossPct: number;
  estimatedSpineElongationPct: number;
  missionRadiationMSv: number;
  missionNeutronMSv: number;
  careerTotalMSv: number;
  careerLimitPct: number;
}

export interface Assessment {
  perIndicator: Record<IndicatorId, IndicatorClassification>;
  overall: Status;
  escalationTier: EscalationTier;
  escalationTitle: string;
  escalationBanner: string;
  actions: RecommendedAction[];
  trendFlags: TrendFlag[];
  compoundAlerts: CompoundHazardAlert[];
  bodyRegions: Record<BodyRegionId, BodyRegionAssessment>;
  cumulative: CumulativeMetrics;
  readinessScore: number;
}

export interface HazardInfo {
  id: HazardId;
  name: string;
  shortName: string;
  color: string;
  tagline: string;
  description: string;
  keyFacts: string[];
  affectedRegions: BodyRegionId[];
  platforms: string[];
  sourceUrl: string;
}

export type RiskCategory =
  | 'Physiology'
  | 'Behavioral Performance & Human Factors'
  | 'Space Radiation';

export interface RiskInfo {
  id: string;
  title: string;
  formalTitle: string;
  category: RiskCategory;
  hazards: HazardId[];
  topRisks: string;
  whatCanBeDone: string;
  didYouKnow: string;
  affectedRegions: BodyRegionId[];
  relatedIndicators: IndicatorId[];
  sourceUrl: string;
}

export interface StudyInfo {
  id: string;
  name: string;
  formalTitle: string;
  agency: 'NASA' | 'CSA' | 'NASA / ESA';
  status: 'Ongoing' | 'Artemis' | 'Completed' | 'Technology';
  description: string;
  impact: string;
  appFeatureLink: string;
  sourceUrl: string;
}

export interface BodyRegionInfo {
  id: BodyRegionId;
  name: string;
  view: 'front' | 'back' | 'both';
  functionSummary: string;
  spaceAdaptation: string;
  linkedIndicators: IndicatorId[];
  linkedHazards: HazardId[];
  linkedRisks: string[];
  countermeasures: string[];
}

export interface EnvironmentConfig {
  id: EnvId;
  label: string;
  shortLabel: string;
  gravityG: number;
  gravityLabel: string;
  radBaselineMSvDay: number;
  neutronShare: number;
  insideMagnetosphere: boolean;
  commsDelaySec: number;
  commsDelayLabel: string;
  evacWindow: string;
  hasTreadmill: boolean;
  autonomousFirst: boolean;
  description: string;
  escalationStyle: string;
}

export interface IndicatorConfig {
  id: IndicatorId;
  label: string;
  shortLabel: string;
  unit: string;
  category: 'Cardiovascular & Metabolic' | 'Neuro-Ocular & Sensorimotor' | 'Sleep, Behavioral & Nutrition' | 'Radiation & Environment';
  minInput: number;
  maxInput: number;
  step: number;
  nominalBand: [number, number];
  nominalText: string;
  monitorText: string;
  alertText: string;
  howToMeasure: string[];
  whyInSpace: string;
  hazards: HazardId[];
  clinicalSource: string;
}

export interface DailyTask {
  id: string;
  title: string;
  detail: string;
  xp: number;
  priority: Status;
  linkedIndicator?: IndicatorId;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progressText: string;
}

export interface GamificationSummary {
  xp: number;
  level: number;
  rankTitle: string;
  nextLevelXp: number;
  streakDays: number;
  tasks: DailyTask[];
  badges: Badge[];
}
