import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function StudentAssignments() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissionText, setSubmissionText] = useState('')
  const [submissionFile, setSubmissionFile] = useState(null)

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    const token = sessionStorage.getItem('token')
    
    if (!userData || !token) {
      navigate('/signin')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchEnrolledCourses(token)
  }, [navigate])

  const fetchEnrolledCourses = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/courses/my-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setCourses(data.enrollments)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchAssignments = async (courseId) => {
    const token = sessionStorage.getItem('token')
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
    fetchAssignments(course.id)
  }

  const handleDownloadAssignment = (assignmentId) => {
    const token = sessionStorage.getItem('token')
    window.open(`http://localhost:5000/api/assignments/${assignmentId}/download?token=${token}`, '_blank')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = sessionStorage.getItem('token')
    
    try {
      const formData = new FormData()
      formData.append('submission_text', submissionText)
      if (submissionFile) {
        formData.append('file', submissionFile)
      }
      
      const response = await fetch(`http://localhost:5000/api/submissions/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Submission uploaded successfully!')
        setShowSubmitForm(false)
        setSubmissionText('')
        setSubmissionFile(null)
        fetchAssignments(selectedCourse.id)
      } else {
        alert(data.message || 'Submission failed')
      }
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Error submitting assignment')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Lancers Tech</h2>
          <p className="sidebar-subtitle">Student Portal</p>
        </div>
        
        <div className="sidebar-section">
          <h3 className="section-title">MENU</h3>
          <ul className="sidebar-menu">
            <li className="menu-item" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <span className="menu-text">Assignments</span>
            </li>
          </ul>
        </div>

        {courses.length > 0 && (
          <div className="sidebar-section">
            <h3 className="section-title">MY COURSES</h3>
            <div className="user-list">
              {courses.map(course => (
                <div 
                  key={course.id} 
                  className={`user-item ${selectedCourse?.id === course.id ? 'active' : ''}`}
                  onClick={() => handleCourseSelect(course)}
                  style={{cursor: 'pointer', padding: '12px', borderRadius: '6px', marginBottom: '8px', backgroundColor: selectedCourse?.id === course.id ? '#e3f2fd' : 'transparent'}}
                >
                  <div className="user-info">
                    <div className="user-name" style={{fontWeight: '600', marginBottom: '4px'}}>{course.title}</div>
                    <div className="user-email" style={{fontSize: '12px', color: '#666'}}>View assignments</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="top-nav">
          <div className="nav-title">
            <h1>{selectedCourse ? selectedCourse.title + ' - Assignments' : 'My Assignments'}</h1>
            <div className="user-welcome">
              Welcome, <strong>{user.name}</strong>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            Back to Dashboard
          </button>
        </div>

        {!selectedCourse ? (
          <div style={{textAlign: 'center', padding: '60px 20px', color: '#666'}}>
            <h3>Select a course from the sidebar to view assignments</h3>
          </div>
        ) : assignments.length === 0 ? (
          <div style={{textAlign: 'center', padding: '60px 20px', color: '#666'}}>
            <h3>No assignments yet for this course</h3>
          </div>
        ) : (
          <div style={{padding: '20px'}}>
            {assignments.map(assignment => (
              <div key={assignment.id} style={{backgroundColor: 'white', padding: '25px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                  <div style={{flex: 1}}>
                    <h3 style={{marginTop: 0, color: '#333', fontSize: '20px'}}>{assignment.title}</h3>
                    <p style={{color: '#666', marginBottom: '15px'}}>{assignment.description}</p>
                    
                    <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                      <div>
                        <strong>Due Date:</strong> {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Max Marks:</strong> {assignment.max_marks}
                      </div>
                      {assignment.file_url && (
                        <div>
                          <strong>File:</strong> <span style={{color: '#4CAF50'}}>✓ Attached</span>
                        </div>
                      )}
                    </div>

                    {assignment.submitted_at && (
                      <div style={{padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '6px', marginBottom: '10px'}}>
                        <strong style={{color: '#2e7d32'}}>✓ Submitted:</strong> {new Date(assignment.submitted_at).toLocaleString()}
                        {assignment.marks_obtained !== null && (
                          <div style={{marginTop: '5px'}}>
                            <strong>Marks:</strong> {assignment.marks_obtained}/{assignment.max_marks}
                            {assignment.feedback && <div><strong>Feedback:</strong> {assignment.feedback}</div>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px'}}>
                    {assignment.file_url && (
                      <button 
                        onClick={() => handleDownloadAssignment(assignment.id)}
                        style={{padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap'}}
                      >
                        📥 Download Assignment
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {setSelectedAssignment(assignment); setShowSubmitForm(true)}}
                      style={{padding: '10px 20px', backgroundColor: assignment.submitted_at ? '#FF9800' : '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap'}}
                    >
                      {assignment.submitted_at ? '🔄 Resubmit' : '📤 Submit'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showSubmitForm && selectedAssignment && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}} onClick={() => setShowSubmitForm(false)}>
            <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
              <h2 style={{marginTop: 0}}>Submit Assignment: {selectedAssignment.title}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '600'}}>Submission Text</label>
                  <textarea
                    placeholder="Enter your submission text or comments..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    style={{width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px'}}
                  />
                </div>
                
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '600'}}>Upload File (Optional)</label>
                  <input
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd'}}
                  />
                  {submissionFile && (
                    <p style={{marginTop: '5px', fontSize: '14px', color: '#666'}}>Selected: {submissionFile.name}</p>
                  )}
                </div>
                
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="submit" style={{flex: 1, padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'}}>
                    Submit Assignment
                  </button>
                  <button type="button" onClick={() => setShowSubmitForm(false)} style={{flex: 1, padding: '12px', backgroundColor: '#f5f5f5', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentAssignments
