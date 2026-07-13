import React from 'react';

export type ActionCategory =
  | 'Emergency'
  | 'Medical'
  | 'Police'
  | 'Volunteer'
  | 'NGO'
  | 'Child Welfare'
  | 'Administration'
  | 'AI'
  | 'Reports'
  | 'Navigation';

export interface ActionLog {
  who: string;
  when: string; // ISO String
  role: string;
  actionTitle: string;
  caseId: string;
  timestamp: number; // Unix timestamp
}

export interface ActionContext {
  currentCase: any | null;
  currentRole: string;
  user: any;
  cases: any[];
  setCases: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedCase: (c: any | null) => void;
  activeDispatches: any;
  startDispatchAnimation: (caseId: string, lat: number, lng: number) => void;
  addNotification: (notification: any) => void;
  playAlertSound?: () => void;
  navigate?: (path: string) => void;
  logAction: (actionLog: Omit<ActionLog, 'timestamp' | 'when'>) => void;
  triggerToast?: (title: string, body: string, type: 'emergency' | 'success' | 'warning' | 'info') => void;
}

export interface ActionConfig {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon component name
  category: ActionCategory;
  permission: string; // Role name or general scope
  workflowStage?: string; // Stage condition
  visibleWhen?: (context: ActionContext) => boolean;
  enabledWhen?: (context: ActionContext) => boolean;
  priority: number; // Sorting order
  buttonStyle: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  confirmDialog?: {
    title: string;
    body: string;
    confirmText: string;
    cancelText: string;
  };
  successMessage: string;
  handler: (context: ActionContext) => Promise<any> | any;
}
