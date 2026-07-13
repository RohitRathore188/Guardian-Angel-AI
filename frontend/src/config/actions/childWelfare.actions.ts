import { ActionConfig } from './types';

const childWelfareActions: ActionConfig[] = [
  {
    id: 'welfare-assign-officer',
    title: 'Assign Officer',
    description: 'Assign a state case manager officer to manage child care plans.',
    icon: 'UserCheck',
    category: 'Child Welfare',
    permission: 'child_welfare',
    priority: 1,
    buttonStyle: 'primary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Welfare social officer assigned.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🏠 Welfare Officer Assigned',
        body: 'Priya Sharma assigned as lead social caseworker manager.',
        category: 'Child Welfare',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Priya Sharma',
        role: 'child_welfare',
        actionTitle: 'Assigned Welfare Caseworker officer',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'welfare-verify-guardian',
    title: 'Verify Guardian',
    description: 'Verify parent certificates and run biometric scan authentication matches.',
    icon: 'Fingerprint',
    category: 'Child Welfare',
    permission: 'child_welfare',
    priority: 2,
    buttonStyle: 'info',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Guardian identification matches Missing Children records.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🧬 Biometric Verification Successful',
        body: 'Matching photo scan records verify parent custody claim at 98.6% confidence.',
        category: 'Child Welfare',
        priority: 'high',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Priya Sharma',
        role: 'child_welfare',
        actionTitle: 'Verified Guardian custody credentials',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'welfare-assign-shelter',
    title: 'Assign Shelter',
    description: 'Secure state-approved child rehabilitation placements.',
    icon: 'Home',
    category: 'Child Welfare',
    permission: 'child_welfare',
    priority: 3,
    buttonStyle: 'success',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Safehouse facility bed allocated.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🏢 Placement Facility Assigned',
        body: 'Municipal child welfare safehouse confirmed space allocation.',
        category: 'Child Welfare',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Priya Sharma',
        role: 'child_welfare',
        actionTitle: 'Assigned municipal safehouse shelter placement',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'welfare-schedule-counselling',
    title: 'Schedule Counselling',
    description: 'Calendar daily therapy slots with child trauma psychologists.',
    icon: 'Calendar',
    category: 'Child Welfare',
    permission: 'child_welfare',
    priority: 4,
    buttonStyle: 'secondary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Trauma support counseling booked.',
    handler: (ctx) => {
      ctx.triggerToast?.('Counseling Scheduled', 'Psychologist session booked: July 15, 10:00 AM.', 'success');
      ctx.logAction({
        who: ctx.user?.name || 'Priya Sharma',
        role: 'child_welfare',
        actionTitle: 'Booked trauma counseling psychologists slot',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'welfare-legal-review',
    title: 'Legal Review',
    description: 'Execute child welfare court protection orders for safety custody.',
    icon: 'FileText',
    category: 'Child Welfare',
    permission: 'child_welfare',
    priority: 5,
    buttonStyle: 'warning',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Legal court safety files compiled.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '⚖️ Legal Welfare Review',
        body: 'Court protection filing completed and verified by state magistrate.',
        category: 'Child Welfare',
        priority: 'high',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Priya Sharma',
        role: 'child_welfare',
        actionTitle: 'Triggered legal review filing status',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'welfare-close-rehabilitation',
    title: 'Close Rehabilitation',
    description: 'Conclude and close case file following complete parent reunion.',
    icon: 'Lock',
    category: 'Child Welfare',
    permission: 'child_welfare',
    priority: 6,
    buttonStyle: 'danger',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status !== 'closed',
    confirmDialog: {
      title: 'Close Rehabilitation File?',
      body: 'Are you sure you want to finalize custody and archive child welfare files?',
      confirmText: 'Verify Close',
      cancelText: 'Cancel',
    },
    successMessage: 'Case closed and archive files locked.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'closed' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'closed' });

      ctx.addNotification({
        title: '🔒 Case Closed & Finalized',
        body: 'Reunification verified successful. Case archived in municipal registry.',
        category: 'Child Welfare',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Priya Sharma',
        role: 'child_welfare',
        actionTitle: 'Closed and finalized rehabilitation custody',
        caseId,
      });
    },
  },
];

export default childWelfareActions;
