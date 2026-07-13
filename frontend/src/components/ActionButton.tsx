import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ActionConfig, ActionContext } from '../config/actions/types';
import ActionModal from './ActionModal';
import { globalEventBus } from '../core/events/eventBus';

// Helper to resolve dynamic Lucide icons from string name
const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : <Icons.HelpCircle className="w-3.5 h-3.5" />;
};

interface ActionButtonProps {
  action: ActionConfig;
  context: ActionContext;
  size?: 'sm' | 'md' | 'lg';
}

export default function ActionButton({ action, context, size = 'md' }: ActionButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'failure'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const styleClasses = {
    primary: 'bg-primary hover:bg-red-600 text-white border-primary/50',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-slate-300 border-white/5',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-500/50',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500/50',
    info: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/50',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[9px] rounded-md gap-1',
    md: 'px-4 py-2 text-[10px] rounded-lg gap-1.5',
    lg: 'px-6 py-3 text-xs rounded-xl gap-2',
  };

  const handleExecute = async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      // Execute custom action handler
      await action.handler(context);

      // Resolve event type dynamically
      let eventType: any = 'CaseUpdated';
      if (action.id.includes('accept-case') || action.id.includes('accept-mission') || action.id.includes('accept-patient')) {
        eventType = 'CaseAccepted';
      } else if (action.id.includes('reject-case')) {
        eventType = 'CaseRejected';
      } else if (action.id.includes('dispatch') || action.id.includes('send-ambulance') || action.id.includes('start-navigation')) {
        eventType = 'ResponderStarted';
      } else if (action.id.includes('reached')) {
        eventType = 'ResponderReached';
      } else if (action.id.includes('close') || action.id.includes('complete-treatment') || action.id.includes('complete-mission')) {
        eventType = 'CaseClosed';
      } else if (action.id.includes('broadcast')) {
        eventType = 'BroadcastCreated';
      } else if (action.id.includes('assign-officer') || action.id.includes('assign-doctor')) {
        eventType = 'CaseAssigned';
      } else if (action.id.includes('report-child') || action.id.includes('report-sos')) {
        eventType = 'CaseCreated';
      }

      // Publish Event to Bus
      globalEventBus.publish({
        type: eventType,
        timestamp: Date.now(),
        caseId: context.currentCase?.id || 'global',
        user: { name: context.user?.name || 'Operator', role: context.currentRole },
        source: 'client',
        data: context.currentCase ? { ...context.currentCase } : {}
      });
      
      // Log history audit
      context.logAction({
        who: context.user?.name || 'Operator',
        role: context.currentRole,
        actionTitle: action.title,
        caseId: context.currentCase?.id || 'global',
      });

      setStatus('success');
      
      // Auto-revert to idle after 2.5 seconds
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err: any) {
      console.error(`Action execution failed: ${action.title}`, err);
      setErrorMessage(err?.message || 'Operation failed. Please retry.');
      setStatus('failure');
    }
  };

  const handleClick = () => {
    if (action.confirmDialog) {
      setShowConfirm(true);
    } else {
      handleExecute();
    }
  };

  const isEnabled = action.enabledWhen ? action.enabledWhen(context) : true;

  if (status === 'loading') {
    return (
      <button
        disabled
        className={`flex items-center justify-center font-bold uppercase tracking-wider border bg-dark-800 text-slate-500 border-white/5 opacity-80 cursor-wait transition-all ${sizeClasses[size]}`}
      >
        <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
        Processing...
      </button>
    );
  }

  if (status === 'success') {
    return (
      <button
        disabled
        className={`flex items-center justify-center font-bold uppercase tracking-wider border bg-emerald-950/40 text-emerald-400 border-emerald-500/30 opacity-90 transition-all ${sizeClasses[size]}`}
      >
        <Icons.Check className="w-3.5 h-3.5" />
        Success
      </button>
    );
  }

  if (status === 'failure') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <button
          onClick={handleExecute}
          className={`w-full flex items-center justify-center font-bold uppercase tracking-wider border bg-red-950/40 text-red-400 border-red-500/30 hover:bg-red-900/20 transition-all ${sizeClasses[size]}`}
        >
          <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin-once" />
          Retry Action
        </button>
        <span className="text-[8px] text-red-400/80 text-center truncate px-1">
          {errorMessage || 'Execution Error'}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!isEnabled}
        className={`flex items-center justify-center font-bold uppercase tracking-wider border hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:pointer-events-none ${styleClasses[action.buttonStyle]} ${sizeClasses[size]}`}
      >
        {getIconComponent(action.icon)}
        <span>{action.title}</span>
      </button>

      {/* Confirmation ActionModal */}
      {showConfirm && action.confirmDialog && (
        <ActionModal
          title={action.confirmDialog.title}
          body={action.confirmDialog.body}
          confirmText={action.confirmDialog.confirmText}
          cancelText={action.confirmDialog.cancelText}
          confirmStyle={action.buttonStyle === 'danger' ? 'danger' : 'primary'}
          onConfirm={() => {
            setShowConfirm(false);
            handleExecute();
          }}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
