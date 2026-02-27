import { useState, useEffect } from 'react';
import { 
  ArrowLeft, CalendarBlank, Users, BookOpen, ChalkboardTeacher, 
  PaperPlaneTilt, WarningCircle, Table, ArrowsClockwise, Calendar
} from "@phosphor-icons/react";

function ClassAttendance({ user, onBack }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showSheetView, setShowSheetView] = useState(false);
  
  // Class Course Management
  const [classCourses, setClassCourses] = useState([]);

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetch('http://localhost:5000/api/classes/teacher/my-classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data.success) setClasses(data.classes || []); })
      .catch(err => console.error(err));

    fetch('http://localhost:5000/api/courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data.success) setCourses(data.courses); })
      .catch(err => console.error(err));
  }, []);

  const handleClassSelect = async (classId) => {
    if (!classId) return;
    const classObj = classes.find(c => c.id === parseInt(classId));
    setSelectedClass(classObj);
    setStudents([]);
    setAttendanceData({});
    setSelectedCourse(null);
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setClassCourses(data.courses);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCourseSelect = async (courseId) => {
    setSelectedCourse(courseId);
    if(!selectedClass || !courseId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students?classId=${selectedClass.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if(data.success) {
        setStudents(data.students || []);
        const initialData = {};
        (data.students || []).forEach(s => initialData[s.id] = 'present');
        
        if(attendanceDate) {
          try {
            const attendanceResponse = await fetch(
              `http://localhost:5000/api/attendance/class/${selectedClass.id}/date/${attendanceDate}?course_id=${courseId}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const attendanceDataRes = await attendanceResponse.json();
            if(attendanceDataRes.success && attendanceDataRes.records) {
              const existingData = { ...initialData };
              attendanceDataRes.records.forEach(record => {
                existingData[record.student_id] = record.status;
              });
              setAttendanceData(existingData);
            } else setAttendanceData(initialData);
          } catch(e) { setAttendanceData(initialData); }
        } else setAttendanceData(initialData);
      }
    } catch(error) { console.error(error); } finally { setLoading(false); }
  };

  // Fetch existing attendance when date changes
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (!selectedClass || !attendanceDate) return;
      
      let url = `http://localhost:5000/api/attendance/class/${selectedClass.id}/date/${attendanceDate}`;
      if(selectedCourse) url += `?course_id=${selectedCourse}`;

      try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        
        if (data.success && data.records && data.records.length > 0) {
          const existingData = {};
          data.records.forEach(record => existingData[record.student_id] = record.status);
          setAttendanceData(prev => ({ ...prev, ...existingData }));
        } else {
          if(students.length > 0) {
            const initialData = {};
            students.forEach(s => initialData[s.id] = 'present');
            setAttendanceData(initialData);
          }
        }
      } catch (error) { console.error(error); }
    };
    fetchExistingAttendance();
  }, [attendanceDate, selectedClass, selectedCourse]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedCourse || !selectedClass) { 
      alert('⚠️ Please select class and course first!'); 
      return; 
    }

    const students_data = students.map(s => ({
      student_id: s.id,
      status: attendanceData[s.id] || 'present'
    }));

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/attendance/mark', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass.id,
          course_id: parseInt(selectedCourse),
          attendance_date: attendanceDate,
          students: students_data
        })
      });
      
      const data = await response.json();
      
      if (data.success) { 
        alert(`✅ Attendance Saved!`);
        doFetchHistory(selectedYear, selectedMonth);
      } else { alert(`❌ Failed: ${data.message}`); }
    } catch (error) { alert(`❌ Network Error`); } finally { setLoading(false); }
  };

  // ── History Sheet State ──
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyDates, setHistoryDates] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (showSheetView && selectedClass && selectedCourse) {
      doFetchHistory(selectedYear, selectedMonth);
    }
  }, [showSheetView, selectedClass, selectedCourse, selectedYear, selectedMonth]);

  const doFetchHistory = async (year, month) => {
    setLoadingHistory(true);
    try {
      const classId = selectedClass?.id;
      const courseId = selectedCourse;
      if (!classId || !courseId) return;

      const url = `http://localhost:5000/api/attendance/history/all?class_id=${classId}&course_id=${courseId}&year=${year}&month=${month}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.records) {
        setHistoryRecords(data.records);
        setHistoryDates(data.dates || []);
      }
    } catch (e) { console.error(e); } finally { setLoadingHistory(false); }
  };

  // Generate all dates in the selected month
  const getAllDatesInMonth = (year, month) => {
    const daysInMonth = new Date(year, parseInt(month), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
  };

  // ── SHEET VIEW (Enhanced with Calendar) ──
  if (showSheetView) {
    const allDatesInMonth = getAllDatesInMonth(selectedYear, selectedMonth);
    const sortedDates = allDatesInMonth; // Use all dates in month
    
    const statusMap = {};
    const studentMeta = {};
    historyRecords.forEach(r => {
      if (!statusMap[r.student_id]) statusMap[r.student_id] = {};
      statusMap[r.student_id][r.date] = r.status;
      studentMeta[r.student_id] = { name: r.student_name, email: r.student_email };
    });

    const studentIds = [...new Set(historyRecords.map(r => r.student_id))];
    const courseName = classCourses.find(c => c.id === parseInt(selectedCourse))?.title || '';

    // Available years (last 5 years to current year)
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    return (
      <div style={styles.sheetContainer}>
        {/* Header */}
        <div style={styles.sheetHeader}>
          <button onClick={() => setShowSheetView(false)} style={styles.backBtn}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2 style={styles.sheetTitle}>Attendance Register</h2>
          <div style={styles.sheetInfo}>
            {selectedClass?.name} - {courseName} | {studentIds.length} Students
          </div>
        </div>

        {/* Calendar Filters */}
        <div style={styles.calendarFilters}>
          <div style={styles.filterGroup}>
            <label>Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={styles.filterSelect}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label>Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.filterSelect}>
              {monthNames.map((name, index) => {
                const monthNum = (index + 1).toString().padStart(2, '0');
                return <option key={monthNum} value={monthNum}>{name}</option>;
              })}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label>Go to Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.dateInput}
            />
          </div>
          <button onClick={() => {
            if (selectedDate) {
              const [y, m] = selectedDate.split('-');
              setSelectedYear(y);
              setSelectedMonth(m);
              doFetchHistory(y, m);
            }
          }} style={styles.goBtn}>
            <Calendar size={14} /> Go
          </button>
          <button onClick={() => doFetchHistory(selectedYear, selectedMonth)} style={styles.refreshBtn}>
            <ArrowsClockwise size={14} /> Refresh
          </button>
        </div>

        {/* Excel Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thSticky}>SR#</th>
                <th style={styles.thSticky}>STUDENT NAME</th>
                <th style={styles.thSticky}>EMAIL</th>
                {sortedDates.map(d => {
                  const [y, m, day] = d.split('-');
                  const isSelectedDate = d === selectedDate;
                  return (
                    <th key={d} style={{
                      ...styles.thDate,
                      background: isSelectedDate ? '#4f46e5' : '#f4f4f4',
                      color: isSelectedDate ? '#fff' : '#000',
                    }}>
                      {parseInt(day)}
                      <div style={styles.thYear}>{monthNames[parseInt(m)-1]}</div>
                    </th>
                  );
                })}
                <th style={styles.thStickyRight}>ATT%</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr><td colSpan={3 + sortedDates.length + 1} style={styles.loadingCell}>Loading...</td></tr>
              ) : studentIds.map((sid, idx) => {
                const meta = studentMeta[sid] || {};
                const sMap = statusMap[sid] || {};
                const sTotal = sortedDates.length;
                const sPres = sortedDates.filter(d => sMap[d] === 'present').length;
                const sPct = sTotal > 0 ? Math.round((sPres / sTotal) * 100) : 0;
                const rowBg = idx % 2 === 0 ? '#fff' : '#f9f9f9';

                return (
                  <tr key={sid}>
                    <td style={{...styles.tdSticky, background: rowBg}}>{idx + 1}</td>
                    <td style={{...styles.tdSticky, background: rowBg}}>
                      <div style={styles.studentName}>{meta.name}</div>
                    </td>
                    <td style={{...styles.tdSticky, background: rowBg, borderRight: '2px solid #ddd'}}>
                      {meta.email || '—'}
                    </td>
                    {sortedDates.map(d => {
                      const status = sMap[d];
                      const isSelectedDate = d === selectedDate;
                      return (
                        <td key={d} style={{
                          ...styles.td,
                          background: isSelectedDate ? '#e0e7ff' : rowBg,
                        }}>
                          <span style={styles.statusCell}>
                            {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : '—'}
                          </span>
                        </td>
                      );
                    })}
                    <td style={{...styles.tdStickyRight, background: rowBg}}>
                      <span style={sPct >= 75 ? styles.highPercent : styles.lowPercent}>{sPct}%</span>
                    </td>
                  </tr>
                );
              })}
              {/* If no students, show empty row */}
              {studentIds.length === 0 && !loadingHistory && (
                <tr>
                  <td colSpan={3 + sortedDates.length + 1} style={styles.emptyCell}>
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals Row */}
            <tfoot>
              <tr>
                <td colSpan={3} style={styles.footerCell}>TOTALS</td>
                {sortedDates.map(d => {
                  const present = historyRecords.filter(r => r.date === d && r.status === 'present').length;
                  const absent = historyRecords.filter(r => r.date === d && r.status === 'absent').length;
                  const late = historyRecords.filter(r => r.date === d && r.status === 'late').length;
                  const isSelectedDate = d === selectedDate;
                  return (
                    <td key={d} style={{
                      ...styles.footerDataCell,
                      background: isSelectedDate ? '#e0e7ff' : 'inherit',
                    }}>
                      <div>P:{present}</div>
                      <div>A:{absent}</div>
                      <div>L:{late}</div>
                    </td>
                  );
                })}
                <td style={styles.footerEmpty}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <span><span style={styles.legendBox}>P</span> Present</span>
          <span><span style={styles.legendBox}>A</span> Absent</span>
          <span><span style={styles.legendBox}>L</span> Late</span>
          <span><span style={styles.legendBox}>—</span> Not Marked</span>
          <span style={styles.selectedDateNote}>
            <span style={{...styles.legendBox, background: '#4f46e5', color: '#fff'}}>📅</span> Selected Date
          </span>
        </div>
      </div>
    );
  }

  // Normal attendance marking view (ENLARGED)
  return (
    <div style={styles.pageContainer}>
      <button onClick={onBack} style={styles.backButton}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
      <h1 style={styles.title}>Roll Call Manager</h1>

      {/* Selection Cards - Larger */}
      <div style={styles.selectionGrid}>
        <div style={styles.card}>
          <label>Class</label>
          <select onChange={(e) => handleClassSelect(e.target.value)} style={styles.select}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>)}
          </select>
        </div>
        <div style={styles.card}>
          <label>Course</label>
          <select value={selectedCourse || ''} onChange={(e) => handleCourseSelect(e.target.value)} style={styles.select}>
            <option value="">Select Course</option>
            {classCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div style={styles.card}>
          <label>Date</label>
          <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={styles.input} />
        </div>
      </div>

      {/* Action Buttons - Larger */}
      {selectedClass && selectedCourse && students.length > 0 && (
        <div style={styles.actions}>
          <button onClick={() => setShowSheetView(true)} style={styles.sheetBtn}>
            <Table size={18} /> View Attendance Sheet
          </button>
          <button onClick={handleSubmitAttendance} disabled={loading} style={styles.saveBtn}>
            {loading ? 'Saving...' : 'Save Today\'s Attendance'}
          </button>
        </div>
      )}

      {/* Student List - Expanded */}
      {selectedClass && selectedCourse && students.length > 0 && (
        <div style={styles.studentList}>
          <h3>{selectedClass.name} - {students.length} Students Enrolled</h3>
          <table style={styles.studentTable}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td style={styles.studentNameCell}>{s.name}</td>
                  <td style={styles.emailCell}>{s.email}</td>
                  <td>
                    <div style={styles.statusGroup}>
                      <button onClick={() => handleStatusChange(s.id, 'present')}
                        style={attendanceData[s.id] === 'present' ? styles.activePresent : styles.inactive}>
                        P
                      </button>
                      <button onClick={() => handleStatusChange(s.id, 'absent')}
                        style={attendanceData[s.id] === 'absent' ? styles.activeAbsent : styles.inactive}>
                        A
                      </button>
                      <button onClick={() => handleStatusChange(s.id, 'late')}
                        style={attendanceData[s.id] === 'late' ? styles.activeLate : styles.inactive}>
                        L
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {selectedClass && selectedCourse && students.length === 0 && !loading && (
        <div style={styles.emptyState}>
          <WarningCircle size={48} color="#94a3b8" />
          <p>No students enrolled in this course yet.</p>
        </div>
      )}
    </div>
  );
}

// ==================== ENHANCED STYLES ====================
const styles = {
  // Main View - Larger Sizes
  pageContainer: {
    width: '100%',
    maxWidth: '1200px', 
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  backButton: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '10px 20px', // Larger
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px', // More space
    fontSize: '15px',
  },
  title: {
    fontSize: '32px', // Larger
    fontWeight: '700',
    margin: '0 0 28px', // More space
  },
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Wider min
    gap: '20px',
    marginBottom: '28px',
  },
  card: {
    background: '#fff',
    padding: '20px', // More padding
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    '& label': {
      display: 'block',
      fontSize: '13px', // Slightly larger
      fontWeight: '600',
      color: '#64748b',
      marginBottom: '8px',
    },
  },
  select: {
    width: '100%',
    padding: '12px', // Larger
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '15px', // Larger
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    marginBottom: '28px',
  },
  sheetBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '14px 28px', // Larger
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  saveBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
  },
  studentList: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
  },
  studentTable: {
    width: '100%',
    borderCollapse: 'collapse',
    '& th': {
      textAlign: 'left',
      padding: '14px', // Larger
      borderBottom: '2px solid #e2e8f0',
      fontSize: '13px',
      fontWeight: '700',
      color: '#64748b',
    },
    '& td': {
      padding: '14px',
      borderBottom: '1px solid #f1f5f9',
    },
  },
  studentNameCell: {
    fontWeight: '600',
    fontSize: '15px',
  },
  emailCell: {
    fontSize: '14px',
    color: '#64748b',
  },
  statusGroup: {
    display: 'flex',
    gap: '10px',
  },
  inactive: {
    padding: '8px 14px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    minWidth: '44px',
  },
  activePresent: {
    padding: '8px 14px',
    border: 'none',
    background: '#10b981',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    minWidth: '44px',
  },
  activeAbsent: {
    padding: '8px 14px',
    border: 'none',
    background: '#ef4444',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    minWidth: '44px',
  },
  activeLate: {
    padding: '8px 14px',
    border: 'none',
    background: '#f59e0b',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    minWidth: '44px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
  },

  // Sheet View - Enhanced with Calendar
  sheetContainer: {
    padding: '24px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: '#fff',
    minHeight: '100vh',
  },
  sheetHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
    padding: '10px 0',
    borderBottom: '2px solid #333',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '15px',
    padding: '6px 10px',
    borderRadius: '4px',
    '&:hover': {
      background: '#f0f0f0',
    },
  },
  sheetTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
  },
  sheetInfo: {
    marginLeft: 'auto',
    fontSize: '15px',
    color: '#666',
  },
  calendarFilters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    '& label': {
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
    },
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '100px',
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  goBtn: {
    padding: '8px 16px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
  },
  refreshBtn: {
    padding: '8px 16px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    marginLeft: 'auto',
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    minWidth: '900px',
  },
  thSticky: {
    position: 'sticky',
    left: 0,
    background: '#f4f4f4',
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '700',
    borderBottom: '2px solid #333',
    borderRight: '1px solid #ddd',
    zIndex: 10,
  },
  thStickyRight: {
    position: 'sticky',
    right: 0,
    background: '#f4f4f4',
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: '700',
    borderBottom: '2px solid #333',
    borderLeft: '2px solid #333',
    zIndex: 10,
    minWidth: '70px',
  },
  thDate: {
    background: '#f4f4f4',
    padding: '8px 4px',
    textAlign: 'center',
    fontWeight: '700',
    borderBottom: '2px solid #333',
    borderRight: '1px solid #ddd',
    minWidth: '60px',
  },
  thYear: {
    fontSize: '10px',
    fontWeight: '400',
    color: '#666',
  },
  tdSticky: {
    position: 'sticky',
    left: 0,
    padding: '10px 8px',
    borderRight: '1px solid #ddd',
    borderBottom: '1px solid #eee',
    zIndex: 5,
  },
  tdStickyRight: {
    position: 'sticky',
    right: 0,
    padding: '10px 8px',
    textAlign: 'center',
    borderLeft: '2px solid #333',
    borderBottom: '1px solid #eee',
    zIndex: 5,
  },
  td: {
    padding: '8px 4px',
    textAlign: 'center',
    borderRight: '1px solid #ddd',
    borderBottom: '1px solid #eee',
  },
  studentName: {
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  statusCell: {
    display: 'inline-block',
    width: '28px',
    height: '28px',
    lineHeight: '28px',
    textAlign: 'center',
    borderRadius: '4px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    fontWeight: '600',
  },
  highPercent: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#e6f7e6',
    borderRadius: '4px',
    fontWeight: '600',
  },
  lowPercent: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#ffe6e6',
    borderRadius: '4px',
    fontWeight: '600',
  },
  loadingCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  footerCell: {
    position: 'sticky',
    left: 0,
    background: '#f4f4f4',
    padding: '10px 8px',
    fontWeight: '700',
    borderTop: '2px solid #333',
    borderRight: '2px solid #333',
    zIndex: 5,
  },
  footerDataCell: {
    padding: '8px 4px',
    textAlign: 'center',
    borderTop: '2px solid #333',
    borderRight: '1px solid #ddd',
    fontSize: '11px',
    lineHeight: '1.6',
  },
  footerEmpty: {
    position: 'sticky',
    right: 0,
    background: '#f4f4f4',
    borderTop: '2px solid #333',
    borderLeft: '2px solid #333',
    zIndex: 5,
  },
  legend: {
    display: 'flex',
    gap: '24px',
    marginTop: '16px',
    padding: '12px',
    fontSize: '13px',
    borderTop: '1px solid #ddd',
    flexWrap: 'wrap',
  },
  legendBox: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    lineHeight: '24px',
    textAlign: 'center',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    marginRight: '6px',
    fontWeight: '600',
  },
  selectedDateNote: {
    marginLeft: 'auto',
  },
};

export default ClassAttendance;
