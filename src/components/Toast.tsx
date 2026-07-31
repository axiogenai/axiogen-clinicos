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
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm pointer-events-auto">
      <div className="bg-[#1a1c1a] backdrop-blur-md border border-[#4b463e] shadow-2xl rounded-xl px-4 py-3 text-white flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-white shrink-0">
            <Icon className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-0.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#cdc6ba]">
              {title || defaultTitle}
            </h4>
            <p className="text-xs text-white font-medium leading-tight">
              {cleanMessage}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#cdc6ba] hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

}
