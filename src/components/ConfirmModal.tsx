import { AlertTriangle } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1a1c1a]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-[#e4e2e1] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 sm:p-6 text-center space-y-4">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle className="w-7 h-7" />
          </div>
          
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1a1c1a]">{title}</h3>
            <p className="text-sm text-[#4b463e] mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="px-5 py-4 bg-[#faf9f6] border-t border-[#e4e2e1] flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white hover:bg-[#f2eee3] text-[#4b463e] border border-[#cdc6ba] rounded-xl text-sm font-bold transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${
              isDestructive 
                ? 'bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-800 text-white shadow-red-900/20' 
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
