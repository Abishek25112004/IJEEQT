// src/pages/auth/Register.js
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Alert, Spinner } from "../../components/common";
import { authAPI } from "../../services/api";

// ─── Privacy Policy Modal ─────────────────────────────────────────────────────
const PrivacyPolicyModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Privacy Policy</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">✕</button>
      </div>
      <div className="overflow-y-auto px-6 py-5 text-sm text-gray-700 space-y-4 leading-relaxed">
        <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        <section>
          <h3 className="font-semibold text-gray-900 mb-1">1. Information We Collect</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Account & Login Data:</strong> We collect your full name, email address, and hashed password to manage your account, authenticate logins, and secure your session.</li>
            <li><strong>Paper Uploads & Peer Review:</strong> When you submit a manuscript, we collect author details, affiliations, and the content of the uploaded files to facilitate the review and publication process.</li>
            <li><strong>Payment Information:</strong> For processing Article Processing Charges (APC) and other payments, we collect necessary billing details. Payments are processed securely via third-party gateways (e.g., Razorpay); we do not store full credit card details.</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-gray-900 mb-1">2. How We Use Your Information</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>To create, authenticate, and manage your journal account securely.</li>
            <li>To process manuscript submissions, facilitate peer review, and handle author correspondence.</li>
            <li>To securely process payments and confirm transactions.</li>
            <li>To send important notifications, such as OTP verification codes and submission status updates.</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-gray-900 mb-1">3. Data Security & Storage</h3>
          <p>Your data is stored securely using cloud infrastructure. Passwords are encrypted and never stored in plain text. We implement industry-standard security measures, including HTTPS and secure cookies, to protect your personal and financial information against unauthorized access.</p>
        </section>
        <section>
          <h3 className="font-semibold text-gray-900 mb-1">4. Data Sharing & Third Parties</h3>
          <p>We do not sell your personal information. Your data may be shared with:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1">
            <li><strong>Co-authors & Editors:</strong> As necessary for the peer review and editorial process.</li>
            <li><strong>Service Providers:</strong> Secure third-party services for hosting, payment processing, and email delivery.</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-gray-900 mb-1">5. Your Rights & Data Retention</h3>
          <p>We retain your personal data only as long as necessary to fulfill the purposes outlined above or comply with legal obligations. You have the right to access, modify, or delete your personal data at any time by contacting us at <a href="mailto:editor@ijeeqt.org" className="text-blue-600 hover:underline">editor@ijeeqt.org</a>.</p>
        </section>
        <section>
          <h3 className="font-semibold text-gray-900 mb-1">6. Contact Us</h3>
          <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@ijeeqt.org" className="text-blue-600 hover:underline">privacy@ijeeqt.org</a>.</p>
        </section>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button onClick={onClose} className="bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-800 transition-colors">I Understand</button>
      </div>
    </div>
  </div>
);

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
      else if (idx > 0) { arr[idx - 1] = ""; document.getElementById(`otp-${idx - 1}`)?.focus(); }
      onChange(arr.join("")); return;
    }
    if (!/^\d$/.test(e.key)) return;
    const arr = digits.slice(); arr[idx] = e.key; onChange(arr.join(""));
    if (idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(p);
    if (p.length > 0) document.getElementById(`otp-${Math.min(p.length, 5)}`)?.focus();
  };
  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ""} onChange={() => {}} onKeyDown={(e) => handleKey(e, i)}
          className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          style={{ caretColor: "transparent" }} />
      ))}
    </div>
  );
};

// ─── Main Register ────────────────────────────────────────────────────────────
const Register = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Check all password rules pass
  const passwordValid = useMemo(() => passwordRules.every((r) => r.test(form.password)), [form.password]);

  // ── Step 1: Validate & send OTP ─────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!passwordValid) { setError("Password does not meet all requirements."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (!privacyAccepted) { setError("You must accept the Privacy Policy to continue."); return; }

    setLoading(true);
    try {
      await authAPI.sendOtp(form.email);
      setStep(2);
      startResendTimer();
      setSuccess("OTP sent to " + form.email + ". Please check your inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP & register ─────────────────────────────────────
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      await authAPI.verifyOtp(form.email, otp);
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => setResendTimer((t) => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(""); setLoading(true);
    try {
      await authAPI.sendOtp(form.email);
      startResendTimer();
      setSuccess("New OTP sent to " + form.email + ". Please check your inbox.");
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
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">{step === 1 ? "Join as an author or reviewer" : "Verify your email address"}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= s ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > s ? "✓" : s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 transition-all ${step > 1 ? "bg-blue-700" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {success && !error && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">{success}</div>
        )}

        {/* ── STEP 1: Form ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4 space-y-4">
            {[
              { name: "name", label: "Full Name", type: "text", placeholder: "Dr. John Smith" },
              { name: "email", label: "Email Address", type: "email", placeholder: "your@email.com" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} <span className="text-red-500">*</span></label>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ))}

            {/* Password with real-time strength */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Create a strong password" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <PasswordStrength password={form.password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${form.confirmPassword && form.password !== form.confirmPassword ? "border-red-400" : "border-gray-300"}`} />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Privacy Policy */}
            <div className="flex items-start gap-3 pt-1">
              <input id="privacy-checkbox" type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} required
                className="mt-0.5 w-4 h-4 accent-blue-700 cursor-pointer flex-shrink-0" />
              <label htmlFor="privacy-checkbox" className="text-sm text-gray-600 leading-snug">
                I have read and agree to the{" "}
                <button type="button" onClick={() => setShowPrivacy(true)} className="text-blue-600 font-medium hover:underline focus:outline-none">Privacy Policy</button>
                <span className="text-red-500"> *</span>
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Spinner size="sm" /> Sending OTP...</> : "Continue →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📧</span>
              </div>
              <p className="text-sm text-gray-600">We've sent a 6-digit OTP to</p>
              <p className="font-semibold text-gray-900 mt-0.5">{form.email}</p>
              <p className="text-xs text-gray-400 mt-1">Check your inbox (and spam folder)</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter OTP <span className="text-red-500">*</span></label>
              <OtpInput value={otp} onChange={setOtp} />
            </div>

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mb-4">
              {loading ? <><Spinner size="sm" /> Creating account...</> : "Create Account"}
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
              ← Change details
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default Register;
