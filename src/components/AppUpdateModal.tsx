import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, RefreshCw, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface UpdatePayload {
  projectId: string;
  version: string;
  title: string;
  changelog: string[];
  mode: 'prompt' | 'force_refresh' | 'announcement';
  autoRefreshDelaySeconds?: number;
  timestamp: number;
}

export const AppUpdateModal: React.FC = () => {
  const [updateData, setUpdateData] = useState<UpdatePayload | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastHandledTimestampRef = useRef<number>(0);

  const executeHardRefresh = async () => {
    setIsUpdating(true);
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }
      if (updateData?.timestamp) {
        localStorage.setItem('clinicos_last_applied_ota_ts', String(updateData.timestamp));
      }
    } catch {}
    // Hard refresh bypassing browser cache
    window.location.reload();
  };

  const processIncomingRelease = (payload: any) => {
    if (!payload || !payload.version || !payload.timestamp) return;

    // Check if user already dismissed or applied this exact release timestamp
    const lastApplied = Number(localStorage.getItem('clinicos_last_applied_ota_ts') || '0');
    const dismissed = Number(localStorage.getItem('clinicos_dismissed_ota_ts') || '0');

    if (payload.timestamp <= lastApplied || payload.timestamp <= dismissed) {
      return;
    }

    if (payload.timestamp <= lastHandledTimestampRef.current) {
      return;
    }

    lastHandledTimestampRef.current = payload.timestamp;

    if (payload.mode === 'force_refresh') {
      executeHardRefresh();
    } else {
      setUpdateData(payload);
    }
  };

  const handleDismiss = () => {
    if (updateData?.timestamp) {
      localStorage.setItem('clinicos_dismissed_ota_ts', String(updateData.timestamp));
    }
    setUpdateData(null);
  };

  useEffect(() => {
    // 1. Listen for Realtime WebSockets Broadcast
    const channel = supabase.channel('axiogen_ota_axiogen-clinicos');
    channel.on('broadcast', { event: 'force_hard_refresh' }, (response: any) => {
      processIncomingRelease(response?.payload);
    }).subscribe();

    const globalChannel = supabase.channel('axiogen_ota_global');
    globalChannel.on('broadcast', { event: 'app_release_broadcast' }, (response: any) => {
      const p = response?.payload;
      if (p && (p.projectId === 'axiogen-clinicos' || p.projectId === 'all')) {
        processIncomingRelease(p);
      }
    }).subscribe();

    // 2. Poll Database fallback every 5 seconds (guarantees update even across firewalls / sleep mode)
    const checkDbRelease = async () => {
      try {
        const { data } = await supabase.from('clinics').select('pharmacy_info, updated_at').eq('id', 1).single();
        if (data?.pharmacy_info) {
          try {
            const parsed = typeof data.pharmacy_info === 'string' ? JSON.parse(data.pharmacy_info) : data.pharmacy_info;
            if (parsed && parsed.version) {
              processIncomingRelease(parsed);
            }
          } catch {}
        }
      } catch {}
    };

    checkDbRelease();
    const interval = setInterval(checkDbRelease, 5000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
      clearInterval(interval);
    };
  }, []);

  if (!updateData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1c1a]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#a7f3d0] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] flex items-center justify-center text-white shadow-lg shadow-emerald-950/20">
              <Sparkles className="w-6 h-6 animate-pulse text-[#a7f3d0]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#a7f3d0]">
                🚀 New Version {updateData.version}
              </span>
              <h3 className="text-base font-serif font-bold text-[#1a1c1a] mt-0.5">
                {updateData.title || 'Software Update Ready'}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 text-[#7c766d] hover:text-[#1a1c1a] rounded-lg hover:bg-[#f2eee3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Improvements List */}
        {updateData.changelog && updateData.changelog.length > 0 && (
          <div className="bg-[#faf9f6] border border-[#e4e2e1] rounded-2xl p-4 mb-5 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#7c766d]">
              What's New in this update:
            </h4>
            <div className="space-y-1.5">
              {updateData.changelog.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#4b463e]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-[#7c766d] mb-5 leading-relaxed">
          Click below to apply the latest clinical updates and refresh your browser. Your ongoing work is securely saved.
        </p>

        {/* 1-Click Hard Refresh Button */}
        <button
          onClick={executeHardRefresh}
          disabled={isUpdating}
          className="w-full py-3.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] rounded-2xl text-xs font-bold transition-all shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Updating ClinicOS & Hard-Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>⚡ Update & Hard Refresh Software Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
