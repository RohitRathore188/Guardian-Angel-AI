import type { ActionConfig, ActionContext } from './types';
import citizenActions from './citizen.actions';
import policeActions from './police.actions';
import hospitalActions from './hospital.actions';
import volunteerActions from './volunteer.actions';
import ngoActions from './ngo.actions';
import childWelfareActions from './childWelfare.actions';
import adminActions from './admin.actions';

export * from './types';

const allActions: Record<string, ActionConfig[]> = {
  citizen: citizenActions,
  police: policeActions,
  hospital: hospitalActions,
  volunteer: volunteerActions,
  ngo: ngoActions,
  child_welfare: childWelfareActions,
  admin: adminActions,
};

// Urgent AI override actions injected when a critical incident is active
const criticalAiActions: ActionConfig[] = [
  {
    id: 'ai-dispatch-all',
    title: 'Dispatch All',
    description: '🚨 CRITICAL AI RECOMMENDATION: Mobilize all nearby police, hospital, and NGO rescue units.',
    icon: 'AlertTriangle',
    category: 'Emergency',
    permission: 'all',
    priority: -4,
    buttonStyle: 'danger',
    successMessage: 'Coordinated rescue units mobilized.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.startDispatchAnimation(caseId, ctx.currentCase.location.lat, ctx.currentCase.location.lng);

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'dispatched' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'dispatched' });

      ctx.addNotification({
        title: '🚨 GLOBAL EMERGENCY DISPATCH',
        body: 'Police cruisers, ER ambulances, and NGO volunteer units routed to coordinate rescue coordinates.',
        category: 'Emergency',
        priority: 'critical',
      });

      ctx.logAction({
        who: ctx.user?.name || 'System Operator',
        role: ctx.currentRole,
        actionTitle: 'AI Recommendation: Dispatched all agencies',
        caseId,
      });
    },
  },
  {
    id: 'ai-call-hospital',
    title: 'Call Hospital',
    description: '🚨 CRITICAL AI RECOMMENDATION: Request pediatric ICU trauma reservation.',
    icon: 'PhoneCall',
    category: 'Medical',
    permission: 'all',
    priority: -3,
    buttonStyle: 'warning',
    successMessage: 'Hospital hotline dialed.',
    handler: (ctx) => {
      window.open('tel:112');
      ctx.logAction({
        who: ctx.user?.name || 'System Operator',
        role: ctx.currentRole,
        actionTitle: 'AI Recommendation: Dialed Hospital hotline',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'ai-broadcast-alert',
    title: 'Broadcast Alert',
    description: '🚨 CRITICAL AI RECOMMENDATION: Issue regional Amber Alert.',
    icon: 'Radio',
    category: 'Emergency',
    permission: 'all',
    priority: -2,
    buttonStyle: 'danger',
    confirmDialog: {
      title: 'Issue AI-Recommended Regional Amber Alert?',
      body: 'This will push high-priority visual comparison alerts to all platform networks.',
      confirmText: 'Broadcast Alert',
      cancelText: 'Cancel',
    },
    successMessage: 'Amber Alert broadcasted.',
    handler: (ctx) => {
      ctx.addNotification({
        caseId: ctx.currentCase?.id || 'global',
        title: '📢 CRITICAL BROADCAST ALERT',
        body: 'Alert issued across all emergency grids. Check tracking zones.',
        category: 'Emergency',
        priority: 'critical',
      });
      if (ctx.playAlertSound) ctx.playAlertSound();
      ctx.logAction({
        who: ctx.user?.name || 'System Operator',
        role: ctx.currentRole,
        actionTitle: 'AI Recommendation: Broadcasted Amber Alert',
        caseId: ctx.currentCase?.id || 'global',
      });
    },
  },
  {
    id: 'ai-notify-admin',
    title: 'Notify Admin',
    description: '🚨 CRITICAL AI RECOMMENDATION: Escalate incident audit trail to system administrator.',
    icon: 'Shield',
    category: 'Administration',
    permission: 'all',
    priority: -1,
    buttonStyle: 'info',
    successMessage: 'Incident escalated to administrator portal.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '⚠️ Admin Case Escalation',
        body: `Incident #${ctx.currentCase?.id.slice(0, 8).toUpperCase()} escalated to Administrator due to critical hazards exposure.`,
        category: 'Administration',
        priority: 'high',
      });
      ctx.logAction({
        who: ctx.user?.name || 'System Operator',
        role: ctx.currentRole,
        actionTitle: 'AI Recommendation: Escalated case to Admin',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
];

export const getActions = (
  role: string,
  context: Omit<ActionContext, 'logAction'>
): ActionConfig[] => {
  const normalizedRole = role === 'childWelfare' ? 'child_welfare' : role;
  const list = allActions[normalizedRole] || [];

  // Filter based on visibleWhen rule
  const actionContext: ActionContext = {
    ...context,
    logAction: () => {}, // placeholder, replaced by the page log handler
  };

  let resolvedActions = list.filter((act) => {
    if (act.visibleWhen) {
      return act.visibleWhen(actionContext);
    }
    // By default, if workflowStage is defined, only show if case status matches
    if (act.workflowStage && actionContext.currentCase) {
      return actionContext.currentCase.status === act.workflowStage;
    }
    return true;
  });

  // Inject AI recommendations if the active case is CRITICAL
  if (
    actionContext.currentCase &&
    actionContext.currentCase.ai_severity === 'critical' &&
    actionContext.currentCase.status !== 'closed' &&
    normalizedRole !== 'citizen' // Citizen only gets their own standard SOS triggers
  ) {
    resolvedActions = [...criticalAiActions, ...resolvedActions];
  }

  return [...resolvedActions].sort((a, b) => a.priority - b.priority);
};
