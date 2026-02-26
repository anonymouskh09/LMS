import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, ShieldCheck, GraduationCap, ArrowRight, CheckCircle, XCircle, ArrowLeft } from "@phosphor-icons/react";
import "./ResetPassword.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/verify-reset-token/${token}`);
      const data = await response.json();
      if (data.success) {
        setTokenValid(true);
        setUserEmail(data.email);
      } else {
        setTokenValid(false);
        setError(data.message || "Invalid or expired reset token");
      }
    } catch (err) {
      setTokenValid(false);
      setError("Connection error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");

    if (name === "newPassword") {
      let strength = 0;
      if (value.length >= 6) strength++;
      if (value.length >= 10) strength++;
      if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
      if (/\d/.test(value)) strength++;
      if (/[^a-zA-Z\d]/.test(value)) strength++;
      setPasswordStrength(Math.min(strength, 4));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, newPassword: formData.newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        alert("✅ " + data.message);
        navigate("/signin");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  // 1. Loading / Verifying State
  if (verifying) {
    return (
      <div className="reset-wrapper">
        <div className="status-card animate-fadeIn">
          <div className="premium-spinner"></div>
          <p>Verifying Security Token...</p>
        </div>
      </div>
    );
  }

  // 2. Error / Invalid Token State
  if (!tokenValid) {
    return (
      <div className="reset-wrapper">
        <div className="bg-blur-elements"><div className="orb orb-1"></div></div>
        <div className="status-card error-card animate-fadeIn">
          <XCircle size={64} weight="duotone" color="#ef4444" />
          <h2>Link Expired</h2>
          <p>{error}</p>
          <Link to="/forgot-password" className="prime-btn">Request New Link</Link>
        </div>
      </div>
    );
  }

  // 3. Main Reset Form
  return (
    <div className="reset-wrapper">
      <div className="bg-blur-elements">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="reset-glass-card animate-fadeIn">
        {/* Left Side Branding */}
        <div className="branding-section">
          <div className="brand-header">
            <div className="logo-wrapper"><GraduationCap size={32} weight="duotone" /></div>
            <span className="brand-name">Lancers Tech</span>
          </div>
          <div className="branding-body">
            <h1 className="hero-text">Secure your <br /><span>Identity</span></h1>
            <p className="sub-hero">Your new password should be unique and strong. We recommend using a mix of letters and symbols.</p>
            <div className="feature-pill">
              <ShieldCheck size={22} weight="duotone" />
              <span>End-to-End Encryption</span>
            </div>
          </div>
          <div className="branding-footer"><p>© 2026 Lancers Tech Security</p></div>
        </div>

        {/* Right Side Form */}
        <div className="form-section">
          <div className="form-title-block">
            <CheckCircle size={40} weight="fill" color="#22c55e" style={{marginBottom: '15px'}} />
            <h2>New Password</h2>
            <p>Setting up access for <strong>{userEmail}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            {error && <div className="error-toast">{error}</div>}

            <div className="input-container">
              <Lock size={20} className="field-icon" />
              <input type="password" name="newPassword" placeholder="New Password" value={formData.newPassword} onChange={handleChange} required />
              
              {formData.newPassword && (
                <div className="strength-meter-box">
                  <div className="meter-bar-bg">
                    <div className="meter-bar-fill" style={{ width: `${(passwordStrength + 1) * 20}%`, backgroundColor: strengthColors[passwordStrength] }}></div>
                  </div>
                  <span style={{ color: strengthColors[passwordStrength] }}>{strengthLabels[passwordStrength]}</span>
                </div>
              )}
            </div>

            <div className="input-container">
              <ShieldCheck size={20} className="field-icon" />
              <input type="password" name="confirmPassword" placeholder="Confirm New Password" value={formData.confirmPassword} onChange={handleChange} required />
            </div>

            <button type="submit" className="prime-btn" disabled={loading}>
              {loading ? <span className="loader"></span> : <>Update Password <ArrowRight weight="bold" /></>}
            </button>
          </form>

          <div className="auth-switch">
            <Link to="/signin" className="back-link"><ArrowLeft size={18} weight="bold" /> Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;