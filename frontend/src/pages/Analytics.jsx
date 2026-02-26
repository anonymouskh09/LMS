import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Analytics() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    averageMarks: 0,
    attendance: 0
  })
  const [recentGrades, setRecentGrades] = useState([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    
    if (!userData) {
      navigate('/signin')
      return
    }
    
    setUser(JSON.parse(userData))
    fetchAnalytics()
  }, [navigate])

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token')
    
    // Fetch enrolled courses
    try {
      const coursesRes = await fetch('http://localhost:5000/api/courses/my-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const coursesData = await coursesRes.json()
      
      if (coursesData.success) {
        const totalCourses = coursesData.enrollments.length
        
        // Calculate assignment stats
        let totalCompleted = 0
        let totalPending = 0
        let totalMarks = 0
        let gradedCount = 0
        const grades = []
        
        for (const course of coursesData.enrollments) {
          try {
            const assignRes = await fetch(`http://localhost:5000/api/submissions/course/${course.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const assignData = await assignRes.json()
            
            if (assignData.success) {
              assignData.assignments.forEach(assign => {
                if (assign.submission_id) {
                  totalCompleted++
                  if (assign.marks_obtained !== null) {
                    totalMarks += assign.marks_obtained
                    gradedCount++
                    grades.push({
                      title: assign.title,
                      course: course.title,
                      marks: assign.marks_obtained,
                      maxMarks: assign.max_marks,
                      percentage: ((assign.marks_obtained / assign.max_marks) * 100).toFixed(1)
                    })
                  }
                } else {
                  totalPending++
                }
              })
            }
          } catch (err) {
            console.error('Error fetching course assignments:', err)
          }
        }
        
        setStats({
          totalCourses,
          completedAssignments: totalCompleted,
          pendingAssignments: totalPending,
          averageMarks: gradedCount > 0 ? (totalMarks / gradedCount).toFixed(1) : 0,
          attendance: 85 // Mock data for now
        })
        
        setRecentGrades(grades.slice(-5).reverse())
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  if (!user) return null

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Lancers Tech</h2>
          <p className="sidebar-subtitle">Learning Portal</p>
        </div>
        
        <div className="sidebar-section">
          <h3 className="section-title">MENU</h3>
          <ul className="sidebar-menu">
            <li className="menu-item" onClick={() => navigate('/dashboard')}>
              <div className="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              </div>
              <span className="menu-text">Dashboard</span>
            </li>
            <li className="menu-item" onClick={() => navigate('/courses')}>
              <div className="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <span className="menu-text">Courses</span>
            </li>
            <li className="menu-item active">
              <div className="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <span className="menu-text">Analytics</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-nav">
          <div className="nav-title">
            <h1>Performance Analytics</h1>
            <div className="user-welcome">
              Track your academic performance and progress
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{padding: '8px 16px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            Back to Dashboard
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#e3f2fd'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalCourses}</div>
                <div className="stat-label">Enrolled Courses</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#e8f5e9'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.completedAssignments}</div>
                <div className="stat-label">Completed Assignments</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#fff3e0'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.pendingAssignments}</div>
                <div className="stat-label">Pending Assignments</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{backgroundColor: '#f3e5f5'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.averageMarks}%</div>
                <div className="stat-label">Average Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="courses-section" style={{marginTop: '30px'}}>
          <div className="section-header">
            <h2>Recent Grades</h2>
          </div>
          <div style={{backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #e0e0e0'}}>
                  <th style={{textAlign: 'left', padding: '12px', color: '#666', fontWeight: '600'}}>Assignment</th>
                  <th style={{textAlign: 'left', padding: '12px', color: '#666', fontWeight: '600'}}>Course</th>
                  <th style={{textAlign: 'center', padding: '12px', color: '#666', fontWeight: '600'}}>Score</th>
                  <th style={{textAlign: 'center', padding: '12px', color: '#666', fontWeight: '600'}}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {recentGrades.length > 0 ? (
                  recentGrades.map((grade, index) => (
                    <tr key={index} style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td style={{padding: '15px'}}>{grade.title}</td>
                      <td style={{padding: '15px', color: '#666'}}>{grade.course}</td>
                      <td style={{padding: '15px', textAlign: 'center', fontWeight: 'bold'}}>{grade.marks}/{grade.maxMarks}</td>
                      <td style={{padding: '15px', textAlign: 'center'}}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          backgroundColor: grade.percentage >= 80 ? '#e8f5e9' : grade.percentage >= 60 ? '#fff3e0' : '#ffebee',
                          color: grade.percentage >= 80 ? '#2e7d32' : grade.percentage >= 60 ? '#f57c00' : '#c62828',
                          fontWeight: 'bold'
                        }}>
                          {grade.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{padding: '20px', textAlign: 'center', color: '#999'}}>
                      No graded assignments yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Chart - Coming Soon */}
        <div className="courses-section" style={{marginTop: '30px'}}>
          <div className="section-header">
            <h2>Attendance Overview</h2>
          </div>
          <div style={{backgroundColor: 'white', borderRadius: '8px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            <div style={{fontSize: '48px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '10px'}}>
              {stats.attendance}%
            </div>
            <div style={{color: '#666', fontSize: '16px'}}>Overall Attendance</div>
            <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
              <p style={{margin: 0, color: '#666'}}>
                Keep up the good work! Maintain 75% attendance to be eligible for exams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
