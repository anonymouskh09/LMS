import {useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './SignIn.css'

function TeacherSignIn() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/teacher/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        // Save user data and token
        sessionStorage.setItem('user', JSON.stringify(data.user))
        sessionStorage.setItem('token', data.token)
        
        // Redirect to teacher dashboard
        navigate('/teacher/dashboard')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Teacher Login</h1>
          <p>Sign in to access your teacher dashboard</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="teacher@university.edu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In as Teacher'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Student? <Link to="/signin">Student Login</Link></p>
          <p>Admin? <Link to="/signin">Admin Login</Link></p>
        </div>
      </div>
    </div>
  )
}

export default TeacherSignIn
