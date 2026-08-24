import { 
  WaferInspectionRecord, 
  MachineHealthRecord, 
  HistoricalInspectionCase, 
  KnowledgeDocument, 
  UserProfile, 
  VisionModelConfig, 
  AuditLogEntry, 
  DefectCategory,
  DefectItem,
  RootCauseItem,
  CorrectiveAction
} from '../types';

// ==========================================
// User Profiles & Roles
// ==========================================

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-01',
    name: 'Arpit Sharma',
    email: 'arpitsharma1124@gmail.com',
    role: 'admin',
    department: 'Enterprise Metrology & Systems Administration',
    organization: 'Silicon Foundry Fab-09',
    apiKey: 'wg_live_arpit_admin_98f4a7bc',
    lastLogin: 'Just now',
    permissions: {
      canRunInspection: true,
      canApproveCorrectiveActions: true,
      canEditKnowledgeBase: true,
      canManageMachines: true,
      canExportReports: true,
      canModifyModelConfig: true
    }
  }
];

// ==========================================
// Default Vision Model Configuration
// ==========================================

export const INITIAL_VISION_CONFIG: VisionModelConfig = {
  isSimulationMode: true, // Clearly labeled Demo / Simulation Mode
  activeModelName: 'WaferGuard-YOLOv8-Semiconductor-v2.4',
  endpointUrl: 'https://vision-api.internal.fab9-semi.com/v1/inspect',
  confidenceThreshold: 0.85,
  iouThreshold: 0.45,
  autoTriggerRcaOnFail: true,
  minDefectSizeUm: 5.0,
  semiStandardProfile: 'SEMI_E10_STRICT'
};

// ==========================================
// Sample Inspection Records
// ==========================================

export const SAMPLE_INSPECTIONS: WaferInspectionRecord[] = [
  {
    id: 'INSP-2026-0818-01',
    waferId: 'W-7801-A4',
    lotId: 'LOT-9921-X',
    batchId: 'B-4089',
    machineId: 'M-03',
    processStage: 'Dry Plasma Etch (Gate Etching)',
    recipeName: 'POLY-GATE-ETCH-V4',
    timestamp: '2026-08-18T08:42:15Z',
    inspectionType: 'Brightfield Optical & Automated SEM Review',
    isDemoMode: true,
    originalImageUrl: 'sample_wafer_crack_particles',
    waferDiameterMm: 300,
    dieCount: 420,
    yieldPct: 88.5,
    defects: [
      {
        id: 'DEF-01',
        category: 'crack',
        name: 'Critical Edge Radial Crack',
        confidence: 0.964,
        severity: 'critical',
        location: { x: 74, y: 18, width: 14, height: 16 },
        dieCoordinate: { x: 26, y: 8 },
        estimatedSizeUm: 380.5,
        timestamp: '2026-08-18T08:42:18Z',
        waferId: 'W-7801-A4',
        lotId: 'LOT-9921-X',
        batchId: 'B-4089',
        machineId: 'M-03',
        inspectionStation: 'Station-02 High-NA SEM',
        description: 'Micro-crack propagating radially from wafer outer exclusion zone into adjacent active dies.'
      },
      {
        id: 'DEF-02',
        category: 'particle_contamination',
        name: 'Sub-Micron Particle Cluster',
        confidence: 0.917,
        severity: 'high',
        location: { x: 38, y: 46, width: 9, height: 10 },
        dieCoordinate: { x: 14, y: 19 },
        estimatedSizeUm: 64.2,
        timestamp: '2026-08-18T08:42:19Z',
        waferId: 'W-7801-A4',
        lotId: 'LOT-9921-X',
        batchId: 'B-4089',
        machineId: 'M-03',
        inspectionStation: 'Station-02 High-NA SEM',
        description: 'Metallic byproduct flake deposition causing bridging across interconnect lines.'
      },
      {
        id: 'DEF-03',
        category: 'scratch',
        name: 'Surface Robot Handling Scratch',
        confidence: 0.884,
        severity: 'medium',
        location: { x: 52, y: 68, width: 18, height: 7 },
        dieCoordinate: { x: 18, y: 28 },
        estimatedSizeUm: 145.0,
        timestamp: '2026-08-18T08:42:20Z',
        waferId: 'W-7801-A4',
        lotId: 'LOT-9921-X',
        batchId: 'B-4089',
        machineId: 'M-03',
        inspectionStation: 'Station-02 High-NA SEM',
        description: 'Linear scratch in dielectric passivation layer caused by end-effector friction.'
      },
      {
        id: 'DEF-04',
        category: 'stain',
        name: 'Chemical Residue Stain',
        confidence: 0.842,
        severity: 'low',
        location: { x: 22, y: 28, width: 8, height: 8 },
        dieCoordinate: { x: 9, y: 11 },
        estimatedSizeUm: 28.6,
        timestamp: '2026-08-18T08:42:21Z',
        waferId: 'W-7801-A4',
        lotId: 'LOT-9921-X',
        batchId: 'B-4089',
        machineId: 'M-03',
        inspectionStation: 'Station-02 High-NA SEM',
        description: 'Post-rinse dry mark anomaly in non-critical periphery area.'
      }
    ],
    decision: {
      decision: 'FAIL',
      qualityScore: 68,
      defectCount: 4,
      criticalCount: 1,
      highCount: 1,
      mediumCount: 1,
      lowCount: 1,
      aiConfidence: 0.946,
      reason: 'Critical edge crack (DEF-01) detected in active zone with 96.4% confidence and high-severity particle cluster exceeding SEMI E10 defect density limit.',
      ruleTriggered: 'SEMI-E10-RULE-4: Zero tolerance for active crack propagation.'
    },
    rca: [
      {
        id: 'RCA-01',
        title: 'Thermal Instability & RF Matching Drift in Chamber B',
        evidenceScore: 82,
        category: 'equipment',
        explanation: 'Telemetric logs for Machine M-03 indicate thermal runaway (+18.4°C above setpoint) and RF forward power oscillation in Chamber B during the poly-gate step, inducing mechanical thermal stress at the wafer edge boundary.',
        supportingEvidence: [
          'Chamber B chuck temperature reached 84.4°C (Normal: 65-68°C, +24% deviation)',
          'Chamber pressure spiked to 38.2 mTorr vs 20.0 mTorr recipe specification',
          'Identical edge crack pattern recorded in Historical Case #HIST-2025-0812 on Machine M-03'
        ],
        sensorCorrelations: [
          { parameter: 'Chuck Temperature', normalRange: '65.0 - 68.0 °C', observedValue: '84.4 °C', deviationPct: 24.1, unit: '°C', isCritical: true },
          { parameter: 'Chamber Pressure', normalRange: '19.5 - 20.5 mTorr', observedValue: '38.2 mTorr', deviationPct: 86.3, unit: 'mTorr', isCritical: true },
          { parameter: 'RF Reflected Power', normalRange: '0 - 15 W', observedValue: '84 W', deviationPct: 460.0, unit: 'W', isCritical: true },
          { parameter: 'Helium Backside Flow', normalRange: '12.0 - 14.0 sccm', observedValue: '6.2 sccm', deviationPct: -52.3, unit: 'sccm', isCritical: true }
        ],
        relatedHistoricalCases: ['HIST-2025-0812', 'HIST-2025-0440'],
        relevantDocuments: [
          { docTitle: 'SOP-ETC-412: Dry Etch Chamber Calibration & Thermal Drift Guide', section: 'Section 4.3: Edge Thermal Stress', snippet: 'When helium backside cooling flow drops below 8 sccm, thermal gradient induces radial edge shear fracture.', score: 0.94 },
          { docTitle: 'SEMI E10: Semiconductor Equipment Reliability Guideline', section: 'Part 2: Out of Spec Telemetry', snippet: 'Equipment exceeding temperature threshold by >10% must be flagged for unscheduled maintenance.', score: 0.91 }
        ],
        recommendedInvestigation: [
          'Inspect Helium backside cooling seal and mass flow controller MFC-04 on Chamber B',
          'Recalibrate RF generator matching network impedance capacitors',
          'Perform thermal camera scan on electrostatic chuck (ESC)'
        ],
        ishikawaCategory: 'Machine',
        fiveWhys: [
          'Why did the wafer crack? → Excessive thermal mechanical stress at edge boundary.',
          'Why was there thermal stress? → Chuck temperature escalated to 84.4°C.',
          'Why did temperature escalate? → Helium backside cooling flow collapsed to 6.2 sccm.',
          'Why did helium flow collapse? → MFC-04 valve orifice clogged with fluorocarbon polymer residue.',
          'Root Cause: Preventive maintenance schedule for MFC-04 cleaning was overdue by 14 days.'
        ]
      },
      {
        id: 'RCA-02',
        title: 'Chamber Wall Polymer Flaking Contamination',
        evidenceScore: 64,
        category: 'material_chemical',
        explanation: 'Particle cluster DEF-02 matches fluoropolymer etch byproducts deposited on upper chamber liner undergoing periodic stress flaking under high RF reflection.',
        supportingEvidence: [
          'EDX compositional analysis shows 78% Carbon/Fluorine with trace Aluminum',
          'Chamber cleaning cycle at 310 RF hours (Recommended max: 250 RF hours)'
        ],
        sensorCorrelations: [
          { parameter: 'Chamber RF Hours Since Clean', normalRange: '0 - 250 hrs', observedValue: '312 hrs', deviationPct: 24.8, unit: 'hrs', isCritical: false }
        ],
        relatedHistoricalCases: ['HIST-2025-0104'],
        relevantDocuments: [
          { docTitle: 'SOP-CVD-305: Particle Contamination & Chamber Cleaning SOP', section: 'Section 2.1: Poly Liner Flaking', snippet: 'Exceeding 250 RF hours without SF6 in-situ plasma clean results in particle fallout onto wafer surface.', score: 0.88 }
        ],
        recommendedInvestigation: [
          'Schedule in-situ plasma chamber clean (O2/SF6 etch) immediately',
          'Sample chamber wall deposition thickness with quartz witness wafer'
        ],
        ishikawaCategory: 'Material',
        fiveWhys: [
          'Why did particles fall on the wafer? → Flakes detached from chamber wall during plasma ignition.',
          'Why were flakes present? → Thick fluoropolymer film buildup on chamber liner.',
          'Why was buildup excessive? → Chamber ran 62 hours past scheduled cleaning interval.'
        ]
      }
    ],
    correctiveActions: [
      {
        id: 'CA-01',
        inspectionId: 'INSP-2026-0818-01',
        waferId: 'W-7801-A4',
        type: 'immediate',
        title: 'Quarantine Batch #LOT-9921-X & Halt Machine M-03',
        description: 'Immediately quarantine all 25 wafers from Lot #LOT-9921-X for manual high-NA inspection. Place Machine M-03 Chamber B in engineering lockout mode.',
        priority: 'P0',
        targetEntity: 'Lot #LOT-9921-X / Machine M-03 Chamber B',
        requiresHumanApproval: true,
        status: 'pending',
        assignedRole: 'Production Manager',
        supportingRcaTitle: 'Thermal Instability & RF Matching Drift in Chamber B',
        createdAt: '2026-08-18T08:43:00Z'
      },
      {
        id: 'CA-02',
        inspectionId: 'INSP-2026-0818-01',
        waferId: 'W-7801-A4',
        type: 'investigation',
        title: 'Perform Helium MFC-04 Flush and ESC Chuck Thermal Inspection',
        description: 'Technician to inspect Mass Flow Controller MFC-04, test helium pressure leakage, and run automated chuck temperature calibration profile.',
        priority: 'P1',
        targetEntity: 'Machine M-03 Chamber B',
        requiresHumanApproval: true,
        status: 'pending',
        assignedRole: 'Quality Engineer',
        supportingRcaTitle: 'Thermal Instability & RF Matching Drift in Chamber B',
        createdAt: '2026-08-18T08:43:00Z'
      },
      {
        id: 'CA-03',
        inspectionId: 'INSP-2026-0818-01',
        waferId: 'W-7801-A4',
        type: 'preventive',
        title: 'Shorten Chamber Cleaning Threshold from 250 to 200 RF Hours',
        description: 'Update MES recipe automation rules to enforce automatic chamber dry-clean lock at 200 RF operating hours.',
        priority: 'P2',
        targetEntity: 'Fab-09 Etch Fleet MES System',
        requiresHumanApproval: false,
        status: 'pending',
        assignedRole: 'Process Engineer',
        supportingRcaTitle: 'Chamber Wall Polymer Flaking Contamination',
        createdAt: '2026-08-18T08:43:00Z'
      }
    ],
    approvalStatus: 'pending'
  },
  {
    id: 'INSP-2026-0818-02',
    waferId: 'W-7802-C1',
    lotId: 'LOT-9922-A',
    batchId: 'B-4090',
    machineId: 'M-01',
    processStage: 'EUV Photolithography (Metal 1 Layer)',
    recipeName: 'EUV-M1-PITCH-28NM',
    timestamp: '2026-08-18T07:15:30Z',
    inspectionType: 'Darkfield Defect Scan & Overlay Metrology',
    isDemoMode: true,
    originalImageUrl: 'sample_wafer_pattern_anomaly',
    waferDiameterMm: 300,
    dieCount: 420,
    yieldPct: 94.2,
    defects: [
      {
        id: 'DEF-10',
        category: 'pattern_anomaly',
        name: 'EUV Resist Pattern Bridge Anomaly',
        confidence: 0.892,
        severity: 'high',
        location: { x: 48, y: 52, width: 8, height: 8 },
        dieCoordinate: { x: 19, y: 21 },
        estimatedSizeUm: 48.0,
        timestamp: '2026-08-18T07:15:33Z',
        waferId: 'W-7802-C1',
        lotId: 'LOT-9922-A',
        batchId: 'B-4090',
        machineId: 'M-01',
        inspectionStation: 'Station-01 Optical Darkfield',
        description: 'Localized resist scumming resulting in 28nm interconnect metal line bridge.'
      },
      {
        id: 'DEF-11',
        category: 'alignment_defect',
        name: 'Overlay Reticle Shift',
        confidence: 0.810,
        severity: 'medium',
        location: { x: 80, y: 48, width: 10, height: 10 },
        dieCoordinate: { x: 28, y: 20 },
        estimatedSizeUm: 82.5,
        timestamp: '2026-08-18T07:15:34Z',
        waferId: 'W-7802-C1',
        lotId: 'LOT-9922-A',
        batchId: 'B-4090',
        machineId: 'M-01',
        inspectionStation: 'Station-01 Optical Darkfield',
        description: 'Overlay alignment error of 3.8nm at wafer edge, within warning threshold.'
      }
    ],
    decision: {
      decision: 'REVIEW_REQUIRED',
      qualityScore: 81,
      defectCount: 2,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
      aiConfidence: 0.851,
      reason: 'Single high-severity pattern anomaly detected in central die with borderline confidence (89.2%). Human engineer verification recommended before scrap decision.',
      ruleTriggered: 'SEMI-E30-RULE-2: Pattern bridge requires SEM visual confirmation.'
    },
    approvalStatus: 'pending'
  },
  {
    id: 'INSP-2026-0818-03',
    waferId: 'W-7803-B9',
    lotId: 'LOT-9923-M',
    batchId: 'B-4091',
    machineId: 'M-04',
    processStage: 'Chemical Mechanical Planarization (CMP)',
    recipeName: 'CMP-OXIDE-POLISH-STANDARD',
    timestamp: '2026-08-18T06:05:10Z',
    inspectionType: 'Total Surface Laser Scatterometry',
    isDemoMode: true,
    originalImageUrl: 'sample_wafer_pristine',
    waferDiameterMm: 300,
    dieCount: 420,
    yieldPct: 99.8,
    defects: [],
    decision: {
      decision: 'PASS',
      qualityScore: 99,
      defectCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      aiConfidence: 0.988,
      reason: 'Zero critical or high-severity defects detected. Total surface particle density is 0.002/cm², well below SEMI E10 pass threshold (0.05/cm²).',
      ruleTriggered: 'SEMI-E10-PASS: Standard qualification met.'
    },
    approvalStatus: 'approved'
  }
];

// ==========================================
// Historical Inspection Cases Database
// ==========================================

export const HISTORICAL_CASES: HistoricalInspectionCase[] = [
  {
    id: 'HIST-2025-0812',
    waferId: 'W-6104-E2',
    lotId: 'LOT-8402-A',
    batchId: 'B-3102',
    machineId: 'M-03',
    processStep: 'Dry Plasma Etch',
    defectCategory: 'crack',
    severity: 'critical',
    date: '2025-11-14',
    decision: 'FAIL',
    similarityPct: 94,
    defectCount: 3,
    rootCauseSummary: 'Thermal runaway in Chamber B due to blocked helium cooling line, causing radial edge crack.',
    correctiveActionSummary: 'Replaced helium MFC valve, cleaned chuck seals, updated preventive maintenance interval.',
    finalResolution: 'Machine recertified with 0% edge defects across next 200 batches.',
    keyFactors: ['Chamber B', 'Helium MFC', 'Poly-Gate Etch', 'Edge Crack']
  },
  {
    id: 'HIST-2025-0440',
    waferId: 'W-5890-C7',
    lotId: 'LOT-7820-K',
    batchId: 'B-2890',
    machineId: 'M-03',
    processStep: 'Dry Plasma Etch',
    defectCategory: 'crack',
    severity: 'critical',
    date: '2025-08-22',
    decision: 'FAIL',
    similarityPct: 88,
    defectCount: 2,
    rootCauseSummary: 'ESC chuck clamping pin misalignment caused mechanical pressure concentration on wafer edge.',
    correctiveActionSummary: 'Replaced ceramic pin guide and releveled electrostatic chuck.',
    finalResolution: 'Resolved mechanical stress concentration.',
    keyFactors: ['ESC Chuck', 'Pin Misalignment', 'M-03', 'Edge Crack']
  },
  {
    id: 'HIST-2025-0104',
    waferId: 'W-5120-X1',
    lotId: 'LOT-7201-B',
    batchId: 'B-2401',
    machineId: 'M-03',
    processStep: 'Dry Plasma Etch',
    defectCategory: 'particle_contamination',
    severity: 'high',
    date: '2025-03-09',
    decision: 'FAIL',
    similarityPct: 85,
    defectCount: 14,
    rootCauseSummary: 'Fluoropolymer byproduct buildup on upper chamber shield exceeding 280 RF hours.',
    correctiveActionSummary: 'Performed wet chemical wipe and in-situ O2/CF4 plasma strip.',
    finalResolution: 'Particle counts returned to baseline (<3 per wafer).',
    keyFactors: ['Polymer Flaking', 'RF Hours', 'Particle Cluster']
  },
  {
    id: 'HIST-2025-0988',
    waferId: 'W-6450-F4',
    lotId: 'LOT-8710-P',
    batchId: 'B-3410',
    machineId: 'M-01',
    processStep: 'EUV Photolithography',
    defectCategory: 'pattern_anomaly',
    severity: 'high',
    date: '2025-12-03',
    decision: 'REVIEW_REQUIRED',
    similarityPct: 79,
    defectCount: 4,
    rootCauseSummary: 'EUV pellicle micro-pinhole caused localized flare and incomplete resist dissolution.',
    correctiveActionSummary: 'Pellicle frame replaced; reticle remounted and cleaned.',
    finalResolution: 'CD line uniformity restored within ±0.4nm tolerance.',
    keyFactors: ['EUV Pellicle', 'Resist Scumming', 'Pattern Bridge']
  },
  {
    id: 'HIST-2025-0612',
    waferId: 'W-6011-L8',
    lotId: 'LOT-8110-D',
    batchId: 'B-3001',
    machineId: 'M-05',
    processStep: 'Chemical Vapor Deposition (CVD)',
    defectCategory: 'stain',
    severity: 'medium',
    date: '2025-09-18',
    decision: 'REVIEW_REQUIRED',
    similarityPct: 72,
    defectCount: 5,
    rootCauseSummary: 'Precursor gas injector nozzle condensation caused localized organosilicon puddle marks.',
    correctiveActionSummary: 'Increased precursor gas line heating jacket temperature from 85°C to 105°C.',
    finalResolution: 'Condensation eliminated.',
    keyFactors: ['CVD Precursor', 'Gas Heating', 'Stain']
  },
  {
    id: 'HIST-2025-0315',
    waferId: 'W-5402-H9',
    lotId: 'LOT-7502-R',
    batchId: 'B-2610',
    machineId: 'M-02',
    processStep: 'CMP Polishing',
    defectCategory: 'scratch',
    severity: 'high',
    date: '2025-05-11',
    decision: 'FAIL',
    similarityPct: 68,
    defectCount: 8,
    rootCauseSummary: 'Agglomerated silica slurry particles (>2.0µm) bypassing clogged secondary filter unit.',
    correctiveActionSummary: 'Installed automated delta-P pressure sensor on slurry delivery manifold and replaced 0.5µm depth filters.',
    finalResolution: 'CMP scratch defect density decreased by 92%.',
    keyFactors: ['CMP Slurry', 'Depth Filter', 'Micro-Scratches']
  }
];

// ==========================================
// Machine Health & Fleet Telemetry
// ==========================================

export const MACHINES_DATA: MachineHealthRecord[] = [
  {
    id: 'M-03',
    name: 'Applied Centura Multi-Chamber Etcher M-03',
    stationType: 'Dry Plasma Etcher (Gate & Dielectric)',
    location: 'Fab-09 Bay 4 / Module 03',
    status: 'anomaly',
    healthScore: 61,
    baselineDefectRate: 1.2,
    currentDefectRate: 4.9,
    defectRateDeltaPct: 37.2, // +37% higher than baseline
    anomalyDetected: true,
    anomalyAlert: 'ANOMALY DETECTED: Machine M-03 defect rate increased +37.2% above historical baseline. Thermal instability detected in Chamber B.',
    lastCalibration: '2026-08-01',
    nextScheduledMaintenance: '2026-08-25 (OVERDUE)',
    recentBatches: ['B-4089', 'B-4088', 'B-4085', 'B-4080'],
    correlatedDefectsCount: 18,
    chambers: [
      {
        id: 'CH-A',
        name: 'Chamber A (Etch Strip)',
        temperatureC: 66.2,
        targetTempC: 65.0,
        pressureMtorr: 20.1,
        targetPressureMtorr: 20.0,
        rfPowerW: 1200,
        gasFlowSccm: 14.2,
        vibrationG: 0.04,
        status: 'nominal'
      },
      {
        id: 'CH-B',
        name: 'Chamber B (Main Gate Etch)',
        temperatureC: 84.4,
        targetTempC: 66.0,
        pressureMtorr: 38.2,
        targetPressureMtorr: 20.0,
        rfPowerW: 1450,
        gasFlowSccm: 6.2,
        vibrationG: 0.28,
        status: 'anomaly'
      },
      {
        id: 'CH-C',
        name: 'Chamber C (Over-Etch & Passivation)',
        temperatureC: 67.8,
        targetTempC: 65.0,
        pressureMtorr: 21.5,
        targetPressureMtorr: 20.0,
        rfPowerW: 950,
        gasFlowSccm: 13.5,
        vibrationG: 0.06,
        status: 'nominal'
      }
    ],
    maintenanceLogs: [
      { date: '2026-08-01', type: 'Calibration', description: 'RF match auto-tune completed', technician: 'K. Patel' },
      { date: '2026-07-15', type: 'Scheduled PM', description: 'Replaced chamber seals & quartz liners', technician: 'M. Vance' }
    ]
  },
  {
    id: 'M-01',
    name: 'ASML Twinscan EXE:3400 High-NA EUV Scanner',
    stationType: 'EUV Photolithography Scanner',
    location: 'Fab-09 Bay 1 / Scanner Pod 01',
    status: 'warning',
    healthScore: 84,
    baselineDefectRate: 0.6,
    currentDefectRate: 1.1,
    defectRateDeltaPct: 8.3,
    anomalyDetected: false,
    anomalyAlert: 'EUV Source Collector degradation at 88% capacity. Minor alignment drift at wafer notch.',
    lastCalibration: '2026-08-16',
    nextScheduledMaintenance: '2026-09-01',
    recentBatches: ['B-4090', 'B-4087', 'B-4082'],
    correlatedDefectsCount: 5,
    chambers: [
      {
        id: 'EUV-OPT',
        name: 'EUV Optical Column',
        temperatureC: 22.0,
        targetTempC: 22.0,
        pressureMtorr: 0.001,
        targetPressureMtorr: 0.001,
        rfPowerW: 350,
        gasFlowSccm: 5.0,
        vibrationG: 0.01,
        status: 'nominal'
      },
      {
        id: 'EUV-STAGE',
        name: 'Dual Interferometer Wafer Stage',
        temperatureC: 22.4,
        targetTempC: 22.0,
        pressureMtorr: 0.002,
        targetPressureMtorr: 0.001,
        rfPowerW: 0,
        gasFlowSccm: 0,
        vibrationG: 0.03,
        status: 'warning'
      }
    ],
    maintenanceLogs: [
      { date: '2026-08-16', type: 'Alignment Check', description: 'Interferometer mirror cleaning and recalibration', technician: 'T. Takahashi' }
    ]
  },
  {
    id: 'M-02',
    name: 'Ebara F-REX300 CMP Polisher System',
    stationType: 'Chemical Mechanical Planarization',
    location: 'Fab-09 Bay 3 / Planarization Bay',
    status: 'nominal',
    healthScore: 96,
    baselineDefectRate: 0.8,
    currentDefectRate: 0.7,
    defectRateDeltaPct: -1.2,
    anomalyDetected: false,
    lastCalibration: '2026-08-14',
    nextScheduledMaintenance: '2026-09-10',
    recentBatches: ['B-4086', 'B-4081'],
    correlatedDefectsCount: 2,
    chambers: [
      {
        id: 'CMP-P1',
        name: 'Platen 1 (Bulk Oxide Polish)',
        temperatureC: 38.5,
        targetTempC: 38.0,
        pressureMtorr: 1013.0,
        targetPressureMtorr: 1013.0,
        rfPowerW: 0,
        gasFlowSccm: 0,
        vibrationG: 0.05,
        status: 'nominal'
      }
    ],
    maintenanceLogs: [
      { date: '2026-08-14', type: 'Pad Replacement', description: 'Replaced IC1000 polishing pad and conditioner disk', technician: 'J. Doe' }
    ]
  },
  {
    id: 'M-04',
    name: 'Tokyo Electron (TEL) Trias Clean Track',
    stationType: 'Resist Coat & Bake Developer System',
    location: 'Fab-09 Bay 1 / Track Line 04',
    status: 'nominal',
    healthScore: 98,
    baselineDefectRate: 0.3,
    currentDefectRate: 0.2,
    defectRateDeltaPct: -3.4,
    anomalyDetected: false,
    lastCalibration: '2026-08-17',
    nextScheduledMaintenance: '2026-09-15',
    recentBatches: ['B-4091', 'B-4089'],
    correlatedDefectsCount: 1,
    chambers: [
      {
        id: 'TRK-COAT',
        name: 'Spin Coater Module #2',
        temperatureC: 23.0,
        targetTempC: 23.0,
        pressureMtorr: 1013.0,
        targetPressureMtorr: 1013.0,
        rfPowerW: 0,
        gasFlowSccm: 0,
        vibrationG: 0.02,
        status: 'nominal'
      }
    ],
    maintenanceLogs: [
      { date: '2026-08-17', type: 'Filter Ingestion', description: 'Replaced photoresist syringe microfilter', technician: 'L. Chen' }
    ]
  },
  {
    id: 'M-05',
    name: 'Lam Research Vector Express PECVD System',
    stationType: 'Plasma Enhanced Chemical Vapor Deposition',
    location: 'Fab-09 Bay 5 / Deposition Bay',
    status: 'nominal',
    healthScore: 92,
    baselineDefectRate: 1.1,
    currentDefectRate: 1.0,
    defectRateDeltaPct: -0.9,
    anomalyDetected: false,
    lastCalibration: '2026-08-10',
    nextScheduledMaintenance: '2026-09-05',
    recentBatches: ['B-4084', 'B-4079'],
    correlatedDefectsCount: 3,
    chambers: [
      {
        id: 'CVD-DEP1',
        name: 'Chamber 1 (SiN Dielectric Barrier)',
        temperatureC: 400.0,
        targetTempC: 400.0,
        pressureMtorr: 2500.0,
        targetPressureMtorr: 2500.0,
        rfPowerW: 2200,
        gasFlowSccm: 120.0,
        vibrationG: 0.05,
        status: 'nominal'
      }
    ],
    maintenanceLogs: [
      { date: '2026-08-10', type: 'Showerhead Clean', description: 'Replaced SiH4/NH3 gas showerhead distributor', technician: 'S. Wong' }
    ]
  },
  {
    id: 'M-06',
    name: 'KLA-Tencor 2920 High-Speed Optical Inspector',
    stationType: 'Brightfield/Darkfield Wafer Metrology',
    location: 'Fab-09 Bay 6 / Metrology Cluster',
    status: 'nominal',
    healthScore: 99,
    baselineDefectRate: 0.1,
    currentDefectRate: 0.1,
    defectRateDeltaPct: 0.0,
    anomalyDetected: false,
    lastCalibration: '2026-08-18',
    nextScheduledMaintenance: '2026-09-30',
    recentBatches: ['B-4091', 'B-4090', 'B-4089'],
    correlatedDefectsCount: 0,
    chambers: [
      {
        id: 'MET-OPT',
        name: 'Broadband Laser Optics System',
        temperatureC: 20.0,
        targetTempC: 20.0,
        pressureMtorr: 1013.0,
        targetPressureMtorr: 1013.0,
        rfPowerW: 0,
        gasFlowSccm: 0,
        vibrationG: 0.005,
        status: 'nominal'
      }
    ],
    maintenanceLogs: [
      { date: '2026-08-18', type: 'Daily Calibration', description: 'Standard NIST calibration reference wafer scanned', technician: 'Dr. Arpit Sharma' }
    ]
  }
];

// ==========================================
// Semiconductor RAG Knowledge Documents
// ==========================================

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'doc-sop-etc-412',
    title: 'SOP-ETC-412: Dry Etch Chamber Calibration & Thermal Drift Guide',
    filename: 'SOP-ETC-412_Dry_Etch_Thermal_Drift_v3.pdf',
    category: 'sop',
    fileType: 'pdf',
    sizeBytes: 1420000,
    uploadedAt: '2026-08-01',
    chunksCount: 12,
    status: 'ready',
    summary: 'Standard Operating Procedure for handling thermal matching drift, RF reflected spikes, and electrostatic chuck helium cooling anomalies on dry plasma etching equipment.',
    tags: ['Etch', 'M-03', 'Thermal Drift', 'Helium Cooling', 'Edge Crack'],
    author: 'Fab-09 Process Engineering Committee',
    chunks: [
      {
        id: 'chk-etc-01',
        documentId: 'doc-sop-etc-412',
        chunkIndex: 1,
        page: 4,
        section: 'Section 4.3: Edge Thermal Stress & Radial Crack Mitigation',
        content: 'When helium backside cooling flow drops below 8 sccm or chuck temperature deviates >15°C above recipe baseline (65°C), the thermal expansion gradient across the 300mm wafer induces tensile shear strain at the outer 3mm edge exclusion zone. This directly precipitates radial micro-cracks propagating inward toward active die boundaries. In the event of >15°C temperature drift, immediate tool lockout and MFC verification is mandated.',
        standardReference: 'SEMI E10-0304 §4.3',
        tokenCount: 88
      },
      {
        id: 'chk-etc-02',
        documentId: 'doc-sop-etc-412',
        chunkIndex: 2,
        page: 7,
        section: 'Section 6.1: RF Forward/Reflected Power Oscillation',
        content: 'RF reflected power exceeding 50W during plasma strike indicates matching capacitor servo motor lag or fluoropolymer buildup on chamber walls altering plasma impedance. Unchecked RF oscillation causes violent ion bombardment non-uniformity and thermal hot spots on the wafer perimeter.',
        standardReference: 'SEMI E30-0710 §6.1',
        tokenCount: 65
      }
    ]
  },
  {
    id: 'doc-semi-e10',
    title: 'SEMI E10: Standard for Definition and Measurement of Equipment Reliability, Availability, and Maintainability',
    filename: 'SEMI_E10_RAM_Standards_2025.pdf',
    category: 'semi_standard',
    fileType: 'pdf',
    sizeBytes: 2840000,
    uploadedAt: '2026-07-15',
    chunksCount: 24,
    status: 'ready',
    summary: 'International semiconductor equipment standards defining pass/fail quality criteria, uptime tracking, unscheduled downtime triggers, and defect density thresholds.',
    tags: ['SEMI E10', 'Compliance', 'Quality Score', 'Pass Criteria'],
    author: 'SEMI Standards International',
    chunks: [
      {
        id: 'chk-semi-01',
        documentId: 'doc-semi-e10',
        chunkIndex: 1,
        page: 12,
        section: 'Section 3.4: Critical Defect Quarantine Mandate',
        content: 'Any detected physical defect classified as a structural crack, substrate chip, or active-gate delamination requires instantaneous automated batch quarantine (P0). Processing subsequent lots on the implicated processing chamber without verified root-cause resolution is strictly prohibited under SEMI E10 compliance standards.',
        standardReference: 'SEMI E10 Clause 3.4',
        tokenCount: 74
      },
      {
        id: 'chk-semi-02',
        documentId: 'doc-semi-e10',
        chunkIndex: 2,
        page: 18,
        section: 'Section 5.2: Defect Density & Quality Score Calculation',
        content: 'Quality Score (0-100) is derived from normalized weighted defect penalties: Critical Defects (-30 pts each), High Defects (-15 pts each), Medium Defects (-5 pts each), Low Defects (-2 pts each). A score below 75 automatically yields a FAIL verdict. Scores between 75 and 85 with 0 critical defects trigger a REVIEW REQUIRED status.',
        standardReference: 'SEMI E10 Clause 5.2',
        tokenCount: 82
      }
    ]
  },
  {
    id: 'doc-sop-lit-204',
    title: 'SOP-LIT-204: EUV Photolithography Overlay & Alignment Protocol',
    filename: 'SOP-LIT-204_EUV_Alignment_Defects.pdf',
    category: 'sop',
    fileType: 'pdf',
    sizeBytes: 1980000,
    uploadedAt: '2026-07-28',
    chunksCount: 16,
    status: 'ready',
    summary: 'Procedures for diagnosing pattern anomalies, resist scumming, and reticle overlay alignment shifts on EUV scanner lines.',
    tags: ['Lithography', 'EUV', 'Pattern Anomaly', 'Overlay', 'M-01'],
    author: 'Fab-09 Litho Module Lead',
    chunks: [
      {
        id: 'chk-lit-01',
        documentId: 'doc-sop-lit-204',
        chunkIndex: 1,
        page: 5,
        section: 'Section 2.2: Pattern Bridging and Micro-bridging in EUV Photoresist',
        content: 'Stochastic line-edge roughness and resist bridging at sub-30nm pitch are driven by local EUV photon shot noise, under-exposure dose (<45 mJ/cm²), or contaminated developer rinse. When pattern anomalies are detected in >2 dies, execute a dose calibration matrix on a dummy wafer.',
        standardReference: 'SOP-LIT-204 §2.2',
        tokenCount: 76
      }
    ]
  },
  {
    id: 'doc-sop-cmp-108',
    title: 'SOP-CMP-108: Chemical Mechanical Planarization Slurry & Scratch Control Guide',
    filename: 'SOP-CMP-108_CMP_Scratch_Slurry_Protocol.pdf',
    category: 'sop',
    fileType: 'pdf',
    sizeBytes: 1650000,
    uploadedAt: '2026-08-05',
    chunksCount: 14,
    status: 'ready',
    summary: 'Guidelines for preventing pad glazing, abrasive particle agglomeration, and micro-scratch formation during interlayer dielectric polishing.',
    tags: ['CMP', 'Scratches', 'Slurry', 'M-02'],
    author: 'Planarization Yield Team',
    chunks: [
      {
        id: 'chk-cmp-01',
        documentId: 'doc-sop-cmp-108',
        chunkIndex: 1,
        page: 3,
        section: 'Section 3.1: Micro-Scratch Morphology Identification',
        content: 'Linear scratches with chattered trail morphology indicate diamond conditioner grit loss or slurry particle agglomeration (>1.5µm). Immediate pad conditioning sweep and slurry filter delta-P verification must be executed.',
        standardReference: 'SOP-CMP-108 §3.1',
        tokenCount: 62
      }
    ]
  },
  {
    id: 'doc-sop-cvd-305',
    title: 'SOP-CVD-305: Particle Contamination & Chamber Cleaning SOP',
    filename: 'SOP-CVD-305_Chamber_Cleaning_Particles.pdf',
    category: 'troubleshooting',
    fileType: 'pdf',
    sizeBytes: 1510000,
    uploadedAt: '2026-08-11',
    chunksCount: 10,
    status: 'ready',
    summary: 'Chamber preventative maintenance protocols, RF hour limits, and in-situ fluorine/oxygen plasma clean routines.',
    tags: ['CVD', 'Particles', 'Chamber Clean', 'PM Schedule'],
    author: 'Fab-09 Equipment Maintenance',
    chunks: [
      {
        id: 'chk-cvd-01',
        documentId: 'doc-sop-cvd-305',
        chunkIndex: 1,
        page: 2,
        section: 'Section 1.4: RF Operating Limits for Chamber Flaking Prevention',
        content: 'Exceeding 250 RF plasma operating hours without performing an in-situ NF3/O2 chamber cleaning cycle causes accumulated dielectric films on chamber liners to exceed critical adhesion thickness (15µm), precipitating spontaneous particle showers during wafer transfers.',
        standardReference: 'SOP-CVD-305 §1.4',
        tokenCount: 68
      }
    ]
  }
];

// ==========================================
// 30-Day Production Data Analytics
// ==========================================

export interface ProductionDailyMetric {
  date: string;
  dayIndex: number;
  totalInspected: number;
  passedCount: number;
  failedCount: number;
  reviewCount: number;
  passRatePct: number;
  failRatePct: number;
  avgQualityScore: number;
  totalDefects: number;
  criticalDefects: number;
  scratches: number;
  cracks: number;
  particles: number;
  stains: number;
  patternAnomalies: number;
  m03DefectRate: number; // Anomaly spike tracking
}

export const generateProductionAnalyticsData = (): ProductionDailyMetric[] => {
  const data: ProductionDailyMetric[] = [];
  const now = new Date();
  const initialDate = new Date(now);
  initialDate.setDate(initialDate.getDate() - 29);

  for (let i = 0; i < 30; i++) {
    const d = new Date(initialDate);
    d.setDate(d.getDate() + i);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const total = Math.round(140 + Math.sin(i * 0.8) * 25 + (i * 1.5));
    // Simulate anomaly spike on machine M-03 during the last 5 days (days 25-29)
    const isRecentAnomaly = i >= 24;
    const baseFailRate = isRecentAnomaly ? 6.8 + (i - 24) * 0.9 : 2.8 + Math.sin(i) * 0.6;
    const failRatePct = +baseFailRate.toFixed(1);
    const reviewRatePct = +(4.2 + Math.cos(i) * 0.8).toFixed(1);
    const passRatePct = +(100 - failRatePct - reviewRatePct).toFixed(1);

    const failedCount = Math.round((total * failRatePct) / 100);
    const reviewCount = Math.round((total * reviewRatePct) / 100);
    const passedCount = total - failedCount - reviewCount;

    const cracks = isRecentAnomaly ? Math.round(3 + (i - 24) * 1.5) : Math.round(Math.random() * 2);
    const particles = Math.round(12 + Math.sin(i) * 4 + (isRecentAnomaly ? 8 : 0));
    const scratches = Math.round(8 + Math.cos(i) * 3);
    const stains = Math.round(4 + Math.sin(i * 1.2) * 2);
    const patternAnomalies = Math.round(3 + Math.cos(i * 0.9) * 2);
    const totalDefects = cracks + particles + scratches + stains + patternAnomalies;
    const criticalDefects = cracks + (isRecentAnomaly ? 2 : 0);

    const m03Rate = isRecentAnomaly ? +(4.2 + (i - 24) * 0.35).toFixed(1) : +(1.2 + Math.sin(i) * 0.3).toFixed(1);

    data.push({
      date: dateLabel,
      dayIndex: i + 1,
      totalInspected: total,
      passedCount,
      failedCount,
      reviewCount,
      passRatePct,
      failRatePct,
      avgQualityScore: +(isRecentAnomaly ? 91.2 - (i - 24) * 1.1 : 95.8 + Math.sin(i) * 0.8).toFixed(1),
      totalDefects,
      criticalDefects,
      scratches,
      cracks,
      particles,
      stains,
      patternAnomalies,
      m03DefectRate: m03Rate
    });
  }

  return data;
};

export const PRODUCTION_ANALYTICS_30_DAYS = generateProductionAnalyticsData();

// ==========================================
// Audit Log Trail
// ==========================================

export const INITIAL_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  {
    id: 'CA-01',
    inspectionId: 'INSP-2026-0818-01',
    waferId: 'W-7801-A4',
    type: 'immediate',
    title: 'Quarantine Batch #LOT-9921-X & Halt Machine M-03',
    description: 'Immediately quarantine all 25 wafers from Lot #LOT-9921-X for manual high-NA inspection. Place Machine M-03 Chamber B in engineering lockout mode.',
    priority: 'P0',
    targetEntity: 'Lot #LOT-9921-X / Machine M-03 Chamber B',
    requiresHumanApproval: true,
    status: 'pending',
    assignedRole: 'Production Manager',
    supportingRcaTitle: 'Thermal Instability & RF Matching Drift in Chamber B',
    createdAt: '2026-08-18T08:43:00Z'
  },
  {
    id: 'CA-02',
    inspectionId: 'INSP-2026-0818-01',
    waferId: 'W-7801-A4',
    type: 'investigation',
    title: 'Perform Helium MFC-04 Flush and ESC Chuck Thermal Inspection',
    description: 'Technician to inspect Mass Flow Controller MFC-04, test helium pressure leakage, and run automated chuck temperature calibration profile.',
    priority: 'P1',
    targetEntity: 'Machine M-03 Chamber B',
    requiresHumanApproval: true,
    status: 'pending',
    assignedRole: 'Quality Engineer',
    supportingRcaTitle: 'Thermal Instability & RF Matching Drift in Chamber B',
    createdAt: '2026-08-18T08:43:00Z'
  },
  {
    id: 'CA-03',
    inspectionId: 'INSP-2026-0818-01',
    waferId: 'W-7801-A4',
    type: 'preventive',
    title: 'Shorten Chamber Cleaning Threshold from 250 to 200 RF Hours',
    description: 'Update MES recipe automation rules to enforce automatic chamber dry-clean lock at 200 RF operating hours.',
    priority: 'P2',
    targetEntity: 'Fab-09 Etch Fleet MES System',
    requiresHumanApproval: false,
    status: 'pending',
    assignedRole: 'Process Engineer',
    supportingRcaTitle: 'Chamber Wall Polymer Flaking Contamination',
    createdAt: '2026-08-18T08:43:00Z'
  },
  {
    id: 'CA-04',
    inspectionId: 'INSP-2026-0818-02',
    waferId: 'W-7802-C1',
    type: 'investigation',
    title: 'EUV Reticle Pellicle Inspection & CD-SEM Verification',
    description: 'Perform optical confocal inspection of Reticle R-410 for sub-micron particulate flare and re-verify 28nm line space CD overlay on Station 1.',
    priority: 'P1',
    targetEntity: 'Lithography Scanner M-01',
    requiresHumanApproval: true,
    status: 'in_progress',
    assignedRole: 'Process Engineer',
    supportingRcaTitle: 'EUV Flare & Reticle Defocus Drift',
    createdAt: '2026-08-18T07:20:00Z'
  },
  {
    id: 'CA-05',
    inspectionId: 'INSP-2026-0817-09',
    waferId: 'W-7789-F2',
    type: 'immediate',
    title: 'Replace CMP Polishing Pad & Diamond Conditioner Grid',
    description: 'Pad wear sensor detected micro-groove degradation exceeding 0.35mm delta on Platen 2. Authorize immediate maintenance pad replacement.',
    priority: 'P0',
    targetEntity: 'CMP Tool M-04 Platen 2',
    requiresHumanApproval: true,
    status: 'approved',
    assignedRole: 'admin',
    approvedBy: 'Arpit Sharma',
    approvedAt: '2026-08-17T16:10:00Z',
    supportingRcaTitle: 'Pad Glazing & Asymmetric Slurry Dispersion',
    createdAt: '2026-08-17T15:45:00Z'
  },
  {
    id: 'CA-06',
    inspectionId: 'INSP-2026-0816-14',
    waferId: 'W-7760-K8',
    type: 'preventive',
    title: 'Chemical Wet Bench WB-02 Megasonic Transducer Recalibration',
    description: 'Recalibrate 1.2MHz megasonic acoustic power delivery and flush DI rinse nozzle manifold to prevent slurry residue spots.',
    priority: 'P2',
    targetEntity: 'Wet Bench WB-02 Tank 3',
    requiresHumanApproval: true,
    status: 'approved',
    assignedRole: 'admin',
    approvedBy: 'Arpit Sharma',
    approvedAt: '2026-08-16T11:30:00Z',
    supportingRcaTitle: 'Post-Clean DI Water Stagnation',
    createdAt: '2026-08-16T09:15:00Z'
  },
  {
    id: 'CA-07',
    inspectionId: 'INSP-2026-0815-03',
    waferId: 'W-7742-D3',
    type: 'immediate',
    title: 'Emergency Gas Line Valve Lockout (SF6/O2 Ratio Imbalance)',
    description: 'Chamber C mass spectrometer detected 14% fluorine excess during poly etch strike. Emergency automated isolation requested.',
    priority: 'P0',
    targetEntity: 'Plasma Etcher M-03 Chamber C',
    requiresHumanApproval: true,
    status: 'rejected',
    assignedRole: 'admin',
    approvedBy: 'Arpit Sharma',
    approvedAt: '2026-08-15T18:05:00Z',
    supportingRcaTitle: 'Gas Manifold Sensor False Trigger',
    createdAt: '2026-08-15T17:50:00Z'
  },
  {
    id: 'CA-08',
    inspectionId: 'INSP-2026-0814-11',
    waferId: 'W-7710-J5',
    type: 'investigation',
    title: 'Automated Recipe Parameter Validation & Drift Correction',
    description: 'Audit MES automated recipe dispatch for Low-K Dielectric PECVD deposition stage. Validate RF bias power ramp profile.',
    priority: 'P2',
    targetEntity: 'PECVD Tool M-02',
    requiresHumanApproval: false,
    status: 'completed',
    assignedRole: 'admin',
    supportingRcaTitle: 'RF Generator Match Drift',
    createdAt: '2026-08-14T10:00:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-08-18T08:43:05Z',
    category: 'approval',
    severity: 'warning',
    actor: 'Arpit Sharma',
    userRole: 'admin',
    action: 'Requested Batch Quarantine (Lot #LOT-9921-X)',
    details: 'Triggered Human-in-the-Loop P0 quarantine for 25 wafers following Critical Edge Crack detection on Machine M-03.',
    targetEntityId: 'LOT-9921-X',
    ipAddress: '10.240.12.88'
  },
  {
    id: 'AUD-002',
    timestamp: '2026-08-18T08:42:20Z',
    category: 'inspection',
    severity: 'critical',
    actor: 'Autonomous Vision Agent',
    userRole: 'admin',
    action: 'Completed AI Wafer Inspection (W-7801-A4)',
    details: 'Detected 4 defects (1 Critical Crack, 1 High Particle Cluster, 1 Medium Scratch, 1 Low Stain). Final Verdict: FAIL.',
    targetEntityId: 'INSP-2026-0818-01',
    ipAddress: '10.240.10.15'
  },
  {
    id: 'AUD-003',
    timestamp: '2026-08-18T08:42:25Z',
    category: 'rca',
    severity: 'info',
    actor: 'Autonomous Quality Engineer Agent',
    userRole: 'admin',
    action: 'Root-Cause Analysis Synthesized',
    details: 'Identified Thermal Instability & RF Matching Drift in Chamber B (Evidence Score: 82%) supported by SOP-ETC-412 and Case #HIST-2025-0812.',
    targetEntityId: 'RCA-01',
    ipAddress: '10.240.10.16'
  },
  {
    id: 'AUD-004',
    timestamp: '2026-08-18T07:15:35Z',
    category: 'inspection',
    severity: 'warning',
    actor: 'Autonomous Vision Agent',
    userRole: 'admin',
    action: 'Completed AI Wafer Inspection (W-7802-C1)',
    details: 'Detected Pattern Bridge Anomaly in EUV Layer. Final Verdict: REVIEW_REQUIRED (Quality Score: 81/100).',
    targetEntityId: 'INSP-2026-0818-02',
    ipAddress: '10.240.10.15'
  },
  {
    id: 'AUD-005',
    timestamp: '2026-08-18T06:05:15Z',
    category: 'inspection',
    severity: 'success',
    actor: 'Arpit Sharma',
    userRole: 'admin',
    action: 'Approved Inspection Pass (W-7803-B9)',
    details: 'Zero defects detected on CMP wafer. Final Verdict: PASS (Quality Score: 99/100).',
    targetEntityId: 'INSP-2026-0818-03',
    ipAddress: '10.240.12.92'
  },
  {
    id: 'AUD-006',
    timestamp: '2026-08-17T16:10:00Z',
    category: 'approval',
    severity: 'success',
    actor: 'Arpit Sharma',
    userRole: 'admin',
    action: 'Approved Corrective Action (CA-05: CMP Pad Replacement)',
    details: 'Authorized immediate maintenance shutdown and platen pad exchange for Tool M-04.',
    targetEntityId: 'CA-05',
    ipAddress: '10.240.12.75'
  },
  {
    id: 'AUD-007',
    timestamp: '2026-08-17T14:20:00Z',
    category: 'knowledge',
    severity: 'info',
    actor: 'Arpit Sharma',
    userRole: 'admin',
    action: 'Ingested Knowledge Document',
    details: 'Indexed SOP-CVD-305: Particle Contamination & Chamber Cleaning SOP (10 vector chunks generated).',
    targetEntityId: 'doc-sop-cvd-305',
    ipAddress: '10.240.12.10'
  },
  {
    id: 'AUD-008',
    timestamp: '2026-08-16T15:30:22Z',
    category: 'machine',
    severity: 'warning',
    actor: 'Telemetry Stream Monitor',
    userRole: 'admin',
    action: 'Chamber B Thermal Drift Flagged',
    details: 'Telemetry alert: ESC Chuck temperature +18.4°C over setpoint on Tool M-03.',
    targetEntityId: 'M-03',
    ipAddress: '10.240.10.40'
  },
  {
    id: 'AUD-009',
    timestamp: '2026-08-16T11:30:00Z',
    category: 'approval',
    severity: 'success',
    actor: 'Arpit Sharma',
    userRole: 'admin',
    action: 'Approved Megasonic Calibration (CA-06)',
    details: 'Approved acoustic calibration profile for Wet Bench WB-02 following periodic slurry residue check.',
    targetEntityId: 'CA-06',
    ipAddress: '10.240.12.88'
  },
  {
    id: 'AUD-010',
    timestamp: '2026-08-15T18:05:00Z',
    category: 'approval',
    severity: 'warning',
    actor: 'Arpit Sharma',
    userRole: 'admin',
    action: 'Rejected Emergency Gas Lockout (CA-07)',
    details: 'Overruled emergency tool shutdown after confirming sensor telemetry false trigger on Chamber C.',
    targetEntityId: 'CA-07',
    ipAddress: '10.240.12.75'
  },
  {
    id: 'AUD-011',
    timestamp: '2026-08-15T09:40:10Z',
    category: 'auth',
    severity: 'info',
    actor: 'Security Gateway',
    userRole: 'admin',
    action: 'User Multi-Factor Authentication Verified',
    details: 'Arpit Sharma successfully verified TOTP 2FA token from IP 10.240.12.88.',
    targetEntityId: 'user-01',
    ipAddress: '10.240.12.88'
  },
  {
    id: 'AUD-012',
    timestamp: '2026-08-14T14:15:00Z',
    category: 'machine',
    severity: 'info',
    actor: 'Arpit Sharma',
    userRole: 'admin',
    action: 'Vision Model Weights Deployed',
    details: 'Deployed WaferGuard-YOLOv8-Semiconductor-v2.4 with 0.85 confidence threshold.',
    targetEntityId: 'MODEL-YOLO-V2.4',
    ipAddress: '10.240.12.10'
  }
];

// ==========================================
// Structured Defect Taxonomy Reference
// ==========================================

export interface DefectTaxonomyDefinition {
  category: DefectCategory;
  displayName: string;
  description: string;
  typicalCauses: string[];
  defaultSeverity: 'critical' | 'high' | 'medium' | 'low';
  inspectionMethods: string[];
  semiCode: string;
}

export const DEFECT_TAXONOMY_CATALOG: DefectTaxonomyDefinition[] = [
  {
    category: 'crack',
    displayName: 'Wafer Crack & Substrate Fracture',
    description: 'Physical micro-fissure or mechanical fracture penetrating through silicon crystal lattice or edge boundary.',
    typicalCauses: ['Thermal shock gradient', 'Mechanical chuck stress concentration', 'Robot end-effector impact', 'Edge bevel chipping'],
    defaultSeverity: 'critical',
    inspectionMethods: ['Brightfield Optical', 'Acoustic Microscopy', 'High-NA SEM'],
    semiCode: 'SEMI-CRK-01'
  },
  {
    category: 'particle_contamination',
    displayName: 'Particle Contamination & Flakes',
    description: 'Extraneous particulate matter (organic, metallic, or dielectric) deposited onto wafer surface causing bridging or litho shadow.',
    typicalCauses: ['Chamber liner flaking', 'Gas line byproduct precipitation', 'Slurry residue', 'Cleanroom airflow eddy'],
    defaultSeverity: 'high',
    inspectionMethods: ['Laser Scatterometry', 'Darkfield Imaging', 'EDX Compositional Analysis'],
    semiCode: 'SEMI-PAR-02'
  },
  {
    category: 'scratch',
    displayName: 'Surface Scratch & Pad Abrasion',
    description: 'Linear mechanical indentation or gouge on dielectric, passivation, or metal interconnect layers.',
    typicalCauses: ['CMP pad diamond grit loss', 'Handling robot gripper slippage', 'Wafer cassette slot friction'],
    defaultSeverity: 'medium',
    inspectionMethods: ['Darkfield Optical', 'AFM Surface Profilometry'],
    semiCode: 'SEMI-SCR-03'
  },
  {
    category: 'pattern_anomaly',
    displayName: 'Pattern Anomaly & Line Bridging',
    description: 'Critical dimension (CD) variation, micro-bridging, or line collapse in patterned photoresist or etched features.',
    typicalCauses: ['EUV photon shot noise', 'Resist under-exposure', 'Mask reticle pellicle contamination', 'Focus defocus drift'],
    defaultSeverity: 'high',
    inspectionMethods: ['CD-SEM', 'Scatterometry Overlay', 'Broadband E-beam'],
    semiCode: 'SEMI-PAT-04'
  },
  {
    category: 'edge_defect',
    displayName: 'Edge Exclusion Zone Defect',
    description: 'Chipping, film peeling, or edge bead removal (EBR) irregularity in the outer 1-3mm wafer margin.',
    typicalCauses: ['EBR nozzle mis-aim', 'Bevel grinding micro-cracks', 'Clamp ring mechanical friction'],
    defaultSeverity: 'high',
    inspectionMethods: ['Edge Inspection Scanner', 'Confocal Microscopy'],
    semiCode: 'SEMI-EDG-05'
  },
  {
    category: 'alignment_defect',
    displayName: 'Alignment & Overlay Registration Error',
    description: 'Positional displacement between sequential lithographic exposure layers exceeding design tolerance.',
    typicalCauses: ['Wafer stage interferometer drift', 'Thermal expansion', 'Alignment mark damage or distortion'],
    defaultSeverity: 'medium',
    inspectionMethods: ['Overlay Metrology Scanner', 'Diffraction-based Overlay (DBO)'],
    semiCode: 'SEMI-ALN-06'
  },
  {
    category: 'missing_structure',
    displayName: 'Missing Structure & Pattern Open',
    description: 'Absence of expected contact hole, via, or interconnect trace due to incomplete etch or blocked mask window.',
    typicalCauses: ['Contact etch polymer blockage', 'Under-developed photoresist', 'Pinhole mask defect'],
    defaultSeverity: 'critical',
    inspectionMethods: ['Voltage Contrast SEM', 'E-beam Inspection'],
    semiCode: 'SEMI-MIS-07'
  },
  {
    category: 'stain',
    displayName: 'Chemical Residue & Drying Stain',
    description: 'Non-uniform chemical residue, water mark, or slurry puddle left after wet clean or rinse steps.',
    typicalCauses: ['Marangoni dryer airflow imbalance', 'Incomplete DI water rinse', 'Chemical evaporation residue'],
    defaultSeverity: 'low',
    inspectionMethods: ['Spectroscopic Ellipsometry', 'Surface Reflectometry'],
    semiCode: 'SEMI-STN-08'
  },
  {
    category: 'abnormal_region',
    displayName: 'Abnormal Surface Contrast Region',
    description: 'Large-area optical contrast deviation indicating film thickness non-uniformity or plasma density imbalance.',
    typicalCauses: ['Gas showerhead nozzle clog', 'Chamber plasma glow discharge anomaly', 'CMP center-to-edge non-uniformity'],
    defaultSeverity: 'medium',
    inspectionMethods: ['Full-Wafer Color Mapping', 'Ellipsometric Film Thickness Mapper'],
    semiCode: 'SEMI-ABN-09'
  },
  {
    category: 'general_surface_anomaly',
    displayName: 'General Unclassified Surface Anomaly',
    description: 'Surface anomaly not yet matching primary taxonomies; flagged for engineer triage and review.',
    typicalCauses: ['Multi-variable process interaction', 'Novel recipe instability'],
    defaultSeverity: 'medium',
    inspectionMethods: ['Automated SEM Classification', 'Vision-Language Model Review'],
    semiCode: 'SEMI-GEN-10'
  }
];
