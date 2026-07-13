import { ActionConfig } from './types';

const hospitalActions: ActionConfig[] = [
  {
    id: 'hospital-accept-patient',
    title: 'Accept Patient',
    description: 'Accept the victim triage registration under Pediatric Trauma ER care.',
    icon: 'HeartHandshake',
    category: 'Medical',
    permission: 'hospital',
    priority: 1,
    buttonStyle: 'primary',
    visibleWhen: (ctx) => !ctx.currentCase || ctx.currentCase.status === 'reported',
    enabledWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Patient triage reservation confirmed.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'dispatched' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'dispatched' });

      ctx.addNotification({
        title: '🏥 Patient Accepted',
        body: `Emergency Trauma intake registered for Incident Case #${caseId.slice(0, 8).toUpperCase()}`,
        category: 'Medical',
        priority: 'high',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Dr. Aaron',
        role: 'hospital',
        actionTitle: 'Accepted Patient Intake',
        caseId,
      });
    },
  },
  {
    id: 'hospital-assign-doctor',
    title: 'Assign Doctor',
    description: 'Assign a pediatric specialist doctor to supervise recovery triage.',
    icon: 'Stethoscope',
    category: 'Medical',
    permission: 'hospital',
    priority: 2,
    buttonStyle: 'info',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'ER Doctor assigned successfully.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) =>
          c.id === caseId ? { ...c, assignedDoctor: 'Dr. Aaron Croft' } : c
        )
      );
      ctx.setSelectedCase({ ...ctx.currentCase, assignedDoctor: 'Dr. Aaron Croft' });

      ctx.addNotification({
        title: '🩺 Pediatrician Assigned',
        body: 'Dr. Aaron Croft assigned to victim trauma critical recovery triage.',
        category: 'Medical',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Dr. Aaron',
        role: 'hospital',
        actionTitle: 'Assigned specialist physician Dr. Aaron Croft',
        caseId,
      });
    },
  },
  {
    id: 'hospital-dispatch-ambulance',
    title: 'Dispatch Ambulance',
    description: 'Route and dispatch nearest hospital intensive care ambulance.',
    icon: 'Truck',
    category: 'Medical',
    permission: 'hospital',
    priority: 3,
    buttonStyle: 'danger',
    visibleWhen: (ctx) => !!ctx.currentCase && (ctx.currentCase.status === 'reported' || ctx.currentCase.status === 'dispatched'),
    successMessage: 'ICU Ambulance unit mobilized.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.startDispatchAnimation(caseId, ctx.currentCase.location.lat, ctx.currentCase.location.lng);

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'dispatched' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'dispatched' });

      ctx.addNotification({
        title: '🚑 ICU Ambulance Dispatched',
        body: 'Ambulance Unit #2 is routing via street coordinate telemetry. ETA: 3.5 mins.',
        category: 'Medical',
        priority: 'critical',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Dr. Aaron',
        role: 'hospital',
        actionTitle: 'Dispatched Emergency Ambulance',
        caseId,
      });
    },
  },
  {
    id: 'hospital-update-medical',
    title: 'Update Medical Status',
    description: 'Update the child victim diagnostic parameters (conscious, injuries).',
    icon: 'Activity',
    category: 'Medical',
    permission: 'hospital',
    priority: 4,
    buttonStyle: 'secondary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Vitals assessment parameters recorded.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '📊 Patient Vitals Checked',
        body: 'Conscious status: Stable. Dehydration recovery is active. Exposure symptoms decreasing.',
        category: 'Medical',
        priority: 'info',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Dr. Aaron',
        role: 'hospital',
        actionTitle: 'Updated patient diagnostic vitals',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'hospital-request-blood',
    title: 'Request Blood',
    description: 'Request blood transfusion compatibility check from emergency registry.',
    icon: 'Droplet',
    category: 'Medical',
    permission: 'hospital',
    priority: 5,
    buttonStyle: 'warning',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Blood bank request broadcasted.',
    handler: (ctx) => {
      ctx.addNotification({
        title: '🩸 Blood Bank Intake Matching',
        body: 'Intake matching request sent for type O-Negative to regional hospital network.',
        category: 'Medical',
        priority: 'high',
      });
      ctx.logAction({
        who: ctx.user?.name || 'Dr. Aaron',
        role: 'hospital',
        actionTitle: 'Requested O-Negative Blood Bank matching',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'hospital-transfer-patient',
    title: 'Transfer Patient',
    description: 'Coordinate pediatric ICU transfer to regional specialty facility.',
    icon: 'Share2',
    category: 'Medical',
    permission: 'hospital',
    priority: 6,
    buttonStyle: 'secondary',
    visibleWhen: (ctx) => !!ctx.currentCase,
    successMessage: 'Intake transfer coordinated successfully.',
    handler: (ctx) => {
      ctx.triggerToast?.('Patient Coordinated', 'Patient coordinated for safe transport dispatch to St. Jude Pediatric Specialty Center.', 'success');
      ctx.logAction({
        who: ctx.user?.name || 'Dr. Aaron',
        role: 'hospital',
        actionTitle: 'Coordinated specialty hospital transfer',
        caseId: ctx.currentCase?.id || 'none',
      });
    },
  },
  {
    id: 'hospital-complete-treatment',
    title: 'Complete Treatment',
    description: 'Discharge child victim and release custody to verified guardians.',
    icon: 'CheckCircle',
    category: 'Medical',
    permission: 'hospital',
    priority: 7,
    buttonStyle: 'success',
    visibleWhen: (ctx) => !!ctx.currentCase && ctx.currentCase.status !== 'closed',
    successMessage: 'Treatment marked complete. Child discharged.',
    handler: (ctx) => {
      const caseId = ctx.currentCase?.id;
      if (!caseId) return;

      ctx.setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: 'rescued' } : c))
      );
      ctx.setSelectedCase({ ...ctx.currentCase, status: 'rescued' });

      ctx.addNotification({
        title: '🏥 Treatment Completed',
        body: 'Victim discharged as fully healthy. Social work placement verified.',
        category: 'Medical',
        priority: 'info',
      });

      ctx.logAction({
        who: ctx.user?.name || 'Dr. Aaron',
        role: 'hospital',
        actionTitle: 'Discharged patient and marked treatment complete',
        caseId,
      });
    },
  },
];

export default hospitalActions;
