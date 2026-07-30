import { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  title?: string;
  onClose: () => void;
}

export default function Toast({ type, message, title, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [onClose]);

  const defaultTitle = {
    success: 'System Updated',
    info: 'Information',
    warning: 'Attention Required',
    error: 'Action Failed',
  }[type];

  const Icon = {
    success: CheckCircle2,
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
  }[type];

  const cleanMessage = message.replace(/!/g, '.');

  return (
    <div className="fixed top-20 right-8 z-[100] max-w-sm pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-xl px-4 py-3 text-white flex items-center justify-between gap-3 animate-in slide-in-from-top-3 fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 shrink-0">
            <Icon className="w-4 h-4 text-slate-200" />
          </div>

          <div className="space-y-0.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
              {title || defaultTitle}
            </h4>
            <p className="text-xs text-slate-100 font-medium leading-tight">
              {cleanMessage}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
