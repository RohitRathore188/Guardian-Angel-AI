import { ActionConfig } from './types';

const policeActions: ActionConfig[] = [
  {
    id: 'police-accept-case',
    title: 'Accept Case',
    description: 'Acknowledge and mark the emergency incident as accepted for investigation.',
    icon: 'ShieldAlert',
    category: 'Police',
    permission: 'police',
    priority: 1,
    buttonStyle: 'primary',
    visibleWhen: (ctx) => !ctx.currentCase || ctx.currentCase.status === 'reported',
    enabledWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Emergency incident accepted by the precinct dispatcher.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'dispatched' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'dispatched' });

      ctx.addNotification({
        title: '👮 Case Accepted & Cruisers Triage Active',
        body: `Precinct 17 dispatched responders to location: ${ctx.currentCase.location.address}`,
        category: 'Police',
        priority: 'high',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: 'Accepted Case',
        caseId,
      });
    },
  },
  {
    id: 'police-assign-officer',
    title: 'Assign Officer',
    description: 'Assign a dedicated detective or patrol officer as case officer.',
    icon: 'UserPlus',
    category: 'Police',
    permission: 'police',
    priority: 2,
    buttonStyle: 'info',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Precinct officer assigned successfully.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) =>
          c.id === caseId ? { ...c, assignedOfficer: 'Detective Aaron Croft' } : c
        )
      );
      ctx.setSelectedCase({ ...ctx.currentCase, assignedOfficer: 'Detective Aaron Croft' });

      ctx.addNotification({
        title: '👮 Officer Assigned',
        body: `Detective Aaron Croft assigned to investigate Incident #${caseId.slice(0, 8).toUpperCase()}`,
        category: 'Police',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: 'Assigned Officer Aaron Croft',
        caseId,
      });
    },
  },
  {
    id: 'police-dispatch-team',
    title: 'Dispatch Team',
    description: 'Mobilize and route tactical rescue cruisers immediately.',
    icon: 'Send',
    category: 'Emergency',
    permission: 'police',
    priority: 3,
    buttonStyle: 'danger',
    visibleWhen: (ctx) => !!ctx.currentCase && (ctx.currentCase.status === 'reported' || ctx.currentCase.status === 'dispatched'),
    successMessage: 'Tactical unit mobilized to the coordinates.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      // Trigger animation
      ctx.startDispatchAnimation(caseId, ctx.currentCase.location.lat, ctx.currentCase.location.lng);

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'dispatched' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'dispatched' });

      ctx.addNotification({
        title: '🚓 Response Cruisers Dispatched',
        body: 'OSRM routing telemetry initialized. ETA: 2.8 minutes.',
        category: 'Emergency',
        priority: 'critical',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: 'Dispatched Cruisers Unit',
        caseId,
      });
    },
  },
  {
    id: 'police-navigate',
    title: 'Navigate',
    description: 'Open real-time GPS navigation to the incident target.',
    icon: 'Navigation',
    category: 'Navigation',
    permission: 'police',
    priority: 4,
    buttonStyle: 'success',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status === 'dispatched',
    successMessage: 'OSRM Navigation routing details active on GIS telemetry deck.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📍 GPS Navigation Active',
        body: 'Routing cruisers along Chennai Central arterial highway. Avoid congestion.',
        category: 'Navigation',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: 'Activated GPS Route Navigation',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'police-update-status',
    title: 'Update Case Status',
    description: 'Manually override the operational progress status of this incident.',
    icon: 'RefreshCw',
    category: 'Police',
    permission: 'police',
    priority: 5,
    buttonStyle: 'secondary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Incident status updated to active search.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      const nextStatus = ctx.currentCase.status === 'reported' ? 'dispatched' : 'rescued';
      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: nextStatus } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: nextStatus });

      ctx.addNotification({
        title: '🔄 Case Status Override',
        body: `Incident status updated to: ${nextStatus.toUpperCase()}`,
        category: 'Police',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: `Updated status to ${nextStatus}`,
        caseId,
      });
    },
  },
  {
    id: 'police-upload-evidence',
    title: 'Upload Evidence',
    description: 'Attach scan photos or witness statements to the case registry file.',
    icon: 'Camera',
    category: 'Reports',
    permission: 'police',
    priority: 6,
    buttonStyle: 'secondary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Visual photo evidence uploaded successfully.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📁 Case File Updated',
        body: 'Uploaded matching diagnostic scan. High resolution facial markers registered.',
        category: 'Reports',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: 'Uploaded visual scan evidence',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'police-request-backup',
    title: 'Request Backup',
    description: 'Alert and redirect nearby response cruisers within a 2km radius.',
    icon: 'Radio',
    category: 'Emergency',
    permission: 'police',
    priority: 7,
    buttonStyle: 'warning',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Backup signal broadcasted to nearby cruisers.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🚨 Backup Cruisers Alerted',
        body: 'Alert priority sent to vehicles within 2km radius to converge on Chennai coordinates.',
        category: 'Emergency',
        priority: 'critical',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: 'Sent emergency backup request',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'police-close-case',
    title: 'Close Case',
    description: 'Formally archive this case file post-reunification or safety completion.',
    icon: 'CheckCircle',
    category: 'Police',
    permission: 'police',
    priority: 8,
    buttonStyle: 'danger',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status !== 'closed',
    confirmDialog: {
      title: 'Formally Close Case File?',
      body: 'Are you sure you want to close this child rescue case? This action will archive all telemetry logs.',
      confirmText: 'Confirm Close',
      cancelText: 'Cancel',
    },
    successMessage: 'Case closed and telemetry logs archived.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'closed' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'closed' });

      ctx.addNotification({
        title: '✅ Incident Closed',
        body: `Incident #${caseId.slice(0, 8).toUpperCase()} has been verified safe and closed.`,
        category: 'Police',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Officer Sarah J.',
        role: 'police',
        actionTitle: 'Closed and Archived Case File',
        caseId,
      });
    },
  },
];

export default policeActions;
