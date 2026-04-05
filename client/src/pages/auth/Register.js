// src/pages/auth/Register.js
import React, { useState } from "react";
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
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Privacy Policy</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      {/* Body */}
      <div className="overflow-y-auto px-6 py-5 text-sm text-gray-700 space-y-4 leading-relaxed">
        <p className="text-xs text-gray-400">Last updated: January 2025</p>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">1. Information We Collect</h3>
          <p>
            When you create an account on IJEEQT, we collect your full name, email address,
            and password. We use this information solely to manage your account and provide
            you access to submission and review services.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">2. How We Use Your Information</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>To create and manage your journal account</li>
            <li>To communicate submission status and review feedback</li>
            <li>To send OTP verification codes to your email</li>
            <li>To process manuscript submissions and author correspondence</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">3. Data Security</h3>
          <p>
            Your data is stored securely using Firebase (Google Cloud). Passwords are
            hashed and never stored in plain text. We implement industry-standard
            security measures to protect your personal information.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">4. Data Sharing</h3>
          <p>
            We do not sell or share your personal information with third parties.
            Your data may be shared with co-authors or editors only as needed for
            the peer review process.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">5. Your Rights</h3>
          <p>
            You have the right to access, modify, or delete your personal data at
            any time by contacting us at{" "}
            <a href="mailto:editor@ijeeqt.org" className="text-blue-600 hover:underline">
              editor@ijeeqt.org
            </a>.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">6. Cookies</h3>
          <p>
            We use session cookies for authentication purposes only. We do not
            use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">7. Contact</h3>
          <p>
            For privacy-related inquiries, contact our data protection officer at{" "}
            <a href="mailto:privacy@ijeeqt.org" className="text-blue-600 hover:underline">
              privacy@ijeeqt.org
            </a>.
          </p>
        </section>
      </div>
      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={onClose}
          className="bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          I Understand
        </button>
      </div>
    </div>
  </div>
);

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
        document.getElementById(`otp-${idx - 1}`)?.focus();
      }
      onChange(arr.join(""));
      return;
    }
    if (!/^\d$/.test(char)) return;
    const arr = digits.slice();
    arr[idx] = char;
    onChange(arr.join(""));
    if (idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    if (pasted.length > 0) {
      document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
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

// ─── Main Register Component ──────────────────────────────────────────────────
const Register = () => {
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(""); // shown in dev mode
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ── Step 1: Validate & send OTP ───────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!form.password) { setError("Password is required."); return; }
    if (!form.confirmPassword) { setError("Please confirm your password."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!privacyAccepted) { setError("You must accept the Privacy Policy to continue."); return; }

    setLoading(true);
    try {
      const res = await authAPI.sendOtp(form.email);
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep(2);
      startResendTimer();
      setSuccess("OTP sent to " + form.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP & register ─────────────────────────────────────────
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }

    setLoading(true);
    try {
      // Verify OTP
      await authAPI.verifyOtp(form.email, otp);
      // Register account
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
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setDevOtp("");
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(form.email);
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
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">{logoText}</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 ? "Join as an author or reviewer" : "Verify your email address"}
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

        {/* ── STEP 1: Registration Form ─────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4 space-y-4">
            {[
              { name: "name", label: "Full Name", type: "text", placeholder: "Dr. John Smith" },
              { name: "email", label: "Email Address", type: "email", placeholder: "your@email.com" },
              { name: "password", label: "Password", type: "password", placeholder: "Min 6 characters" },
              { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Repeat password" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}

            {/* Privacy Policy Checkbox */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="privacy-checkbox"
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                required
                className="mt-0.5 w-4 h-4 accent-blue-700 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="privacy-checkbox" className="text-sm text-gray-600 leading-snug">
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-blue-600 font-medium hover:underline focus:outline-none"
                >
                  Privacy Policy
                </button>
                <span className="text-red-500"> *</span>
              </label>
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
          <form onSubmit={handleVerifyAndRegister} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📧</span>
              </div>
              <p className="text-sm text-gray-600">
                We've sent a 6-digit OTP to
              </p>
              <p className="font-semibold text-gray-900 mt-0.5">{form.email}</p>
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
              {loading ? <><Spinner size="sm" /> Creating account...</> : "Create Account"}
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
              ← Change email or details
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
        </p>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default Register;
