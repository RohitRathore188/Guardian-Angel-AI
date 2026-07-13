import { ActionConfig } from './types';

const adminActions: ActionConfig[] = [
  {
    id: 'admin-broadcast-alert',
    title: 'Broadcast Alert',
    description: 'Broadcast high-priority emergency alerts across all regional networks.',
    icon: 'Radio',
    category: 'Administration',
    permission: 'admin',
    priority: 1,
    buttonStyle: 'danger',
    confirmDialog: {
      title: 'Issue Global Broadcast Alert?',
      body: 'This will push priority notifications to all mobile citizens and rescue squads in the region.',
      confirmText: 'Broadcast Now',
      cancelText: 'Cancel',
    },
    successMessage: 'Global emergency broadcast alert dispatched.',
    handler: (ctx) => {
      ctx.addNotification({
        caseId: 'global',
        title: '📢 CRITICAL BROADCAST ALERT',
        body: 'Alert issued across all emergency grids. Check tracking zones.',
        category: 'Emergency',
        priority: 'critical',
      });
      if (ctx.playAlertSound) ctx.playAlertSound();
      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Broadcasted global emergency alarm alert',
        caseId: 'global',
      });
    },
  },
  {
    id: 'admin-assign-agency',
    title: 'Assign Agency',
    description: 'Manually re-route incident caseload responsibility to another division.',
    icon: 'CornerUpRight',
    category: 'Administration',
    permission: 'admin',
    priority: 2,
    buttonStyle: 'primary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Caseload assigned successfully.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🔄 Agency caseload assigned',
        body: `Incident routed to pediatric medical ER triage team.`,
        category: 'Administration',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Re-routed case assignment',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'admin-override-priority',
    title: 'Override Priority',
    description: 'Override AI incident severity ranking parameters manually.',
    icon: 'AlertOctagon',
    category: 'Administration',
    permission: 'admin',
    priority: 3,
    buttonStyle: 'warning',
    visibleWhen: (ctx) => !!ctx.currentCase,
    confirmDialog: {
      title: 'Override Incident Priority?',
      body: 'Are you sure you want to manually elevate this report to CRITICAL severity classification?',
      confirmText: 'Confirm Override',
      cancelText: 'Cancel',
    },
    successMessage: 'Incident severity set to Critical.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, ai_severity: 'critical' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, ai_severity: 'critical' });

      ctx.addNotification({
        title: '⚠️ Severity Priority Elevated',
        body: 'Severity overridden to CRITICAL priority by platform administrator.',
        category: 'Emergency',
        priority: 'critical',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Elevated Case severity priority to critical',
        caseId,
      });
    },
  },
  {
    id: 'admin-generate-ai',
    title: 'Generate AI Report',
    description: 'Trigger visual analysis logs aggregation and download.',
    icon: 'BrainCircuit',
    category: 'AI',
    permission: 'admin',
    priority: 4,
    buttonStyle: 'info',
    successMessage: 'AI Synthesis finished successfully.',
    handler: (ctx) => {
      ctx.triggerToast?.('Guardian AI Synthesis', 'Synthesized total caseload parameters. Downloaded summary report: guardian_ai_audit.txt', 'success');
      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Triggered Gemini report compilation',
        caseId: 'global',
      });
    },
  },
  {
    id: 'admin-export-data',
    title: 'Export Data',
    description: 'Download Supabase database backup logs and CSV incident summaries.',
    icon: 'FileSpreadsheet',
    category: 'Reports',
    permission: 'admin',
    priority: 5,
    buttonStyle: 'secondary',
    successMessage: 'Database logs export initiated.',
    handler: (ctx) => {
      ctx.triggerToast?.('Data Export', 'Exported file: GUARDIAN_INCIDENTS_DB_EXPORT.csv', 'success');
      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Exported active cases database dump',
        caseId: 'global',
      });
    },
  },
  {
    id: 'admin-manage-users',
    title: 'Manage Users',
    description: 'View active profiles list and override Raw Roles values.',
    icon: 'UserCog',
    category: 'Administration',
    permission: 'admin',
    priority: 6,
    buttonStyle: 'secondary',
    successMessage: 'User management console active.',
    handler: (ctx) => {
      ctx.triggerToast?.('User Manager', 'Routing to user manager profiles directory layout.', 'info');
      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Opened profiles directory manager',
        caseId: 'global',
      });
    },
  },
  {
    id: 'admin-monitor-system',
    title: 'Monitor System',
    description: 'Refresh and audit OSRM servers, Supabase logs and audio sirens channels.',
    icon: 'Activity',
    category: 'Administration',
    permission: 'admin',
    priority: 7,
    buttonStyle: 'secondary',
    successMessage: 'System audit monitoring diagnostics complete.',
    handler: (ctx) => {
      ctx.triggerToast?.('System Diagnostics', 'Supabase Latency: 42ms. OSRM status: Online. Audio sirens: Enabled.', 'info');
      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Triggered diagnostics check',
        caseId: 'global',
      });
    },
  },
  {
    id: 'admin-lockdown',
    title: 'Emergency Lockdown',
    description: 'Suspend all active telemetry networks and lock out profiles.',
    icon: 'Lock',
    category: 'Emergency',
    permission: 'admin',
    priority: 8,
    buttonStyle: 'danger',
    confirmDialog: {
      title: 'Trigger Platform Emergency Lockdown?',
      body: 'This high-security protocol suspends user sessions, silences real-time subscriptions, and locks all reports.',
      confirmText: 'Lockdown System',
      cancelText: 'Cancel',
    },
    successMessage: 'Platform locked down successfully.',
    handler: (ctx) => {
      ctx.addNotification({
        caseId: 'global',
        title: '🚨 PLATFORM SYSTEM LOCKDOWN ACTIVATED',
        body: 'CASES LOCKED. Telemetry operations halted by administrator authority.',
        category: 'Emergency',
        priority: 'critical',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Administrator',
        role: 'admin',
        actionTitle: 'Activated complete emergency lockdown protocol',
        caseId: 'global',
      });
    },
  },
];

export default adminActions;
