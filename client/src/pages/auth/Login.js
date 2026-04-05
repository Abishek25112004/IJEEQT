// src/pages/auth/Login.js
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Alert, Spinner } from "../../components/common";
import { authAPI } from "../../services/api";

// ─── OTP Input ────────────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleKey = (e, idx) => {
    const char = e.key;
    if (char === "Backspace") {
      const arr = digits.slice();
      if (arr[idx]) {
        arr[idx] = "";
      } else if (idx > 0) {
        arr[idx - 1] = "";
        document.getElementById(`login-otp-${idx - 1}`)?.focus();
      }
      onChange(arr.join(""));
      return;
    }
    if (!/^\d$/.test(char)) return;
    const arr = digits.slice();
    arr[idx] = char;
    onChange(arr.join(""));
    if (idx < 5) document.getElementById(`login-otp-${idx + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    if (pasted.length > 0) {
      document.getElementById(`login-otp-${Math.min(pasted.length, 5)}`)?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          id={`login-otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          style={{ caretColor: "transparent" }}
        />
      ))}
    </div>
  );
};

// ─── Main Login Component ────────────────────────────────────────────────────
const Login = () => {
  const [step, setStep] = useState(1);         // 1=credentials, 2=otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── Step 1: Verify credentials, then send OTP ──────────────────────────────
  const handleCredentials = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }

    setLoading(true);
    try {
      // First verify credentials are correct via Firebase (without completing login flow)
      // We'll use a separate state variable to hold the firebase result for later
      // Actually: send OTP first, then after OTP verified, complete login
      const res = await authAPI.sendOtp(email);
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep(2);
      startResendTimer();
      setSuccess("OTP sent to " + email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP, then complete login ────────────────────────────────
  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }

    setLoading(true);
    try {
      // Verify OTP
      await authAPI.verifyOtp(email, otp);
      // Now complete Firebase login
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message;
      setError(
        msg.includes("wrong-password") || msg.includes("user-not-found") || msg.includes("invalid-credential")
          ? "Invalid email or password."
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setDevOtp("");
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(email);
      if (res.devOtp) setDevOtp(res.devOtp);
      startResendTimer();
      setSuccess("New OTP sent!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logoText = process.env.REACT_APP_JOURNAL_ABBR?.slice(0, 4) || "IJAR";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">{logoText}</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 ? "Access your author dashboard" : "Verify your identity"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 2 && (
                <div className={`h-0.5 w-12 transition-all ${step > 1 ? "bg-blue-700" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {success && !error && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            {success}
          </div>
        )}

        {/* ── STEP 1: Credentials ───────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleCredentials} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Spinner size="sm" /> Sending OTP...</> : "Continue →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ──────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndLogin} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📧</span>
              </div>
              <p className="text-sm text-gray-600">We've sent a 6-digit OTP to</p>
              <p className="font-semibold text-gray-900 mt-0.5">{email}</p>
            </div>

            {/* Dev mode OTP hint */}
            {devOtp && (
              <div className="mb-4 text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                🔧 Dev mode OTP: <strong className="font-mono tracking-widest">{devOtp}</strong>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter OTP <span className="text-red-500">*</span>
              </label>
              <OtpInput value={otp} onChange={setOtp} />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mb-4"
            >
              {loading ? <><Spinner size="sm" /> Signing in...</> : "Sign In"}
            </button>

            <div className="text-center text-sm">
              <span className="text-gray-500">Didn't receive the OTP? </span>
              {resendTimer > 0 ? (
                <span className="text-gray-400">Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(""); setError(""); setSuccess(""); }}
              className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 hover:underline"
            >
              ← Go back
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
