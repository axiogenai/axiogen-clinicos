import { useEffect } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel
}: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-150"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-[#e4e2e1] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3.5 top-3.5 p-1 text-[#7c766d] hover:text-[#1a1c1a] hover:bg-[#f2eee3] rounded-lg transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center space-y-3.5">
          <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
            isDestructive ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            {isDestructive ? <AlertCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          
          <div>
            <h3 className="text-base font-bold text-[#1a1c1a]">{title}</h3>
            <p className="text-xs text-[#57534e] mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#faf9f6] border-t border-[#e4e2e1] flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white hover:bg-[#f2eee3] text-[#4b463e] border border-[#cdc6ba] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
              isDestructive 
                ? 'bg-[#dc2626] hover:bg-[#b91c1c] text-white' 
                : 'btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
