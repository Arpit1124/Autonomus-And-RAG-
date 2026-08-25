import { PredictiveChamberForecast, SensorTrendPoint } from '../types';

// Helper to generate simulated telemetry trend points (-24h to +48h)
const generateTrendSeries = (
  baseNominal: number,
  currentValue: number,
  criticalLimit: number,
  warningLimit: number,
  unit: string,
  degradationTrend: 'up' | 'down' | 'nominal' = 'up',
  noise: number = 0.03
): SensorTrendPoint[] => {
  const points: SensorTrendPoint[] = [];
  const hours = [-24, -18, -12, -8, -4, -2, 0, 4, 8, 12, 18, 24, 36, 48];

  hours.forEach((hr) => {
    const isProjected = hr > 0;
    let val: number;
    let mean: number;
    let upper: number;
    let lower: number;

    if (hr <= 0) {
      // Historical progression from nominal to current
      const progress = (hr + 24) / 24; // 0 to 1
      mean = baseNominal + (currentValue - baseNominal) * Math.pow(progress, 1.4);
      val = mean + (Math.random() - 0.5) * mean * noise;
      upper = val;
      lower = val;
    } else {
      // Future projection with increasing uncertainty cone (+/- sigma)
      const projectFactor = hr / 24; // 0 to 2
      const delta = (currentValue - baseNominal) * (1 + projectFactor * 0.95);
      mean = baseNominal + delta;
      val = mean;
      const uncertainty = (mean * 0.04) * (1 + projectFactor * 1.5);
      upper = mean + uncertainty * 2;
      lower = Math.max(0, mean - uncertainty * 2);
    }

    // Round nicely
    points.push({
      timestamp: hr === 0 ? 'Now (T-0)' : hr < 0 ? `T${hr}h` : `T+${hr}h`,
      timeHour: hr,
      observedValue: Number(val.toFixed(2)),
      forecastMean: Number(mean.toFixed(2)),
      upperConfidence: Number(upper.toFixed(2)),
      lowerConfidence: Number(lower.toFixed(2)),
      warningThreshold: warningLimit,
      criticalThreshold: criticalLimit,
      unit,
      isProjected
    });
  });

  return points;
};

export const PREDICTIVE_CHAMBER_FORECASTS: PredictiveChamberForecast[] = [
  {
    chamberId: 'CH-B',
    chamberName: 'Chamber B (Main Poly Gate Etch)',
    machineId: 'M-03',
    machineName: 'Lam Research 2300 Kiyo45 Plasma Etcher',
    stationType: 'Dry Plasma Reactive Ion Etching (RIE)',
    location: 'Fab-09 Bay 4 / Dry Etch Cell 03',
    healthScore: 41,
    remainingUsefulLifeHours: 11.4,
    failureProbability24h: 89.4,
    failureProbability72h: 98.2,
    failureProbability7d: 99.9,
    riskLevel: 'CRITICAL_IMMINENT',
    primaryFailureMode: 'RF Plasma Arc Discharge & Electrostatic Chuck (ESC) Backside He Seal Breach',
    weibullBeta: 3.42, // Wear-out phase failure
    weibullEta: 284,  // Characteristic life in hours
    mtbfHours: 320,
    telemetryTrends: {
      rfPower: generateTrendSeries(1200, 1450, 1480, 1380, 'W', 'up', 0.02),
      pressure: generateTrendSeries(20.0, 38.2, 45.0, 28.0, 'mTorr', 'up', 0.04),
      temperature: generateTrendSeries(65.0, 84.4, 90.0, 75.0, '°C', 'up', 0.03),
      vibration: generateTrendSeries(0.04, 0.28, 0.35, 0.15, 'g', 'up', 0.05),
      gasFlow: generateTrendSeries(14.2, 6.2, 4.0, 9.0, 'sccm', 'down', 0.04)
    },
    degradationFactors: [
      {
        sensorId: 'SEN-RF-03B',
        parameter: 'RF Match Reflected Power & Phase Angle Drift',
        currentValue: 185,
        nominalValue: 18,
        unit: 'W reflected',
        driftPercentage: 142.5,
        contributionToFailure: 44.5,
        degradationRatePerHour: 4.8,
        status: 'anomaly'
      },
      {
        sensorId: 'SEN-ESC-HE',
        parameter: 'ESC Helium Backside Seal Leakage Rate',
        currentValue: 4.8,
        nominalValue: 0.8,
        unit: 'sccm',
        driftPercentage: 312.0,
        contributionToFailure: 31.0,
        degradationRatePerHour: 0.24,
        status: 'anomaly'
      },
      {
        sensorId: 'SEN-TEMP-PYRO',
        parameter: 'Quartz Liner Thermal Pyrometer Deviation',
        currentValue: 84.4,
        nominalValue: 65.0,
        unit: '°C',
        driftPercentage: 29.8,
        contributionToFailure: 16.5,
        degradationRatePerHour: 0.95,
        status: 'warning'
      },
      {
        sensorId: 'SEN-PUMP-VIB',
        parameter: 'Turbomolecular Cryo Bearing FFT High-Freq Vibration',
        currentValue: 0.28,
        nominalValue: 0.04,
        unit: 'g RMS',
        driftPercentage: 220.0,
        contributionToFailure: 8.0,
        degradationRatePerHour: 0.012,
        status: 'warning'
      }
    ],
    recommendedActions: [
      {
        id: 'PA-03-01',
        title: 'Execute In-Situ Automated SF6/O2 Plasma Chamber Dry Clean & De-chucking Sequence',
        chamberId: 'CH-B',
        machineId: 'M-03',
        recommendedAction: 'Initiate automated recipe "CLEAN-RECIPE-M3B" to vaporize fluorocarbon polymer buildup on RF electrode and restore match impedance.',
        deadlineHours: 3.5,
        estimatedDowntimeMinutes: 35,
        riskIfIgnored: 'Uncontrolled wafer micro-arcing leading to 100% lot scrap ($128,000 loss) and catastrophic quartz shatter.',
        priority: 'P0',
        estimatedCostSavingsUsd: 128000,
        procedureRef: 'SOP-FAB9-ETCH-4412',
        isAutomatedCleanRoutine: true
      },
      {
        id: 'PA-03-02',
        title: 'Recalibrate RF Auto-Match Tuning Capacitor Servo & Zero Phase Offset',
        chamberId: 'CH-B',
        machineId: 'M-03',
        recommendedAction: 'Lock chamber RF generator, execute automatic stepper motor impedance calibration, and replace worn coupling pin.',
        deadlineHours: 8.0,
        estimatedDowntimeMinutes: 60,
        riskIfIgnored: 'Plasma strike failures, reflected power thermal cutoff, non-uniform etching across outer 15mm dies.',
        priority: 'P1',
        estimatedCostSavingsUsd: 46000,
        procedureRef: 'SOP-FAB9-RF-209',
        isAutomatedCleanRoutine: false
      },
      {
        id: 'PA-03-03',
        title: 'Replace ESC Backside Helium Dual Port Elastomer O-Ring Seal',
        chamberId: 'CH-B',
        machineId: 'M-03',
        recommendedAction: 'Vent chamber during scheduled changeover, inspect ESC clamp ceramic face, and seat fresh DuPont Kalrez 9100 seal.',
        deadlineHours: 11.0,
        estimatedDowntimeMinutes: 120,
        riskIfIgnored: 'Wafer de-chucking thermal runaway and catastrophic wafer lift crack during transfer.',
        priority: 'P1',
        estimatedCostSavingsUsd: 92000,
        procedureRef: 'SOP-FAB9-ESC-3301',
        isAutomatedCleanRoutine: false
      }
    ],
    historicalFailureCorrelations: [
      {
        date: '2026-06-12',
        waferLot: 'LOT-9104-E',
        rootCause: 'Unscheduled RF Match Ignition Arc causing wafer shatter in Chamber B',
        downtimeHours: 14.5,
        similarityScore: 96.4
      },
      {
        date: '2026-04-03',
        waferLot: 'LOT-8422-B',
        rootCause: 'Helium Backside Leak leading to wafer thermal drift and edge radial cracks',
        downtimeHours: 8.2,
        similarityScore: 91.8
      }
    ]
  },
  {
    chamberId: 'EUV-STAGE',
    chamberName: 'Dual Interferometer Wafer Stage & Reticle Chuck',
    machineId: 'M-01',
    machineName: 'ASML Twinscan EXE:3400 High-NA EUV Scanner',
    stationType: 'EUV High-NA Photolithography',
    location: 'Fab-09 Bay 1 / Scanner Pod 01',
    healthScore: 78,
    remainingUsefulLifeHours: 48.2,
    failureProbability24h: 24.1,
    failureProbability72h: 68.5,
    failureProbability7d: 91.2,
    riskLevel: 'HIGH_PRECURSOR',
    primaryFailureMode: 'Laser Interferometer Mirror Piezo Thermal Jitter & Debris Accumulation',
    weibullBeta: 2.15,
    weibullEta: 720,
    mtbfHours: 850,
    telemetryTrends: {
      rfPower: generateTrendSeries(350, 382, 420, 375, 'W (EUV Laser)', 'up', 0.02),
      pressure: generateTrendSeries(0.001, 0.002, 0.005, 0.003, 'mTorr', 'up', 0.05),
      temperature: generateTrendSeries(22.0, 22.4, 23.0, 22.6, '°C', 'up', 0.01),
      vibration: generateTrendSeries(0.01, 0.03, 0.05, 0.025, 'g', 'up', 0.04),
      gasFlow: generateTrendSeries(5.0, 4.8, 3.5, 4.2, 'sccm (H2 Buffer)', 'down', 0.02)
    },
    degradationFactors: [
      {
        sensorId: 'SEN-EUV-MIRROR',
        parameter: 'Interferometer Mirror Surface Reflectance Drop',
        currentValue: 88.4,
        nominalValue: 99.2,
        unit: '% Reflectance',
        driftPercentage: 10.9,
        contributionToFailure: 52.0,
        degradationRatePerHour: 0.18,
        status: 'warning'
      },
      {
        sensorId: 'SEN-STAGE-JITTER',
        parameter: 'Dual-Stage Nanometer Positioning Jitter',
        currentValue: 1.42,
        nominalValue: 0.35,
        unit: 'nm 3-sigma',
        driftPercentage: 305.7,
        contributionToFailure: 33.0,
        degradationRatePerHour: 0.022,
        status: 'warning'
      },
      {
        sensorId: 'SEN-TIN-DEBRIS',
        parameter: 'Tin Droplet Collector Debris Absorption Monitor',
        currentValue: 14.2,
        nominalValue: 2.1,
        unit: 'ppm obscuration',
        driftPercentage: 576.0,
        contributionToFailure: 15.0,
        degradationRatePerHour: 0.31,
        status: 'warning'
      }
    ],
    recommendedActions: [
      {
        id: 'PA-01-01',
        title: 'Initiate High-Velocity H2 Buffer Gas Purge & Collector Cleaning Cycle',
        chamberId: 'EUV-STAGE',
        machineId: 'M-01',
        recommendedAction: 'Run automated hydrogen radical cleaning to etch sub-micron tin debris from mirror surfaces without breaking high vacuum.',
        deadlineHours: 18.0,
        estimatedDowntimeMinutes: 45,
        riskIfIgnored: 'Overlay alignment drift causing critical pattern shorts on 2nm logic nodes.',
        priority: 'P1',
        estimatedCostSavingsUsd: 210000,
        procedureRef: 'SOP-ASML-CLEAN-901',
        isAutomatedCleanRoutine: true
      },
      {
        id: 'PA-01-02',
        title: 'Laser Interferometer Piezo Stage Gain Calibration',
        chamberId: 'EUV-STAGE',
        machineId: 'M-01',
        recommendedAction: 'Re-zero 6-axis stage positional feedback loops using golden quartz reference grid.',
        deadlineHours: 36.0,
        estimatedDowntimeMinutes: 90,
        riskIfIgnored: 'Wafer notch edge exclusion focus blur and die yield degradation.',
        priority: 'P2',
        estimatedCostSavingsUsd: 78000,
        procedureRef: 'SOP-ASML-CAL-418',
        isAutomatedCleanRoutine: false
      }
    ],
    historicalFailureCorrelations: [
      {
        date: '2026-05-19',
        waferLot: 'LOT-8910-A',
        rootCause: 'Interferometer mirror thermal jitter resulting in overlay displacement errors',
        downtimeHours: 6.5,
        similarityScore: 89.2
      }
    ]
  },
  {
    chamberId: 'ALD-1',
    chamberName: 'Atomic Layer Deposition Reactor Chamber 1',
    machineId: 'M-06',
    machineName: 'ASM Pulsar 3000 ALD System',
    stationType: 'Atomic Layer Dielectric Deposition (HfO2 Gate)',
    location: 'Fab-09 Bay 6 / ALD Thin-Film Cell',
    healthScore: 62,
    remainingUsefulLifeHours: 26.5,
    failureProbability24h: 46.2,
    failureProbability72h: 81.0,
    failureProbability7d: 96.4,
    riskLevel: 'HIGH_PRECURSOR',
    primaryFailureMode: 'Precursor ALD High-Speed Pneumatic Injector Valve Latency & Micro-Leakage',
    weibullBeta: 2.85,
    weibullEta: 410,
    mtbfHours: 490,
    telemetryTrends: {
      rfPower: generateTrendSeries(0, 0, 10, 5, 'W', 'nominal', 0),
      pressure: generateTrendSeries(1.5, 2.9, 4.0, 2.4, 'Torr', 'up', 0.03),
      temperature: generateTrendSeries(300.0, 308.5, 320.0, 312.0, '°C', 'up', 0.01),
      vibration: generateTrendSeries(0.02, 0.09, 0.15, 0.08, 'g', 'up', 0.04),
      gasFlow: generateTrendSeries(25.0, 18.2, 12.0, 19.0, 'sccm', 'down', 0.03)
    },
    degradationFactors: [
      {
        sensorId: 'SEN-VALVE-LATENCY',
        parameter: 'HfCl4 High-Speed ALD Injector Actuation Response Latency',
        currentValue: 34.2,
        nominalValue: 12.0,
        unit: 'ms response',
        driftPercentage: 185.0,
        contributionToFailure: 58.0,
        degradationRatePerHour: 0.62,
        status: 'anomaly'
      },
      {
        sensorId: 'SEN-EXHAUST-TRAP',
        parameter: 'Precursor Scrub Exhaust Foreline Particle Load',
        currentValue: 76.5,
        nominalValue: 20.0,
        unit: '% loaded',
        driftPercentage: 282.5,
        contributionToFailure: 28.0,
        degradationRatePerHour: 0.85,
        status: 'warning'
      }
    ],
    recommendedActions: [
      {
        id: 'PA-06-01',
        title: 'Replace HfCl4 Fast-Switching ALD Diaphragm Valve & Clean Seat',
        chamberId: 'ALD-1',
        machineId: 'M-06',
        recommendedAction: 'Swap out pneumatic cycle valve pack (rated for 10M cycles) and perform He leak test.',
        deadlineHours: 12.0,
        estimatedDowntimeMinutes: 75,
        riskIfIgnored: 'Non-uniform gate oxide thickness leading to transistor threshold voltage breakdown across wafer center.',
        priority: 'P0',
        estimatedCostSavingsUsd: 115000,
        procedureRef: 'SOP-ASM-VALVE-102',
        isAutomatedCleanRoutine: false
      }
    ],
    historicalFailureCorrelations: [
      {
        date: '2026-03-28',
        waferLot: 'LOT-8201-C',
        rootCause: 'Pneumatic injector valve seal sticking caused HfO2 film thickness variance',
        downtimeHours: 11.0,
        similarityScore: 94.1
      }
    ]
  },
  {
    chamberId: 'PVD-TIN',
    chamberName: 'Endura PVD Titanium/TiN Sputter Module',
    machineId: 'M-04',
    machineName: 'Applied Materials Endura 300mm PVD',
    stationType: 'Physical Vapor Deposition (PVD)',
    location: 'Fab-09 Bay 5 / Metallization Bay',
    healthScore: 67,
    remainingUsefulLifeHours: 32.0,
    failureProbability24h: 38.5,
    failureProbability72h: 74.0,
    failureProbability7d: 92.5,
    riskLevel: 'MODERATE_DRIFT',
    primaryFailureMode: 'Target Erosion V-Groove Deepening & Sputter Cathode Magnetron Drift',
    weibullBeta: 1.95,
    weibullEta: 520,
    mtbfHours: 580,
    telemetryTrends: {
      rfPower: generateTrendSeries(8000, 8950, 9500, 9100, 'W DC', 'up', 0.02),
      pressure: generateTrendSeries(2.2, 3.4, 4.5, 3.2, 'mTorr', 'up', 0.03),
      temperature: generateTrendSeries(150.0, 168.0, 190.0, 175.0, '°C', 'up', 0.02),
      vibration: generateTrendSeries(0.03, 0.08, 0.15, 0.09, 'g', 'up', 0.03),
      gasFlow: generateTrendSeries(45.0, 39.0, 30.0, 36.0, 'sccm Ar/N2', 'down', 0.02)
    },
    degradationFactors: [
      {
        sensorId: 'SEN-TARGET-LIFE',
        parameter: 'Ti Target Erosion Life Consumption',
        currentValue: 84.5,
        nominalValue: 40.0,
        unit: '% life expended',
        driftPercentage: 111.2,
        contributionToFailure: 62.0,
        degradationRatePerHour: 0.35,
        status: 'warning'
      }
    ],
    recommendedActions: [
      {
        id: 'PA-04-01',
        title: 'Schedule Target Replacement & Shield Grit Blast Changeover',
        chamberId: 'PVD-TIN',
        machineId: 'M-04',
        recommendedAction: 'Perform planned target exchange to prevent copper backing plate punch-through.',
        deadlineHours: 24.0,
        estimatedDowntimeMinutes: 180,
        riskIfIgnored: 'Target backing plate sputter contamination rendering entire metallization batch defective.',
        priority: 'P1',
        estimatedCostSavingsUsd: 180000,
        procedureRef: 'SOP-AMAT-PVD-550',
        isAutomatedCleanRoutine: false
      }
    ],
    historicalFailureCorrelations: []
  },
  {
    chamberId: 'PL-1',
    chamberName: 'Platen 1 (Copper Bulk & Barrier Polishing)',
    machineId: 'M-02',
    machineName: 'Ebara F-REX300 CMP Polisher System',
    stationType: 'Chemical Mechanical Planarization (CMP)',
    location: 'Fab-09 Bay 3 / Planarization Bay',
    healthScore: 94,
    remainingUsefulLifeHours: 210.0,
    failureProbability24h: 3.2,
    failureProbability72h: 8.5,
    failureProbability7d: 18.0,
    riskLevel: 'HEALTHY_NOMINAL',
    primaryFailureMode: 'Polyurethane Polishing Pad Groove Wearout (Normal Wear Cycle)',
    weibullBeta: 1.85,
    weibullEta: 450,
    mtbfHours: 620,
    telemetryTrends: {
      rfPower: generateTrendSeries(0, 0, 5, 2, 'W', 'nominal', 0),
      pressure: generateTrendSeries(14.2, 14.5, 18.0, 16.0, 'psi (Downforce)', 'up', 0.02),
      temperature: generateTrendSeries(34.0, 36.5, 45.0, 40.0, '°C', 'up', 0.02),
      vibration: generateTrendSeries(0.02, 0.03, 0.08, 0.05, 'g', 'nominal', 0.02),
      gasFlow: generateTrendSeries(250.0, 248.0, 210.0, 230.0, 'mL/min Slurry', 'nominal', 0.01)
    },
    degradationFactors: [
      {
        sensorId: 'SEN-PAD-GROOVE',
        parameter: 'Diamond Pad Conditioner Groove Depth',
        currentValue: 0.62,
        nominalValue: 0.85,
        unit: 'mm depth',
        driftPercentage: 27.0,
        contributionToFailure: 80.0,
        degradationRatePerHour: 0.001,
        status: 'nominal'
      }
    ],
    recommendedActions: [
      {
        id: 'PA-02-01',
        title: 'Routine Pad Conditioner Diamond Head Inspection',
        chamberId: 'PL-1',
        machineId: 'M-02',
        recommendedAction: 'Check diamond head sharpness during weekly scheduled PM slot.',
        deadlineHours: 120.0,
        estimatedDowntimeMinutes: 30,
        riskIfIgnored: 'Minor slurry dishing on wide metal lines.',
        priority: 'P2',
        estimatedCostSavingsUsd: 15000,
        procedureRef: 'SOP-EBARA-CMP-210',
        isAutomatedCleanRoutine: false
      }
    ],
    historicalFailureCorrelations: []
  },
  {
    chamberId: 'MET-OPT',
    chamberName: 'High-NA Deep-UV Metrology Optics Pod',
    machineId: 'M-05',
    machineName: 'KLA-Tencor 2920 Broadband Plasma Metrology',
    stationType: 'Automated Defect & Critical Dimension Metrology',
    location: 'Fab-09 Bay 2 / Automated Inspection Hub',
    healthScore: 98,
    remainingUsefulLifeHours: 540.0,
    failureProbability24h: 0.8,
    failureProbability72h: 2.1,
    failureProbability7d: 5.4,
    riskLevel: 'HEALTHY_NOMINAL',
    primaryFailureMode: 'Laser Pumped Plasma (LPP) Light Source Degas (Nominal)',
    weibullBeta: 1.20,
    weibullEta: 1200,
    mtbfHours: 1400,
    telemetryTrends: {
      rfPower: generateTrendSeries(150, 151, 180, 165, 'W Source', 'nominal', 0.01),
      pressure: generateTrendSeries(0.0001, 0.0001, 0.001, 0.0005, 'mTorr', 'nominal', 0.01),
      temperature: generateTrendSeries(21.0, 21.1, 22.5, 21.8, '°C', 'nominal', 0.005),
      vibration: generateTrendSeries(0.005, 0.006, 0.02, 0.01, 'g', 'nominal', 0.01),
      gasFlow: generateTrendSeries(2.0, 2.0, 1.5, 1.8, 'sccm', 'nominal', 0.01)
    },
    degradationFactors: [
      {
        sensorId: 'SEN-KLA-OPTICS',
        parameter: 'DUV Darkfield Optical Illumination Transmission',
        currentValue: 98.6,
        nominalValue: 99.5,
        unit: '% Transmission',
        driftPercentage: 0.9,
        contributionToFailure: 90.0,
        degradationRatePerHour: 0.0002,
        status: 'nominal'
      }
    ],
    recommendedActions: [
      {
        id: 'PA-05-01',
        title: 'Bi-Monthly Autofocus Reference Laser Calibration',
        chamberId: 'MET-OPT',
        machineId: 'M-05',
        recommendedAction: 'Standard automated optical calibration scan using NIST reference wafer standard.',
        deadlineHours: 360.0,
        estimatedDowntimeMinutes: 20,
        riskIfIgnored: 'Negligible drift in sub-nanometer defect sizing accuracy.',
        priority: 'P2',
        estimatedCostSavingsUsd: 12000,
        procedureRef: 'SOP-KLA-MET-104',
        isAutomatedCleanRoutine: true
      }
    ],
    historicalFailureCorrelations: []
  }
];
