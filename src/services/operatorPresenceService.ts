// ==========================================================
// WaferGuard AI — Real-Time Operator Presence & WebSocket Service
// SEMI E10 Cleanroom Multi-Operator Concurrency & Lock Shield
// ==========================================================

import { ActiveOperator, OperatorLockInfo, OperatorStatus, WebSocketPresenceEvent, UserProfile } from '../types';

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'offline';

export interface PresenceState {
  connectionState: ConnectionState;
  wsEndpoint: string;
  latencyMs: number;
  currentWaferId: string;
  operators: ActiveOperator[];
  lockInfo: OperatorLockInfo;
  currentUserStatus: OperatorStatus;
  recentPings: Array<{ id: string; sender: string; text: string; time: number }>;
}

type PresenceListener = (state: PresenceState) => void;

// Realistic Cleanroom Teammate Pool
const SIMULATED_TEAMMATES: Omit<ActiveOperator, 'currentWaferId' | 'joinedAt' | 'lastActive' | 'isEditing' | 'status' | 'actionDetail'>[] = [
  {
    id: 'op-elena-vance',
    name: 'Dr. Elena Vance',
    email: 'e.vance@fab09.internal',
    role: 'Lead Metrologist',
    avatarColor: 'from-purple-500 to-indigo-600',
    station: 'Station SEM-04',
    bay: 'Bay 04 (Litho/Metrology)',
    deviceType: 'cleanroom_hud',
    lockedSection: 'Die #14 Bounding Box & SEM Review'
  },
  {
    id: 'op-marcus-chen',
    name: 'Marcus Chen',
    email: 'm.chen@fab09.internal',
    role: 'Senior Process Engineer',
    avatarColor: 'from-cyan-500 to-blue-600',
    station: 'Station ETCH-02',
    bay: 'Bay 02 (Dry Etch Cluster)',
    deviceType: 'workstation',
    lockedSection: 'Chamber M-03 RF Drift Correlation'
  },
  {
    id: 'op-sarah-jenkins',
    name: 'Sarah Jenkins',
    email: 's.jenkins@fab09.internal',
    role: 'Senior QA Engineer',
    avatarColor: 'from-emerald-500 to-teal-600',
    station: 'Station QA-01',
    bay: 'Bay 01 (Cleanroom QA)',
    deviceType: 'tablet'
  },
  {
    id: 'op-alex-rivera',
    name: 'Alex Rivera',
    email: 'a.rivera@fab09.internal',
    role: 'Cleanroom Technician',
    avatarColor: 'from-amber-500 to-orange-600',
    station: 'Station ROBOT-09',
    bay: 'Bay 05 (Wafer Handling)',
    deviceType: 'terminal'
  },
  {
    id: 'op-viktor-novak',
    name: 'Viktor Novak',
    email: 'v.novak@fab09.internal',
    role: 'Yield Analytics Specialist',
    avatarColor: 'from-rose-500 to-pink-600',
    station: 'Station YIELD-08',
    bay: 'Bay 03 (Metrology Analytics)',
    deviceType: 'workstation'
  }
];

class OperatorPresenceService {
  private listeners: Set<PresenceListener> = new Set();
  private state: PresenceState = {
    connectionState: 'connected',
    wsEndpoint: 'wss://fab09-relay.semiconductor.internal:3000/presence/ws',
    latencyMs: 14,
    currentWaferId: 'WFR-2026-X89',
    operators: [],
    lockInfo: {
      isLocked: false,
      conflictDetected: false
    },
    currentUserStatus: 'VIEWING',
    recentPings: []
  };

  private currentUser: UserProfile | null = null;
  private simulationInterval: any = null;
  private latencyInterval: any = null;

  constructor() {
    this.initSimulationLoop();
  }

  // Subscribe to real-time state changes
  public subscribe(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  public getState(): PresenceState {
    return { ...this.state };
  }

  // Initialize or join a wafer inspection room
  public joinWaferRoom(waferId: string, user: UserProfile) {
    this.currentUser = user;
    if (this.state.currentWaferId === waferId && this.state.operators.length > 0) {
      return;
    }

    this.state.currentWaferId = waferId;
    this.state.connectionState = 'connecting';
    this.notify();

    // Realistic WebSocket room handshake
    setTimeout(() => {
      this.state.connectionState = 'connected';
      this.state.latencyMs = Math.floor(10 + Math.random() * 12);
      this.seedOperatorsForWafer(waferId);
      this.notify();
    }, 180);
  }

  // Seed realistic team presence for the given wafer
  private seedOperatorsForWafer(waferId: string) {
    const now = Date.now();

    // Deterministic selection based on waferId to give consistent yet varied presence
    const hash = waferId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const count = 2 + (hash % 3); // 2 to 4 other operators
    const selected = SIMULATED_TEAMMATES.slice(0, count);

    // One operator might be actively modifying if the wafer has high defect density or specific id
    const hasModifyingOperator = hash % 2 === 0;

    const operators: ActiveOperator[] = selected.map((base, idx) => {
      const isModifying = hasModifyingOperator && idx === 0;
      return {
        ...base,
        currentWaferId: waferId,
        joinedAt: now - (idx + 1) * 120000 - Math.floor(Math.random() * 60000),
        lastActive: now - Math.floor(Math.random() * 15000),
        status: isModifying ? 'MODIFYING' : (idx === 1 && Math.random() > 0.6 ? 'IDLE' : 'VIEWING'),
        isEditing: isModifying,
        actionDetail: isModifying 
          ? `Modifying ${base.lockedSection || 'Defect Annotations & Bounding Boxes'}`
          : idx === 1 
            ? 'Analyzing Spatial Yield Heatmap'
            : 'Viewing SEM Die #07 High-Mag Inspection',
        lockedSection: isModifying ? (base.lockedSection || 'Defect Annotations') : undefined
      };
    });

    const activeLockHolder = operators.find(o => o.status === 'MODIFYING');

    this.state.operators = operators;
    this.state.lockInfo = {
      isLocked: !!activeLockHolder,
      lockedBy: activeLockHolder,
      lockedSection: activeLockHolder?.lockedSection || undefined,
      lockedAt: activeLockHolder ? now - 45000 : undefined,
      conflictDetected: !!activeLockHolder && this.state.currentUserStatus === 'MODIFYING',
      conflictMessage: activeLockHolder 
        ? `Operator ${activeLockHolder.name} is currently modifying this record from ${activeLockHolder.station}. Concurrent edits will require reconciliation.`
        : undefined
    };
  }

  // Set the current logged-in user's presence & editing lock
  public setCurrentUserStatus(status: OperatorStatus, actionDetail?: string, lockedSection?: string) {
    this.state.currentUserStatus = status;

    const now = Date.now();
    const isEditing = status === 'MODIFYING';

    // If user is editing and someone else is editing, trigger conflict warning
    const otherModifying = this.state.operators.find(o => o.status === 'MODIFYING');
    
    if (isEditing) {
      if (otherModifying) {
        this.state.lockInfo = {
          isLocked: true,
          lockedBy: otherModifying,
          lockedSection: otherModifying.lockedSection,
          lockedAt: this.state.lockInfo.lockedAt || now,
          conflictDetected: true,
          conflictMessage: `CONCURRENT EDIT CONFLICT: ${otherModifying.name} holds the active write lock on ${otherModifying.lockedSection}. Your changes will be buffered.`
        };
      } else {
        this.state.lockInfo = {
          isLocked: true,
          lockedBy: this.currentUser ? {
            id: this.currentUser.id,
            name: this.currentUser.name,
            email: this.currentUser.email,
            role: this.currentUser.role,
            avatarColor: 'from-indigo-500 to-purple-600',
            station: 'Local Terminal',
            bay: 'Active Cleanroom Console',
            status: 'MODIFYING',
            actionDetail: actionDetail || 'Editing Defect Annotations & Bounding Boxes',
            currentWaferId: this.state.currentWaferId,
            joinedAt: now - 300000,
            lastActive: now,
            isEditing: true,
            lockedSection: lockedSection || 'Defect Annotations',
            deviceType: 'workstation'
          } : undefined,
          lockedSection: lockedSection || 'Defect Annotations',
          lockedAt: now,
          conflictDetected: false
        };
      }
    } else {
      // User is viewing or idle
      if (this.state.lockInfo.lockedBy?.id === this.currentUser?.id) {
        // Release user lock
        const remainingLockHolder = this.state.operators.find(o => o.status === 'MODIFYING');
        this.state.lockInfo = {
          isLocked: !!remainingLockHolder,
          lockedBy: remainingLockHolder,
          lockedSection: remainingLockHolder?.lockedSection,
          lockedAt: remainingLockHolder ? now - 30000 : undefined,
          conflictDetected: false
        };
      }
    }

    this.notify();
  }

  // Request handover or claim write lock
  public requestOrTakeoverLock(customReason?: string) {
    const now = Date.now();
    // Reassign lock to current user and set other operators to VIEWING
    this.state.operators = this.state.operators.map(op => {
      if (op.status === 'MODIFYING') {
        return {
          ...op,
          status: 'VIEWING',
          isEditing: false,
          actionDetail: 'Handed over write lock — now observing live stream',
          lockedSection: undefined,
          lastActive: now
        };
      }
      return op;
    });

    this.state.currentUserStatus = 'MODIFYING';
    this.state.lockInfo = {
      isLocked: true,
      lockedBy: this.currentUser ? {
        id: this.currentUser.id,
        name: this.currentUser.name,
        email: this.currentUser.email,
        role: this.currentUser.role,
        avatarColor: 'from-indigo-500 to-purple-600',
        station: 'Local Terminal',
        bay: 'Active Cleanroom Console',
        status: 'MODIFYING',
        actionDetail: customReason || 'Acquired Write Lock: Editing Defect Annotations',
        currentWaferId: this.state.currentWaferId,
        joinedAt: now - 300000,
        lastActive: now,
        isEditing: true,
        lockedSection: 'Defect Annotations',
        deviceType: 'workstation'
      } : undefined,
      lockedSection: 'Defect Annotations',
      lockedAt: now,
      conflictDetected: false,
      conflictMessage: undefined
    };

    this.notify();
  }

  // Send a cleanroom ping / direct message to a peer operator
  public sendPingToOperator(operatorId: string, message: string = 'Coordinating on current wafer defect inspection.') {
    const target = this.state.operators.find(o => o.id === operatorId);
    const ping = {
      id: 'ping-' + Date.now(),
      sender: this.currentUser?.name || 'Local Operator',
      text: `Ping sent to ${target?.name || 'Operator'}: "${message}"`,
      time: Date.now()
    };
    this.state.recentPings = [ping, ...this.state.recentPings.slice(0, 4)];
    this.notify();
    return ping;
  }

  // Simulate real-time interactions for testing and demonstrations
  public simulateOperatorAction(action: 'toggle_modifying' | 'add_operator' | 'remove_operator' | 'random_heartbeat') {
    const now = Date.now();

    if (action === 'toggle_modifying') {
      const existingModifierIndex = this.state.operators.findIndex(o => o.status === 'MODIFYING');
      if (existingModifierIndex >= 0) {
        // Stop modifying
        this.state.operators[existingModifierIndex] = {
          ...this.state.operators[existingModifierIndex],
          status: 'VIEWING',
          isEditing: false,
          actionDetail: 'Observing Metrology Defect Map',
          lockedSection: undefined,
          lastActive: now
        };
        this.state.lockInfo = {
          isLocked: this.state.currentUserStatus === 'MODIFYING',
          lockedBy: this.state.currentUserStatus === 'MODIFYING' ? this.state.lockInfo.lockedBy : undefined,
          lockedSection: this.state.currentUserStatus === 'MODIFYING' ? 'Defect Annotations' : undefined,
          conflictDetected: false
        };
      } else if (this.state.operators.length > 0) {
        // Start modifying
        const target = this.state.operators[0];
        this.state.operators[0] = {
          ...target,
          status: 'MODIFYING',
          isEditing: true,
          actionDetail: `Modifying Bounding Box on Die #${Math.floor(10 + Math.random() * 20)}`,
          lockedSection: 'Bounding Box & SEM Verification',
          lastActive: now
        };
        this.state.lockInfo = {
          isLocked: true,
          lockedBy: this.state.operators[0],
          lockedSection: 'Bounding Box & SEM Verification',
          lockedAt: now,
          conflictDetected: this.state.currentUserStatus === 'MODIFYING',
          conflictMessage: `Operator ${target.name} acquired active lock from ${target.station}.`
        };
      }
    } else if (action === 'add_operator') {
      const existingIds = new Set(this.state.operators.map(o => o.id));
      const pool = SIMULATED_TEAMMATES.filter(t => !existingIds.has(t.id));
      if (pool.length > 0) {
        const newOp = pool[0];
        this.state.operators.push({
          ...newOp,
          currentWaferId: this.state.currentWaferId,
          joinedAt: now,
          lastActive: now,
          status: 'VIEWING',
          isEditing: false,
          actionDetail: 'Just connected to cleanroom stream',
        });
      }
    } else if (action === 'remove_operator') {
      if (this.state.operators.length > 1) {
        const removed = this.state.operators.pop();
        if (removed && removed.status === 'MODIFYING') {
          this.state.lockInfo = {
            isLocked: false,
            conflictDetected: false
          };
        }
      }
    } else if (action === 'random_heartbeat') {
      this.state.operators = this.state.operators.map(op => ({
        ...op,
        lastActive: now - Math.floor(Math.random() * 8000),
        actionDetail: op.status === 'MODIFYING' 
          ? op.actionDetail 
          : ['Examining Die Defect #03', 'Reviewing Spectral Map', 'Comparing Historical Lot L-8812', 'Analyzing 3D Topology'][Math.floor(Math.random() * 4)]
      }));
    }

    this.notify();
  }

  public setConnectionState(state: ConnectionState) {
    this.state.connectionState = state;
    this.notify();
  }

  // Periodic heartbeat loop simulating live WebSocket traffic
  private initSimulationLoop() {
    this.simulationInterval = setInterval(() => {
      if (this.state.connectionState !== 'connected') return;

      const now = Date.now();
      // Update operators activity timestamps
      let changed = false;
      this.state.operators = this.state.operators.map(op => {
        if (Math.random() > 0.6) {
          changed = true;
          return {
            ...op,
            lastActive: now - Math.floor(Math.random() * 4000)
          };
        }
        return op;
      });

      if (changed) {
        this.notify();
      }
    }, 6000);

    // Subtle latency jitter
    this.latencyInterval = setInterval(() => {
      if (this.state.connectionState === 'connected') {
        this.state.latencyMs = Math.floor(9 + Math.random() * 11);
        this.notify();
      }
    }, 12000);
  }

  public destroy() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.latencyInterval) clearInterval(this.latencyInterval);
    this.listeners.clear();
  }
}

export const operatorPresenceService = new OperatorPresenceService();
