export type EventType =
  | 'CaseCreated'
  | 'CaseUpdated'
  | 'CaseAssigned'
  | 'CaseAccepted'
  | 'CaseRejected'
  | 'PriorityChanged'
  | 'AIAnalysisCompleted'
  | 'HospitalAssigned'
  | 'PoliceAssigned'
  | 'VolunteerAssigned'
  | 'NGOAssigned'
  | 'ChildWelfareAssigned'
  | 'ResponderStarted'
  | 'ResponderReached'
  | 'CaseClosed'
  | 'NotificationCreated'
  | 'ReportGenerated'
  | 'UserOnline'
  | 'UserOffline'
  | 'BroadcastCreated';

export interface EventPayload<T = any> {
  type: EventType;
  timestamp: number;
  user?: {
    name: string;
    role: string;
  };
  caseId?: string;
  status?: string;
  source: 'client' | 'server' | 'ai' | 'system';
  data: T;
}

export interface EventLogEntry {
  id: string;
  timestamp: number;
  eventType: EventType;
  userName: string;
  userRole: string;
  caseId: string;
  status: string;
  source: string;
  details?: string;
}
