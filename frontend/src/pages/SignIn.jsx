import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Envelope, Lock, GraduationCap, ArrowRight, Eye, EyeSlash, ChartLineUp, Users } from "@phosphor-icons/react";
import './SignIn.css'

function SignIn() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false) // Eye toggle state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        
        if (data.user.role === 'teacher') {
          navigate('/teacher/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        if (data.pending) {
          setError('⏳ Your account is pending teacher approval. Please wait for a teacher to approve your registration request.')
        } else {
          setError(data.message || 'Invalid email or password')
        }
      }
    } catch (err) {
      setError('Connection error. Please check if your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signin-wrapper">
      {/* Dynamic Background Orbs */}
      <div className="bg-blur-elements">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="signin-glass-card animate-fadeIn">
        {/* Left Branding Side */}
        <div className="branding-section">
          <div className="brand-header">
            <div className="logo-wrapper">
              <GraduationCap size={32} weight="duotone" />
            </div>
            <span className="brand-name">Lancers Tech</span>
          </div>
          
          <div className="branding-body">
            <h1 className="hero-text">Welcome <br /><span>Back</span></h1>
            <p className="sub-hero">Sign in to manage your students, track performance, and lead your institution effectively.</p>
            
            <div className="feature-stack">
              <div className="feature-pill">
                <Users size={22} weight="duotone" />
                <span>Team Management</span>
              </div>
              <div className="feature-pill">
                <ChartLineUp size={22} weight="duotone" />
                <span>Live Analytics</span>
              </div>
            </div>
          </div>
          
          <div className="branding-footer">
            <p>© 2026 Lancers Tech LMS. Professional Suite.</p>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="form-section">
          <div className="form-title-block">
            <h2>Sign In</h2>
            <p>Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            {error && <div className="error-toast">{error}</div>}

            <div className="floating-group">
              <div className="input-container">
                <Envelope size={20} className="field-icon" />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

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
            </div>

            <div className="form-aux-options">
              <label className="custom-checkbox">
                <input type="checkbox" />
                <span className="checkmark"></span>
                <span className="label-text">Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="prime-btn" disabled={loading}>
              {loading ? <span className="loader"></span> : <>Sign In <ArrowRight weight="bold" /></>}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn