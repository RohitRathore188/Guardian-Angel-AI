import * as Icons from 'lucide-react';

interface ActionModalProps {
  title: string;
  body: string;
  confirmText: string;
  cancelText: string;
  confirmStyle?: 'primary' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

export default function ActionModal({
  title,
  body,
  confirmText,
  cancelText,
  confirmStyle = 'primary',
  onConfirm,
  onClose,
}: ActionModalProps) {
  const confirmBtnStyles = {
    primary: 'bg-primary hover:bg-red-600 text-white border-primary/40',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-500/40',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Icons.ShieldAlert className="w-5 h-5 text-primary" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-slate-300 text-xs leading-relaxed">
          {body}
        </p>

        {/* Action Panel Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/5 hover:border-white/10 bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all ${confirmBtnStyles[confirmStyle]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
