import type { EnvId, EnvironmentConfig } from './types';

export const ENVIRONMENTS: Record<EnvId, EnvironmentConfig> = {
  station: {
    id: 'station',
    label: 'Space Station (ISS — LEO)',
    shortLabel: 'ISS (0 g)',
    gravityG: 0,
    gravityLabel: '0 g (Microgravity)',
    radBaselineMSvDay: 0.5,
    neutronShare: 0.3, // CSA CANS: neutrons contribute ~30% of total radiation on ISS
    insideMagnetosphere: true,
    commsDelaySec: 0,
    commsDelayLabel: 'Real-time (~0 s)',
    evacWindow: '~24 hours (Earth return)',
    hasTreadmill: true,
    autonomousFirst: false,
    description:
      'Low-Earth orbit laboratory protected by Earth’s magnetosphere. Real-time flight surgeon link and full exercise suite (ARED, T2 treadmill, cycle ergometer). Crew witness 16 sunrises/sunsets per day.',
    escalationStyle:
      'Real-time Flight Surgeon consult available via Mission Control Houston / CSA Payload Telescience Operations.',
  },
  spacecraft: {
    id: 'spacecraft',
    label: 'Deep Space Transit (Orion / Mars Transit)',
    shortLabel: 'Spacecraft (0 g)',
    gravityG: 0,
    gravityLabel: '0 g (Microgravity)',
    radBaselineMSvDay: 0.9,
    neutronShare: 0.25,
    insideMagnetosphere: false,
    commsDelaySec: 300,
    commsDelayLabel: '1.3 s – 10 min one-way',
    evacWindow: '3–180 days (abort-dependent)',
    hasTreadmill: false, // Zero T2 study: smaller deep-space capsules omit large treadmills
    autonomousFirst: true,
    description:
      'Beyond Earth’s protective magnetosphere in a studio-apartment-sized transit vehicle. No T2 treadmill aboard (Zero T2 protocol relies on compact resistive/flywheel & cycle training).',
    escalationStyle:
      'Crew Medical Officer initiates protocol autonomously; transmit Tempus Pro telemetry packet to ground.',
  },
  rover: {
    id: 'rover',
    label: 'Pressurized Surface Rover',
    shortLabel: 'Rover (0.17 g)',
    gravityG: 0.17,
    gravityLabel: '⅙ – ⅜ g (Partial Gravity)',
    radBaselineMSvDay: 1.2,
    neutronShare: 0.28,
    insideMagnetosphere: false,
    commsDelaySec: 60,
    commsDelayLabel: '1.3 s – 20 min one-way',
    evacWindow: 'Hours to return to base habitat',
    hasTreadmill: false,
    autonomousFirst: true,
    description:
      'Mobile surface exploration vehicle conducting frequent EVAs with partial cabin depressurization to cut oxygen prebreathe time—elevating decompression sickness (DCS) and mild hypoxia vigilance.',
    escalationStyle:
      'Abort surface EVA immediately for DCS/hypoxia signs; repressurize cabin/suit and return to base habitat.',
  },
  lunarBase: {
    id: 'lunarBase',
    label: 'Lunar Base (Artemis Surface Habitat)',
    shortLabel: 'Lunar Base (⅙ g)',
    gravityG: 0.166,
    gravityLabel: '⅙ g (0.166 g Lunar)',
    radBaselineMSvDay: 1.4,
    neutronShare: 0.26,
    insideMagnetosphere: false,
    commsDelaySec: 1.3,
    commsDelayLabel: '~1.3 s one-way',
    evacWindow: '3–5 days (Earth return)',
    hasTreadmill: false,
    autonomousFirst: false,
    description:
      'South Pole lunar outpost outside Earth’s magnetosphere with high solar particle event vigilance, ⅙ g sensorimotor readaptation, and frequent dusty surface EVAs.',
    escalationStyle:
      'Near-real-time Flight Surgeon guidance (1.3 s lag); shelter in radiation-hardened core during SPE.',
  },
  marsBase: {
    id: 'marsBase',
    label: 'Mars Base (Surface Habitat)',
    shortLabel: 'Mars Base (⅜ g)',
    gravityG: 0.38,
    gravityLabel: '⅜ g (0.38 g Martian)',
    radBaselineMSvDay: 0.7,
    neutronShare: 0.28,
    insideMagnetosphere: false,
    commsDelaySec: 1200,
    commsDelayLabel: 'Up to 20 min one-way (~140M mi)',
    evacWindow: '~200+ days (no emergency return / resupply)',
    hasTreadmill: true,
    autonomousFirst: true,
    description:
      'Roughly 140 million miles from Earth on a ~3-year mission with up to 20-minute one-way communications delay, partial ⅜ g gravity after 6 months in 0 g, and no emergency resupply.',
    escalationStyle:
      'AUTONOMOUS FIRST: Execute Crew Medical Officer treatment protocol immediately, then downlink Tempus Pro summary for asynchronous Flight Surgeon review.',
  },
};

export const ENV_LIST: EnvironmentConfig[] = Object.values(ENVIRONMENTS);
