import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// Eye aur EyeSlash icons add kiye hain
import { User, Envelope, Lock, ShieldCheck, GraduationCap, ArrowRight, CheckCircle, Eye, EyeSlash, Buildings, ListNumbers } from "@phosphor-icons/react";
import "./SignUp.css";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // Visibility toggles ki states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [campuses, setCampuses] = useState([]);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/campuses");
      const data = await response.json();
      if (data.success) {
        setCampuses(data.campuses);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");

    if (name === "password") {
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
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          campus_id: formData.campus_id,
          semester: formData.semester || 1,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.pending) {
          setError(""); 
          alert("✅ Registration submitted successfully!\n\nYour account is pending teacher approval.");
          setTimeout(() => navigate("/signin"), 2000);
        } else {
          sessionStorage.setItem("user", JSON.stringify(data.user));
          sessionStorage.setItem("token", data.token);
          navigate("/dashboard");
        }
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Connection error. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="signup-wrapper">
      <div className="bg-blur-elements">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="signup-glass-card animate-fadeIn">
        <div className="branding-section">
          <div className="brand-header">
            <div className="logo-wrapper">
              <GraduationCap size={32} weight="duotone" />
            </div>
            <span className="brand-name">Lancers Tech</span>
          </div>
          
          <div className="branding-body">
            <h1 className="hero-text">Elevate Your <br /><span>Learning</span></h1>
            <p className="sub-hero">Step into a world of structured knowledge and academic excellence.</p>
            
            <div className="premium-features">
              {[
                "Centralized Course Management",
                "Real-time Academic Tracking",
                "Seamless Teacher Collaboration"
              ].map((text, i) => (
                <div key={i} className="feature-pill">
                  <CheckCircle size={20} weight="fill" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="branding-footer">
            <p>© 2026 Lancers Tech LMS. All rights reserved.</p>
          </div>
        </div>

        <div className="form-section">
          <div className="form-title-block">
            <h2>Get Started</h2>
            <p>Enter your details to create your student profile</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            {error && <div className="error-toast">{error}</div>}

            <div className="floating-group">
              <div className="input-container">
                <User size={20} className="field-icon" />
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="floating-group">
              <div className="input-container">
                <Envelope size={20} className="field-icon" />
                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="floating-group">
              <div className="input-container">
                <Buildings size={20} className="field-icon" />
                <select name="campus_id" value={formData.campus_id} onChange={handleChange} required className="modern-select">
                  <option value="">Select Department</option>
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="floating-group">
              <div className="input-container">
                <ListNumbers size={20} className="field-icon" />
                <select name="semester" value={formData.semester} onChange={handleChange} required className="modern-select">
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password Field with Eye Icon */}
            <div className="floating-group">
              <div className="input-container">
                <Lock size={20} className="field-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
                <button 
                  type="button" 
                  className="eye-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.password && (
                <div className="strength-indicator">
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${(passwordStrength + 1) * 20}%`, backgroundColor: strengthColors[passwordStrength] }}></div>
                  </div>
                  <span style={{ color: strengthColors[passwordStrength] }}>{strengthLabels[passwordStrength]}</span>
                </div>
              )}
            </div>

            {/* Confirm Password Field with Eye Icon */}
            <div className="floating-group">
              <div className="input-container">
                <ShieldCheck size={20} className="field-icon" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  placeholder="Confirm Password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                />
                <button 
                  type="button" 
                  className="eye-btn" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="prime-btn" disabled={loading}>
              {loading ? <span className="loader"></span> : <>Create Account <ArrowRight weight="bold" /></>}
            </button>
          </form>

          <div className="auth-switch">
            Already a member? <Link to="/signin">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
