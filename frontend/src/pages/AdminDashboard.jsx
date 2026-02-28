  import { useState, useEffect, useRef } from "react";
  import { useNavigate } from "react-router-dom";
  import '../responsive.css'
  import { Chart } from "chart.js/auto";
  import {
    House, ChalkboardTeacher, UserCircle, Buildings, ClipboardText,
    CalendarBlank, CaretDown, Plus, SignOut, Trash, Phone, VideoCamera, 
    DotsThreeVertical, PencilSimple, BookOpen, TrendUp, Pulse, UserPlus, GraduationCap, DotsThreeOutline, ChatCircle
  } from "@phosphor-icons/react";

  function AdminDashboard({ user = { name: "Margaret" }, onLogout }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [logs, setLogs] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPerson, setNewPerson] = useState({ name: "", email: "", password: "", campus_id: "", semester: "1" });
    const [newClass, setNewClass] = useState({ name: "", section: "", academic_year: "2024-2025", teacher_id: "" });
    const [newCourse, setNewCourse] = useState({ title: "", description: "", teacher_id: "" });
    const [campuses, setCampuses] = useState([]);
    const [editingClass, setEditingClass] = useState(null);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);

    const token = sessionStorage.getItem("token");
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
      fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const [teachersRes, studentsRes, classesRes, coursesRes, logsRes, pendingRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/teachers", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/admin/students", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/classes", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/courses?status=all", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/logs?limit=50", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/pending-students", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/campuses"), // public endpoint
        ]);
        const tData = await teachersRes.json();
        const sData = await studentsRes.json();
        const cData = await classesRes.json();
        const courData = await coursesRes.json();
        const lData = await logsRes.json();
        const pData = await pendingRes.json();
        const campData = await campusesRes.json();

        if (tData.success) setTeachers(tData.teachers || []);
        if (sData.success) setStudents(sData.students || []);
        if (cData.success) setClasses(cData.classes || []);
        if (courData.success) setCourses(courData.courses || []);
        if (lData.success) setLogs(lData.logs || []);
        if (pData.success) setPendingStudents(pData.students || []);
        if (campData.success) setCampuses(campData.campuses || []);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleEdit = (item) => {
      if (activeTab === "classes") {
        setEditingClass(item);
        setShowEditModal(true);
      } else if (activeTab === "courses") {
        setEditingCourse(item);
        setShowEditCourseModal(true);
      }
    };

    const handleUpdateClass = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`http://localhost:5000/api/classes/${editingClass.id}`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(editingClass)
        });
        const data = await res.json();
        if (data.success) {
          setShowEditModal(false);
          setEditingClass(null);
          fetchAdminData();
        } else {
          alert("❌ Error: " + data.message);
        }
      } catch (error) {
        alert("❌ Error updating class");
      }
    };

    const handleDelete = async (id, entityType) => {
      if (!window.confirm(`Are you sure you want to delete this ${entityType}?`)) return;
      
      // Fix: Use correct endpoints
      let endpoint;
      if (entityType === "classe") {
        // When activeTab is "classes", slice(0,-1) gives "classe", but we need "classes"
        endpoint = `classes/${id}`;
      } else if (entityType === "course") {
        endpoint = `courses/${id}`;
      } else {
        endpoint = `admin/${entityType}s/${id}`;
      }
      
      console.log('Delete endpoint:', endpoint);
      
      try {
        const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) { fetchAdminData(); } else { alert("❌ Error: " + data.message); }
      } catch (error) { 
        console.error('Delete error:', error);
        alert("❌ Error deleting"); 
      }
    };

    const handleApprove = async (studentId, studentName) => {
      if (!window.confirm(`Approve student: ${studentName}?`)) return;

      try {
        const res = await fetch(`http://localhost:5000/api/pending-students/${studentId}/approve`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          alert(`✅ ${studentName} approved successfully!`);
          fetchAdminData(); // Refresh all data
        } else {
          alert("❌ Error: " + data.message);
        }
      } catch (error) {
        console.error('Approve error:', error);
        alert("❌ Error approving student");
      }
    };

    const handleReject = async (studentId, studentName) => {
      if (!window.confirm(`Reject and delete student: ${studentName}? This action cannot be undone.`)) return;

      try {
        const res = await fetch(`http://localhost:5000/api/pending-students/${studentId}/reject`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          alert(`✅ ${studentName} rejected and removed`);
          fetchAdminData(); // Refresh all data
        } else {
          alert("❌ Error: " + data.message);
        }
      } catch (error) {
        console.error('Reject error:', error);
        alert("❌ Error rejecting student");
      }
    };

    const handleReactivateCourse = async (courseId) => {
      if (!window.confirm("Are you sure you want to reactivate this course? It will reappear on the teacher's dashboard.")) return;
      try {
          const res = await fetch(`http://localhost:5000/api/courses/${courseId}/status`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'active' })
          });
          const data = await res.json();
          if(data.success) {
              alert("✅ Course Reactivated!");
              fetchAdminData();
          } else {
              alert("❌ Error: " + data.message);
          }
      } catch (error) { console.error(error); alert("❌ Network Error"); }
    };

    const handleAddSubmit = async (e) => {
      e.preventDefault();
      let endpoint = "";
      let body = {};
      if (activeTab === "classes") {
        endpoint = "classes";
        body = { ...newClass, teacher_id: newClass.teacher_id === "" ? null : newClass.teacher_id };
      } else if (activeTab === "courses") {
        endpoint = "courses";
        body = { ...newCourse, teacher_id: newCourse.teacher_id === "" ? null : newCourse.teacher_id };
      } else {
        endpoint = `admin/${activeTab}`;
        body = newPerson;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          setNewPerson({ name: "", email: "", password: "", campus_id: "", semester: "1" });
          setNewClass({ name: "", section: "", academic_year: "2024-2025", teacher_id: "" });
          setNewCourse({ title: "", description: "", teacher_id: "" });
          fetchAdminData();
        }
      } catch (error) { console.error(error); }
    };

    useEffect(() => {
      if (chartRef.current && activeTab === "overview") {
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'System Activity',
              data: [15, 22, 18, 30, 25, 28, 35],
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#4f46e5'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { grid: { color: '#f1f5f9' }, border: { display: false } }, x: { grid: { display: false } } }
          }
        });
      }
    }, [activeTab]);

    if (isLoading) return <div style={loadingStyle}>Authenticating Dashboard...</div>;

    return (
      <div style={containerStyle}>
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
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
            display: 'none'
          }}
          className="mobile-menu-btn"
        >
          <DotsThreeOutline size={24} weight="bold" />
        </button>

        <ResponsiveStyles />
        <aside style={sidebarStyle} className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div style={logoAreaStyle}>
            <div style={logoIconStyle}><GraduationCap size={20} weight="fill" /></div>
            <span>Lancers Tech</span>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SidebarBtn active={false} onClick={() => navigate('/chat')} icon={<ChatCircle size={20} />} label="Chat" />
            <SidebarBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<House size={20} />} label="Overview" />
            <SidebarBtn active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={<ChalkboardTeacher size={20} />} label="Teachers" />
            <SidebarBtn active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<UserCircle size={20} />} label="Students" />
            <SidebarBtn active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} icon={<Buildings size={20} />} label="Classes" />
            <SidebarBtn active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} icon={<BookOpen size={20} />} label="Courses" />
            <SidebarBtn active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} icon={<UserPlus size={20} />} label="Pending Students" />
          </nav>

          <button onClick={onLogout} style={logoutBtnStyle} className="logout-btn">
            <SignOut size={20} /> <span>Sign Out</span>
          </button>
        </aside>

        <main style={mainStyle} className="main-content">
          <header style={headerStyle}>
            <div>
              <h1 style={titleStyle}>Management Hub</h1>
              <p style={subtitleStyle}>Welcome back, {user.name}. Here's what's happening.</p>
            </div>
            <div style={dateBadgeStyle}>
              <CalendarBlank size={18} /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </header>

          {activeTab === "overview" && (
            <div style={overviewGridStyle}>
              <div style={statsRowStyle} className="stats-grid">
                <MetricBox label="Teachers" value={teachers.length} icon={<ChalkboardTeacher weight="duotone" />} trend="+2 this month" />
                <MetricBox label="Students" value={students.length} icon={<UserPlus weight="duotone" />} trend="+15 this month" />
                <MetricBox label="Active Classes" value={classes.length} icon={<Buildings weight="duotone" />} />
              </div>

              <div style={chartCardStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Engagement Analytics</h3>
                  <Pulse size={24} color="#4f46e5" weight="duotone" />
                </div>
                <div style={{ height: '280px' }}><canvas ref={chartRef}></canvas></div>
              </div>
            </div>
          )}

          {activeTab !== "overview" && (
            <div style={tableContainerStyle} className="table-container animate-fadeIn">
              <div style={tableHeaderStyle}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', textTransform: 'capitalize' }}>{activeTab} Directory</h2>
                <button onClick={() => setShowAddModal(true)} style={addBtnStyle} className="add-btn">
                  <Plus size={18} weight="bold" /> Add New
                </button>
              </div>
              
              <div style={{overflowX: 'auto'}}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeadRowStyle}>
                      <th style={thStyle}>{activeTab === 'classes' ? 'CLASS NAME' : activeTab === 'courses' ? 'COURSE TITLE' : activeTab === 'pending' ? 'NAME' : 'NAME'}</th>
                      {activeTab === 'students' && <th style={thStyle}>ROLL NO</th>}
                      {activeTab === 'students' && <th style={thStyle}>SEM</th>}
                      <th style={thStyle}>{activeTab === 'classes' ? 'SECTION' : activeTab === 'courses' ? 'DESCRIPTION' : 'EMAIL'}</th>
                      {(activeTab === 'classes' || activeTab === 'courses') && <th style={thStyle}>TEACHER</th>}
                      {activeTab === 'courses' && <th style={thStyle}>STATUS</th>}
                      {activeTab === 'pending' && <th style={thStyle}>REGISTRATION DATE</th>}
                      <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === "teachers" ? teachers : activeTab === "students" ? students : activeTab === "classes" ? classes : activeTab === "pending" ? pendingStudents : courses).map(item => (
                      <tr key={item.id} style={trStyle}>
                        <td style={tdNameStyle}>{item.name || item.title}</td>
                         {activeTab === 'students' && <td style={tdStyle}>{item.roll_number || <span style={{color: '#94a3b8'}}>Pending</span>}</td>}
                         {activeTab === 'students' && <td style={tdStyle}>{item.semester || 1}</td>}
                         <td style={tdStyle}>{item.email || item.section || (item.description && item.description.substring(0, 40) + '...')}</td>
                        {(activeTab === 'classes' || activeTab === 'courses') && <td style={tdStyle}>{item.teacher_name || <span style={{color: '#94a3b8'}}>Not Assigned</span>}</td>}
                        {activeTab === 'courses' && (
                          <td style={tdStyle}>
                            <span style={{
                              padding:'4px 10px', borderRadius:'12px', 
                              background: item.status === 'active' ? '#dcfce7' : '#f1f5f9', 
                              color: item.status === 'active' ? '#166534' : '#64748b', 
                              fontSize:'11px', fontWeight:'700', textTransform:'uppercase'
                            }}>
                              {item.status || 'ACTIVE'}
                            </span>
                          </td>
                        )}
                        {activeTab === 'pending' && <td style={tdStyle}>{new Date(item.created_at).toLocaleDateString()}</td>}
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          {activeTab === 'pending' ? (
                            <div style={actionGroupStyle}>
                              <button 
                                style={{...iconBtnStyle, background: '#22c55e', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontWeight: '600'}} 
                                onClick={() => handleApprove(item.id, item.name)} 
                                title="Approve Student"
                              >
                                ✓ Approve
                              </button>
                              <button 
                                style={{...deleteBtnStyle, background: '#ef4444', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontWeight: '600'}} 
                                onClick={() => handleReject(item.id, item.name)} 
                                title="Reject Student"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          ) : (
                            <div style={actionGroupStyle}>
                              {activeTab === 'courses' && item.status !== 'active' && (
                                  <button 
                                      onClick={() => handleReactivateCourse(item.id)}
                                      style={{...iconBtnStyle, color: '#4f46e5', fontWeight: '700', fontSize: '12px', padding: '8px', background: '#e0e7ff', borderRadius: '8px'}}
                                      className="icon-btn"
                                      title="Reactivate Course"
                                  >
                                      ↻ Reactivate
                                  </button>
                              )}
                              <button style={iconBtnStyle} className="icon-btn" onClick={() => handleEdit(item)} title="Edit"><PencilSimple size={18} /></button>
                              <button style={deleteBtnStyle} className="delete-btn" onClick={() => handleDelete(item.id, activeTab.slice(0, -1))} title="Delete"><Trash size={18} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* Edit Class Modal */}
        {showEditModal && editingClass && (
          <div style={modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeader}>
                <h3 style={modalTitle}>Edit Class</h3>
                <button onClick={() => setShowEditModal(false)} style={closeBtn}>×</button>
              </div>
              <form onSubmit={handleUpdateClass} style={formStyle}>
                <input
                  required
                  placeholder="Class Name"
                  value={editingClass.name || ''}
                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                  style={inputStyle}
                />
                <input
                  required
                  placeholder="Section"
                  value={editingClass.section || ''}
                  onChange={(e) => setEditingClass({...editingClass, section: e.target.value})}
                  style={inputStyle}
                />
                <input
                  required
                  placeholder="Academic Year (e.g. 2024-2025)"
                  value={editingClass.academic_year || ''}
                  onChange={(e) => setEditingClass({...editingClass, academic_year: e.target.value})}
                  style={inputStyle}
                />
                <select
                  value={editingClass.teacher_id || ''}
                  onChange={(e) => setEditingClass({...editingClass, teacher_id: e.target.value})}
                  style={inputStyle}
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div style={modalActions}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={cancelButton}>Cancel</button>
                  <button type="submit" style={submitButton}>Update Class</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <aside style={rightPanelStyle} className="right-panel">
          <div style={profileCardStyle}>
            <div style={avatarStyle}>{user.name.charAt(0)}</div>
            <h3 style={{ margin: '12px 0 4px', fontSize: '16px' }}>{user.name}</h3>
            <span style={roleBadgeStyle}>Main Department</span>
          </div>

          <div style={{ marginTop: '40px' }}>
            <div style={sectionHeaderStyle}>
              <h4>System Logs</h4>
              <TrendUp size={18} />
            </div>
            <div style={logListStyle}>
              {logs.slice(0, 5).map((log, i) => (
                <div key={i} style={logItemStyle}>
                  <div style={logDotStyle}></div>
                  <div>
                    <p style={logActionStyle}>{log.action}</p>
                    <p style={logTimeStyle}>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {showAddModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle} className="animate-fadeIn">
              <h3 style={{fontSize: '20px', fontWeight: '800', marginBottom: '20px'}}>New {activeTab.slice(0, -1)}</h3>
              <form onSubmit={handleAddSubmit} style={formStyle}>
                {activeTab === "classes" ? (
                  <>
                    <input placeholder="Class Name" required value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} style={inputStyle} />
                    <input placeholder="Section (e.g. A)" required value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value })} style={inputStyle} />
                    <input placeholder="Academic Year (e.g. 2024-2025)" value={newClass.academic_year} onChange={e => setNewClass({ ...newClass, academic_year: e.target.value })} style={inputStyle} />
                    <select value={newClass.teacher_id} onChange={e => setNewClass({ ...newClass, teacher_id: e.target.value })} style={inputStyle}>
                      <option value="">No Teacher Assigned</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </select>
                  </>
                ) : activeTab === "courses" ? (
                  <>
                    <input placeholder="Course Title" required value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} style={inputStyle} />
                    <textarea placeholder="Description" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} style={{ ...inputStyle, height: '100px' }} />
                    <select value={newCourse.teacher_id} onChange={e => setNewCourse({ ...newCourse, teacher_id: e.target.value })} style={inputStyle}>
                      <option value="">No Teacher Assigned</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <input placeholder="Full Name" required value={newPerson.name} onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} style={inputStyle} />
                    <input placeholder="Email Address" required type="email" value={newPerson.email} onChange={e => setNewPerson({ ...newPerson, email: e.target.value })} style={inputStyle} />
                    <input placeholder="Password" required type="password" value={newPerson.password} onChange={e => setNewPerson({ ...newPerson, password: e.target.value })} style={inputStyle} />
                    
                    {activeTab === "students" && (
                      <>
                        <select 
                          required 
                          value={newPerson.campus_id} 
                          onChange={e => setNewPerson({ ...newPerson, campus_id: e.target.value })} 
                          style={inputStyle}
                        >
                          <option value="">Select Department</option>
                          {campuses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <select 
                          required 
                          value={newPerson.semester} 
                          onChange={e => setNewPerson({ ...newPerson, semester: e.target.value })} 
                          style={inputStyle}
                        >
                          <option value="">Select Semester</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </>
                )}
                <div style={modalActionStyle}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={cancelBtnStyle}>Cancel</button>
                  <button type="submit" style={saveBtnStyle}>Confirm & Add</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- STYLES (Wahi hain jo humne set kiye thay) ---
  const containerStyle = { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const sidebarStyle = { width: '280px', backgroundColor: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '32px 20px' };
  const logoAreaStyle = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', fontWeight: '800', fontSize: '20px' };
  const logoIconStyle = { background: '#4f46e5', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const SidebarBtn = ({ active, icon, label, onClick }) => (
    <button 
      onClick={onClick} 
      className={`nav-btn ${active ? 'active' : ''}`}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '14px', border: 'none', cursor: 'pointer', backgroundColor: active ? '#4f46e5' : 'transparent', color: active ? '#fff' : '#94a3b8', transition: '0.3s', fontWeight: active ? '700' : '500' }}>
      {icon} <span>{label}</span>
    </button>
  );
  const mainStyle = { flex: 1, padding: '48px', overflowY: 'auto' };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' };
  const titleStyle = { fontSize: '28px', fontWeight: '800', margin: 0, color: '#0f172a' };
  const subtitleStyle = { color: '#64748b', marginTop: '6px', fontSize: '15px' };
  const dateBadgeStyle = { backgroundColor: '#fff', padding: '10px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b' };
  const overviewGridStyle = { display: 'flex', flexDirection: 'column', gap: '32px' };
  const statsRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' };
  const MetricBox = ({ label, value, icon, trend }) => (
    <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{label}</p>
          <h2 style={{ margin: '8px 0', fontSize: '32px', fontWeight: '800' }}>{value}</h2>
          {trend && <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '700' }}>{trend}</span>}
        </div>
        <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '16px', color: '#4f46e5' }}>{icon}</div>
      </div>
    </div>
  );
  const chartCardStyle = { backgroundColor: '#fff', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' };
  const tableContainerStyle = { backgroundColor: '#fff', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden' };
  const tableHeaderStyle = { padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' };
  const addBtnStyle = { background: '#0f172a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse' };
  const thStyle = { padding: '18px 32px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', textAlign: 'left' };
  const tableHeadRowStyle = { borderBottom: '1px solid #e2e8f0' };
  const trStyle = { borderBottom: '1px solid #f1f5f9' };
  const tdNameStyle = { padding: '20px 32px', fontWeight: '700', color: '#0f172a' };
  const tdStyle = { padding: '20px 32px', color: '#64748b', fontSize: '14px' };
  const iconBtnStyle = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px' };
  const deleteBtnStyle = { ...iconBtnStyle, color: '#ef4444' };
  const rightPanelStyle = { width: '320px', backgroundColor: '#fff', borderLeft: '1px solid #e2e8f0', padding: '40px 24px' };
  const profileCardStyle = { textAlign: 'center', background: '#f8fafc', padding: '32px 20px', borderRadius: '24px' };
  const avatarStyle = { width: '64px', height: '64px', background: '#4f46e5', color: '#fff', borderRadius: '20px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800' };
  const roleBadgeStyle = { backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' };
  const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modalContentStyle = { background: '#fff', padding: '40px', borderRadius: '32px', width: '450px' };
  const inputStyle = { padding: '14px 18px', borderRadius: '14px', border: '2px solid #f1f5f9', outline: 'none', width: '100%', fontSize: '15px' };
  const logoutBtnStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', borderRadius: '16px', fontWeight: '700' };
  const loadingStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#4f46e5' };
  const actionGroupStyle = { display: 'flex', gap: '8px', justifyContent: 'flex-end' };
  const formStyle = { display: 'flex', flexDirection: 'column', gap: '18px' };
  const modalActionStyle = { display: 'flex', gap: '12px', marginTop: '10px' };
  const cancelBtnStyle = { flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', color: '#64748b' };
  const saveBtnStyle = { flex: 2, padding: '14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700' };
  const sectionHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontWeight: '700' };
  const logListStyle = { display: 'flex', flexDirection: 'column', gap: '18px' };
  const logItemStyle = { display: 'flex', gap: '14px' };
  const logDotStyle = { width: '8px', height: '8px', backgroundColor: '#4f46e5', borderRadius: '50%', marginTop: '6px', flexShrink: 0 };
  const logActionStyle = { margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b' };
  const logTimeStyle = { margin: 0, fontSize: '11px', color: '#94a3b8' };

  // Minimal responsive styles - preserves all colors, only adjusts layout
  const ResponsiveStyles = () => (
    <style>{`
      .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1);
      }
      .add-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -5px rgba(0,0,0,0.3);
      }
      .icon-btn:hover {
        background-color: #f1f5f9 !important;
        color: #4f46e5 !important;
      }
      .delete-btn:hover {
        background-color: #fee2e2 !important;
        color: #ef4444 !important;
      }
      .logout-btn:hover {
        background-color: rgba(239, 68, 68, 0.2) !important;
      }
      tr:hover {
        background-color: #f8fafc;
      }
      input:focus, select:focus, textarea:focus {
        border-color: #4f46e5 !important;
        outline: none !important;
      }
      .nav-btn:hover:not(.active) {
        background-color: rgba(79, 70, 229, 0.1) !important;
        color: #fff !important;
      }
    `}</style>
  );

  export default AdminDashboard;
