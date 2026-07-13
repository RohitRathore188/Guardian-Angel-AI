import { ActionConfig } from './types';

const volunteerActions: ActionConfig[] = [
  {
    id: 'volunteer-accept-mission',
    title: 'Accept Mission',
    description: 'Commit to respond and aid in the visual search or emergency case rescue.',
    icon: 'CheckSquare',
    category: 'Volunteer',
    permission: 'volunteer',
    priority: 1,
    buttonStyle: 'primary',
    visibleWhen: (ctx) => !ctx.currentCase || ctx.currentCase.status === 'reported',
    enabledWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Mission accepted successfully.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'dispatched' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'dispatched' });

      ctx.addNotification({
        title: '🤝 Mission Accepted',
        body: `Volunteer Rahul registered response dispatch for Case #${caseId.slice(0, 8).toUpperCase()}`,
        category: 'Volunteer',
        priority: 'high',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Rahul Dev',
        role: 'volunteer',
        actionTitle: 'Accepted Rescue Mission',
        caseId,
      });
    },
  },
  {
    id: 'volunteer-start-navigation',
    title: 'Start Navigation',
    description: 'Launch GPS mapping navigation routes to distress pin.',
    icon: 'Navigation2',
    category: 'Navigation',
    permission: 'volunteer',
    priority: 2,
    buttonStyle: 'success',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status === 'dispatched',
    successMessage: 'Volunteer OSRM navigation coordinates active.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📍 Volunteer Navigation Active',
        body: 'Routing volunteer team along local routes. Distance: 0.7 km.',
        category: 'Navigation',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Rahul Dev',
        role: 'volunteer',
        actionTitle: 'Started GPS navigation',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'volunteer-reached-location',
    title: 'Reached Location',
    description: 'Mark arrival on scene to coordinate physical search grids.',
    icon: 'MapPin',
    category: 'Volunteer',
    permission: 'volunteer',
    priority: 3,
    buttonStyle: 'info',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status === 'dispatched',
    successMessage: 'On-scene status synchronized.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📍 Volunteer On Scene',
        body: 'Search team arrived at distress pin location. Securing area.',
        category: 'Volunteer',
        priority: 'high',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Rahul Dev',
        role: 'volunteer',
        actionTitle: 'Arrived on scene',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'volunteer-upload-update',
    title: 'Upload Update',
    description: 'Post text notes or diagnostic photos directly from the search area.',
    icon: 'UploadCloud',
    category: 'Reports',
    permission: 'volunteer',
    priority: 4,
    buttonStyle: 'secondary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Field update registered in database.',
    handler: (ctx) => {
      alert('Field note posted: Area secured. Child is warm. Found under shelter canopy.');
      ctx.logAction({
        who: ctx.user?.name || 'Rahul Dev',
        role: 'volunteer',
        actionTitle: 'Posted field update note',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'volunteer-complete-mission',
    title: 'Complete Mission',
    description: 'Confirm visual rescue verification and safe custody transition.',
    icon: 'Award',
    category: 'Volunteer',
    permission: 'volunteer',
    priority: 5,
    buttonStyle: 'success',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status !== 'closed',
    successMessage: 'Mission completed successfully. Hero points awarded!',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'rescued' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'rescued' });

      ctx.addNotification({
        title: '🏆 Mission Successfully Resolved',
        body: 'Child secured and transferred to Welfare team. Rahul awarded 100 Hero points!',
        category: 'Volunteer',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Rahul Dev',
        role: 'volunteer',
        actionTitle: 'Resolved and completed mission',
        caseId,
      });
    },
  },
  {
    id: 'volunteer-request-support',
    title: 'Request Support',
    description: 'Request extra resources or emergency transport from NGO network.',
    icon: 'HelpCircle',
    category: 'Emergency',
    permission: 'volunteer',
    priority: 6,
    buttonStyle: 'warning',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Support alert issued.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🆘 Volunteer Support Alert',
        body: 'Emergency request for child welfare transport and medical kits.',
        category: 'Emergency',
        priority: 'high',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Rahul Dev',
        role: 'volunteer',
        actionTitle: 'Requested emergency NGO support',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
];

export default volunteerActions;
