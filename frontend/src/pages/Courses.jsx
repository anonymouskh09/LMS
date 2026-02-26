import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Courses() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showCoursePopup, setShowCoursePopup] = useState(false)
  const [assignments, setAssignments] = useState([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (!userData || !token) {
      navigate('/signin')
      return
    }
    
    setUser(JSON.parse(userData))
    fetchEnrolledCourses()
    fetchAllCourses()
  }, [navigate])

  const fetchEnrolledCourses = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('http://localhost:5000/api/courses/my-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setEnrolledCourses(data.enrollments)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchAllCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses')
      const data = await response.json()
      if (data.success) {
        setAllCourses(data.courses)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchCourseAssignments = async (courseId) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEnroll = async (courseId) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        alert('Successfully enrolled!')
        fetchEnrolledCourses()
        setShowCoursePopup(false)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error:', error)
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
            <li className="menu-item active">
              <div className="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <span className="menu-text">Courses</span>
            </li>
            <li className="menu-item" onClick={() => navigate('/analytics')}>
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
            <h1>My Courses</h1>
            <div className="user-welcome">
              All your enrolled courses and available courses
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{padding: '8px 16px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            Back to Dashboard
          </button>
        </div>

        {/* Enrolled Courses */}
        <div className="courses-section">
          <div className="section-header">
            <h2>My Enrolled Courses ({enrolledCourses.length})</h2>
          </div>
          <div className="courses-grid">
            {enrolledCourses.map(course => (
              <div key={course.id} className="course-card" onClick={() => fetchCourseAssignments(course.id)} style={{cursor: 'pointer'}}>
                <div className="course-title">{course.title}</div>
                <div className="course-instructor">By {course.teacher_name || 'TBA'}</div>
                <div className="course-description">{course.description}</div>
                <div style={{
                  marginTop: '10px', 
                  padding: '5px 10px', 
                  backgroundColor: course.status === 'pending' ? '#fff3e0' : '#e8f5e9', 
                  color: course.status === 'pending' ? '#ef6c00' : '#2e7d32', 
                  borderRadius: '4px', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}>
                  {course.status === 'pending' ? '⏳ Pending Approval' : '✓ Enrolled'}
                </div>
                {course.status !== 'pending' && <button className="course-btn" style={{marginTop: '10px'}}>View Assignments</button>}
                {course.status === 'pending' && <p style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>Waiting for teacher to approve your request.</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Available Courses */}
        <div className="courses-section" style={{marginTop: '40px'}}>
          <div className="section-header">
            <h2>Available Courses</h2>
          </div>
          <div className="courses-grid">
            {allCourses.filter(c => !enrolledCourses.some(e => e.id === c.id)).map(course => (
              <div key={course.id} className="course-card" onClick={() => {setSelectedCourse(course); setShowCoursePopup(true)}} style={{cursor: 'pointer'}}>
                <div className="course-title">{course.title}</div>
                <div className="course-instructor">By {course.teacher_name || 'TBA'}</div>
                <div className="course-description">{course.description}</div>
                <button className="course-btn" style={{marginTop: '10px'}} onClick={(e) => {e.stopPropagation(); setSelectedCourse(course); setShowCoursePopup(true)}}>
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Course Popup */}
        {showCoursePopup && selectedCourse && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}} onClick={() => setShowCoursePopup(false)}>
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
              <h2 style={{marginTop: 0}}>{selectedCourse.title}</h2>
              <p><strong>Instructor:</strong> {selectedCourse.teacher_name || 'TBA'}</p>
              <p><strong>Description:</strong><br/>{selectedCourse.description}</p>
              <button onClick={() => handleEnroll(selectedCourse.id)} style={{width: '100%', padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px'}}>
                Enroll in this Course
              </button>
              <button onClick={() => setShowCoursePopup(false)} style={{width: '100%', padding: '12px', backgroundColor: '#f5f5f5', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses
