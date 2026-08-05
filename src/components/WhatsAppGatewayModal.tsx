import { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, RefreshCw, Send, LogOut, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../api/client';

interface WhatsAppGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppGatewayModal({ isOpen, onClose }: WhatsAppGatewayModalProps) {
  const [loading, setLoading] = useState(false);
  const [gatewayInfo, setGatewayInfo] = useState<{
    status: string;
    qrCodeDataUrl: string;
    phone: string;
  }>({
    status: 'disconnected',
    qrCodeDataUrl: '',
    phone: '',
  });

  const fetchStatus = async () => {
    try {
      const res = await api.getWhatsAppStatus();
      if (res && res.gateway) {
        setGatewayInfo(res.gateway);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll status every 3s while open
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp session?')) return;
    setLoading(true);
    try {
      await api.disconnectWhatsApp();
      await fetchStatus();
    } catch (e) {
      alert('Error disconnecting session');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAutoReminders = async () => {
    setLoading(true);
    try {
      const res = await api.triggerAutoWhatsApp();
      alert(`Automated Reminders Complete!\nTotal Due: ${res.summary?.totalEligible || 0}\nSent: ${res.summary?.sentCount || 0}`);
    } catch (e: any) {
      alert(`Failed to trigger auto reminders: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestartSession = async () => {
    setLoading(true);
    try {
      await api.restartWhatsApp();
      await fetchStatus();
    } catch (e) {
      console.error('Error restarting WhatsApp gateway:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#e4e2e1] animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#52b788]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">WhatsApp Web Gateway</h3>
              <p className="text-[11px] text-[#b7e4c7]">100% Free Automated Follow-Up Reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {/* Connection Status Banner */}
          {gatewayInfo.status === 'connected' ? (
            <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-[#065f46] text-sm flex items-center gap-1.5">
                    Connected & Active
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                  </div>
                  <p className="text-xs text-[#047857]">Phone: +{gatewayInfo.phone || 'Clinic WhatsApp'}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          ) : gatewayInfo.status === 'qr_ready' && gatewayInfo.qrCodeDataUrl ? (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5 text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-xs font-bold">
                <QrCode className="w-3.5 h-3.5" /> Scan QR Code with Clinic Phone
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#e4e2e1] inline-block shadow-md">
                <img src={gatewayInfo.qrCodeDataUrl} alt="WhatsApp QR Code" className="w-56 h-56 mx-auto" />
              </div>
              <div className="text-left text-xs text-[#78350f] space-y-1 bg-[#fef3c7]/60 p-3 rounded-lg border border-[#fde68a]">
                <p className="font-bold">Instructions to Link WhatsApp:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                  <li>Open <strong>WhatsApp</strong> on the clinic's smartphone.</li>
                  <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings ⚙️</strong> &rarr; <strong>Linked Devices</strong>.</li>
                  <li>Tap <strong>Link a Device</strong> and point camera at the QR code above.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="bg-[#faf9f6] border border-[#e4e2e1] rounded-xl p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#047857] animate-spin mx-auto" />
              <p className="font-medium text-sm text-[#4b463e]">Initializing WhatsApp Gateway Session...</p>
              <p className="text-xs text-[#7c766d]">Generating fresh QR code for pairing</p>
              <button
                onClick={handleRestartSession}
                disabled={loading}
                className="mt-2 px-3 py-1.5 text-xs font-bold bg-[#047857] hover:bg-[#065f46] text-white rounded-lg transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Force Generate Fresh QR
              </button>
            </div>
          )}

          {/* Quick Actions (When Connected) */}
          {gatewayInfo.status === 'connected' && (
            <div className="pt-2 border-t border-[#e4e2e1]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-[#4b463e]">Auto Reminders</span>
                <button
                  onClick={handleTriggerAutoReminders}
                  disabled={loading}
                  className="px-3.5 py-2 text-xs font-bold bg-[#047857] hover:bg-[#065f46] text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" /> Run Today's Follow-up Reminders Now
                </button>
              </div>
            </div>
          )}

          {/* Guarantee Footer */}
          <div className="flex items-center gap-2 text-[11px] text-[#7c766d] bg-[#f8f6f0] px-3.5 py-2 rounded-lg border border-[#e8e4db]">
            <ShieldCheck className="w-4 h-4 text-[#047857] shrink-0" />
            <span>100% Free & Unlimited WhatsApp messages using direct local device pairing.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
