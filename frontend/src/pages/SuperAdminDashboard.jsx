import { useState, useEffect, useRef } from "react";
import "../responsive.css";
import { Chart } from "chart.js/auto";
import { House, Buildings, UserCircle, SignOut, Plus, Trash, PencilSimple, Globe, ChartLine, Users, Calendar, ShieldCheck, ChartBar, PlusCircle, NotePencil, List } from "@phosphor-icons/react";

const API = "http://localhost:5000/api";

function SuperAdminDashboard({ user = { name: "Main Department" }, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState({});
  const [departmentStats, setDepartmentStats] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newDepartment, setNewDepartment] = useState({ name: "", location: "", subscription_plan: "basic" });
  const [newHOD, setNewHOD] = useState({ name: "", email: "", password: "", campus_id: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const token = sessionStorage.getItem("token");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ov, cp, pr] = await Promise.all([
        fetch(`${API}/superadmin/overview`, { headers }).then(r => r.json()),
        fetch(`${API}/superadmin/campuses`, { headers }).then(r => r.json()),
        fetch(`${API}/superadmin/principals`, { headers }).then(r => r.json()),
      ]);
      if (ov.success) { setOverview(ov.overview || {}); setDepartmentStats(ov.campusStats || []); }
      if (cp.success) setDepartments(cp.campuses || []);
      if (pr.success) setHods(pr.principals || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => {
    if (chartRef.current && activeTab === "overview" && departmentStats.length > 0) {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: departmentStats.map(c => c.campus_name),
          datasets: [
            { 
              label: 'Students', 
              data: departmentStats.map(c => c.students), 
              backgroundColor: 'rgba(79, 70, 229, 0.8)',
              borderRadius: 8,
              barPercentage: 0.6,
            },
            { 
              label: 'Teachers', 
              data: departmentStats.map(c => c.teachers), 
              backgroundColor: 'rgba(124, 58, 237, 0.8)',
              borderRadius: 8,
              barPercentage: 0.6,
            },
          ]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            legend: { 
              position: 'top',
              labels: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: 600 } }
            } 
          }, 
          scales: { 
            y: { 
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.03)' }
            },
            x: {
              grid: { display: false }
            }
          } 
        }
      });
    }
  }, [activeTab, departmentStats]);

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete this department? All users will be unassigned.")) return;
    const res = await fetch(`${API}/superadmin/campuses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) fetchData(); else alert('❌ ' + data.message);
  };

  const handleDeleteHOD = async (id) => {
    if (!window.confirm("Delete this HOD?")) return;
    const res = await fetch(`${API}/superadmin/principals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) fetchData(); else alert('❌ ' + data.message);
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    const body = editingItem ? { ...editingItem } : newDepartment;
    const url = editingItem ? `${API}/superadmin/campuses/${editingItem.id}` : `${API}/superadmin/campuses`;
    const method = editingItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) { setShowAddModal(false); setEditingItem(null); setNewDepartment({ name: "", location: "", subscription_plan: "basic" }); fetchData(); }
    else alert('❌ ' + data.message);
  };

  const handleAddHOD = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/superadmin/principals`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newHOD)
    });
    const data = await res.json();
    if (data.success) { setShowAddModal(false); setNewHOD({ name: "", email: "", password: "", campus_id: "" }); fetchData(); }
    else alert('❌ ' + data.message);
  };

  if (isLoading) return (
    <div style={S.loadingContainer}>
      <div style={S.loadingSpinner}></div>
      <p style={S.loadingText}>Loading Global Dashboard...</p>
    </div>
  );

  return (
    <div style={S.container}>
      {/* Animated Background Elements */}
      <div style={S.bgOrb1}></div>
      <div style={S.bgOrb2}></div>
      
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="mobile-menu-btn"
      >
        <List size={24} weight="bold" />
      </button>

      {/* Sidebar */}
      <aside style={S.sidebar} className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={S.logoWrapper}>
          <div style={S.logoIcon}><Globe size={24} weight="fill" /></div>
          <span style={S.logoText}>Lancers<span style={S.logoAccent}>Tech</span></span>
        </div>
        
        <div style={S.globalBadge}>
          <ShieldCheck size={14} weight="fill" />
          <span>Global Platform Control</span>
        </div>
        
        <nav style={S.nav}>
          {[
            ['overview', 'Platform Overview', <ChartBar size={20} weight={activeTab === 'overview' ? 'fill' : 'regular'} />],
            ['campuses', 'Departments', <Buildings size={20} weight={activeTab === 'campuses' ? 'fill' : 'regular'} />],
            ['principals', 'HODs', <UserCircle size={20} weight={activeTab === 'principals' ? 'fill' : 'regular'} />]
          ].map(([tab, label, icon]) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              style={{...S.navBtn, ...(activeTab === tab ? S.navBtnActive : {})}}
              className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {icon}
              <span>{label}</span>
              {activeTab === tab && <div style={S.activeIndicator}></div>}
            </button>
          ))}
        </nav>
        
        <button onClick={onLogout} style={S.logoutBtn} className="logout-btn">
          <SignOut size={20} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main style={S.main} className="main-content">
        <header style={S.header}>
          <div>
            <h1 style={S.title}>Global Control Center</h1>
            <p style={S.subtitle}>Platform-wide management — all departments</p>
          </div>
          <div style={S.campusCounter}>
            <Buildings size={16} color="#94a3b8" />
            <span>{overview.totalCampuses || 0} Departments Active</span>
          </div>
        </header>

        {activeTab === "overview" && (
          <div style={S.overviewContainer}>
            {/* Stats Grid */}
            <div style={S.statsGrid} className="stats-grid">
              {[
                ['Total Departments', overview.totalCampuses || 0, '#4f46e5', <Buildings size={24} weight="duotone" />],
                ['Total HODs', overview.totalPrincipals || 0, '#7c3aed', <UserCircle size={24} weight="duotone" />],
                ['Total Teachers', overview.totalTeachers || 0, '#2563eb', <UserCircle size={24} weight="duotone" />],
                ['Total Courses', overview.totalCourses || 0, '#0891b2', <ChartLine size={24} weight="duotone" />],
              ].map(([label, val, color, icon], idx) => (
                <div key={label} style={S.metricCard} className="metric-card">
                  <div style={S.metricIconWrapper( color)}>
                    {icon}
                  </div>
                  <div>
                    <p style={S.metricLabel}>{label}</p>
                    <h2 style={{...S.metricValue, color}}>{val.toLocaleString()}</h2>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={S.chartCard}>
              <div style={S.chartHeader}>
                <h3 style={S.chartTitle}>Students & Teachers per Department</h3>
                <div style={S.chartLegend}>
                  <span style={S.legendItem}><span style={{...S.legendDot, background: '#4f46e5'}}></span> Students</span>
                  <span style={S.legendItem}><span style={{...S.legendDot, background: '#7c3aed'}}></span> Teachers</span>
                </div>
              </div>
              <div style={{ height: '300px', position: 'relative' }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div style={S.tableCard}>
              <div style={S.tableHeader}>
                <h3 style={S.tableTitle}>Department Breakdown</h3>
                <div style={S.tableBadge}>
                  <Calendar size={14} />
                  <span>Real-time stats</span>
                </div>
              </div>
              <div style={S.tableContainer} className="table-container">
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>DEPARTMENT</th>
                      <th style={S.th}>PLAN</th>
                      <th style={S.th}>STUDENTS</th>
                      <th style={S.th}>TEACHERS</th>
                      <th style={S.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.map(c => (
                      <tr key={c.id} style={S.tr}>
                        <td style={S.tdName}>{c.campus_name}</td>
                        <td style={S.td}>
                          <span style={{...S.planBadge, 
                            background: c.subscription_plan === 'premium' ? '#fef3c7' : 
                                       c.subscription_plan === 'standard' ? '#dbeafe' : '#f1f5f9',
                            color: c.subscription_plan === 'premium' ? '#92400e' : 
                                   c.subscription_plan === 'standard' ? '#1e40af' : '#475569'
                          }}>
                            {c.subscription_plan}
                          </span>
                        </td>
                        <td style={S.td}>{c.students}</td>
                        <td style={S.td}>{c.teachers}</td>
                        <td style={S.td}>
                          <span style={{...S.statusBadge, 
                            background: c.is_active ? '#dcfce7' : '#fee2e2',
                            color: c.is_active ? '#166534' : '#991b1b'
                          }}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "campuses" && (
          <div style={S.tableCard}>
            <div style={S.tableHeader}>
              <h2 style={S.tableTitle}>Departments</h2>
              <button 
                onClick={() => { setEditingItem(null); setShowAddModal(true); }} 
                style={S.addBtn}
                className="add-btn"
              >
                <Plus size={18} weight="bold" />
                <span>Add Department</span>
              </button>
            </div>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>NAME</th>
                    <th style={S.th}>LOCATION</th>
                    <th style={S.th}>PLAN</th>
                    <th style={S.th}>STUDENTS</th>
                    <th style={S.th}>TEACHERS</th>
                    <th style={{...S.th, textAlign: 'right'}}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(c => (
                    <tr key={c.id} style={S.tr}>
                      <td style={S.tdName}>{c.name}</td>
                      <td style={S.td}>{c.location || '—'}</td>
                      <td style={S.td}>
                        <span style={{...S.planBadge,
                          background: c.subscription_plan === 'premium' ? '#fef3c7' : 
                                     c.subscription_plan === 'standard' ? '#dbeafe' : '#f1f5f9',
                          color: c.subscription_plan === 'premium' ? '#92400e' : 
                                 c.subscription_plan === 'standard' ? '#1e40af' : '#475569'
                        }}>
                          {c.subscription_plan}
                        </span>
                      </td>
                      <td style={S.td}>{c.student_count || 0}</td>
                      <td style={S.td}>{c.teacher_count || 0}</td>
                      <td style={{...S.td, textAlign: 'right'}}>
                        <div style={S.actionButtons}>
                          <button 
                            style={S.editBtn} 
                            className="edit-btn"
                            onClick={() => { setEditingItem({...c}); setShowAddModal(true); }}
                            title="Edit Department"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button 
                            style={S.deleteBtn} 
                            className="delete-btn"
                            onClick={() => handleDeleteDepartment(c.id)}
                            title="Delete Department"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "principals" && (
          <div style={S.tableCard}>
            <div style={S.tableHeader}>
              <h2 style={S.tableTitle}>HODs</h2>
              <button 
                onClick={() => setShowAddModal(true)} 
                style={S.addBtn}
                className="add-btn"
              >
                <Plus size={18} weight="bold" />
                <span>Add HOD</span>
              </button>
            </div>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>NAME</th>
                    <th style={S.th}>EMAIL</th>
                    <th style={S.th}>DEPARTMENT</th>
                    <th style={S.th}>JOINED</th>
                    <th style={{...S.th, textAlign: 'right'}}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {hods.map(p => (
                    <tr key={p.id} style={S.tr}>
                      <td style={S.tdName}>{p.name}</td>
                      <td style={S.td}>{p.email}</td>
                      <td style={S.td}>
                        <span style={S.campusTag}>{p.campus_name || '—'}</span>
                      </td>
                      <td style={S.td}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{...S.td, textAlign: 'right'}}>
                        <button 
                          style={S.deleteBtn} 
                          className="delete-btn"
                          onClick={() => handleDeleteHOD(p.id)}
                          title="Delete HOD"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Right Panel */}
      <aside style={S.rightPanel} className="right-panel">
        <div style={S.profileCard}>
          <div style={{...S.avatar, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)'}}>
            {user.name.charAt(0)}
          </div>
          <h3 style={S.profileName}>{user.name}</h3>
          <span style={S.roleBadge}>Super Admin</span>
          
          <div style={S.profileStats}>
            <div style={S.profileStat}>
              <span style={S.profileStatLabel}>Last Login</span>
              <span style={S.profileStatValue}>Today 09:24</span>
            </div>
            <div style={S.profileStat}>
              <span style={S.profileStatLabel}>Role</span>
              <span style={S.profileStatValue}>Main Department</span>
            </div>
          </div>
        </div>
        
        <div style={S.platformStats}>
          <h4 style={S.platformStatsTitle}>Platform Stats</h4>
          {[
            ['Departments', overview.totalCampuses || 0, '#4f46e5'],
            ['HODs', overview.totalPrincipals || 0, '#7c3aed'],
            ['Teachers', overview.totalTeachers || 0, '#2563eb'],
            ['Students', overview.totalStudents || 0, '#0891b2']
          ].map(([label, val, color], idx) => (
            <div key={label} style={S.platformStatItem}>
              <span style={S.platformStatLabel}>{label}</span>
              <span style={{...S.platformStatValue, color}}>{val.toLocaleString()}</span>
            </div>
          ))}
        </div>
        
        <div style={S.systemStatus}>
          <div style={S.systemStatusDot}></div>
          <span>All systems operational</span>
        </div>
      </aside>

      {/* Add/Edit Department Modal */}
      {showAddModal && activeTab === "campuses" && (
        <div style={S.overlay} onClick={() => { setShowAddModal(false); setEditingItem(null); }}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>{editingItem ? 'Edit Department' : 'Add New Department'}</h3>
            <form onSubmit={handleAddDepartment} style={S.modalForm}>
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Department Name</label>
                <input 
                  placeholder="e.g., Main Department" 
                  required 
                  value={editingItem ? editingItem.name : newDepartment.name} 
                  onChange={e => editingItem ? setEditingItem({...editingItem, name: e.target.value}) : setNewDepartment({...newDepartment, name: e.target.value})} 
                  style={S.input}
                />
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Location</label>
                <input 
                  placeholder="e.g., New York" 
                  value={editingItem ? editingItem.location : newDepartment.location} 
                  onChange={e => editingItem ? setEditingItem({...editingItem, location: e.target.value}) : setNewDepartment({...newDepartment, location: e.target.value})} 
                  style={S.input}
                />
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Subscription Plan</label>
                <select 
                  value={editingItem ? editingItem.subscription_plan : newDepartment.subscription_plan} 
                  onChange={e => editingItem ? setEditingItem({...editingItem, subscription_plan: e.target.value}) : setNewDepartment({...newDepartment, subscription_plan: e.target.value})} 
                  style={S.input}
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              {editingItem && (
                <div style={S.checkboxGroup}>
                  <input 
                    type="checkbox" 
                    id="activeCheckbox"
                    checked={editingItem.is_active} 
                    onChange={e => setEditingItem({...editingItem, is_active: e.target.checked})} 
                    style={S.checkbox}
                  />
                  <label htmlFor="activeCheckbox" style={S.checkboxLabel}>Active Department</label>
                </div>
              )}
              
              <div style={S.modalActions}>
                <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }} style={S.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={S.saveBtn}>
                  {editingItem ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add HOD Modal */}
      {showAddModal && activeTab === "principals" && (
        <div style={S.overlay} onClick={() => setShowAddModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>Add New HOD</h3>
            <form onSubmit={handleAddHOD} style={S.modalForm}>
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Full Name</label>
                <input 
                  placeholder="e.g., Prof. Ahmed" 
                  required 
                  value={newHOD.name} 
                  onChange={e => setNewHOD({...newHOD, name: e.target.value})} 
                  style={S.input}
                />
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Email Address</label>
                <input 
                  placeholder="hod@department.edu" 
                  required 
                  type="email" 
                  value={newHOD.email} 
                  onChange={e => setNewHOD({...newHOD, email: e.target.value})} 
                  style={S.input}
                />
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Password</label>
                <input 
                  placeholder="••••••••" 
                  required 
                  type="password" 
                  value={newHOD.password} 
                  onChange={e => setNewHOD({...newHOD, password: e.target.value})} 
                  style={S.input}
                />
              </div>
              
              <div style={S.inputGroup}>
                <label style={S.inputLabel}>Assign to Department</label>
                <select 
                  required 
                  value={newHOD.campus_id} 
                  onChange={e => setNewHOD({...newHOD, campus_id: e.target.value})} 
                  style={S.input}
                >
                  <option value="">Select Department...</option>
                  {departments.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div style={S.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} style={S.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={S.saveBtn}>
                  Create HOD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ADVANCED STYLES ====================
const S = {
  // Container & Background
  container: { 
    display: 'flex', 
    minHeight: '100vh', 
    backgroundColor: '#f8fafc', 
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  
  bgOrb1: {
    position: 'fixed',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.15), transparent 70%)',
    top: '-200px',
    left: '-200px',
    zIndex: 0,
    animation: 'float 20s infinite alternate ease-in-out',
  },
  
  bgOrb2: {
    position: 'fixed',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 70% 70%, rgba(124, 58, 237, 0.15), transparent 70%)',
    bottom: '-150px',
    right: '-150px',
    zIndex: 0,
    animation: 'float 25s infinite alternate ease-in-out',
  },

  // Sidebar Styles
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
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
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
  
  globalBadge: {
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

  // Main Content
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
  
  campusCounter: {
    background: '#fff',
    padding: '12px 24px',
    borderRadius: '30px',
    border: '1px solid #e2e8f0',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)',
  },

  // Overview Section
  overviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
  },
  
  metricCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05)',
  },
  
  metricIconWrapper: (color) => ({
    width: '56px',
    height: '56px',
    borderRadius: '20px',
    background: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color,
  }),
  
  metricLabel: { 
    margin: 0, 
    fontSize: '0.9rem', 
    fontWeight: '600', 
    color: '#64748b',
    letterSpacing: '0.02em',
  },
  
  metricValue: { 
    margin: '4px 0 0', 
    fontSize: '2rem', 
    fontWeight: '800',
  },
  
  chartCard: {
    backgroundColor: '#fff',
    padding: '28px',
    borderRadius: '32px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },
  
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  
  chartTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1.2rem',
    color: '#0f172a',
  },
  
  chartLegend: {
    display: 'flex',
    gap: '16px',
  },
  
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#475569',
  },
  
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '4px',
  },
  
  tableCard: {
    backgroundColor: '#fff',
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
  
  tableBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: '#f1f5f9',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#475569',
  },
  
  tableContainer: {
    overflowX: 'auto',
  },
  
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  
  th: {
    padding: '18px 28px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
    textAlign: 'left',
    borderBottom: '1px solid #e2e8f0',
  },
  
  tr: {
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
  
  planBadge: {
    padding: '4px 12px',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  
  campusTag: {
    padding: '4px 12px',
    borderRadius: '30px',
    background: '#f0fdf4',
    color: '#166534',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  
  actionButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  
  editBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },
  
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },
  
  addBtn: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
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

  // Right Panel
  rightPanel: {
    width: '320px',
    backgroundColor: '#fff',
    borderLeft: '1px solid #e2e8f0',
    padding: '40px 24px',
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
    background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
    padding: '32px 20px',
    borderRadius: '32px',
    border: '1px solid #e2e8f0',
    marginBottom: '32px',
  },
  
  avatar: {
    width: '80px',
    height: '80px',
    color: '#fff',
    borderRadius: '28px',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '800',
    boxShadow: '0 15px 30px -10px rgba(79, 70, 229, 0.3)',
  },
  
  profileName: {
    margin: '0 0 8px',
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#0f172a',
  },
  
  roleBadge: {
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '700',
    background: '#e0e7ff',
    color: '#3730a3',
    display: 'inline-block',
  },
  
  profileStats: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9',
  },
  
  profileStat: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  
  profileStatLabel: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '600',
  },
  
  profileStatValue: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  
  platformStats: {
    marginTop: '32px',
  },
  
  platformStatsTitle: {
    fontWeight: '700',
    marginBottom: '20px',
    fontSize: '1rem',
    color: '#0f172a',
  },
  
  platformStatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  
  platformStatLabel: {
    fontSize: '0.9rem',
    color: '#64748b',
    fontWeight: '600',
  },
  
  platformStatValue: {
    fontWeight: '800',
    fontSize: '1rem',
  },
  
  systemStatus: {
    marginTop: '32px',
    padding: '16px',
    background: '#f0fdf4',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#166534',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  
  systemStatusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 2s infinite',
  },

  // Modal Styles
  overlay: { 
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
    width: '480px', 
    maxHeight: '90vh', 
    overflowY: 'auto',
    boxShadow: '0 50px 70px -20px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease',
  },
  
  modalTitle: {
    fontWeight: '800',
    fontSize: '1.5rem',
    marginBottom: '28px',
    color: '#0f172a',
    letterSpacing: '-0.02em',
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
  },
  
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
  },
  
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#4f46e5',
  },
  
  checkboxLabel: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#0f172a',
    cursor: 'pointer',
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
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '30px', 
    cursor: 'pointer', 
    fontWeight: '700',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 10px 20px -8px rgba(79, 70, 229, 0.5)',
  },

  // Loading State
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: '#f8fafc',
  },
  
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  loadingText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#4f46e5',
  },
};

// Add global keyframes
const style = document.createElement('style');
style.textContent = `
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
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .metric-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -10px rgba(79, 70, 229, 0.15);
    border-color: #cbd5e1;
  }
  
  .nav-btn:hover:not(.active) {
    background: rgba(79, 70, 229, 0.1) !important;
    color: #fff !important;
  }
  
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2) !important;
    border-color: rgba(239, 68, 68, 0.3) !important;
  }
  
  .add-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px -8px rgba(79, 70, 229, 0.6);
  }
  
  .edit-btn:hover {
    background: #e0e7ff;
  }
  
  .delete-btn:hover {
    background: #fee2e2;
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

  .metric-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -10px rgba(79, 70, 229, 0.15);
    border-color: #cbd5e1;
  }

  tr:hover {
    background: #f8fafc;
  }

  .add-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px -8px rgba(79, 70, 229, 0.6);
  }

  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 25px -8px rgba(79, 70, 229, 0.6);
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2) !important;
  }

  .nav-btn:hover:not(.active) {
    background: rgba(79, 70, 229, 0.1) !important;
  }
`;
document.head.appendChild(style);

export default SuperAdminDashboard;
