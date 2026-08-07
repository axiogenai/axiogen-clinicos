import { useState } from 'react';
import { Lock, UserCheck, ShieldAlert, ArrowRight, KeyRound, CheckCircle2, RefreshCw, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { api, apiRequest } from '../api/client';
import { supabaseAuth } from '../lib/supabase';

interface Props {
  onSuccess: () => void;
}

export default function LoginView({ onSuccess }: Props) {
  const { login, setToast } = useClinic();
  const [email, setEmail] = useState('8010127704');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1 = Request OTP, 2 = Verify OTP, 3 = Reset Password
  const [forgotIdentifier, setForgotIdentifier] = useState('8010127704');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedOTPNotice, setGeneratedOTPNotice] = useState<string | null>(null);

  const maskPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `•••• ${digits.slice(-4)}`;
    }
    return phone;
  };

  const handleQuickRoleSelect = (selectedRole: 'doctor' | 'receptionist') => {
    setRole(selectedRole);
    setPassword('');
    setError(null);
    if (selectedRole === 'doctor') {
      setEmail('8010127704');
      setForgotIdentifier('8010127704');
    } else {
      setEmail('7972884083');
      setForgotIdentifier('7972884083');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      setToast({
        type: 'success',
        message: `Welcome back! Logged in successfully as ${role === 'doctor' ? 'Doctor' : 'Receptionist'}.`
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request 6-digit OTP Code via Supabase & Database
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setGeneratedOTPNotice(null);

    try {
      try {
        await supabaseAuth.resetPasswordForEmail(forgotIdentifier);
      } catch {}

      if (typeof api?.forgotPassword === 'function') {
        await api.forgotPassword(forgotIdentifier);
      } else {
        await apiRequest<{ message: string }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ identifier: forgotIdentifier })
        });
      }

      setForgotStep(2);
      setOtpCode('');
      setGeneratedOTPNotice(`Verification code sent to WhatsApp ending in ${maskPhoneNumber(forgotIdentifier)}.`);
      setToast({
        type: 'success',
        title: 'OTP Sent',
        message: `Verification code sent to ${maskPhoneNumber(forgotIdentifier)}`
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP Code FIRST before allowing password reset
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the complete 6-digit OTP code received on WhatsApp.');
      return;
    }

    setLoading(true);
    try {
      if (typeof api?.verifyOTP === 'function') {
        await api.verifyOTP(forgotIdentifier, otpCode);
      } else {
        await apiRequest('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ identifier: forgotIdentifier, otp: otpCode })
        });
      }

      setForgotStep(3);
      setError(null);
      setGeneratedOTPNotice(null);
      setToast({
        type: 'success',
        title: 'OTP Verified',
        message: 'OTP verified successfully. Choose your new password.'
      });
    } catch (err: any) {
      setError(err.message || 'Invalid or expired 6-digit OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password Page & Auto-Login
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      try {
        await supabaseAuth.verifyOtp(forgotIdentifier, otpCode);
        await supabaseAuth.updatePassword(newPassword);
      } catch {}

      if (typeof api?.resetPassword === 'function') {
        await api.resetPassword(forgotIdentifier, otpCode, newPassword);
      } else {
        await apiRequest('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ identifier: forgotIdentifier, otp: otpCode, newPassword })
        });
      }

      setToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password was updated successfully. Signing in now...'
      });

      await login(forgotIdentifier, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#f2eee3] to-[#e8e2d2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-[#e4e2e1] p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center py-1">
            <img
              src="/logo-symbol.png"
              alt="Shinagare Clinic Emblem"
              className="h-16 w-auto mx-auto object-contain drop-shadow-sm"
            />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1a1c1a] tracking-tight">ClinicOS</h1>
            <p className="text-xs font-semibold text-[#7c766d] mt-0.5">शिनगारे स्किन & कॉस्मेटीक क्लिनिक</p>
          </div>
          <span className="inline-block bg-[#f2eee3] text-[#4b463e] text-[10px] font-bold px-2.5 py-0.5 rounded border border-[#cdc6ba]">
            AUTHENTICATED SECURE LOGIN
          </span>
        </div>

        {/* Normal Login Mode */}
        {!isForgotMode ? (
          <>
            {/* Role Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-[#f2eee3]/80 p-1 rounded-xl border border-[#e4e2e1]">
              <button
                type="button"
                onClick={() => handleQuickRoleSelect('doctor')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'doctor'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Doctor Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleSelect('receptionist')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'receptionist'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Reception Desk</span>
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Clean Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#4b463e]">Enter Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setError(null);
                      setForgotStep(1);
                      setOtpCode('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-[11px] font-bold text-[#047857] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] font-bold text-sm rounded-lg shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Forgot Password Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#e4e2e1] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#047857]" />
                <h2 className="font-serif font-bold text-base text-[#1a1c1a]">
                  {forgotStep === 3 ? 'Set New Password' : 'Reset Password'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false);
                  setError(null);
                }}
                className="p-1 hover:bg-[#f2eee3] rounded-lg transition-colors text-[#7c766d]"
                title="Back to Sign In"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {generatedOTPNotice && (
              <div className="bg-[#ecfdf5] text-[#065f46] text-xs p-3 rounded-xl border border-[#a7f3d0] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                <span>{generatedOTPNotice}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              /* Step 1: Request OTP Code */
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <p className="text-xs text-[#7c766d]">
                  Send a 6-digit verification code to registered WhatsApp ending in <strong className="font-mono text-[#1a1c1a]">{maskPhoneNumber(forgotIdentifier)}</strong>.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Sending OTP...</span>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP Code via WhatsApp</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotMode(false)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#7c766d] hover:text-[#1a1c1a]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </form>
            ) : forgotStep === 2 ? (
              /* Step 2: Verify OTP Code FIRST */
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <p className="text-xs text-[#7c766d]">
                  Enter the 6-digit OTP code received on WhatsApp ending in <strong className="font-mono text-[#1a1c1a]">{maskPhoneNumber(forgotIdentifier)}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#4b463e] mb-1">6-Digit OTP Code</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#047857] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-base font-mono font-bold tracking-widest bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying OTP Code...</span>
                  ) : (
                    <>
                      <span>Verify OTP Code</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-[#7c766d] hover:text-[#1a1c1a] font-bold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    className="text-[#047857] hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP Code
                  </button>
                </div>
              </form>
            ) : (
              /* Step 3: Reset Password Page */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-[#7c766d]">
                  OTP verified! Enter a new password for your account.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#4b463e] mb-1">New Password (min 6 chars)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4b463e] mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Saving New Password...</span>
                  ) : (
                    <>
                      <span>Save New Password &amp; Sign In</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setForgotStep(2)}
                    className="text-[#7c766d] hover:text-[#1a1c1a] font-bold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
