# AstroVitals — Astronaut Self-Health Assessment Tool

## Features

- **Multi-Crew Profiles & Crew Overview**: Switch between crew profiles, track individual pre-flight baselines, view a Crew × Indicator readiness heatmap, and toggle **Crew Medical Officer Mode** (inspired by NASA's *Tempus Pro* protocol).
- **Interactive Human Body Map (Front & Back SVG)**: 11 clickable anatomical systems color-coded by live health status, filterable by NASA's **5 Hazards of Human Spaceflight**, with a **Gravity Field & Fluid-Shift Simulator** (`0 g` → `0.16 g Moon` → `0.38 g Mars` → `1.0 g Earth`) and cumulative bone density / spine elongation estimators.
- **Multi-Modal Self Check-In**:
  - Keyboard/slider entry with live color coding and step-by-step **"How to measure in space"** guides.
  - **SANS Amsler Grid Vision Self-Check** & **15-second Vestibular/Reaction Tap Test**.
  - **Camera & Medical Image Capture** (live webcam, file upload, or sample Jugular Ultrasound, Ocular OCT, and Skin Rash captures).
  - **Simulated Live Wearable Feed** (*CSA Bio-Monitor* smart shirt + *CSA CANS* continuous ~30% neutron dosimeter).
- **Compound-Hazard Rules Engine**: Evaluates indicators against clinical guidelines + personal baselines, detects multi-day trends, flags compounding spaceflight hazards, and adapts escalation urgency to the mission environment (**ISS real-time Flight Surgeon** vs. **Mars 20-min comms delay autonomous-first protocol**).
- **Dynamic Trends & Dosimetry**: Time-series charts with nominal reference bands, pre-flight baselines, dual-line blood pressure, and cumulative radiation dose (Charged Particles vs. Neutron fraction) against NASA's 600 mSv career limit.
- **Routine Reminders & Gamification**: Daily countermeasure missions, streaks, XP levels, badges, and a Crew Cooperative Readiness goal.
- **NASA HRP & CSA Encyclopedia + Tempus Pro Downlink**: Searchable reference covering the 5 hazards, 17 HRP risks, 22 ongoing/past studies, CSA technologies, Earth health benefits, and printable/JSON telemedicine downlink reports.

## Running Locally

```powershell
npm install
npm run dev
```

## Verification

```powershell
npm run typecheck
npm test
npm run build
```

## Disclaimer

AstroVitals is an educational self-assessment and decision-support prototype created for the NASA Space Apps Challenge. Clinical vitals thresholds (AHA, ADA, WHO) and NASA HRP / CSA research data are presented for simulation and training purposes and do not replace diagnosis or medical clearance by a qualified flight surgeon.

## Sources

- [5 Hazards of Human Spaceflight — NASA](https://www.nasa.gov/hrp/hazards/)
- [Risks of Human Spaceflight — NASA](https://www.nasa.gov/hrp/risks/)
- [Ongoing HRP Research — NASA](https://www.nasa.gov/hrp/ongoing-hrp-research/)
- [Why do we conduct science experiments in space? — Canadian Space Agency](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)
- [Monitoring radiation for astronaut health — Canadian Space Agency](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
