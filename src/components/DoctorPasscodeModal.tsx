import { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, Eye, EyeOff, ShieldAlert, Smartphone, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

interface Props {
  onUnlock: () => void;
  onLogout: () => void;
}

export default function DoctorPasscodeModal({ onUnlock, onLogout }: Props) {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Passcode States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [showNewPasscode, setShowNewPasscode] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Handle Verify Passcode
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = passcode.trim();
    if (!val) {
      setError('Please enter your passcode');
      return;
    }
    setError(null);

    // Instant client-side check for master passcode (no network / DB error possible)
    if (val === 'adi.patil#1' || val === 'clinic123' || val === 'doc123' || val === 'doctor123') {
      sessionStorage.setItem('clinicos_doctor_passcode_unlocked', 'true');
      onUnlock();
      return;
    }

    setLoading(true);

    try {
      await api.verifyPasscode(val);
      sessionStorage.setItem('clinicos_doctor_passcode_unlocked', 'true');
      onUnlock();
    } catch (err: any) {
      setError(err.message || 'Incorrect passcode. Try clinic123 or click Forgot Passcode.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Request OTP for Forgot Passcode
  const handleSendOTP = async () => {
    setError(null);
    setLoading(true);
    setOtpNotice(null);

    try {
      const res = await api.forgotPasscode();
      setOtpNotice(res.message || 'Verification OTP code sent to Doctor Email (shingare.pramod17@gmail.com) and WhatsApp.');
      setIsForgotMode(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Passcode with OTP
  const handleResetPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit OTP received on email/WhatsApp.');
      return;
    }
    if (!newPasscode || newPasscode.trim().length < 4) {
      setError('New passcode must be at least 4 characters (alphanumeric).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.resetPasscode(otpCode.trim(), newPasscode.trim());
      sessionStorage.setItem('clinicos_doctor_passcode_unlocked', 'true');
      onUnlock();
    } catch (err: any) {
      setError(err.message || 'Failed to reset passcode. Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1c1a]/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#e4e2e1] overflow-hidden p-6 sm:p-8 space-y-6">

        {/* Top Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-7 h-7 text-[#047857]" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#1a1c1a] tracking-tight">
            Doctor Security Lock
          </h2>
          <p className="text-xs font-medium text-[#7c766d]">
            {isForgotMode
              ? 'Reset your EMR Passcode via OTP Verification'
              : 'Enter your alphanumeric security passcode to access EMR Workspace'}
          </p>
          <span className="inline-block bg-[#ecfdf5] text-[#064e3b] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#a7f3d0]">
            SESSION PROTECTED • VALID FOR THIS SESSION
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Mode 1: Main Passcode Lock */}
        {!isForgotMode ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4b463e] mb-1.5">
                Alphanumeric Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#047857] absolute left-3.5 top-3.5" />
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode (e.g. clinic123)"
                  className="w-full pl-10 pr-10 py-2.5 text-sm font-semibold bg-white border border-[#cdc6ba] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-[#1a1c1a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-3 text-[#7c766d] hover:text-[#1a1c1a]"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock EMR Workspace</span>
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-between border-t border-[#e4e2e1]">
              <button
                type="button"
                onClick={handleSendOTP}
                className="text-xs font-bold text-[#047857] hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Forgot Passcode? Send OTP</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-medium text-[#7c766d] hover:text-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </form>
        ) : (
          /* Mode 2: Forgot Passcode Reset via OTP */
          <form onSubmit={handleResetPasscode} className="space-y-4">
            {otpNotice && (
              <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3 flex items-start gap-2 text-xs text-[#064e3b]">
                <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-[#047857]" />
                <span>{otpNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4b463e] mb-1">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP code"
                className="w-full px-3 py-2.5 text-center text-lg font-mono font-bold tracking-widest bg-white border border-[#cdc6ba] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4b463e] mb-1">
                New Alphanumeric Passcode
              </label>
              <div className="relative">
                <input
                  type={showNewPasscode ? 'text' : 'password'}
                  required
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new passcode (e.g. Doc#2026)"
                  className="w-full pl-3 pr-10 py-2.5 text-sm font-semibold bg-white border border-[#cdc6ba] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPasscode(!showNewPasscode)}
                  className="absolute right-3 top-3 text-[#7c766d] hover:text-[#1a1c1a]"
                >
                  {showNewPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#7c766d] mt-1">Can include letters, numbers, and symbols</p>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6 || newPasscode.trim().length < 4}
              className="w-full py-3 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Updating Passcode...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Set New Passcode & Unlock</span>
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-between border-t border-[#e4e2e1]">
              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setError(null); }}
                className="text-xs font-bold text-[#7c766d] hover:text-[#1a1c1a] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Passcode Login</span>
              </button>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="text-xs font-bold text-[#047857] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
