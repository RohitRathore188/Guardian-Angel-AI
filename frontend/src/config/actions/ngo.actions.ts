import { ActionConfig } from './types';

const ngoActions: ActionConfig[] = [
  {
    id: 'ngo-assign-shelter',
    title: 'Assign Shelter',
    description: 'Allocate placement space in an NGO family shelter house.',
    icon: 'Home',
    category: 'NGO',
    permission: 'ngo',
    priority: 1,
    buttonStyle: 'primary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Shelter home space reserved successfully.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🏠 NGO Shelter Allocated',
        body: 'Hope Family Foundation reserved bedroom placement spot for child.',
        category: 'NGO',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Raj Kumar',
        role: 'ngo',
        actionTitle: 'Allocated NGO Shelter placement',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'ngo-allocate-resources',
    title: 'Allocate Resources',
    description: 'Allocate emergency food rations and medical kits to field teams.',
    icon: 'Package',
    category: 'NGO',
    permission: 'ngo',
    priority: 2,
    buttonStyle: 'info',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Supplies dispatched to target coordinates.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📦 Supplies Dispatched',
        body: 'Food rations, blankets, and trauma kits sent to field coordinators.',
        category: 'NGO',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Raj Kumar',
        role: 'ngo',
        actionTitle: 'Allocated emergency supplies',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'ngo-deploy-volunteers',
    title: 'Deploy Volunteers',
    description: 'Mobilize NGO volunteer teams to support local search efforts.',
    icon: 'Users',
    category: 'NGO',
    permission: 'ngo',
    priority: 3,
    buttonStyle: 'success',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status === 'reported',
    successMessage: '3 volunteer searchers mobilized.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '👥 Volunteer Responders Mobilized',
        body: '3 local search volunteers dispatched to distress pin vicinity.',
        category: 'NGO',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Raj Kumar',
        role: 'ngo',
        actionTitle: 'Deployed volunteer searchers',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'ngo-upload-inventory',
    title: 'Upload Inventory',
    description: 'Update safehouse stock quantities (blankets, foods, baby milk).',
    icon: 'Upload',
    category: 'Reports',
    permission: 'ngo',
    priority: 4,
    buttonStyle: 'secondary',
    successMessage: 'Inventory counts updated.',
    handler: (ctx) => {
      alert('Inventory database updated: Blankets: +50, Emergency Kits: +20.');
      ctx.logAction({
        who: ctx.user?.name || 'Raj Kumar',
        role: 'ngo',
        actionTitle: 'Uploaded supply inventory metrics',
        caseId: 'global',
      });
    },
  },
  {
    id: 'ngo-complete-support',
    title: 'Complete Support',
    description: 'Conclude counseling placement and close child aid file.',
    icon: 'Heart',
    category: 'NGO',
    permission: 'ngo',
    priority: 5,
    buttonStyle: 'success',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status !== 'closed',
    successMessage: 'Rehabilitation concluded successfully.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'closed' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'closed' });

      ctx.addNotification({
        title: '🧡 NGO Case Concluded',
        body: 'Successful counseling rehabilitation program completed for child.',
        category: 'NGO',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Raj Kumar',
        role: 'ngo',
        actionTitle: 'Concluded counseling aid program',
        caseId,
      });
    },
  },
];

export default ngoActions;
