import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import PrincipalDashboard from './PrincipalDashboard'
import SuperAdminDashboard from './SuperAdminDashboard'
import BDDashboard from './BDDashboard'
import StudentDashboard from './StudentDashboard'
import TeacherDashboard from './TeacherDashboard'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/signin')
      return
    }
    try {
      setUser(JSON.parse(userData))
    } catch (e) {
      console.error("Failed to parse user data", e)
      navigate('/signin')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/signin')
  }

  if (!user) return null

  // Super Admin — global platform control
  if (user.role === 'super_admin') {
    return <SuperAdminDashboard user={user} onLogout={handleLogout} />
  }

  // HOD — campus-level admin (replaces old 'admin' role)
  if (user.role === 'principal') {
    return <PrincipalDashboard user={user} onLogout={handleLogout} />
  }

  // BD Agent — business development portal
  if (user.role === 'bd_agent') {
    return <BDDashboard user={user} onLogout={handleLogout} />
  }

  // Legacy admin role (backward compat)
  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />
  }

  if (user.role === 'student') {
    return <StudentDashboard user={user} onLogout={handleLogout} />
  }

  if (user.role === 'teacher') {
    return <TeacherDashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="dashboard-container">
      <h2>Unknown Role: {user.role}</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default Dashboard
