import { useState, useEffect, useRef } from 'react'
import '../responsive.css'
import {
  House, BookOpen, PlusCircle, CheckCircle, GraduationCap,
  Clock, UserCircle, SignOut, CalendarBlank, Trash,
  List, ChalkboardTeacher, UserPlus, X, ClipboardText, Pulse, 
  PencilSimple, FileText, DotsThreeOutline, ChartLine, Users,
  Warning, Bell, Star, Download, Eye, EyeSlash, TrendUp
} from "@phosphor-icons/react";
import { Chart } from "chart.js/auto";
import ClassAttendance from './ClassAttendance';

function TeacherDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const [grades, setGrades] = useState([])
  const [timetable, setTimetable] = useState([])
  const [teacherClasses, setTeacherClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [newGrade, setNewGrade] = useState({ student_id: '', exam_type: 'midterm', marks_obtained: '', max_marks: 100, exam_date: '', remarks: '' })
  const [pendingEnrollments, setPendingEnrollments] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  
  // Assignment State
  const [assignments, setAssignments] = useState([])
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([])
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [gradingSubmission, setGradingSubmission] = useState(null)
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', course_id: '', due_date: '', max_marks: 100 })
  const [gradeData, setGradeData] = useState({ marks_obtained: '', feedback: '' })
  const [stats, setStats] = useState({ total_courses: 0, total_students: 0, total_classes: 0, total_assignments: 0, total_graded: 0, total_pending: 0, recent_students: [] })

  // Timetable State
  const [showTimetableModal, setShowTimetableModal] = useState(false)

  // Chart references
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const token = localStorage.getItem('token')
  
  useEffect(() => {
    fetchTeacherCourses()
    fetchTimetable()
    fetchTeacherClasses()
    fetchStats()
    fetchPendingEnrollments()
    if (activePage === 'assignments') {
      fetchAssignments()
    }
  }, [activePage])

  // Chart initialization for overview
  useEffect(() => {
    if (chartRef.current && activePage === "overview") {
      if (chartInstance.current) chartInstance.current.destroy();
      
      // Dynamic data based on actual counts
      const activityData = [
        stats.total_courses,
        stats.total_students,
        stats.total_classes,
        stats.total_assignments,
        stats.total_graded,
        stats.total_pending,
        stats.recent_students.length
      ];

      chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            { 
              label: 'Activity', 
              data: activityData.slice(0, 7), 
              borderColor: '#4f46e5', 
              backgroundColor: 'rgba(79, 70, 229, 0.1)', 
              fill: true, 
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 8,
              pointBackgroundColor: '#4f46e5',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              borderWidth: 3
            }
          ]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            legend: { display: false },
            tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#94a3b8' }
          },
          scales: { 
            y: { 
              grid: { color: '#f1f5f9' }, 
              border: { display: false },
              beginAtZero: true,
              ticks: { stepSize: 5 }
            }, 
            x: { grid: { display: false } } 
          },
          animation: { duration: 1000, easing: 'easeInOutQuart' }
        }
      });
    }
  }, [activePage, courses.length, students.length, teacherClasses.length, assignments.length, grades.length, timetable.length, pendingEnrollments.length]);

  // --- API Functions (Aapka Original Logic - Unchanged) ---
  const fetchTeacherCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teachers/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setCourses(data.courses || [])
    } catch (error) { console.error(error) }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teachers/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setStats(data.stats)
    } catch (error) { console.error('Error fetching stats:', error) }
  }

  const fetchTimetable = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/timetables/my-timetable', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setTimetable(data.timetable || [])
    } catch (error) { console.error('Error:', error) }
  }


  const fetchTeacherClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes/teacher/my-classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setTeacherClasses(data.classes || [])
    } catch (error) { console.error(error) }
  }

  const fetchPendingEnrollments = async () => {
    setLoadingPending(true)
    try {
      const response = await fetch('http://localhost:5000/api/teachers/pending-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) { setPendingEnrollments(data.pendingEnrollments || []) }
    } catch (error) { console.error('Error fetching pending enrollments:', error) }
    finally { setLoadingPending(false) }
  }

  const handleApproveEnrollment = async (enrollmentId) => {
    if (!window.confirm('Approve this enrollment request?')) return
    try {
      const response = await fetch(`http://localhost:5000/api/teachers/enrollments/${enrollmentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) { alert('✅ Enrollment Approved'); fetchPendingEnrollments(); fetchStats(); }
      else { alert('❌ ' + data.message); }
    } catch (error) { alert('❌ Error approving enrollment') }
  }

  const handleRejectEnrollment = async (enrollmentId) => {
    if (!window.confirm('Reject this enrollment request?')) return
    try {
      const response = await fetch(`http://localhost:5000/api/teachers/enrollments/${enrollmentId}/reject`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) { alert('✅ Enrollment Rejected'); fetchPendingEnrollments(); fetchStats(); }
      else { alert('❌ ' + data.message); }
    } catch (error) { alert('❌ Error rejecting enrollment') }
  }

  const handleCourseSelect = async (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId))
    setSelectedCourse(course)
    try {
      const url = selectedClassId
        ? `http://localhost:5000/api/courses/${courseId}/students?classId=${selectedClassId}`
        : `http://localhost:5000/api/courses/${courseId}/students`;

      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      if (data.success) {
        setStudents(data.students)
        const initialData = {}
        data.students.forEach(s => initialData[s.id] = 'present')
        setAttendanceData(initialData)
      }
    } catch (error) { 
      console.error('Fetch students error:', error) 
    }
  }

  const fetchCourseGrades = async (courseId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/grades/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setGrades(data.grades || [])
    } catch (error) { console.error(error) }
  }

  const handleGradesCourseSelect = async (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId))
    setSelectedCourse(course)
    
    if (!courseId) {
      setStudents([])
      return
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.students || [])
      } else {
        console.error('Failed to fetch students:', data.message);
        setStudents([])
      }
    } catch (error) { 
      console.error('Fetch students error for grades:', error)
      setStudents([])
    }
  }

  // --- ASSIGNMENT FUNCTIONS ---
  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/assignments/my-assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) setAssignments(data.assignments || [])
    } catch (error) { console.error(error) }
  }

  const handleCreateAssignment = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment)
      })
      const data = await response.json()
      if (data.success) {
        alert('✅ Assignment created!');
        setShowCreateAssignmentModal(false);
        setNewAssignment({ title: '', description: '', course_id: '', due_date: '', max_marks: 100 });
        fetchAssignments();
      } else { alert('❌ ' + data.message) }
    } catch (error) { console.error(error) }
  }

  const fetchSubmissions = async (assignmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/assignment/${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setAssignmentSubmissions(data.submissions || [])
      }
    } catch (error) { console.error(error) }
  }

  const handleGradeSubmission = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${gradingSubmission.id}/grade`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData)
      })
      const data = await response.json()
      if (data.success) {
        alert('✅ Graded successfully!');
        setGradingSubmission(null);
        fetchSubmissions(selectedAssignment.id);
      }
    } catch (error) { console.error(error) }
  }

  const handleDeleteAssignment = async (id) => {
    if(!window.confirm('Delete this assignment?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/assignments/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      })
      if(response.ok) { fetchAssignments(); alert('Deleted'); }
    } catch(err) { console.error(err); }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }))
  }

  const fetchClassCourses = async (classId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (error) { console.error('Error fetching class courses:', error); }
  };

  const groupTimetableByDay = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const grouped = {}; days.forEach(day => grouped[day] = [])
    timetable.forEach(entry => { if (grouped[entry.day_of_week]) grouped[entry.day_of_week].push(entry) })
    return grouped
  }

  // Calculate stats
  const totalStudents = stats.total_students
  const totalCourses = stats.total_courses
  const totalClasses = stats.total_classes
  const pendingCount = stats.total_pending
  const totalAssignments = stats.total_assignments
  const displayCompletionRate = stats.total_assignments > 0 ? Math.min(100, Math.round((stats.total_graded / (stats.total_assignments || 1)) * 10)) : 0

  return (
    <div style={S.container}>
      {/* Animated Background Orbs */}
      <div style={S.bgOrb1}></div>
      <div style={S.bgOrb2}></div>
      <div style={S.bgOrb3}></div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={S.mobileMenuBtn}
        className="mobile-menu-btn"
      >
        <DotsThreeOutline size={24} weight="bold" />
      </button>

      {/* SIDEBAR */}
      <aside style={S.sidebar} className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={S.logoWrapper}>
          <div style={S.logoIcon}><GraduationCap size={24} weight="fill" /></div>
          <span style={S.logoText}>Lancers<span style={S.logoAccent}>Tech</span></span>
        </div>

        <div style={S.teacherBadge}>
          <ChalkboardTeacher size={14} weight="fill" />
          <span>Faculty Dashboard</span>
          <div style={S.liveIndicator}></div>
        </div>

        <nav style={S.nav}>
          <SidebarBtn active={activePage === 'overview'} onClick={() => setActivePage('overview')} icon={<House size={20} />} label="Overview" count={null} />
          <SidebarBtn active={activePage === 'classes'} onClick={() => setActivePage('classes')} icon={<BookOpen size={20} />} label="My Classes" count={totalClasses} />
          <SidebarBtn active={activePage === 'class-attendance'} onClick={() => setActivePage('class-attendance')} icon={<ClipboardText size={20} />} label="Class Attendance" count={null} />
          <SidebarBtn active={activePage === 'grades'} onClick={() => setActivePage('grades')} icon={<GraduationCap size={20} />} label="Grades" count={grades.length} />
          <SidebarBtn active={activePage === 'assignments'} onClick={() => setActivePage('assignments')} icon={<FileText size={20} />} label="Assignments" count={totalAssignments} />
          <SidebarBtn active={activePage === 'timetable'} onClick={() => setActivePage('timetable')} icon={<Clock size={20} />} label="Time Table" count={timetable.length} />
          <SidebarBtn active={activePage === 'pending'} onClick={() => setActivePage('pending')} icon={<UserPlus size={20} />} label="Pending Requests" count={pendingCount} />
          <SidebarBtn active={activePage === 'profile'} onClick={() => setActivePage('profile')} icon={<UserCircle size={20} />} label="My Profile" count={null} />
        </nav>

        <button onClick={onLogout} style={S.logoutBtn} className="logout-btn">
          <SignOut size={20} /> <span>Sign Out</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={S.main} className="main-content">
        <header style={S.header}>
          <div>
            <h1 style={S.title}>Faculty Hub</h1>
            <p style={S.subtitle}>Welcome back, <span style={S.teacherName}>Prof. {user.name}</span></p>
          </div>
          <div style={S.headerActions}>
            <div style={S.dateBadge}>
              <CalendarBlank size={18} /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* OVERVIEW PAGE - WITH GRAPH */}
        {activePage === 'overview' && (
          <div className="animate-fadeIn">
            {/* Stats Grid */}
            <div style={S.statsGrid} className="stats-grid">
              <MetricBox 
                label="Total Courses" 
                value={totalCourses} 
                icon={<BookOpen weight="duotone" />} 
                color="#4f46e5"
                trend="+2 this month"
              />
              <MetricBox 
                label="Students" 
                value={totalStudents} 
                icon={<Users weight="duotone" />} 
                color="#7c3aed"
                trend={`${stats.recent_students.length} recent`}
              />
              <MetricBox 
                label="Classes" 
                value={totalClasses} 
                icon={<ChalkboardTeacher weight="duotone" />} 
                color="#2563eb"
                trend="Real-time"
              />
              <MetricBox 
                label="Assignments" 
                value={totalAssignments} 
                icon={<FileText weight="duotone" />} 
                color="#0891b2"
                trend={`${displayCompletionRate}% progress`}
              />
            </div>

            {/* Chart Card */}
            <div style={S.chartCard}>
              <div style={S.chartHeader}>
                <div>
                  <h3 style={S.chartTitle}>Weekly Activity</h3>
                  <p style={S.chartSubtitle}>Teaching engagement over the last 7 days</p>
                </div>
                <div style={S.chartControls}>
                  <Pulse size={20} color="#4f46e5" weight="duotone" />
                  <span style={S.chartLive}>LIVE</span>
                </div>
              </div>
              <div style={{ height: '300px' }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* Quick Actions and Recent Students */}
            <div style={S.bottomGrid}>
              {/* Quick Actions */}
              <div style={S.quickActionsCard}>
                <h4 style={S.sectionTitle}>Recent Student Enrollments</h4>
                <div style={S.scheduleList}>
                  {stats.recent_students.length > 0 ? stats.recent_students.map((stu, idx) => (
                    <div key={idx} style={S.scheduleItem}>
                      <div style={S.scheduleTime}>{new Date(stu.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                      <div style={S.scheduleInfo}>
                        <span style={S.scheduleCourse}>{stu.name}</span>
                        <span style={S.scheduleRoom}>Joined: {stu.course_title}</span>
                      </div>
                      <div style={S.statusBadge} className="animate-fadeIn" style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', fontSize: '10px' }}>APPROVED</div>
                    </div>
                  )) : (
                    <p style={S.emptySchedule}>No approved students yet</p>
                  )}
                </div>
              </div>

              {/* Upcoming Schedule */}
              <div style={S.scheduleCard}>
                <div style={S.sectionHeader}>
                  <h4 style={S.sectionTitle}>Today's Schedule</h4>
                  <Clock size={16} color="#64748b" />
                </div>
                <div style={S.scheduleList}>
                  {timetable.filter(t => {
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    return t.day_of_week === today;
                  }).slice(0, 3).map((item, idx) => (
                    <div key={idx} style={S.scheduleItem}>
                      <div style={S.scheduleTime}>{item.start_time}</div>
                      <div style={S.scheduleInfo}>
                        <span style={S.scheduleCourse}>{item.course_title}</span>
                        <span style={S.scheduleRoom}>Room {item.room_number || 'TBD'}</span>
                      </div>
                    </div>
                  ))}
                  {timetable.filter(t => {
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    return t.day_of_week === today;
                  }).length === 0 && (
                    <p style={S.emptySchedule}>No classes scheduled today</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Secondary */}
            <div style={S.bottomGrid}>
              <div style={S.quickActionsCard}>
                <h4 style={S.sectionTitle}>Quick Actions</h4>
                <div style={S.actionsGrid}>
                  <button onClick={() => setActivePage('classes')} style={S.primarySmallBtn}>
                    <BookOpen size={18} /> My Classes
                  </button>
                  <button onClick={() => setActivePage('pending')} style={S.primarySmallBtn}>
                    <UserPlus size={18} /> Pending Requests
                  </button>
                  <button onClick={() => setActivePage('grades')} style={S.secondarySmallBtn}>
                    <GraduationCap size={18} /> Update Grades
                  </button>
                  <button onClick={() => setActivePage('assignments')} style={S.secondarySmallBtn}>
                    <FileText size={18} /> New Assignment
                  </button>
                </div>
              </div>
            </div>

            {/* Pending Approvals Alert */}
            {pendingCount > 0 && (
              <div style={S.pendingAlert} className="animate-fadeIn">
                <Warning size={20} color="#f97316" />
                <span>You have <strong>{pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}</strong> to review</span>
                <button onClick={() => setActivePage('pending')} style={S.viewBtn}>View Now →</button>
              </div>
            )}
          </div>
        )}

        {/* MY CLASSES PAGE */}
        {activePage === 'classes' && !selectedClassId ? (
          <div style={S.tableCard} className="table-container animate-fadeIn">
            <div style={S.tableHeader}>
              <div>
                <h2 style={S.tableTitle}>🏫 My Classes</h2>
                <p style={S.tableSubtitle}>Classes assigned to you by the HOD</p>
              </div>
            </div>
            <div style={S.classesGrid}>
              {teacherClasses.map(cls => (
                <div key={cls.id} style={S.classCard}
                  onClick={() => { setSelectedClassId(cls.id); fetchClassCourses(cls.id); }}
                >
                  <div style={S.classCardHeader}>
                    <span style={S.classYearBadge}>{cls.academic_year}</span>
                    <span style={S.classStudentCount}>
                      <Users size={14} /> {cls.student_count || 0}
                    </span>
                  </div>
                  <h3 style={S.className}>{cls.name}</h3>
                  <p style={S.classSection}>Section: {cls.section}</p>
                  <div style={S.classFooter}>
                    <span style={S.classCoursesCount}>
                      <BookOpen size={12} /> {cls.course_count || 0} courses
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {teacherClasses.length === 0 && (
              <div style={S.emptyState}>
                <ChalkboardTeacher size={48} weight="duotone" />
                <p>No classes assigned to you yet. Contact your HOD to get classes assigned.</p>
              </div>
            )}
          </div>
        ) : activePage === 'classes' && selectedClassId ? (
          // CLASS DETAILS VIEW
          <div className="animate-fadeIn">
            <button onClick={() => setSelectedClassId(null)} style={S.backButton}>
              ← Back to Classes
            </button>
            
            <div style={S.tableCard} className="table-container">
              <div style={S.tableHeader}>
                <div>
                  <h2 style={S.tableTitle}>
                    {teacherClasses.find(c => c.id === selectedClassId)?.name}
                  </h2>
                  <p style={S.tableSubtitle}>Manage courses for this class</p>
                </div>
              </div>

              <div style={S.coursesList}>
                <h4 style={S.listSubtitle}>Active Courses</h4>
                {courses.length > 0 ? (
                  <table style={S.table}>
                    <thead>
                      <tr style={S.tableHeadRow}>
                        <th style={S.th}>COURSE TITLE</th>
                        <th style={S.th}>DESCRIPTION</th>
                        <th style={S.th}>STUDENTS</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map(course => (
                        <tr key={course.id} style={S.tableRow}>
                          <td style={S.tdName}>{course.title}</td>
                          <td style={S.td}>{course.description || "—"}</td>
                          <td style={S.td}>{course.enrolled_students || 0}</td>
                          <td style={{ ...S.td, textAlign: 'right' }}>
                            <div style={S.actionGroup}>
                              <button 
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setActivePage('grades');
                                }}
                                style={S.iconBtn}
                                title="Manage Grades"
                              >
                                <GraduationCap size={16} />
                              </button>
                              <button style={S.deleteIconBtn}><Trash size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={S.emptyMessage}>No courses in this class yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* CLASS ATTENDANCE PAGE */}
        {activePage === 'class-attendance' && (
          <div className="animate-fadeIn">
            <ClassAttendance user={user} onBack={() => setActivePage('overview')} />
          </div>
        )}

        {/* GRADES PAGE */}
        {activePage === 'grades' && (
          <div style={S.tableCard} className="table-container animate-fadeIn">
            <div style={S.tableHeader}>
              <div>
                <h2 style={S.tableTitle}>🎓 Student Performance</h2>
                <p style={S.tableSubtitle}>Manage grades and exam results</p>
              </div>
              {selectedCourse && (
                <button onClick={() => setShowGradeModal(true)} style={S.addBtn}>
                  <PlusCircle size={18} /> Add Grade
                </button>
              )}
            </div>
            
            <div style={S.gradesFilter}>
              <select 
                onChange={(e) => {
                  const cid = e.target.value;
                  handleGradesCourseSelect(cid);
                  if (cid) fetchCourseGrades(cid);
                }} 
                style={S.modernSelect}
                value={selectedCourse?.id || ''}
              >
                <option value="">Select a course to view grades</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <>
                <div style={S.gradesSummary}>
                  <div style={S.summaryItem}>
                    <span>Total Students</span>
                    <strong>{students.length}</strong>
                  </div>
                  <div style={S.summaryItem}>
                    <span>Graded</span>
                    <strong>{grades.length}</strong>
                  </div>
                  <div style={S.summaryItem}>
                    <span>Average</span>
                    <strong>
                      {grades.length > 0 
                        ? Math.round(grades.reduce((acc, g) => acc + (g.percentage || 0), 0) / grades.length) 
                        : 0}%
                    </strong>
                  </div>
                </div>

                <table style={S.table}>
                  <thead>
                    <tr style={S.tableHeadRow}>
                      <th style={S.th}>STUDENT</th>
                      <th style={S.th}>EXAM</th>
                      <th style={S.th}>MARKS</th>
                      <th style={S.th}>GRADE</th>
                      <th style={S.th}>DATE</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(g => (
                      <tr key={g.id} style={S.tableRow}>
                        <td style={S.tdName}>{g.student_name}</td>
                        <td style={S.td}><span style={S.examType}>{g.exam_type}</span></td>
                        <td style={S.td}>{g.marks_obtained}/{g.max_marks}</td>
                        <td style={S.td}><span style={S.gradeBadge}>{g.grade_letter}</span></td>
                        <td style={S.td}>{new Date(g.exam_date).toLocaleDateString()}</td>
                        <td style={{ ...S.td, textAlign: 'right' }}>
                          <button style={S.iconBtn}><PencilSimple size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {grades.length === 0 && (
                      <tr>
                        <td colSpan="6" style={S.emptyTableCell}>No grades recorded yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ASSIGNMENTS PAGE */}
        {activePage === 'assignments' && (
          <div style={S.tableCard} className="table-container animate-fadeIn">
            <div style={S.tableHeader}>
              <div>
                <h2 style={S.tableTitle}>📋 Assignments</h2>
                <p style={S.tableSubtitle}>Create and manage assignments</p>
              </div>
              <button onClick={() => setShowCreateAssignmentModal(true)} style={S.addBtn}>
                <PlusCircle size={18} /> New Assignment
              </button>
            </div>
            
            <table style={S.table}>
              <thead>
                <tr style={S.tableHeadRow}>
                  <th style={S.th}>TITLE</th>
                  <th style={S.th}>COURSE</th>
                  <th style={S.th}>DUE DATE</th>
                  <th style={S.th}>SUBMISSIONS</th>
                  <th style={S.th}>STATUS</th>
                  <th style={{...S.th, textAlign:'right'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => {
                  const dueDate = new Date(a.due_date);
                  const today = new Date();
                  const isOverdue = dueDate < today;
                  
                  return (
                    <tr key={a.id} style={S.tableRow}>
                      <td style={S.tdName}>{a.title}</td>
                      <td style={S.td}>{a.course_title}</td>
                      <td style={S.td}>
                        <span style={{...S.dueDate, color: isOverdue ? '#ef4444' : '#166534'}}>
                          {dueDate.toLocaleDateString()}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button 
                          onClick={() => { setSelectedAssignment(a); fetchSubmissions(a.id); setShowSubmissionModal(true); }}
                          style={S.submissionBtn}
                        >
                          View ({a.submission_count || 0})
                        </button>
                      </td>
                      <td style={S.td}>
                        <span style={{...S.statusBadge, background: isOverdue ? '#fee2e2' : '#dcfce7', color: isOverdue ? '#991b1b' : '#166534'}}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td style={{...S.td, textAlign:'right'}}>
                        <div style={S.actionGroup}>
                          <button style={S.iconBtn}><PencilSimple size={16} /></button>
                          <button onClick={() => handleDeleteAssignment(a.id)} style={S.deleteIconBtn}><Trash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan="6" style={S.emptyTableCell}>No assignments created yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TIMETABLE PAGE */}
        {activePage === 'timetable' && (
          <div style={S.tableCard} className="table-container animate-fadeIn">
            <div style={S.tableHeader}>
              <div>
                <h2 style={S.tableTitle}>📅 Academic Schedule</h2>
                <p style={S.tableSubtitle}>Your weekly class timetable</p>
              </div>
            </div>
            
            <div style={S.timetableContainer}>
              {Object.entries(groupTimetableByDay()).map(([day, entries]) => (
                entries.length > 0 && (
                  <div key={day} style={S.daySection}>
                    <h4 style={S.dayHeading}>{day}</h4>
                    {entries.map(entry => (
                      <div key={entry.id} style={S.timetableSlot}>
                        <div>
                          <span style={S.courseTitle}>{entry.course_title}</span>
                          <div style={S.roomInfo}>
                            <Clock size={12} /> {entry.start_time} - {entry.end_time} • Room {entry.room_number || 'TBD'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={S.classBadge}>{entry.class_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
              {timetable.length === 0 && (
                <div style={S.emptyState}>
                  <Clock size={48} weight="duotone" />
                  <p>No timetable entries found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PENDING ENROLLMENT REQUESTS PAGE */}
        {activePage === 'pending' && (
          <div style={S.tableCard} className="animate-fadeIn">
            <div style={S.tableHeader}>
              <div>
                <h2 style={S.tableTitle}>📋 Pending Enrollment Requests</h2>
                <p style={S.tableSubtitle}>Students requesting to enroll in your courses</p>
              </div>
            </div>
            
            {loadingPending ? (
              <div style={S.loadingContainer}>
                <div style={S.loadingSpinner}></div>
                <p>Loading enrollment requests...</p>
              </div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>STUDENT</th>
                    <th style={S.th}>EMAIL</th>
                    <th style={S.th}>COURSE</th>
                    <th style={S.th}>CLASS</th>
                    <th style={S.th}>REQUESTED</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEnrollments.map(enrollment => (
                    <tr key={enrollment.enrollment_id} style={S.tableRow}>
                      <td style={S.tdName}>{enrollment.student_name}</td>
                      <td style={S.td}>{enrollment.student_email}</td>
                      <td style={S.td}><span style={S.examType}>{enrollment.course_title}</span></td>
                      <td style={S.td}>{enrollment.class_name} {enrollment.class_section ? `(${enrollment.class_section})` : ''}</td>
                      <td style={S.td}>{new Date(enrollment.enrolled_at).toLocaleDateString()}</td>
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={S.pendingActions}>
                          <button onClick={() => handleApproveEnrollment(enrollment.enrollment_id)} style={S.approveBtn} className="approve-btn">
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button onClick={() => handleRejectEnrollment(enrollment.enrollment_id)} style={S.rejectBtn} className="reject-btn">
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingEnrollments.length === 0 && (
                    <tr>
                      <td colSpan="6" style={S.emptyTableCell}>No pending enrollment requests</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PROFILE PAGE */}
        {activePage === 'profile' && (
          <div style={S.profileCard} className="animate-fadeIn">
            <div style={S.profileHeader}>
              <div style={S.profileAvatar}>{user.name.charAt(0)}</div>
              <h2 style={S.profileName}>{user.name}</h2>
              <span style={S.profileRole}>Senior Faculty • Computer Science</span>
            </div>
            
            <div style={S.profileStats}>
              <div style={S.profileStatItem}>
                <span>Courses</span>
                <strong>{courses.length}</strong>
              </div>
              <div style={S.profileStatItem}>
                <span>Students</span>
                <strong>{students.length}</strong>
              </div>
              <div style={S.profileStatItem}>
                <span>Classes</span>
                <strong>{teacherClasses.length}</strong>
              </div>
            </div>

            <div style={S.profileInfoGrid}>
              <div style={S.infoItem}>
                <span>Email Address</span>
                <p>{user.email || 'teacher@lancerstech.com'}</p>
              </div>
              <div style={S.infoItem}>
                <span>Designation</span>
                <p style={{textTransform:'capitalize'}}>{user.role || 'Teacher'}</p>
              </div>
              <div style={S.infoItem}>
                <span>Department</span>
                <p>Computer Science</p>
              </div>
              <div style={S.infoItem}>
                <span>Joined</span>
                <p>January 2024</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SUBMISSIONS MODAL */}
      {showSubmissionModal && selectedAssignment && (
        <div style={S.modalOverlay} onClick={() => setShowSubmissionModal(false)}>
          <div style={{...S.modal, width: '900px', maxWidth:'95vw'}} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>{selectedAssignment.title} - Submissions</h3>
              <button onClick={() => setShowSubmissionModal(false)} style={S.modalClose} className="modal-close">×</button>
            </div>
            
            <div style={S.submissionsInfo}>
              <div style={S.infoBadge}>
                <FileText size={14} /> Total: {assignmentSubmissions.length}
              </div>
              <div style={S.infoBadge}>
                <CheckCircle size={14} /> Graded: {assignmentSubmissions.filter(s => s.marks_obtained).length}
              </div>
            </div>

            <table style={S.table}>
              <thead>
                <tr style={S.tableHeadRow}>
                  <th style={S.th}>STUDENT</th>
                  <th style={S.th}>SUBMITTED</th>
                  <th style={S.th}>FILE</th>
                  <th style={S.th}>MARKS</th>
                  <th style={S.th}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {assignmentSubmissions.length === 0 ? (
                  <tr><td colSpan="5" style={S.emptyTableCell}>No submissions yet</td></tr>
                ) : (
                  assignmentSubmissions.map(sub => (
                    <tr key={sub.id} style={S.tableRow}>
                      <td style={S.tdName}>{sub.student_name}</td>
                      <td style={S.td}>{new Date(sub.submitted_at).toLocaleString()}</td>
                      <td style={S.td}>
                        {sub.file_path ? (
                          <span onClick={async () => {
                            try {
                              const response = await fetch(`http://localhost:5000/api/submissions/${sub.id}/download`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'submission_file';
                              a.click();
                            } catch (err) {
                              alert('Download failed');
                            }
                          }} style={S.downloadLink}>
                            Download
                          </span>
                        ) : (
                          <span>Text submission</span>
                        )}
                      </td>
                      <td style={S.td}>
                        {sub.marks_obtained ? (
                          <span style={S.gradedMarks}>{sub.marks_obtained}</span>
                        ) : (
                          <span style={S.notGraded}>Pending</span>
                        )}
                      </td>
                      <td style={S.td}>
                        <button 
                          onClick={() => { setGradingSubmission(sub); setGradeData({ marks_obtained: sub.marks_obtained || '', feedback: sub.feedback || '' }); }}
                          style={S.gradeBtn}
                          className="grade-btn"
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {gradingSubmission && (
        <div style={{...S.modalOverlay, zIndex: 1002}} onClick={() => setGradingSubmission(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>Grade Submission</h3>
            <p style={S.modalSubtitle}>Student: <strong>{gradingSubmission.student_name}</strong></p>
            
            {gradingSubmission.submission_text && (
              <div style={S.submissionTextBlock}>
                <p style={S.submissionLabel}>Submission Text:</p>
                <p>{gradingSubmission.submission_text}</p>
              </div>
            )}

            <form onSubmit={handleGradeSubmission} style={S.modalForm}>
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Marks Obtained (Max: {selectedAssignment?.max_marks || 100})</label>
                <input 
                  type="number" 
                  placeholder="Enter marks" 
                  value={gradeData.marks_obtained} 
                  onChange={e => setGradeData({...gradeData, marks_obtained: e.target.value})} 
                  style={S.input} 
                  required 
                  max={selectedAssignment?.max_marks || 100}
                />
              </div>
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Feedback</label>
                <textarea 
                  placeholder="Provide feedback to student..." 
                  value={gradeData.feedback} 
                  onChange={e => setGradeData({...gradeData, feedback: e.target.value})} 
                  style={{...S.input, height:'80px'}} 
                />
              </div>
              <div style={S.modalActions}>
                <button type="button" onClick={() => setGradingSubmission(null)} style={S.cancelBtn}>Cancel</button>
                <button type="submit" style={S.saveBtn}>Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateAssignmentModal && (
        <div style={S.modalOverlay} onClick={() => setShowCreateAssignmentModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>Create Assignment</h3>
            <form onSubmit={handleCreateAssignment} style={S.modalForm}>
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Course</label>
                <select required value={newAssignment.course_id} onChange={e => setNewAssignment({...newAssignment, course_id: e.target.value})} style={S.input}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Assignment Title</label>
                <input placeholder="e.g., Chapter 5 Exercise" required value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} style={S.input} />
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Description</label>
                <textarea placeholder="Instructions for students..." value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} style={{...S.input, height:'80px'}} />
              </div>
              
              <div style={S.row}>
                <div style={S.flex1}>
                  <label style={S.inputLabel}>Due Date</label>
                  <input type="date" required value={newAssignment.due_date} onChange={e => setNewAssignment({...newAssignment, due_date: e.target.value})} style={S.input} />
                </div>
                <div style={S.flex1}>
                  <label style={S.inputLabel}>Max Marks</label>
                  <input type="number" required value={newAssignment.max_marks} onChange={e => setNewAssignment({...newAssignment, max_marks: e.target.value})} style={S.input} />
                </div>
              </div>
              
              <div style={S.modalActions}>
                <button type="button" onClick={() => setShowCreateAssignmentModal(false)} style={S.cancelBtn}>Cancel</button>
                <button type="submit" style={S.saveBtn}>Create Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COURSE AND CLASS MODALS REMOVED - Only HOD can create */}

      {/* GRADE MODAL */}
      {showGradeModal && (
        <div style={S.modalOverlay} onClick={() => setShowGradeModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>Record Grade</h3>
            <p style={S.modalSubtitle}>Course: <strong>{selectedCourse?.title}</strong></p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedCourse) {
                alert('Please select a course first!');
                return;
              }
              try {
                const response = await fetch('http://localhost:5000/api/grades', {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    student_id: newGrade.student_id,
                    course_id: selectedCourse.id,
                    exam_type: newGrade.exam_type,
                    marks_obtained: newGrade.marks_obtained,
                    max_marks: newGrade.max_marks,
                    exam_date: newGrade.exam_date,
                    remarks: newGrade.remarks
                  })
                });
                const data = await response.json();
                if (data.success) {
                  alert('Grade saved successfully!');
                  setShowGradeModal(false);
                  setNewGrade({ student_id: '', exam_type: 'midterm', marks_obtained: '', max_marks: 100, exam_date: '', remarks: '' });
                  fetchCourseGrades(selectedCourse.id);
                } else {
                  alert('Error: ' + data.message);
                }
              } catch (error) {
                console.error('Grade submission error:', error);
                alert('Network error');
              }
            }} style={S.modalForm}>
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Student</label>
                <select required value={newGrade.student_id} onChange={e => setNewGrade({...newGrade, student_id: e.target.value})} style={S.input}>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Exam Type</label>
                <select required value={newGrade.exam_type} onChange={e => setNewGrade({...newGrade, exam_type: e.target.value})} style={S.input}>
                  <option value="midterm">Midterm Exam</option>
                  <option value="final">Final Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              
              <div style={S.row}>
                <div style={S.flex1}>
                  <label style={S.inputLabel}>Marks Obtained</label>
                  <input type="number" required value={newGrade.marks_obtained} onChange={e => setNewGrade({...newGrade, marks_obtained: e.target.value})} style={S.input} />
                </div>
                <div style={S.flex1}>
                  <label style={S.inputLabel}>Max Marks</label>
                  <input type="number" required value={newGrade.max_marks} onChange={e => setNewGrade({...newGrade, max_marks: e.target.value})} style={S.input} />
                </div>
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Exam Date</label>
                <input type="date" required value={newGrade.exam_date} onChange={e => setNewGrade({...newGrade, exam_date: e.target.value})} style={S.input} />
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Remarks (Optional)</label>
                <textarea placeholder="Additional comments..." value={newGrade.remarks} onChange={e => setNewGrade({...newGrade, remarks: e.target.value})} style={{...S.input, height:'60px'}} />
              </div>
              
              <div style={S.modalActions}>
                <button type="button" onClick={() => setShowGradeModal(false)} style={S.cancelBtn}>Cancel</button>
                <button type="submit" style={S.saveBtn}>Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

// ==================== PROFESSIONAL STYLES ====================
const S = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },

  // Animated Background Orbs
  bgOrb1: {
    position: 'fixed',
    width: '700px',
    height: '700px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.12), transparent 70%)',
    top: '-250px',
    left: '-250px',
    zIndex: 0,
    animation: 'float 25s infinite alternate ease-in-out',
  },

  bgOrb2: {
    position: 'fixed',
    width: '550px',
    height: '550px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.12), transparent 70%)',
    bottom: '-200px',
    right: '-200px',
    zIndex: 0,
    animation: 'float 30s infinite alternate ease-in-out',
  },

  bgOrb3: {
    position: 'fixed',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.1), transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 0,
    animation: 'float 20s infinite alternate ease-in-out',
  },

  mobileMenuBtn: {
    position: 'fixed',
    top: '16px',
    left: '16px',
    zIndex: 1001,
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    cursor: 'pointer',
    display: 'none',
    boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
  },

  sidebar: {
    width: '280px',
    background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 20px',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '10px 0 30px -10px rgba(0,0,0,0.2)',
  },

  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '0 8px',
  },

  logoIcon: {
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    padding: '10px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
  },

  logoText: {
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },

  logoAccent: {
    color: '#818cf8',
    marginLeft: '2px',
  },

  teacherBadge: {
    background: 'rgba(79, 70, 229, 0.2)',
    borderRadius: '30px',
    padding: '8px 16px',
    margin: '0 8px 24px 8px',
    fontSize: '12px',
    color: '#a5b4fc',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
  },

  liveIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 1.5s infinite',
    position: 'absolute',
    right: '12px',
  },

  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  navBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'left',
    fontSize: '15px',
    position: 'relative',
    transition: 'all 0.3s ease',
  },

  navBtnActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    color: '#fff',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
  },

  navBadge: {
    background: '#4f46e5',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '30px',
    fontSize: '11px',
    fontWeight: '700',
    marginLeft: 'auto',
  },

  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    width: '4px',
    height: '50%',
    background: 'linear-gradient(180deg, #4f46e5, #818cf8)',
    borderRadius: '0 4px 4px 0',
  },

  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 18px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    cursor: 'pointer',
    borderRadius: '16px',
    fontWeight: '700',
    fontSize: '15px',
    marginTop: '20px',
    transition: 'all 0.3s ease',
  },

  main: {
    flex: 1,
    padding: '48px',
    marginLeft: '280px',
    marginRight: '0',
    overflowY: 'auto',
    zIndex: 5,
    position: 'relative',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
  },

  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },

  title: {
    fontSize: '2.2rem',
    fontWeight: '800',
    margin: 0,
    background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },

  subtitle: {
    color: '#64748b',
    marginTop: '6px',
    fontSize: '1rem',
    fontWeight: '500',
  },

  teacherName: {
    color: '#4f46e5',
    fontWeight: '700',
  },

  dateBadge: {
    background: '#fff',
    padding: '12px 24px',
    borderRadius: '30px',
    border: '1px solid #e2e8f0',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)',
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },

  metricCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05)',
  },

  metricIconWrapper: (color) => ({
    width: '52px',
    height: '52px',
    borderRadius: '18px',
    background: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color,
  }),

  metricContent: {
    flex: 1,
  },

  metricLabel: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: '0.02em',
  },

  metricValue: {
    margin: '4px 0 0',
    fontSize: '1.8rem',
    fontWeight: '800',
  },

  metricTrend: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#22c55e',
    background: '#dcfce7',
    padding: '2px 8px',
    borderRadius: '30px',
    display: 'inline-block',
    marginTop: '4px',
  },

  // Chart Card
  chartCard: {
    background: '#fff',
    padding: '28px',
    borderRadius: '32px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
    marginBottom: '32px',
  },

  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },

  chartTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1.2rem',
    color: '#0f172a',
  },

  chartSubtitle: {
    margin: '4px 0 0',
    fontSize: '0.85rem',
    color: '#64748b',
  },

  chartControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f1f5f9',
    padding: '6px 14px',
    borderRadius: '30px',
  },

  chartLive: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#4f46e5',
    letterSpacing: '0.05em',
  },

  // Bottom Grid
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },

  quickActionsCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
  },

  scheduleCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  sectionTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1rem',
    color: '#0f172a',
  },

  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },

  primarySmallBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: '16px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },

  secondarySmallBtn: {
    background: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    padding: '12px',
    borderRadius: '16px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },

  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  scheduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },

  scheduleTime: {
    background: '#f1f5f9',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#0f172a',
  },

  scheduleInfo: {
    flex: 1,
  },

  scheduleCourse: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '0.9rem',
    display: 'block',
  },

  scheduleRoom: {
    fontSize: '0.75rem',
    color: '#64748b',
  },

  emptySchedule: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '20px 0',
  },

  // Pending Alert
  pendingAlert: {
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '20px',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#92400e',
  },

  viewBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },

  // Classes Grid
  tableCard: {
    background: '#fff',
    borderRadius: '32px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },

  tableHeader: {
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
  },

  tableTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1.2rem',
    color: '#0f172a',
  },

  tableSubtitle: {
    margin: '4px 0 0',
    fontSize: '0.85rem',
    color: '#64748b',
  },

  addBtn: {
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 20px -8px rgba(79, 70, 229, 0.5)',
  },

  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    padding: '24px',
  },

  classCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '20px',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },

  classCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },

  classYearBadge: {
    background: '#e0f2fe',
    color: '#0369a1',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '600',
  },

  classStudentCount: {
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
  },

  className: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#0f172a',
  },

  classSection: {
    margin: '0 0 12px 0',
    color: '#64748b',
    fontSize: '0.9rem',
  },

  classFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
  },

  classCoursesCount: {
    fontSize: '0.8rem',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
    '& p': {
      margin: '16px 0',
    },
  },

  backButton: {
    margin: '0 0 20px 24px',
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1rem',
    fontWeight: '600',
  },

  coursesList: {
    padding: '0 24px 24px',
  },

  listSubtitle: {
    margin: '0 0 16px 0',
    color: '#334155',
    fontWeight: '700',
    fontSize: '0.95rem',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '600px',
  },

  tableHeadRow: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },

  th: {
    padding: '16px 28px',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: '0.05em',
  },

  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s ease',
  },

  tdName: {
    padding: '20px 28px',
    fontWeight: '700',
    color: '#0f172a',
    fontSize: '0.95rem',
  },

  td: {
    padding: '20px 28px',
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '500',
  },

  emptyMessage: {
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: '20px',
    textAlign: 'center',
  },

  actionGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },

  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },

  deleteIconBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
  },

  // Grades
  gradesFilter: {
    padding: '20px 28px',
    borderBottom: '1px solid #f1f5f9',
  },

  modernSelect: {
    padding: '12px 16px',
    borderRadius: '16px',
    border: '2px solid #f1f5f9',
    background: '#f8fafc',
    outline: 'none',
    fontWeight: '600',
    color: '#0f172a',
    cursor: 'pointer',
    width: '350px',
    maxWidth: '100%',
  },

  gradesSummary: {
    display: 'flex',
    gap: '24px',
    padding: '20px 28px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },

  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    '& span': {
      fontSize: '0.8rem',
      color: '#64748b',
      fontWeight: '600',
    },
    '& strong': {
      fontSize: '1.2rem',
      color: '#0f172a',
      fontWeight: '800',
    },
  },

  examType: {
    background: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'capitalize',
  },

  gradeBadge: {
    background: '#e0e7ff',
    color: '#4338ca',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: '800',
    fontSize: '0.8rem',
  },

  emptyTableCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
  },

  // Assignments
  dueDate: {
    fontWeight: '600',
    fontSize: '0.9rem',
  },

  statusBadge: {
    padding: '4px 10px',
    borderRadius: '30px',
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    display: 'inline-block',
  },

  submissionBtn: {
    background: '#e0e7ff',
    color: '#4338ca',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Timetable
  timetableContainer: {
    padding: '0 32px 32px',
  },

  daySection: {
    marginBottom: '28px',
  },

  dayHeading: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #f1f5f9',
  },

  timetableSlot: {
    background: '#f8fafc',
    padding: '16px 24px',
    borderRadius: '18px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },

  courseTitle: {
    fontWeight: '700',
    color: '#0f172a',
    display: 'block',
    marginBottom: '4px',
  },

  roomInfo: {
    fontSize: '0.8rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  classBadge: {
    background: '#0f172a',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },

  // Pending
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    gap: '16px',
  },

  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  pendingActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },

  approveBtn: {
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '30px',
    fontWeight: '700',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 10px -2px rgba(34, 197, 94, 0.3)',
  },

  rejectBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '30px',
    fontWeight: '700',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 10px -2px rgba(239, 68, 68, 0.3)',
  },

  // Profile
  profileCard: {
    background: '#fff',
    borderRadius: '32px',
    border: '1px solid #e2e8f0',
    padding: '40px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },

  profileHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },

  profileAvatar: {
    width: '100px',
    height: '100px',
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    color: '#fff',
    borderRadius: '32px',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '42px',
    fontWeight: '800',
    boxShadow: '0 15px 30px -10px rgba(79, 70, 229, 0.3)',
  },

  profileName: {
    fontSize: '1.5rem',
    fontWeight: '800',
    margin: '0 0 8px',
    color: '#0f172a',
  },

  profileRole: {
    background: '#f1f5f9',
    color: '#64748b',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '700',
    display: 'inline-block',
  },

  profileStats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '24px 0',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '24px',
  },

  profileStatItem: {
    textAlign: 'center',
    '& span': {
      display: 'block',
      fontSize: '0.8rem',
      color: '#64748b',
      marginBottom: '4px',
    },
    '& strong': {
      fontSize: '1.4rem',
      color: '#4f46e5',
    },
  },

  profileInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },

  infoItem: {
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
    '& span': {
      fontSize: '0.75rem',
      fontWeight: '700',
      color: '#64748b',
      display: 'block',
      marginBottom: '4px',
    },
    '& p': {
      margin: 0,
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#0f172a',
    },
  },

  // Modals
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },

  modal: {
    background: '#fff',
    padding: '40px',
    borderRadius: '40px',
    width: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 50px 70px -20px rgba(0,0,0,0.3)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },

  modalTitle: {
    fontWeight: '800',
    fontSize: '1.5rem',
    color: '#0f172a',
    letterSpacing: '-0.02em',
    margin: 0,
  },

  modalSubtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    marginBottom: '20px',
  },

  modalClose: {
    background: '#f1f5f9',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },

  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  inputLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#475569',
    marginLeft: '4px',
  },

  input: {
    padding: '14px 18px',
    borderRadius: '20px',
    border: '2px solid #f1f5f9',
    outline: 'none',
    width: '100%',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  row: {
    display: 'flex',
    gap: '16px',
  },

  flex1: {
    flex: 1,
  },

  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
  },

  cancelBtn: {
    flex: 1,
    padding: '14px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: '700',
    color: '#64748b',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
  },

  saveBtn: {
    flex: 2,
    padding: '14px',
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 20px -8px rgba(79, 70, 229, 0.5)',
  },

  // Submission modal extras
  submissionsInfo: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },

  infoBadge: {
    background: '#f1f5f9',
    padding: '8px 16px',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  downloadLink: {
    color: '#4f46e5',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },

  gradedMarks: {
    fontWeight: '700',
    color: '#166534',
  },

  notGraded: {
    color: '#ef4444',
    fontSize: '0.85rem',
  },

  gradeBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  submissionTextBlock: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '20px',
    marginBottom: '20px',
    maxHeight: '200px',
    overflowY: 'auto',
  },

  submissionLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#64748b',
    marginBottom: '8px',
  },
};

// Helper component for sidebar buttons
const SidebarBtn = ({ active, icon, label, count, onClick }) => (
  <button 
    onClick={onClick} 
    className={`nav-btn ${active ? 'active' : ''}`}
    style={{
      ...S.navBtn,
      ...(active ? S.navBtnActive : {}),
    }}
  >
    {icon}
    <span style={{flex: 1, textAlign: 'left'}}>{label}</span>
    {count > 0 && <span style={S.navBadge}>{count}</span>}
    {active && <div style={S.activeIndicator}></div>}
  </button>
);

// MetricBox component
const MetricBox = ({ label, value, icon, color, trend }) => (
  <div style={S.metricCard} className="metric-card">
    <div style={S.metricIconWrapper(color)}>
      {icon}
    </div>
    <div style={S.metricContent}>
      <p style={S.metricLabel}>{label}</p>
      <h2 style={S.metricValue}>{value}</h2>
      {trend && <span style={S.metricTrend}>{trend}</span>}
    </div>
  </div>
);

// Inject global styles
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @keyframes float {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(3%, 3%) scale(1.05); }
  }
  
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .metric-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -10px rgba(79, 70, 229, 0.15);
    border-color: #cbd5e1;
  }

  tr:hover {
    background: #f8fafc;
  }

  .class-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 25px -10px rgba(79, 70, 229, 0.1);
    border-color: #a5b4fc;
  }

  .add-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px -8px rgba(79, 70, 229, 0.6);
  }

  .primary-small-btn:hover {
    background: #1e293b;
    transform: translateY(-2px);
  }

  .secondary-small-btn:hover {
    border-color: #4f46e5;
    color: #4f46e5;
    transform: translateY(-2px);
  }

  .approve-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -3px rgba(34, 197, 94, 0.4);
  }

  .reject-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -3px rgba(239, 68, 68, 0.4);
  }

  .submission-btn:hover {
    background: #c7d2fe;
    transform: translateY(-2px);
  }

  .grade-btn:hover {
    background: #1e293b;
    transform: translateY(-2px);
  }

  input:focus, select:focus, textarea:focus {
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
    outline: none !important;
  }

  .cancel-btn:hover {
    background: #e2e8f0;
  }

  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 25px -8px rgba(79, 70, 229, 0.6);
  }

  .modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
  
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2) !important;
  }

  .nav-btn:hover:not(.active) {
    background: rgba(79, 70, 229, 0.1) !important;
    color: #fff !important;
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease forwards;
  }

  /* Responsive handled by responsive.css */
`;
document.head.appendChild(style);

export default TeacherDashboard;
