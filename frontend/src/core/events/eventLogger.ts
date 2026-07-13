import { EventPayload, EventLogEntry, EventType } from './eventTypes';
import { globalEventBus } from './eventBus';

const STORAGE_KEY = 'guardian-event-bus-logs';

export const getEventLogs = (): EventLogEntry[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

export const logEvent = (payload: EventPayload): void => {
  const logs = getEventLogs();
  const entry: EventLogEntry = {
    id: `${payload.type}-${payload.timestamp}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: payload.timestamp,
    eventType: payload.type,
    userName: payload.user?.name || 'System Operator',
    userRole: payload.user?.role || 'system',
    caseId: payload.caseId || 'global',
    status: payload.status || 'unknown',
    source: payload.source,
    details: typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data),
  };
  const updated = [entry, ...logs].slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

const ALL_EVENT_TYPES: EventType[] = [
  'CaseCreated',
  'CaseUpdated',
  'CaseAssigned',
  'CaseAccepted',
  'CaseRejected',
  'PriorityChanged',
  'AIAnalysisCompleted',
  'HospitalAssigned',
  'PoliceAssigned',
  'VolunteerAssigned',
  'NGOAssigned',
  'ChildWelfareAssigned',
  'ResponderStarted',
  'ResponderReached',
  'CaseClosed',
  'NotificationCreated',
  'ReportGenerated',
  'UserOnline',
  'UserOffline',
  'BroadcastCreated',
];

export const initEventLogger = (): void => {
  ALL_EVENT_TYPES.forEach((type) => {
    globalEventBus.subscribe(type, (payload) => {
      logEvent(payload);
    });
  });
};
