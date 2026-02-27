import { useState, useEffect, useRef } from 'react'
import '../responsive.css'
import {
  House, BookOpen, Clock, CheckCircle, GraduationCap,
  ChartLineUp, SignOut, CalendarBlank,
  ArrowLeft, User, Phone, VideoCamera, DotsThreeVertical, Buildings, 
  CaretRight, IdentificationCard, DotsThreeOutline, PlusCircle, ClipboardText, FileText, Upload, X,
  ChartLine, Users, Star, Warning, Bell, TrendUp, Pulse
} from "@phosphor-icons/react";
import { Chart } from "chart.js/auto";
import LabPlayer from './LabPlayer';

function StudentDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('courses')
  const [registrationTab, setRegistrationTab] = useState('class')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [courses, setCourses] = useState([])
  const [attendanceStats, setAttendanceStats] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [grades, setGrades] = useState([])
  const [timetable, setTimetable] = useState([])
  const [progressReports, setProgressReports] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [availableClasses, setAvailableClasses] = useState([])
  const [registering, setRegistering] = useState(false)
  const [availableCourses, setAvailableCourses] = useState([])
  const [enrolling, setEnrolling] = useState(false)
  
  // Chart reference
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  
  // Class Subjects State
  const [myClassSubjects, setMyClassSubjects] = useState([])
  const [myClassInfo, setMyClassInfo] = useState(null)

  // Assignment State
  const [assignments, setAssignments] = useState([])
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedLab, setSelectedLab] = useState(null)
  const [availableLabs, setAvailableLabs] = useState([])

  const token = sessionStorage.getItem('token')

  useEffect(() => {
    fetchCourses(); fetchAttendance(); fetchGrades();
    fetchTimetable(); fetchProgressReports();
    fetchAvailableClasses(); fetchStudentAssignments();
    fetchLabs();
  }, [])

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/labs', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setAvailableLabs(data.labs || []);
    } catch (error) { console.error('Error fetching labs:', error); }
  }

  // Chart initialization for overview
  useEffect(() => {
    if (chartRef.current && activePage === "courses" && attendanceLogs.length > 0) {
      if (chartInstance.current) chartInstance.current.destroy();
      
      // Prepare weekly attendance data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = days.map((day, index) => {
        const dayLogs = attendanceLogs.filter(log => {
          const logDate = new Date(log.attendance_date);
          return logDate.getDay() === index + 1; // Monday is 1
        });
        const present = dayLogs.filter(l => l.status === 'present').length;
        const total = dayLogs.length || 1;
        return Math.round((present / total) * 100);
      });

      chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: days,
          datasets: [
            { 
              label: 'Attendance %', 
              data: weeklyData, 
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
              max: 100,
              ticks: { callback: (value) => value + '%' }
            }, 
            x: { grid: { display: false } } 
          },
          animation: { duration: 1000, easing: 'easeInOutQuart' }
        }
      });
    }
  }, [activePage, attendanceLogs]);

  // Refetch available courses when enrolled courses change
  useEffect(() => {
    if (courses.length >= 0) {
      fetchAvailableCourses()
    }
  }, [courses])

  // --- API Functions (Logic Preserved) ---
  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses/my-enrollments', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json(); if (data.success) setCourses(data.enrollments || [])
    } catch (error) { console.error(error) }
  }

  const fetchAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance/my-attendance', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json(); 
      console.log('Attendance API response:', data);
      if (data.success) { 
        setAttendanceStats(data.stats || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 }); 
        setAttendanceLogs(data.records || []);
      }
    } catch (error) { console.error('Attendance fetch error:', error) }
  }

  const fetchGrades = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/grades/my-grades', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json(); if (data.success) setGrades(data.grades || [])
    } catch (error) { console.error(error) }
  }


  const fetchTimetable = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/timetables/student-timetable', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json(); if (data.success) setTimetable(data.timetable || [])
    } catch (error) { console.error(error) }
  }

  const fetchProgressReports = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/progress/my-progress', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json(); if (data.success) setProgressReports(data.reports || [])
    } catch (error) { console.error(error) }
  }

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes/available', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json(); if (data.success) setAvailableClasses(data.classes || [])
      
      // Auto-detect compatibility: if registered in a class, fetch its courses
      if (data.success && data.classes) {
        const registeredClass = data.classes.find(c => c.is_registered > 0);
        if (registeredClass) {
          setMyClassInfo(registeredClass);
          fetchClassSubjects(registeredClass.id);
        }
      }
    } catch (error) { console.error(error) }
  }

  const fetchClassSubjects = async (classId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setMyClassSubjects(data.courses || []);
    } catch (error) { console.error(error); }
  }

  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        // Filter out courses student is already enrolled in
        const enrolledIds = courses.map(c => c.id)
        const available = data.courses.filter(c => !enrolledIds.includes(c.id))
        setAvailableCourses(available)
      }
    } catch (error) { console.error(error) }
  }

  const handleEnrollCourse = async (courseId) => {
    if (!window.confirm('Enroll in this course?')) return
    setEnrolling(true)
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        alert('✅ Successfully enrolled in course!')
        fetchCourses()  // Refresh enrolled courses
      } else {
        alert('❌ ' + data.message)
      }
    } catch (error) {
      alert('❌ Enrollment failed')
      console.error(error)
    } finally {
      setEnrolling(false)
    }
  }

  const handleRegisterClass = async (classId) => {
    setRegistering(true)
    try {
      const response = await fetch('http://localhost:5000/api/classes/register', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId })
      })
      const data = await response.json()
      if (data.success) { alert('✅ Successfully registered!'); fetchAvailableClasses(); }
    } catch (error) { alert('❌ Error'); } finally { setRegistering(false) }
  }

  // --- ASSIGNMENT FUNCTIONS ---
  const fetchStudentAssignments = async () => {
    if (courses.length === 0) return;
    
    let allAssignments = [];
    for (const course of courses) {
      try {
        const response = await fetch(`http://localhost:5000/api/submissions/course/${course.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success) {
          const courseAssignments = data.assignments.map(a => ({...a, course_title: course.title, teacher_name: course.teacher_name}));
          allAssignments = [...allAssignments, ...courseAssignments];
        }
      } catch (e) { console.error(e) }
    }
    setAssignments(allAssignments);
  }

  // Trigger fetch when courses change
  useEffect(() => {
    if(courses.length > 0) fetchStudentAssignments();
  }, [courses]);

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if(!selectedAssignment) return;

    const formData = new FormData();
    formData.append('submission_text', submissionText);
    if(submissionFile) formData.append('file', submissionFile);

    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if(data.success) {
        alert('✅ Assignment Submitted!');
        setShowSubmitModal(false);
        setSubmissionText('');
        setSubmissionFile(null);
        fetchStudentAssignments(); // Refresh status
      } else {
        alert('❌ ' + data.message);
      }
    } catch(err) { console.error(err); alert('failed'); }
  }

  const groupTimetableByDay = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const grouped = {}; days.forEach(day => grouped[day] = [])
    timetable.forEach(entry => { if (grouped[entry.day_of_week]) grouped[entry.day_of_week].push(entry) })
    return grouped
  }

  // Calculate GPA from grades
  const calculateGPA = () => {
    if (!grades || grades.length === 0) return 'N/A';
    
    let totalPoints = 0;
    let totalGrades = 0;
    
    grades.forEach(courseGrade => {
      if (courseGrade.grades && courseGrade.grades.length > 0) {
        courseGrade.grades.forEach(grade => {
          const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0
          };
          const points = gradePoints[grade.grade_letter] || 0;
          totalPoints += points;
          totalGrades++;
        });
      }
    });
    
    if (totalGrades === 0) return 'N/A';
    return (totalPoints / totalGrades).toFixed(2);
  };

  // Calculate total assignments
  const totalAssignments = assignments.length;
  const pendingAssignments = assignments.filter(a => !a.marks_obtained && !a.submitted_at).length;
  const completedAssignments = assignments.filter(a => a.marks_obtained).length;


  const renderContent = () => {
    switch (activePage) {
      case 'courses':
        return (
          <div style={S.overviewContainer} className="animate-fadeIn">
            {/* Stats Grid */}
            <div style={S.statsGrid} className="stats-grid">
              <MetricBox 
                label="Enrolled Subjects" 
                value={courses.length} 
                icon={<BookOpen weight="duotone" />} 
                color="#4f46e5"
                trend={`${myClassSubjects.length} class subjects`}
              />
              <MetricBox 
                label="Attendance" 
                value={attendanceStats.percentage ? `${attendanceStats.percentage}%` : 'N/A'} 
                icon={<CheckCircle weight="duotone" />} 
                color="#10b981"
                trend={`${attendanceStats.present || 0} present`}
              />
              <MetricBox 
                label="GPA" 
                value={calculateGPA()} 
                icon={<ChartLineUp weight="duotone" />} 
                color="#8b5cf6"
                trend="Current semester"
              />
              <MetricBox 
                label="Assignments" 
                value={`${completedAssignments}/${totalAssignments}`} 
                icon={<FileText weight="duotone" />} 
                color="#f59e0b"
                trend={`${pendingAssignments} pending`}
              />
            </div>

            {/* Chart Card */}
            <div style={S.chartCard}>
              <div style={S.chartHeader}>
                <div>
                  <h3 style={S.chartTitle}>Weekly Attendance Trend</h3>
                  <p style={S.chartSubtitle}>Your attendance percentage over the last 7 days</p>
                </div>
                <div style={S.chartControls}>
                  <Pulse size={20} color="#4f46e5" weight="duotone" />
                  <span style={S.chartLive}>LIVE</span>
                </div>
              </div>
              <div style={{ height: '280px' }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* Class Info & Quick Actions */}
            {myClassInfo ? (
              <div style={S.classInfoCard}>
                <div style={S.classInfoHeader}>
                  <div>
                    <h3 style={S.classInfoTitle}>My Class: {myClassInfo.name}</h3>
                    <p style={S.classInfoSubtitle}>Section {myClassInfo.section} • Academic Year {myClassInfo.academic_year}</p>
                  </div>
                  <div style={S.classBadge}>Active</div>
                </div>
                
                <div style={S.classSubjectsGrid}>
                  {myClassSubjects.slice(0, 3).map(sub => (
                    <div key={sub.id} style={S.subjectPill}>
                      <BookOpen size={14} color="#4f46e5" />
                      <span>{sub.title}</span>
                    </div>
                  ))}
                  {myClassSubjects.length > 3 && (
                    <div style={S.subjectPill}>+{myClassSubjects.length - 3} more</div>
                  )}
                </div>

                <button 
                  onClick={() => setActivePage('timetable')}
                  style={S.viewScheduleBtn}
                >
                  View Full Schedule <CaretRight size={16} />
                </button>
              </div>
            ) : (
              <div style={S.alertCard}>
                <Warning size={24} color="#f97316" />
                <div style={S.alertContent}>
                  <h4 style={S.alertTitle}>You are not assigned to a class</h4>
                  <p style={S.alertText}>Please register for your class to see your schedule and subjects.</p>
                </div>
                <button 
                  onClick={() => setActivePage('registration')}
                  style={S.alertBtn}
                >
                  Register Now
                </button>
              </div>
            )}

            {/* Recent Activity */}
            <div style={S.recentActivityCard}>
              <div style={S.recentHeader}>
                <h4 style={S.recentTitle}>Recent Activity</h4>
                <Bell size={18} color="#64748b" />
              </div>
              <div style={S.activityList}>
                {attendanceLogs.slice(0, 3).map((log, i) => (
                  <div key={i} style={S.activityItem}>
                    <div style={S.activityDot}></div>
                    <div style={S.activityContent}>
                      <span style={S.activityCourse}>{log.course_name}</span>
                      <span style={S.activityDate}>{new Date(log.attendance_date).toLocaleDateString()}</span>
                    </div>
                    <span style={{
                      ...S.activityStatus,
                      background: log.status === 'present' ? '#dcfce7' : log.status === 'late' ? '#fed7aa' : '#fee2e2',
                      color: log.status === 'present' ? '#166534' : log.status === 'late' ? '#9a3412' : '#991b1b'
                    }}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'course-detail':
        return (
          <div className="animate-fadeIn">
            <button onClick={() => setActivePage('courses')} style={S.backBtn}>
              <ArrowLeft weight="bold" /> Back to Courses
            </button>
            <div style={S.detailCard}>
              <h2 style={S.detailTitle}>{selectedCourse?.title}</h2>
              <p style={S.detailDesc}>{selectedCourse?.description}</p>
              <div style={S.detailInstructor}>
                <User size={20} weight="fill" color="#4f46e5" />
                <div>
                  <strong>Lead Instructor:</strong> {selectedCourse?.teacher_name}
                </div>
              </div>
            </div>
          </div>
        )

      case 'attendance':
        return (
          <div className="animate-fadeIn">
            {/* Stats Cards */}
            <div style={S.attendanceStatsGrid}>
              <div style={S.attendanceStatCard}>
                <div style={S.statLabel}>TOTAL CLASSES</div>
                <div style={S.statValue}>{attendanceStats.total || 0}</div>
              </div>
              <div style={S.attendanceStatCard}>
                <div style={{...S.statLabel, color: '#10b981'}}>PRESENT</div>
                <div style={{...S.statValue, color: '#10b981'}}>{attendanceStats.present || 0}</div>
              </div>
              <div style={S.attendanceStatCard}>
                <div style={{...S.statLabel, color: '#ef4444'}}>ABSENT</div>
                <div style={{...S.statValue, color: '#ef4444'}}>{attendanceStats.absent || 0}</div>
              </div>
              <div style={S.attendanceStatCard}>
                <div style={{...S.statLabel, color: '#3b82f6'}}>PERCENTAGE</div>
                <div style={{...S.statValue, color: '#3b82f6'}}>{attendanceStats.percentage || 0}%</div>
              </div>
            </div>

            {/* Attendance Table */}
            <div style={S.tableCard}>
              <div style={S.tableHeader}>
                <h3 style={S.tableTitle}>Attendance Records</h3>
              </div>
              <div style={S.tableContainer} className="table-container">
                <table style={S.table}>
                  <thead>
                    <tr style={S.tableHeadRow}>
                      <th style={S.th}>DATE</th>
                      <th style={S.th}>COURSE</th>
                      <th style={S.th}>CLASS</th>
                      <th style={{...S.th, textAlign: 'right'}}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.length === 0 ? (
                      <tr><td colSpan="4" style={S.emptyTableCell}>No attendance records found</td></tr>
                    ) : (
                      attendanceLogs.map((log, i) => (
                        <tr key={i} style={S.tableRow}>
                          <td style={S.tdName}>{new Date(log.attendance_date).toLocaleDateString()}</td>
                          <td style={S.td}>{log.course_name}</td>
                          <td style={S.td}>{log.class_name}</td>
                          <td style={{...S.td, textAlign: 'right'}}>
                            <span style={{
                              ...S.statusBadge,
                              background: log.status === 'present' ? '#dcfce7' : log.status === 'late' ? '#fed7aa' : '#fee2e2',
                              color: log.status === 'present' ? '#166534' : log.status === 'late' ? '#9a3412' : '#991b1b'
                            }}>
                              {log.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'grades':
        return (
          <div className="animate-fadeIn">
            <h2 style={S.sectionTitle}>🎓 Examination Results</h2>
            <div style={S.gradesSummary}>
              <div style={S.summaryItem}>
                <span>GPA</span>
                <strong>{calculateGPA()}</strong>
              </div>
              <div style={S.summaryItem}>
                <span>Courses</span>
                <strong>{grades.length}</strong>
              </div>
              <div style={S.summaryItem}>
                <span>Grades</span>
                <strong>{grades.reduce((acc, g) => acc + (g.grades?.length || 0), 0)}</strong>
              </div>
            </div>

            {grades.map(cg => (
              <div key={cg.course_id} style={S.tableCard}>
                <div style={S.tableHeader}>
                  <h3 style={S.tableTitle}>{cg.course_title}</h3>
                </div>
                <div style={S.tableContainer} className="table-container">
                  <table style={S.table}>
                    <thead>
                      <tr style={S.tableHeadRow}>
                        <th style={S.th}>EXAM TYPE</th>
                        <th style={S.th}>MARKS</th>
                        <th style={{...S.th, textAlign: 'right'}}>GRADE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cg.grades.map(g => (
                        <tr key={g.id} style={S.tableRow}>
                          <td style={S.tdName}>{g.exam_type}</td>
                          <td style={S.td}>{g.marks_obtained} / {g.max_marks}</td>
                          <td style={{...S.td, textAlign: 'right'}}>
                            <span style={S.gradeBadge}>{g.grade_letter}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )


      case 'registration':
        return (
          <div className="animate-fadeIn">
            <h2 style={S.sectionTitle}>📝 Registration Center</h2>
            
            {/* Tabs */}
            <div style={S.tabContainer}>
              <button 
                onClick={() => setRegistrationTab('class')}
                style={{
                  ...S.tabBtn,
                  color: registrationTab === 'class' ? '#0f172a' : '#94a3b8',
                  borderBottom: registrationTab === 'class' ? '3px solid #4f46e5' : '3px solid transparent',
                }}
              >
                Class Registration
              </button>
              <button 
                onClick={() => setRegistrationTab('courses')}
                style={{
                  ...S.tabBtn,
                  color: registrationTab === 'courses' ? '#0f172a' : '#94a3b8',
                  borderBottom: registrationTab === 'courses' ? '3px solid #4f46e5' : '3px solid transparent',
                }}
              >
                Browse All Courses
              </button>
            </div>

            {registrationTab === 'class' ? (
              /* CLASS REGISTRATION TAB */
              availableClasses.length === 0 ? (
                <div style={S.emptyState}>
                  <Buildings size={48} weight="duotone" color="#94a3b8" />
                  <p>No classes available for registration.</p>
                </div>
              ) : (
                <div style={S.classesGrid}>
                  {availableClasses.map(cls => (
                    <div key={cls.id} style={S.classCard}>
                      <h3 style={S.className}>{cls.name}</h3>
                      <p style={S.classInfo}>Section: {cls.section}</p>
                      <p style={S.classTeacher}>
                        <User size={14} /> {cls.teacher_name || 'TBD'}
                      </p>
                      <button 
                        onClick={() => handleRegisterClass(cls.id)} 
                        disabled={cls.is_registered || registering} 
                        style={{
                          ...S.registerBtn,
                          opacity: (cls.is_registered || registering) ? 0.6 : 1,
                          background: cls.is_registered ? '#10b981' : '#0f172a'
                        }}
                      >
                        {cls.is_registered ? '✓ Enrolled' : 'Register Now'}
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* BROWSE COURSES TAB */
                <div>
                  {/* My Applications Section */}
                  {courses.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                      <h3 style={{ ...S.sectionTitle, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardText size={20} weight="duotone" color="#4f46e5" />
                        My Course Applications
                      </h3>
                      <div style={S.coursesGrid}>
                        {courses.map(course => (
                          <div key={course.id} style={{ ...S.courseCard, border: course.status === 'pending' ? '1px dashed #f59e0b' : '1px solid #e2e8f0' }}>
                            <div style={S.courseCardHeader}>
                              <div style={{ ...S.courseIcon, background: course.status === 'pending' ? '#fffbeb' : '#f0f9ff' }}>
                                <BookOpen size={24} weight="bold" color={course.status === 'pending' ? '#f59e0b' : '#3b82f6'} />
                              </div>
                              <span style={{ 
                                ...S.availableTag, 
                                background: course.status === 'pending' ? '#fffbeb' : '#dcfce7',
                                color: course.status === 'pending' ? '#92400e' : '#166534',
                                border: course.status === 'pending' ? '1px solid #fcd34d' : '1px solid #b9f6ca'
                              }}>
                                {course.status === 'pending' ? '⏳ Pending' : '✓ Enrolled'}
                              </span>
                            </div>
                            <h3 style={S.courseTitle}>{course.title}</h3>
                            <div style={S.courseFooter}>
                              <User size={14} /> {course.teacher_name || 'Instructor TBD'}
                            </div>
                            {course.status === 'pending' && (
                              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', fontStyle: 'italic' }}>
                                Waiting for teacher's approval...
                              </p>
                            )}
                            {course.status === 'approved' && (
                              <button 
                                onClick={() => { setSelectedCourse(course); setActivePage('course-detail'); }}
                                style={{ ...S.enrollBtn, marginTop: '16px' }}
                              >
                                View Course Details
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ height: '1px', background: '#e2e8f0', margin: '40px 0' }}></div>
                    </div>
                  )}

                  <h3 style={{ ...S.sectionTitle, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={20} weight="duotone" color="#4f46e5" />
                    Available Courses
                  </h3>
                  {availableCourses.length === 0 ? (
                    <div style={S.emptyState}>
                      <BookOpen size={48} weight="duotone" color="#94a3b8" />
                      <p>No new courses available for enrollment.</p>
                    </div>
                  ) : (
                    <div style={S.coursesGrid}>
                      {availableCourses.map(course => (
                        <div key={course.id} style={S.courseCard}>
                          <div style={S.courseCardHeader}>
                            <div style={S.courseIcon}>
                              <BookOpen size={24} weight="bold" color="#fff" />
                            </div>
                            <span style={S.availableTag}>Available</span>
                          </div>
                          <h3 style={S.courseTitle}>{course.title}</h3>
                          <p style={S.courseDesc}>{course.description || 'No description available.'}</p>
                          <div style={S.courseFooter}>
                            <User size={14} /> {course.teacher_name || 'Instructor TBD'}
                          </div>
                          <button 
                            onClick={() => handleEnrollCourse(course.id)} 
                            disabled={enrolling}
                            style={{...S.enrollBtn, opacity: enrolling ? 0.6 : 1}}
                          >
                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            )}
          </div>
        )

      case 'timetable':
        return (
          <div style={S.tableCard} className="table-container animate-fadeIn">
            <div style={S.tableHeader}>
              <h2 style={S.tableTitle}>📅 Class Schedule</h2>
            </div>
            <div style={S.timetableContainer}>
              {Object.entries(groupTimetableByDay()).map(([day, entries]) => (
                entries.length > 0 && (
                  <div key={day} style={S.daySection}>
                    <h4 style={S.dayHeading}>{day}</h4>
                    {entries.map(entry => (
                      <div key={entry.id} style={S.timetableSlot}>
                        <div>
                          <span style={S.timetableCourseTitle}>{entry.course_title}</span>
                          <div style={S.roomInfo}>
                            <Clock size={12} /> {entry.start_time} - {entry.end_time}
                          </div>
                        </div>
                        <span style={S.roomBadge}>Room {entry.room_number || 'TBD'}</span>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>
        )

      case 'assignments':
        return (
          <div style={S.tableCard} className="table-container animate-fadeIn">
            <div style={S.tableHeader}>
              <h2 style={S.tableTitle}>📋 My Assignments</h2>
            </div>
            <div style={S.assignmentsList}>
              {assignments.length === 0 ? (
                <div style={S.emptyState}>
                  <FileText size={48} weight="duotone" color="#94a3b8" />
                  <p>No assignments assigned yet.</p>
                </div>
              ) : (
                assignments.map(a => (
                  <div key={a.id} style={S.assignmentCard}>
                    <div style={S.assignmentHeader}>
                      <div>
                        <span style={S.assignmentCourse}>{a.course_title}</span>
                        <span style={S.assignmentDue}>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                      </div>
                      {a.marks_obtained ? (
                        <span style={S.scoreBadge}>{a.marks_obtained}/{a.max_marks}</span>
                      ) : (
                        <span style={{
                          ...S.statusBadge,
                          background: a.submitted_at ? '#e0e7ff' : '#fee2e2',
                          color: a.submitted_at ? '#4338ca' : '#991b1b'
                        }}>
                          {a.submitted_at ? 'Submitted' : 'Pending'}
                        </span>
                      )}
                    </div>

                    <h3 style={S.assignmentTitle}>{a.title}</h3>
                    <p style={S.assignmentDesc}>{a.description}</p>
                    
                    {a.feedback && (
                      <div style={S.feedbackBox}>
                        <p style={S.feedbackLabel}>Teacher Feedback:</p>
                        <p style={S.feedbackText}>{a.feedback}</p>
                      </div>
                    )}

                    {!a.marks_obtained && (
                      <button 
                        onClick={() => { 
                          setSelectedAssignment(a); 
                          setShowSubmitModal(true); 
                          setSubmissionText(a.submission_text || ''); 
                        }}
                        style={{
                          ...S.submitBtn,
                          background: a.submitted_at ? '#cbd5e1' : '#4f46e5',
                          color: a.submitted_at ? '#475569' : '#fff'
                        }}
                      >
                        {a.submitted_at ? 'Update Submission' : 'Submit Assignment'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case 'labs':
        return (
          <div className="animate-fadeIn">
            {selectedLab ? (
              <div>
                <button 
                  onClick={() => setSelectedLab(null)} 
                  style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: '#4f46e5', fontWeight: '700', cursor: 'pointer'}}
                >
                  <ArrowLeft weight="bold" /> Back to Labs
                </button>
                <div style={{borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#000'}}>
                   <LabPlayer 
                     labName={selectedLab.name} 
                     labId={selectedLab.id} 
                     url={selectedLab.url}
                     user={user} 
                   />
                </div>
              </div>
            ) : (
              <div>
                <h2 style={S.sectionTitle}>🔬 Cloud Labs</h2>
                <p style={S.subtitle}>Access your virtual environments and hands-on practice labs.</p>
                
                <div style={{...S.coursesGrid, marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px'}}>
                   {availableLabs.length === 0 ? (
                     <div style={S.emptyState}>No labs assigned yet.</div>
                   ) : (
                     availableLabs.map(lab => (
                       <div key={lab.id} style={S.courseCard}>
                          <div style={S.courseCardHeader}>
                            <div style={{...S.courseIcon, fontSize: '32px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px'}}>
                              {lab.icon || '🔗'}
                            </div>
                            <span style={S.availableTag}>Ready</span>
                          </div>
                          <h3 style={S.courseTitle}>{lab.name}</h3>
                          <p style={S.courseDesc}>{lab.description}</p>
                          <button 
                            onClick={() => setSelectedLab(lab)}
                            style={{...S.enrollBtn, marginTop: '16px'}}
                          >
                            Start Lab
                          </button>
                       </div>
                     ))
                   )}
                </div>
              </div>
            )}
          </div>
        )
      default: return <div>Select a module</div>
    }
  }

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

        <div style={S.studentBadge}>
          <User size={14} weight="fill" />
          <span>Student Portal</span>
          <div style={S.liveIndicator}></div>
        </div>

        <nav style={S.nav}>
          <p style={S.navLabel}>ACADEMICS</p>
          <SidebarBtn active={activePage === 'courses'} onClick={() => setActivePage('courses')} icon={<House size={20} />} label="Dashboard" count={null} />
          <SidebarBtn active={activePage === 'registration'} onClick={() => setActivePage('registration')} icon={<Buildings size={20} />} label="Registration" count={availableClasses.length} />
          <SidebarBtn active={activePage === 'assignments'} onClick={() => setActivePage('assignments')} icon={<FileText size={20} />} label="Assignments" count={pendingAssignments} />
          <SidebarBtn active={activePage === 'timetable'} onClick={() => setActivePage('timetable')} icon={<Clock size={20} />} label="Schedule" count={timetable.length} />
          
          <SidebarBtn active={activePage === 'labs'} onClick={() => setSelectedLab(null) || setActivePage('labs')} icon={<Pulse size={20} weight="duotone" />} label="Cloud Labs" count={null} />

          <p style={{...S.navLabel, marginTop:'20px'}}>PERFORMANCE</p>
          <SidebarBtn active={activePage === 'attendance'} onClick={() => setActivePage('attendance')} icon={<CheckCircle size={20} />} label="Attendance" count={attendanceStats.percentage ? attendanceStats.percentage + '%' : null} />
          <SidebarBtn active={activePage === 'grades'} onClick={() => setActivePage('grades')} icon={<GraduationCap size={20} />} label="Results" count={grades.length} />

        </nav>

        <button onClick={onLogout} style={S.logoutBtn} className="logout-btn">
          <SignOut size={20} /> <span>Sign Out</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={S.main} className="main-content">
        <header style={S.header}>
          <div>
            <h1 style={S.title}>Student Portal</h1>
            <p style={S.subtitle}>Welcome back, <span style={S.studentName}>{user.name}</span></p>
          </div>
          <div style={S.dateBadge}>
            <CalendarBlank size={18} /> {new Date().toDateString()}
          </div>
        </header>

        {renderContent()}
      </main>

      {/* RIGHT PANEL */}
      <aside style={S.rightPanel} className="right-panel">
        <div style={S.profileCard}>
          <div style={S.avatar}>{user.name.charAt(0)}</div>
          <h3 style={S.profileName}>{user.name}</h3>
          <span style={S.idBadge}>{user.roll_number || 'ID Pending'}</span>
          <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '12px'}}>
            Semester {user.semester || 1}
          </div>
          
          <div style={S.profileStats}>
            <div style={S.profileStat} className="profile-stat">
              <span>Courses</span>
              <strong>{courses.length}</strong>
            </div>
            <div style={S.profileStat} className="profile-stat">
              <span>Attendance</span>
              <strong>{attendanceStats.percentage || 0}%</strong>
            </div>
          </div>
        </div>

        <div style={S.notificationCard}>
          <div style={S.notificationHeader} className="notification-header">
            <h4>Notifications</h4>
            <Bell size={16} color="#64748b" />
          </div>
          <div style={S.notificationList}>
            <div style={S.notificationItem}>
              <div style={S.notificationDot}></div>
              <div>
                <p style={S.notificationText}>New grade posted in Applied Physics</p>
                <span style={S.notificationTime}>2 hours ago</span>
              </div>
            </div>
            <div style={S.notificationItem}>
              <div style={S.notificationDot}></div>
              <div>
                <p style={S.notificationText}>Assignment due tomorrow: Math Quiz</p>
                <span style={S.notificationTime}>5 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        <div style={S.upcomingCard}>
          <h4 style={S.upcomingTitle}>Upcoming</h4>
          <div style={S.upcomingItem} className="upcoming-item">
            <Clock size={20} color="#4f46e5" weight="duotone" />
            <span>Maths Quiz tomorrow at 10:00 AM</span>
          </div>
          <div style={S.upcomingItem} className="upcoming-item">
            <Clock size={14} color="#4f46e5" />
            <span>Physics Lab at 2:00 PM</span>
          </div>
        </div>
      </aside>

      {/* SUBMIT MODAL */}
      {showSubmitModal && selectedAssignment && (
        <div style={S.modalOverlay} onClick={() => setShowSubmitModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>Submit Assignment</h3>
              <button onClick={() => setShowSubmitModal(false)} style={S.modalClose}>×</button>
            </div>
            
            <p style={S.modalSubtitle}>{selectedAssignment.title}</p>
            
            <form onSubmit={handleSubmitAssignment} style={S.modalForm}>
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Your Submission</label>
                <textarea 
                  placeholder="Type your answer here..." 
                  value={submissionText} 
                  onChange={e => setSubmissionText(e.target.value)} 
                  style={S.textarea}
                />
              </div>
              
              <div style={S.fileUpload} onClick={() => document.getElementById('fileUpload').click()}>
                <Upload size={24} color="#64748b" />
                <p style={S.uploadText}>
                  {submissionFile ? submissionFile.name : 'Click to upload file (optional)'}
                </p>
                <input 
                  type="file" 
                  id="fileUpload" 
                  style={{display:'none'}} 
                  onChange={e => setSubmissionFile(e.target.files[0])} 
                />
              </div>

              <div style={S.modalActions}>
                <button type="button" onClick={() => setShowSubmitModal(false)} style={S.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={S.saveBtn}>
                  Submit Work
                </button>
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

  studentBadge: {
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
    gap: '4px',
  },

  navLabel: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#94a3b8',
    padding: '16px 18px 8px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  navBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 18px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'left',
    fontSize: '14px',
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
    fontSize: '10px',
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
    fontSize: '14px',
    marginTop: '20px',
    transition: 'all 0.3s ease',
  },

  main: {
    flex: 1,
    padding: '48px',
    marginLeft: '280px',
    marginRight: '320px',
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

  studentName: {
    color: '#4f46e5',
    fontWeight: '700',
  },

  dateBadge: {
    background: '#fff',
    padding: '12px 24px',
    borderRadius: '30px',
    border: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)',
  },

  // Overview Page
  overviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
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
    width: '48px',
    height: '48px',
    borderRadius: '16px',
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
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: '0.02em',
  },

  metricValue: {
    margin: '2px 0 0',
    fontSize: '1.6rem',
    fontWeight: '800',
  },

  metricTrend: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#22c55e',
    background: '#dcfce7',
    padding: '2px 8px',
    borderRadius: '30px',
    display: 'inline-block',
  },

  chartCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },

  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  chartTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1.1rem',
    color: '#0f172a',
  },

  chartSubtitle: {
    margin: '4px 0 0',
    fontSize: '0.8rem',
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
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#4f46e5',
    letterSpacing: '0.05em',
  },

  classInfoCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
  },

  classInfoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  classInfoTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1.1rem',
    color: '#0f172a',
  },

  classInfoSubtitle: {
    margin: '4px 0 0',
    fontSize: '0.85rem',
    color: '#64748b',
  },

  classBadge: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },

  classSubjectsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '16px',
  },

  subjectPill: {
    background: '#f1f5f9',
    padding: '8px 16px',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  viewScheduleBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 0',
  },

  alertCard: {
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '24px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '700',
    color: '#92400e',
  },

  alertText: {
    margin: '4px 0 0',
    fontSize: '0.85rem',
    color: '#b45309',
  },

  alertBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '30px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },

  recentActivityCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
  },

  recentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  recentTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1rem',
    color: '#0f172a',
  },

  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },

  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4f46e5',
  },

  activityContent: {
    flex: 1,
  },

  activityCourse: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#0f172a',
  },

  activityDate: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  },

  activityStatus: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Attendance Page
  attendanceStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },

  attendanceStatCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },

  statLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#64748b',
    marginBottom: '4px',
  },

  statValue: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#0f172a',
  },

  // Table Styles
  tableCard: {
    background: '#fff',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginBottom: '24px',
  },

  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
  },

  tableTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1rem',
    color: '#0f172a',
  },

  tableContainer: {
    overflowX: 'auto',
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
    padding: '14px 24px',
    color: '#64748b',
    fontSize: '0.7rem',
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: '0.05em',
  },

  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s ease',
  },

  tdName: {
    padding: '16px 24px',
    fontWeight: '700',
    color: '#0f172a',
    fontSize: '0.9rem',
  },

  td: {
    padding: '16px 24px',
    color: '#64748b',
    fontSize: '0.85rem',
    fontWeight: '500',
  },

  emptyTableCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
  },

  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
    display: 'inline-block',
  },

  // Grades Page
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '800',
    marginBottom: '24px',
    color: '#0f172a',
  },

  gradesSummary: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    padding: '20px',
    background: '#fff',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
  },

  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    '& span': {
      fontSize: '0.75rem',
      color: '#64748b',
      fontWeight: '600',
    },
    '& strong': {
      fontSize: '1.2rem',
      color: '#0f172a',
      fontWeight: '800',
    },
  },

  gradeBadge: {
    background: '#0f172a',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '0.8rem',
  },

  // Finance Page
  feeSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },

  feeItem: {
    background: '#fff',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    '& span': {
      fontSize: '0.75rem',
      color: '#64748b',
      fontWeight: '600',
    },
    '& strong': {
      fontSize: '1.2rem',
      fontWeight: '800',
    },
  },

  challansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },

  challanCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
  },

  challanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  challanStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },

  challanTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 4px',
  },

  challanDue: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '0 0 16px',
  },

  challanAmount: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#0f172a',
  },

  // Registration Page
  tabContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e2e8f0',
  },

  tabBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '700',
    padding: '8px 0',
  },

  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    color: '#94a3b8',
    '& p': {
      marginTop: '16px',
    },
  },

  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },

  classCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
  },

  className: {
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: '0 0 8px',
  },

  classInfo: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 4px',
  },

  classTeacher: {
    fontSize: '0.8rem',
    color: '#475569',
    margin: '0 0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  registerBtn: {
    width: '100%',
    padding: '12px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },

  courseCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
  },

  courseCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },

  courseIcon: {
    background: '#0f172a',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  availableTag: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },

  courseTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 8px',
  },

  courseDesc: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 12px',
  },

  courseFooter: {
    fontSize: '0.8rem',
    color: '#475569',
    margin: '0 0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  enrollBtn: {
    width: '100%',
    padding: '12px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Timetable
  timetableContainer: {
    padding: '24px',
  },

  daySection: {
    marginBottom: '24px',
  },

  dayHeading: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '12px',
    letterSpacing: '1px',
  },

  timetableSlot: {
    background: '#f8fafc',
    padding: '16px 20px',
    borderRadius: '18px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },

  timetableCourseTitle: {
    fontWeight: '700',
    color: '#0f172a',
    display: 'block',
    marginBottom: '4px',
  },

  roomInfo: {
    fontSize: '0.75rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  roomBadge: {
    background: '#0f172a',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },

  // Assignments
  assignmentsList: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  assignmentCard: {
    background: '#f8fafc',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
  },

  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },

  assignmentCourse: {
    background: '#0f172a',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.7rem',
    fontWeight: '700',
    marginRight: '8px',
  },

  assignmentDue: {
    fontSize: '0.75rem',
    color: '#64748b',
  },

  scoreBadge: {
    background: '#10b981',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
  },

  assignmentTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 8px',
  },

  assignmentDesc: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 16px',
  },

  feedbackBox: {
    background: '#dcfce7',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
    marginBottom: '16px',
  },

  feedbackLabel: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#166534',
    margin: '0 0 4px',
  },

  feedbackText: {
    fontSize: '0.85rem',
    color: '#14532d',
    margin: 0,
  },

  submitBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Right Panel
  rightPanel: {
    width: '320px',
    background: '#fff',
    borderLeft: '1px solid #e2e8f0',
    padding: '32px 24px',
    position: 'fixed',
    right: 0,
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '-10px 0 30px -10px rgba(0,0,0,0.05)',
  },

  profileCard: {
    textAlign: 'center',
    padding: '24px',
    background: '#f8fafc',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },

  avatar: {
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    color: '#fff',
    borderRadius: '24px',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    fontWeight: '800',
    boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.3)',
  },

  profileName: {
    fontSize: '1.1rem',
    fontWeight: '800',
    margin: '0 0 4px',
    color: '#0f172a',
  },

  idBadge: {
    background: '#f1f5f9',
    color: '#64748b',
    padding: '4px 12px',
    borderRadius: '30px',
    fontSize: '0.7rem',
    fontWeight: '700',
    display: 'inline-block',
    marginBottom: '16px',
  },

  profileStats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px 0 0',
    borderTop: '1px solid #e2e8f0',
  },

  profileStat: {
    textAlign: 'center',
  },

  notificationCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
  },

  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  notificationItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },

  notificationDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4f46e5',
    marginTop: '6px',
  },

  notificationText: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#1e293b',
  },

  notificationTime: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  },

  upcomingCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
  },

  upcomingTitle: {
    margin: '0 0 16px',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#0f172a',
  },

  upcomingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    fontSize: '0.85rem',
    color: '#1e293b',
    borderBottom: '1px solid #f1f5f9',
  },

  // Modal Styles
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
    padding: '32px',
    borderRadius: '32px',
    width: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 50px 70px -20px rgba(0,0,0,0.3)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  modalTitle: {
    fontWeight: '800',
    fontSize: '1.3rem',
    color: '#0f172a',
    margin: 0,
  },

  modalClose: {
    background: '#f1f5f9',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },

  modalSubtitle: {
    color: '#64748b',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },

  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  inputLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#475569',
  },

  textarea: {
    padding: '14px',
    borderRadius: '16px',
    border: '2px solid #f1f5f9',
    outline: 'none',
    minHeight: '120px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },

  fileUpload: {
    border: '2px dashed #cbd5e1',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  uploadText: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '8px 0 0',
  },

  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },

  cancelBtn: {
    flex: 1,
    padding: '12px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    color: '#64748b',
    cursor: 'pointer',
  },

  saveBtn: {
    flex: 2,
    padding: '12px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Back button & Detail
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    color: '#4f46e5',
  },

  detailCard: {
    background: '#fff',
    padding: '32px',
    borderRadius: '32px',
    border: '1px solid #e2e8f0',
  },

  detailTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    margin: '0 0 8px',
  },

  detailDesc: {
    color: '#64748b',
    fontSize: '1rem',
    margin: '0 0 24px',
  },

  detailInstructor: {
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.95rem',
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
    {count && count !== 0 ? (
      <span style={S.navBadge}>
        {typeof count === 'number' ? (count > 99 ? '99+' : count) : count}
      </span>
    ) : null}
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

  .metric-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -10px rgba(79, 70, 229, 0.15);
    border-color: #cbd5e1;
  }

  tr:hover {
    background: #f8fafc;
  }

  .class-card:hover, .course-card:hover, .challan-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 25px -10px rgba(79, 70, 229, 0.1);
    border-color: #a5b4fc;
  }

  .register-btn:hover, .enroll-btn:hover, .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -5px rgba(79, 70, 229, 0.4);
  }

  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -5px rgba(79, 70, 229, 0.4);
  }

  .cancel-btn:hover {
    background: #e2e8f0;
  }

  .modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .file-upload:hover {
    border-color: #4f46e5;
    background: #f5f3ff;
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

  .profile-stat span {
    display: block;
    fontSize: 0.7rem;
    color: #64748b;
    margin-bottom: 4px;
  }

  .profile-stat strong {
    fontSize: 1.2rem;
    color: #4f46e5;
    font-weight: 800;
  }

  .notification-header h4 {
    margin: 0;
    fontSize: 0.95rem;
    font-weight: 700;
    color: #0f172a;
  }

  .upcoming-item:last-child {
    border-bottom: none;
  }

  /* Responsive handled by responsive.css */
`;
document.head.appendChild(style);

export default StudentDashboard;
