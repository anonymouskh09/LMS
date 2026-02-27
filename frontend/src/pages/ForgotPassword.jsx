import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Envelope, ArrowRight, GraduationCap, ShieldCheck, ArrowLeft, PaperPlaneTilt } from "@phosphor-icons/react";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [redirecting, setRedirecting] = useState(false);

  // Countdown and auto-redirect effect
  useEffect(() => {
    if (redirecting && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (redirecting && countdown === 0 && resetLink) {
      // Extract token from resetLink and navigate
      const token = resetLink.split('/').pop();
      navigate(`/reset-password/${token}`);
    }
  }, [redirecting, countdown, resetLink, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetLink("");
    setRedirecting(false);
    setCountdown(3);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setVerifiedEmail(email); // Store the verified email
        setMessage(data.message);
        if (data.resetLink) {
          setResetLink(data.resetLink);
          setRedirecting(true); // Start countdown
        }
        setEmail(""); 
      } else {
        setError(data.message || "Failed to send reset link");
      }
    } catch (err) {
      setError("Connection error. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-wrapper">
      {/* Dynamic Background Orbs */}
      <div className="bg-blur-elements">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="forgot-glass-card animate-fadeIn">
        {/* Left Branding Side */}
        <div className="branding-section">
          <div className="brand-header">
            <div className="logo-wrapper">
              <GraduationCap size={32} weight="duotone" />
            </div>
            <span className="brand-name">Lancers Tech</span>
          </div>
          
          <div className="branding-body">
            <h1 className="hero-text">Account <br /><span>Recovery</span></h1>
            <p className="sub-hero">Don't worry! It happens to the best of us. Let's get you back into your workspace.</p>
            
            <div className="feature-pill">
              <ShieldCheck size={22} weight="duotone" />
              <span>Secure Recovery Process</span>
            </div>
          </div>
          
          <div className="branding-footer">
            <p>© 2026 Lancers Tech LMS. Professional Portal.</p>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="form-section">
          <div className="form-title-block">
            <h2>Reset Password</h2>
            <p>Enter your registered email to receive a link</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            {error && <div className="error-toast">{error}</div>}
            {message && (
              <div className="success-toast">
                <div className="success-header">
                   <PaperPlaneTilt size={20} weight="fill" />
                   <span>Email Verified!</span>
                </div>
                {verifiedEmail && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#fff' }}>
                      <strong>Reset link sent to:</strong>
                    </p>
                    <p style={{ margin: '0', fontSize: '15px', color: '#22c55e', fontWeight: '600' }}>
                      {verifiedEmail}
                    </p>
                  </div>
                )}
                {redirecting && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#60a5fa' }}>
                      Redirecting to reset password in <strong>{countdown}</strong> seconds...
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="input-container">
              <Envelope size={20} className="field-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="prime-btn" disabled={loading}>
              {loading ? <span className="loader"></span> : <>Send Reset Link <ArrowRight weight="bold" /></>}
            </button>
          </form>

          <div className="auth-switch">
            <Link to="/signin" className="back-link">
              <ArrowLeft size={18} weight="bold" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
