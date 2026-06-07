// src/pages/auth/ForgotPassword.js
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Spinner } from "../../components/common";
import { authAPI } from "../../services/api";
import { Eye, EyeOff } from "lucide-react";

// ─── Password Strength Indicator ──────────────────────────────────────────────
const passwordRules = [
  { id: "length",    label: "At least 8 characters",         test: (p) => p.length >= 8 },
  { id: "upper",     label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower",     label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number",    label: "At least one number",           test: (p) => /[0-9]/.test(p) },
  { id: "special",   label: "At least one special character",test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const passed = passwordRules.filter((r) => r.test(password)).length;
  const pct = (passed / passwordRules.length) * 100;
  const color = passed <= 1 ? "bg-red-500" : passed <= 3 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="mt-2 space-y-2">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {/* Rule checklist */}
      <ul className="space-y-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? "text-green-600" : "text-gray-400"}`}>
              <span className={`w-4 h-4 flex items-center justify-center rounded-full text-xs font-bold ${ok ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                {ok ? "✓" : "·"}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ─── OTP Input ────────────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const digits = value.padEnd(6, "").split("").slice(0, 6);
  const handleKey = (e, idx) => {
    if (e.key === "Backspace") {
      const arr = digits.slice();
      if (arr[idx]) { arr[idx] = ""; }
      else if (idx > 0) { arr[idx - 1] = ""; document.getElementById(`forgot-otp-${idx - 1}`)?.focus(); }
      onChange(arr.join("")); return;
    }
    if (!/^\d$/.test(e.key)) return;
    const arr = digits.slice(); arr[idx] = e.key; onChange(arr.join(""));
    if (idx < 5) document.getElementById(`forgot-otp-${idx + 1}`)?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(p);
    if (p.length > 0) document.getElementById(`forgot-otp-${Math.min(p.length, 5)}`)?.focus();
  };
  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} id={`forgot-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ""} onChange={() => {}} onKeyDown={(e) => handleKey(e, i)}
          className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          style={{ caretColor: "transparent" }} />
      ))}
    </div>
  );
};

// ─── Main Forgot Password ──────────────────────────────────────────────────────
const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();

  const passwordValid = useMemo(() => passwordRules.every((r) => r.test(newPassword)), [newPassword]);

  const startResendTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => setResendTimer((t) => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
  };

  // ── Step 1: Request OTP ───────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }

    setLoading(true);
    try {
      await authAPI.sendOtp(email);
      setStep(2);
      startResendTimer();
      setSuccess("OTP sent to " + email + ". Please check your inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }

    setLoading(true);
    try {
      await authAPI.verifyOtp(email, otp, false);
      setStep(3);
      setSuccess("OTP verified. Please enter your new password.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    if (!passwordValid) { setError("Password does not meet all requirements."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword(email, otp, newPassword);
      setSuccess("Password reset successfully. You can now login.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(""); setLoading(true);
    try {
      await authAPI.sendOtp(email);
      startResendTimer();
      setSuccess("New OTP sent to " + email + ". Please check your inbox.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const logoText = process.env.REACT_APP_JOURNAL_ABBR?.slice(0, 4) || "IJAR";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">{logoText}</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">{step === 1 ? "Enter your email to receive an OTP" : step === 2 ? "Verify your email address" : "Set your new password"}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= s ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > s ? "✓" : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-blue-700" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {success && !error && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">{success}</div>
        )}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Spinner size="sm" /> Sending OTP...</> : "Send OTP"}
            </button>
            <div className="text-center mt-4 text-sm">
              <Link to="/login" className="text-blue-600 font-medium hover:underline">← Back to Login</Link>
            </div>
          </form>
        )}

        {/* ── STEP 2: Verify OTP ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4 space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">Enter the OTP sent to</p>
              <p className="font-semibold text-gray-900 mt-0.5">{email}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter OTP <span className="text-red-500">*</span></label>
              <OtpInput value={otp} onChange={setOtp} />
            </div>

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mb-4 mt-4">
              {loading ? <><Spinner size="sm" /> Verifying...</> : "Verify OTP"}
            </button>

            <div className="text-center text-sm">
              <span className="text-gray-500">Didn't receive it? </span>
              {resendTimer > 0 ? (
                <span className="text-gray-400">Resend in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={handleResend} className="text-blue-600 font-medium hover:underline">Resend OTP</button>
              )}
            </div>
            <button type="button" onClick={() => { setStep(1); setOtp(""); setError(""); setSuccess(""); }}
              className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 hover:underline">
              ← Change email
            </button>
          </form>
        )}

        {/* ── STEP 3: Reset Password ── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Create a strong password" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10 ${confirmPassword && newPassword !== confirmPassword ? "border-red-400" : "border-gray-300"}`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading || !passwordValid || newPassword !== confirmPassword}
              className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mb-4 mt-4">
              {loading ? <><Spinner size="sm" /> Resetting...</> : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
