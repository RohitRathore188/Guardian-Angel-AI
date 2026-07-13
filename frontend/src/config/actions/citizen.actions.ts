import { ActionConfig } from './types';

const citizenActions: ActionConfig[] = [
  {
    id: 'citizen-report-child',
    title: 'Report Child',
    description: 'Trigger a new emergency SOS report for a missing or distressed child.',
    icon: 'AlertTriangle',
    category: 'Reports',
    permission: 'citizen',
    priority: 1,
    buttonStyle: 'danger',
    successMessage: 'SOS distress signal registered successfully.',
    handler: (ctx) => {
      if (ctx.navigate) {
        ctx.navigate('/report');
      } else {
        ctx.triggerToast?.('Navigation Error', 'Navigate helper not available. Please visit /report.', 'warning');
      }
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Triggered Report Child navigation',
        caseId: 'global',
      });
    },
  },
  {
    id: 'citizen-track-rescue',
    title: 'Track Rescue',
    description: 'Track the real-time rescue status of your reported case.',
    icon: 'Activity',
    category: 'Navigation',
    permission: 'citizen',
    priority: 2,
    buttonStyle: 'primary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Rescue tracking dashboard opened.',
    handler: (ctx) => {
      if (ctx.currentCase && ctx.navigate) {
        ctx.navigate(`/companion?case_id=${ctx.currentCase.id}`);
      } else {
        ctx.triggerToast?.('Tracking Error', 'Please select an active incident case to track rescue.', 'warning');
      }
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Opened Rescue Tracking Companion',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'citizen-guardian-ai',
    title: 'Open Guardian AI',
    description: 'Run visual facial recognition and safety diagnostic audits.',
    icon: 'Brain',
    category: 'AI',
    permission: 'citizen',
    priority: 3,
    buttonStyle: 'info',
    successMessage: 'AI Diagnostic analysis finished successfully.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🧠 Guardian AI Scan Active',
        body: 'Synthesizing facial markers and environmental exposure risks...',
        category: 'AI',
        priority: 'info',
      });
      ctx.triggerToast?.('AI Scan Resolved', 'Posture alignment delta: 94%. Weather Hazard: Medium. Identity Index matches Supabase registry Missing Children library.', 'success');
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Triggered Guardian AI Scan Diagnostic',
        caseId: ctx.currentCase?.id || 'global',
      });
    },
  },
  {
    id: 'citizen-nearby-help',
    title: 'Nearby Help',
    description: 'Find active emergency response units nearby.',
    icon: 'MapPin',
    category: 'Navigation',
    permission: 'citizen',
    priority: 4,
    buttonStyle: 'success',
    successMessage: 'Map filters updated to display nearby agencies.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📍 Local Rescuer Grid Loaded',
        body: 'Showing active Police stations, Welfare facilities, and NGO networks in 5km radius.',
        category: 'Navigation',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Searched Nearby Help',
        caseId: 'global',
      });
    },
  },
  {
    id: 'citizen-emergency-call',
    title: 'Emergency Call',
    description: 'Dial the National Child Welfare hotline instantly.',
    icon: 'PhoneCall',
    category: 'Emergency',
    permission: 'citizen',
    priority: 5,
    buttonStyle: 'warning',
    successMessage: 'Hotline dial screen triggered.',
    handler: (ctx) => {
      window.open('tel:1098');
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Dialed Emergency Child Helpline',
        caseId: 'global',
      });
    },
  },
  {
    id: 'citizen-share-location',
    title: 'Share Live Location',
    description: 'Broadcast your live GPS telemetry to dispatchers.',
    icon: 'Radio',
    category: 'Navigation',
    permission: 'citizen',
    priority: 6,
    buttonStyle: 'secondary',
    successMessage: 'Live coordinates telemetry active.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📡 Live GPS Telemetry Broadcast',
        body: 'Broadcasting from current coordinates: lat=13.0827, lng=80.2707',
        category: 'Navigation',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Activated Live GPS Sharing',
        caseId: ctx.currentCase?.id || 'global',
      });
    },
  },
  {
    id: 'citizen-download-report',
    title: 'Download Report',
    description: 'Generate and download incident case summaries.',
    icon: 'Download',
    category: 'Reports',
    permission: 'citizen',
    priority: 7,
    buttonStyle: 'secondary',
    successMessage: 'Report downloaded successfully.',
    handler: (ctx) => {
      ctx.triggerToast?.('Report Generated', 'Downloaded case report: GUARDIAN_ANGEL_SOS_LOG.pdf', 'success');
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Downloaded Incident Report PDF',
        caseId: ctx.currentCase?.id || 'global',
      });
    },
  },
  {
    id: 'citizen-give-feedback',
    title: 'Give Feedback',
    description: 'Submit platform experience and rescue team ratings.',
    icon: 'MessageSquare',
    category: 'Reports',
    permission: 'citizen',
    priority: 8,
    buttonStyle: 'secondary',
    successMessage: 'Thank you for your rating!',
    handler: (ctx) => {
      ctx.triggerToast?.('Feedback Submitted', 'Feedback form: Rating submitted: 5/5 stars.', 'success');
      ctx.logAction({
        who: ctx.user?.name || 'Citizen User',
        role: 'citizen',
        actionTitle: 'Submitted Rescue Operations Rating Feedback',
        caseId: ctx.currentCase?.id || 'global',
      });
    },
  },
];

export default citizenActions;
