import { useState, useEffect, useRef } from "react";
import "../responsive.css";
import { Chart } from "chart.js/auto";
import {
  House, Buildings, Briefcase, Users, UserPlus, SignOut, Plus, Trash,
  PencilSimple, TrendUp, Globe, CheckCircle, ArrowRight, Clock,
  CalendarBlank, DotsThreeOutline, Star, Bell, Warning, Pulse,
  ChalkboardTeacher, BookOpen
} from "@phosphor-icons/react";

const API = "http://localhost:5000/api/bd";

const LEAD_STATUSES = ['prospect', 'contacted', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
const LEAD_COLORS = { prospect: '#94a3b8', contacted: '#60a5fa', proposal: '#a78bfa', negotiation: '#f59e0b', closed_won: '#22c55e', closed_lost: '#ef4444' };
const BATCH_STATUSES = ['planning', 'recruiting', 'onboarding', 'completed', 'cancelled'];
const APPLICANT_STATUSES = ['applied', 'shortlisted', 'interviewed', 'hired', 'rejected'];

function BDDashboard({ user = { name: "BD Manager" }, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [pipeline, setPipeline] = useState([]);
  const [leads, setLeads] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [batches, setBatches] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [globalStats, setGlobalStats] = useState({});
  const [globalCampuses, setGlobalCampuses] = useState([]);
  const [globalTeachers, setGlobalTeachers] = useState([]);
  const [globalStudents, setGlobalStudents] = useState([]);
  const [globalClasses, setGlobalClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [ov, l, j, a, b, gs, gc, gt, gs2, gcl] = await Promise.all([
        fetch(`${API}/overview`, { headers }).then(r => r.json()),
        fetch(`${API}/leads`, { headers }).then(r => r.json()),
        fetch(`${API}/jobs`, { headers }).then(r => r.json()),
        fetch(`${API}/applicants`, { headers }).then(r => r.json()),
        fetch(`${API}/bulk-hires`, { headers }).then(r => r.json()),
        fetch(`${API}/global/stats`, { headers }).then(r => r.json()),
        fetch(`${API}/global/campuses`, { headers }).then(r => r.json()),
        fetch(`${API}/global/teachers`, { headers }).then(r => r.json()),
        fetch(`${API}/global/students`, { headers }).then(r => r.json()),
        fetch(`${API}/global/classes`, { headers }).then(r => r.json()),
      ]);
      if (ov.success) { setStats(ov.stats || {}); setPipeline(ov.pipeline || []); }
      if (l.success) setLeads(l.leads || []);
      if (j.success) setJobs(j.jobs || []);
      if (a.success) setApplicants(a.applicants || []);
      if (b.success) setBatches(b.batches || []);
      if (gs.success) setGlobalStats(gs.stats || {});
      if (gc.success) setGlobalCampuses(gc.campuses || []);
      if (gt.success) setGlobalTeachers(gt.teachers || []);
      if (gs2.success) setGlobalStudents(gs2.students || []);
      if (gcl.success) setGlobalClasses(gcl.classes || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => {
    if (chartRef.current && activeTab === "overview" && pipeline.length > 0) {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: pipeline.map(p => p.status.replace('_', ' ')),
          datasets: [{
            data: pipeline.map(p => p.count),
            backgroundColor: pipeline.map(p => LEAD_COLORS[p.status] || '#94a3b8'),
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 600 } } },
            tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#94a3b8' }
          },
          cutout: '70%',
          animation: { animateRotate: true, duration: 1000 }
        }
      });
    }
  }, [activeTab, pipeline]);

  const openAdd = () => { setEditingItem(null); setForm({}); setShowModal(true); };
  const openEdit = (item) => { setEditingItem(item); setForm({ ...item }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpointMap = { leads: 'leads', jobs: 'jobs', applicants: 'applicants', bulkhires: 'bulk-hires' };
    const tabKey = activeTab === 'bulkhires' ? 'bulkhires' : activeTab;
    const url = editingItem
      ? `${API}/${endpointMap[tabKey]}/${editingItem.id}`
      : `${API}/${endpointMap[tabKey]}`;
    const method = editingItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setShowModal(false); fetchAll(); } else alert('❌ ' + data.message);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    const endpointMap = { leads: 'leads', jobs: 'jobs', applicants: 'applicants', bulkhires: 'bulk-hires' };
    const tabKey = activeTab === 'bulkhires' ? 'bulkhires' : activeTab;
    const res = await fetch(`${API}/${endpointMap[tabKey]}/${id}`, { method: 'DELETE', headers });
    const data = await res.json();
    if (data.success) fetchAll(); else alert('❌ ' + data.message);
  };

  const handleApplicantStatus = async (id, status) => {
    const res = await fetch(`${API}/applicants/${id}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (data.success) fetchAll(); else alert('❌ ' + data.message);
  };

  if (isLoading) return (
    <div style={S.loadingContainer}>
      <div style={S.loadingSpinner}></div>
      <p style={S.loadingText}>Loading BD Portal...</p>
    </div>
  );

  return (
    <div style={S.container}>
      {/* Animated Background Orbs - Indigo theme */}
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

      {/* Sidebar - Navy blue gradient */}
      <aside style={S.sidebar} className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={S.logoWrapper}>
          <div style={S.logoIcon}><Briefcase size={24} weight="fill" /></div>
          <span style={S.logoText}>BD<span style={S.logoAccent}>Portal</span></span>
        </div>

        <div style={S.bdBadge}>
          <Briefcase size={14} weight="fill" />
          <span>Business Development</span>
          <div style={S.liveIndicator}></div>
        </div>

        <nav style={S.nav}>
          {[
            ['overview', 'Overview', <House size={20} />, null],
            ['leads', 'Dept Leads', <Buildings size={20} />, stats.totalLeads],
            ['jobs', 'Job Postings', <Briefcase size={20} />, stats.openJobs],
            ['applicants', 'Applicants', <Users size={20} />, stats.totalApplicants],
            ['bulkhires', 'Bulk Hire', <UserPlus size={20} />, stats.activeBatches],
            ['all_campuses', 'All Departments', <Buildings size={20} weight="duotone" />, globalStats.totalCampuses],
            ['all_teachers', 'All Teachers', <ChalkboardTeacher size={20} />, globalStats.totalTeachers],
            ['all_students', 'All Students', <Users size={20} weight="duotone" />, globalStats.totalStudents],
            ['all_classes', 'All Classes', <BookOpen size={20} />, globalStats.totalClasses],
          ].map(([tab, label, icon, count]) => (
            <SidebarBtn
              key={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              icon={icon}
              label={label}
              count={count}
            />
          ))}
        </nav>

        <button onClick={onLogout} style={S.logoutBtn} className="logout-btn">
          <SignOut size={20} /> <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main style={S.main} className="main-content">
        <header style={S.header}>
          <div>
            <h1 style={S.title}>
              {activeTab === 'overview' ? 'BD Overview' :
               activeTab === 'leads' ? 'Department Leads' :
               activeTab === 'jobs' ? 'Job Postings' :
               activeTab === 'applicants' ? 'Applicants' :
               activeTab === 'bulkhires' ? 'Bulk Hire' :
               activeTab === 'all_campuses' ? 'Global Departments' :
               activeTab === 'all_teachers' ? 'Global Teachers' :
               activeTab === 'all_students' ? 'Global Students' : 'Global Classes'}
            </h1>
            <p style={S.subtitle}>Welcome back, <span style={S.userName}>{user.name}</span></p>
          </div>
          <div style={S.headerActions}>
            {!['overview', 'all_campuses', 'all_teachers', 'all_students', 'all_classes'].includes(activeTab) && (
              <button onClick={openAdd} style={S.addBtn} className="add-btn">
                <Plus size={18} weight="bold" /> Add New
              </button>
            )}
            <div style={S.dateBadge}>
              <CalendarBlank size={18} /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={S.overviewContainer}>
            {/* Stats Grid */}
            <div style={S.statsGrid} className="stats-grid">
              <MetricBox
                label="Total Leads"
                value={stats.totalLeads || 0}
                icon={<Buildings weight="duotone" />}
                color="#4f46e5"
                trend="+12% this month"
              />
              <MetricBox
                label="Won Deals"
                value={stats.wonLeads || 0}
                icon={<CheckCircle weight="duotone" />}
                color="#22c55e"
                trend="PKR 2.5M"
              />
              <MetricBox
                label="Open Jobs"
                value={stats.openJobs || 0}
                icon={<Briefcase weight="duotone" />}
                color="#3b82f6"
                trend={`${stats.totalApplicants || 0} applicants`}
              />
              <MetricBox
                label="Total Students"
                value={globalStats.totalStudents || 0}
                icon={<Users weight="duotone" />}
                color="#8b5cf6"
                trend={`${globalStats.totalTeachers || 0} teachers`}
              />
            </div>

            {/* Charts Row */}
            <div style={S.chartsRow}>
              <div style={S.chartCard}>
                <div style={S.chartHeader}>
                  <h3 style={S.chartTitle}>Lead Pipeline</h3>
                  <Pulse size={20} color="#4f46e5" weight="duotone" />
                </div>
                <div style={{ height: '260px' }}>
                  <canvas ref={chartRef}></canvas>
                </div>
              </div>
              <div style={S.chartCard}>
                <div style={S.chartHeader}>
                  <h3 style={S.chartTitle}>Pipeline Stages</h3>
                  <TrendUp size={20} color="#4f46e5" weight="duotone" />
                </div>
                <div style={S.pipelineStages}>
                  {LEAD_STATUSES.map(status => {
                    const found = pipeline.find(p => p.status === status);
                    const count = found ? found.count : 0;
                    const total = pipeline.reduce((s, p) => s + Number(p.count), 0) || 1;
                    const percentage = Math.round((count / total) * 100);
                    return (
                      <div key={status} style={S.stageItem}>
                        <div style={S.stageHeader}>
                          <span style={{ ...S.stageName, color: LEAD_COLORS[status] }}>
                            {status.replace('_', ' ')}
                          </span>
                          <span style={S.stageCount}>{count} ({percentage}%)</span>
                        </div>
                        <div style={S.progressBarBg}>
                          <div style={{
                            ...S.progressBarFill,
                            background: LEAD_COLORS[status],
                            width: `${percentage}%`
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={S.recentActivityCard}>
              <div style={S.recentHeader}>
                <h4 style={S.recentTitle}>Recent Activity</h4>
                <Bell size={18} color="#64748b" />
              </div>
              <div style={S.activityList}>
                {leads.slice(0, 3).map((lead, i) => (
                  <div key={i} style={S.activityItem}>
                    <div style={S.activityDot}></div>
                    <div style={S.activityContent}>
                      <span style={S.activityText}>New lead: {lead.institution_name}</span>
                      <span style={S.activityTime}>{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {applicants.slice(0, 2).map((app, i) => (
                  <div key={i} style={S.activityItem}>
                    <div style={S.activityDot}></div>
                    <div style={S.activityContent}>
                      <span style={S.activityText}>Applicant {app.name} applied for {app.job_title}</span>
                      <span style={S.activityTime}>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEADS */}
        {activeTab === 'leads' && (
          <div style={S.tableCard}>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>INSTITUTION</th>
                    <th style={S.th}>CONTACT</th>
                    <th style={S.th}>CITY</th>
                    <th style={S.th}>DEAL VALUE</th>
                    <th style={S.th}>STATUS</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} style={S.tableRow}>
                      <td style={S.tdName}>{l.institution_name}</td>
                      <td style={S.td}>
                        {l.contact_person || '—'}<br />
                        <span style={S.tdSub}>{l.contact_email}</span>
                      </td>
                      <td style={S.td}>{l.city || '—'}</td>
                      <td style={S.td}>
                        <span style={S.dealValue}>PKR {Number(l.deal_value || 0).toLocaleString()}</span>
                      </td>
                      <td style={S.td}>
                        <span style={{...S.statusBadge, background: LEAD_COLORS[l.status] + '22', color: LEAD_COLORS[l.status]}}>
                          {l.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={S.actionGroup}>
                          <button style={S.iconBtn} className="icon-btn" onClick={() => openEdit(l)} title="Edit"><PencilSimple size={16} /></button>
                          <button style={S.deleteBtn} className="delete-btn" onClick={() => handleDelete(l.id)} title="Delete"><Trash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan="6" style={S.emptyTableCell}>No leads yet. Add your first department lead!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JOB POSTINGS */}
        {activeTab === 'jobs' && (
          <div style={S.jobsContainer}>
            {/* Share Link Banner - Indigo gradient */}
            <div style={S.shareBanner}>
              <div>
                <p style={S.bannerTitle}>🔗 Public Application Link</p>
                <p style={S.bannerSubtitle}>Share this link so candidates can apply directly</p>
              </div>
              <div style={S.bannerActions}>
                <code style={S.bannerCode}>{window.location.origin}/apply</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/apply`); alert('✅ Link copied!'); }}
                  style={S.bannerCopyBtn}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={S.tableCard}>
              <div style={S.tableContainer} className="table-container">
                <table style={S.table}>
                  <thead>
                    <tr style={S.tableHeadRow}>
                      <th style={S.th}>TITLE</th>
                      <th style={S.th}>SUBJECT</th>
                      <th style={S.th}>DEPARTMENT</th>
                      <th style={S.th}>SLOTS</th>
                      <th style={S.th}>APPLICANTS</th>
                      <th style={S.th}>STATUS</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id} style={S.tableRow}>
                        <td style={S.tdName}>
                          {j.title}
                          <button
                            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/apply/${j.invite_token || j.id}`); alert('✅ Link copied!'); }}
                            style={S.copyLinkBtn}
                          >
                            🔗 Copy apply link
                          </button>
                        </td>
                        <td style={S.td}>{j.subject || '—'}</td>
                        <td style={S.td}>{j.campus_name || 'Any'}</td>
                        <td style={S.td}>
                          <span style={S.slotsBadge}>{j.slots_filled}/{j.slots_available}</span>
                        </td>
                        <td style={S.td}>
                          <span style={S.applicantCount}>{j.applicant_count || 0}</span>
                        </td>
                        <td style={S.td}>
                          <span style={{...S.statusBadge, background: j.status === 'open' ? '#dcfce7' : '#f1f5f9', color: j.status === 'open' ? '#166534' : '#64748b'}}>
                            {j.status}
                          </span>
                        </td>
                        <td style={{ ...S.td, textAlign: 'right' }}>
                          <div style={S.actionGroup}>
                            <button style={S.iconBtn} onClick={() => openEdit(j)}><PencilSimple size={16} /></button>
                            <button style={S.deleteBtn} onClick={() => handleDelete(j.id)}><Trash size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr><td colSpan="7" style={S.emptyTableCell}>No job postings yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* APPLICANTS */}
        {activeTab === 'applicants' && (
          <div style={S.tableCard}>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>NAME</th>
                    <th style={S.th}>EMAIL</th>
                    <th style={S.th}>JOB</th>
                    <th style={S.th}>EXP (YRS)</th>
                    <th style={S.th}>STATUS</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map(a => (
                    <tr key={a.id} style={S.tableRow}>
                      <td style={S.tdName}>{a.name}</td>
                      <td style={S.td}>{a.email}</td>
                      <td style={S.td}>{a.job_title || '—'}</td>
                      <td style={S.td}>{a.experience_years} yrs</td>
                      <td style={S.td}>
                        <select
                          value={a.status}
                          onChange={e => handleApplicantStatus(a.id, e.target.value)}
                          style={{...S.statusSelect, background: a.status === 'hired' ? '#dcfce7' : a.status === 'rejected' ? '#fee2e2' : '#f8fafc', color: a.status === 'hired' ? '#166534' : a.status === 'rejected' ? '#991b1b' : '#374151'}}
                        >
                          {APPLICANT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <button style={S.deleteBtn} onClick={() => handleDelete(a.id)}><Trash size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {applicants.length === 0 && (
                    <tr><td colSpan="6" style={S.emptyTableCell}>No applicants yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BULK HIRES */}
        {activeTab === 'bulkhires' && (
          <div style={S.tableCard}>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>BATCH NAME</th>
                    <th style={S.th}>DEPARTMENT</th>
                    <th style={S.th}>TEACHERS NEEDED</th>
                    <th style={S.th}>SUBJECTS</th>
                    <th style={S.th}>TARGET DATE</th>
                    <th style={S.th}>STATUS</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={S.tableRow}>
                      <td style={S.tdName}>{b.batch_name}</td>
                      <td style={S.td}>{b.campus_name || 'Any'}</td>
                      <td style={S.td}>
                        <span style={S.teacherCount}>{b.teacher_count}</span>
                      </td>
                      <td style={S.td}>{b.subject_areas || '—'}</td>
                      <td style={S.td}>{b.target_date ? new Date(b.target_date).toLocaleDateString() : '—'}</td>
                      <td style={S.td}>
                        <span style={{...S.statusBadge,
                          background: b.status === 'completed' ? '#dcfce7' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                          color: b.status === 'completed' ? '#166534' : b.status === 'cancelled' ? '#991b1b' : '#92400e'
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={S.actionGroup}>
                          <button style={S.iconBtn} onClick={() => openEdit(b)}><PencilSimple size={16} /></button>
                          <button style={S.deleteBtn} onClick={() => handleDelete(b.id)}><Trash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr><td colSpan="7" style={S.emptyTableCell}>No bulk hire batches yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOBAL CAMPUSES */}
        {activeTab === 'all_campuses' && (
          <div style={S.tableCard}>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>DEPARTMENT NAME</th>
                    <th style={S.th}>LOCATION</th>
                    <th style={S.th}>HOD</th>
                    <th style={S.th}>TEACHERS</th>
                    <th style={S.th}>STUDENTS</th>
                    <th style={S.th}>CLASSES</th>
                  </tr>
                </thead>
                <tbody>
                  {globalCampuses.map(c => (
                    <tr key={c.id} style={S.tableRow}>
                      <td style={S.tdName}>{c.name}</td>
                      <td style={S.td}>{c.location || '—'}</td>
                      <td style={S.td}>{c.hod_name || '—'}</td>
                      <td style={S.td}>{c.teacher_count}</td>
                      <td style={S.td}>{c.student_count}</td>
                      <td style={S.td}>
                        <span style={S.teacherCount}>{c.class_count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOBAL TEACHERS */}
        {activeTab === 'all_teachers' && (
          <div style={S.tableCard}>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>NAME</th>
                    <th style={S.th}>EMAIL</th>
                    <th style={S.th}>DEPARTMENT</th>
                    <th style={S.th}>JOINED</th>
                  </tr>
                </thead>
                <tbody>
                  {globalTeachers.map(t => (
                    <tr key={t.id} style={S.tableRow}>
                      <td style={S.tdName}>{t.name}</td>
                      <td style={S.td}>{t.email}</td>
                      <td style={S.td}>{t.campus_name || '—'}</td>
                      <td style={S.td}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOBAL STUDENTS */}
        {activeTab === 'all_students' && (
          <div style={S.tableCard}>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>NAME</th>
                    <th style={S.th}>EMAIL</th>
                    <th style={S.th}>DEPARTMENT</th>
                    <th style={S.th}>JOINED</th>
                  </tr>
                </thead>
                <tbody>
                  {globalStudents.map(s => (
                    <tr key={s.id} style={S.tableRow}>
                      <td style={S.tdName}>{s.name}</td>
                      <td style={S.td}>{s.email}</td>
                      <td style={S.td}>{s.campus_name || '—'}</td>
                      <td style={S.td}>{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOBAL CLASSES */}
        {activeTab === 'all_classes' && (
          <div style={S.tableCard}>
            <div style={S.tableContainer} className="table-container">
              <table style={S.table}>
                <thead>
                  <tr style={S.tableHeadRow}>
                    <th style={S.th}>CLASS NAME</th>
                    <th style={S.th}>SECTION</th>
                    <th style={S.th}>TEACHER</th>
                    <th style={S.th}>DEPARTMENT</th>
                    <th style={S.th}>YEAR</th>
                  </tr>
                </thead>
                <tbody>
                  {globalClasses.map(cl => (
                    <tr key={cl.id} style={S.tableRow}>
                      <td style={S.tdName}>{cl.name}</td>
                      <td style={S.td}>{cl.section}</td>
                      <td style={S.td}>{cl.teacher_name || '—'}</td>
                      <td style={S.td}>{cl.campus_name || '—'}</td>
                      <td style={S.td}>{cl.academic_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Right Panel - Updated to indigo theme */}
      <aside style={S.rightPanel} className="right-panel">
        <div style={S.profileCard}>
          <div style={S.avatar}>{user.name.charAt(0)}</div>
          <h3 style={S.profileName}>{user.name}</h3>
          <span style={S.roleBadge}>BD Agent</span>

          <div style={S.profileStats}>
            <div style={S.profileStat}>
              <span>Deals Won</span>
              <strong>{stats.wonLeads || 0}</strong>
            </div>
            <div style={S.profileStat}>
              <span>Conversion</span>
              <strong>
                {stats.totalLeads ? Math.round((stats.wonLeads / stats.totalLeads) * 100) : 0}%
              </strong>
            </div>
          </div>
        </div>

        <div style={S.quickStatsCard}>
          <h4 style={S.quickStatsTitle}>Quick Stats</h4>
          <div style={S.quickStatsList}>
            {[
              ['Total Leads', stats.totalLeads || 0],
              ['Won Deals', stats.wonLeads || 0],
              ['Open Jobs', stats.openJobs || 0],
              ['Applicants', stats.totalApplicants || 0],
              ['Hired', stats.hiredCount || 0],
              ['Active Batches', stats.activeBatches || 0],
            ].map(([label, val]) => (
              <div key={label} style={S.quickStatItem}>
                <span style={S.quickStatLabel}>{label}</span>
                <span style={S.quickStatValue}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.shareCard}>
          <div style={S.shareHeader}>
            <Globe size={18} color="#4f46e5" />
            <span>Share Apply Page</span>
          </div>
          <p style={S.shareText}>Send this link to candidates:</p>
          <code style={S.shareCode}>{window.location.origin}/apply</code>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/apply`); alert('✅ Copied!'); }}
            style={S.shareBtn}
            className="share-btn"
          >
            Copy Link
          </button>
        </div>
      </aside>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={S.modalOverlay} onClick={() => setShowModal(false)} className="modal-overlay">
          <div style={S.modal} onClick={e => e.stopPropagation()} className="modal animate-slideUp">
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>
                {editingItem ? 'Edit' : 'Add'} {
                  activeTab === 'leads' ? 'Department Lead' :
                  activeTab === 'jobs' ? 'Job Posting' :
                  activeTab === 'applicants' ? 'Applicant' : 'Bulk Hire Batch'
                }
              </h3>
              <button onClick={() => setShowModal(false)} style={S.modalClose} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} style={S.modalForm}>

              {activeTab === 'leads' && (
                <>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Institution Name *</label>
                    <input placeholder="e.g., Beaconhouse School" required value={form.institution_name || ''} onChange={e => setForm({ ...form, institution_name: e.target.value })} style={S.input} />
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Contact Person</label>
                    <input placeholder="e.g., John Smith" value={form.contact_person || ''} onChange={e => setForm({ ...form, contact_person: e.target.value })} style={S.input} />
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Contact Email</label>
                      <input placeholder="email@example.com" type="email" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Phone</label>
                      <input placeholder="+92 300 1234567" value={form.contact_phone || ''} onChange={e => setForm({ ...form, contact_phone: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>City</label>
                      <input placeholder="Lahore" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Deal Value (PKR)</label>
                      <input placeholder="500000" type="number" value={form.deal_value || ''} onChange={e => setForm({ ...form, deal_value: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Status</label>
                    <select value={form.status || 'prospect'} onChange={e => setForm({ ...form, status: e.target.value })} style={S.input}>
                      {LEAD_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Notes</label>
                    <textarea placeholder="Additional notes..." value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...S.input, height: '80px', resize: 'vertical' }} />
                  </div>
                </>
              )}

              {activeTab === 'jobs' && (
                <>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Job Title *</label>
                    <input placeholder="e.g., Mathematics Teacher" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} style={S.input} />
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Subject Area</label>
                      <input placeholder="e.g., Mathematics" value={form.subject || ''} onChange={e => setForm({ ...form, subject: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Department</label>
                      <select value={form.campus_id || ''} onChange={e => setForm({ ...form, campus_id: e.target.value })} style={S.input}>
                        <option value="">Any Department</option>
                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Slots Available *</label>
                      <input type="number" min="1" value={form.slots_available || 1} onChange={e => setForm({ ...form, slots_available: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Experience Required</label>
                      <input placeholder="e.g., 2+ years" value={form.experience_required || ''} onChange={e => setForm({ ...form, experience_required: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Salary Range</label>
                      <input placeholder="e.g., 50k-80k" value={form.salary_range || ''} onChange={e => setForm({ ...form, salary_range: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Application Deadline</label>
                      <input type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  {editingItem && (
                    <div style={S.inputGroup}>
                      <label style={S.inputLabel}>Status</label>
                      <select value={form.status || 'open'} onChange={e => setForm({ ...form, status: e.target.value })} style={S.input}>
                        {['open', 'in_progress', 'filled', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Job Description</label>
                    <textarea placeholder="Describe the role..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...S.input, height: '80px', resize: 'vertical' }} />
                  </div>
                </>
              )}

              {activeTab === 'applicants' && (
                <>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Select Job Posting *</label>
                    <select required value={form.job_id || ''} onChange={e => setForm({ ...form, job_id: e.target.value })} style={S.input}>
                      <option value="">Select a job...</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Full Name *</label>
                    <input placeholder="e.g., John Doe" required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} style={S.input} />
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Email *</label>
                      <input placeholder="email@example.com" required type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Phone</label>
                      <input placeholder="+92 300 1234567" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Experience (years)</label>
                      <input type="number" min="0" value={form.experience_years || 0} onChange={e => setForm({ ...form, experience_years: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Subjects</label>
                      <input placeholder="e.g., Math, Physics" value={form.subjects || ''} onChange={e => setForm({ ...form, subjects: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Notes</label>
                    <textarea placeholder="Additional notes..." value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...S.input, height: '60px', resize: 'vertical' }} />
                  </div>
                </>
              )}

              {activeTab === 'bulkhires' && (
                <>
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Batch Name *</label>
                    <input placeholder="e.g., Summer Recruitment 2026" required value={form.batch_name || ''} onChange={e => setForm({ ...form, batch_name: e.target.value })} style={S.input} />
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Department</label>
                      <select value={form.campus_id || ''} onChange={e => setForm({ ...form, campus_id: e.target.value })} style={S.input}>
                        <option value="">Any Department</option>
                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Teachers Needed *</label>
                      <input type="number" min="1" required value={form.teacher_count || ''} onChange={e => setForm({ ...form, teacher_count: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  <div style={S.row}>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Subject Areas</label>
                      <input placeholder="e.g., Math, Science" value={form.subject_areas || ''} onChange={e => setForm({ ...form, subject_areas: e.target.value })} style={S.input} />
                    </div>
                    <div style={S.flex1}>
                      <label style={S.inputLabel}>Target Date</label>
                      <input type="date" value={form.target_date ? form.target_date.split('T')[0] : ''} onChange={e => setForm({ ...form, target_date: e.target.value })} style={S.input} />
                    </div>
                  </div>
                  {editingItem && (
                    <div style={S.inputGroup}>
                      <label style={S.inputLabel}>Status</label>
                      <select value={form.status || 'planning'} onChange={e => setForm({ ...form, status: e.target.value })} style={S.input}>
                        {BATCH_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={S.inputGroup}>
                    <label style={S.inputLabel}>Notes</label>
                    <textarea placeholder="Additional notes..." value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...S.input, height: '60px', resize: 'vertical' }} />
                  </div>
                </>
              )}

              <div style={S.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={S.cancelBtn} className="cancel-btn">Cancel</button>
                <button type="submit" style={S.saveBtn} className="save-btn">{editingItem ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PROFESSIONAL STYLES - INDIGO THEME ====================
const S = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },

  // Animated Background Orbs - Indigo
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
    background: 'radial-gradient(circle at 50% 50%, rgba(129, 140, 248, 0.08), transparent 70%)',
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

  bdBadge: {
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

  userName: {
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

  // Overview
  overviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
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
    marginTop: '4px',
  },

  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
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
    fontSize: '1rem',
    color: '#0f172a',
  },

  pipelineStages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  stageItem: {
    width: '100%',
  },

  stageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },

  stageName: {
    fontSize: '0.8rem',
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  stageCount: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
  },

  progressBarBg: {
    background: '#f1f5f9',
    borderRadius: '8px',
    height: '8px',
    width: '100%',
  },

  progressBarFill: {
    height: '8px',
    borderRadius: '8px',
    transition: 'width 0.4s ease',
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

  activityText: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#0f172a',
  },

  activityTime: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  },

  // Table Styles
  tableCard: {
    background: '#fff',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },

  tableContainer: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },

  tableHeadRow: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },

  th: {
    padding: '16px 24px',
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

  tdSub: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  },

  emptyTableCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },

  statusBadge: {
    padding: '4px 12px',
    borderRadius: '30px',
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'capitalize',
    display: 'inline-block',
  },

  dealValue: {
    fontWeight: '700',
    color: '#4f46e5',
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

  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },

  // Jobs
  jobsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  shareBanner: {
    background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
    borderRadius: '20px',
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },

  bannerTitle: {
    margin: 0,
    color: '#fff',
    fontWeight: '800',
    fontSize: '1rem',
  },

  bannerSubtitle: {
    margin: '4px 0 0',
    color: '#a5b4fc',
    fontSize: '0.85rem',
  },

  bannerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },

  bannerCode: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
  },

  bannerCopyBtn: {
    background: '#fff',
    color: '#0f172a',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '800',
    fontSize: '0.85rem',
  },

  copyLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontSize: '0.7rem',
    cursor: 'pointer',
    padding: '2px 0',
    display: 'block',
    fontWeight: '700',
  },

  slotsBadge: {
    fontWeight: '700',
    color: '#0f172a',
  },

  applicantCount: {
    background: '#ede9fe',
    color: '#4f46e5',
    padding: '3px 10px',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },

  statusSelect: {
    padding: '5px 10px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
  },

  teacherCount: {
    fontWeight: '800',
    fontSize: '1.1rem',
    color: '#4f46e5',
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

  roleBadge: {
    background: '#e0e7ff',
    color: '#4f46e5',
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
    '& span': {
      display: 'block',
      fontSize: '0.7rem',
      color: '#64748b',
      marginBottom: '4px',
    },
    '& strong': {
      fontSize: '1.2rem',
      color: '#4f46e5',
      fontWeight: '800',
    },
  },

  quickStatsCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
  },

  quickStatsTitle: {
    margin: '0 0 16px',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#0f172a',
  },

  quickStatsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  quickStatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },

  quickStatLabel: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '600',
  },

  quickStatValue: {
    fontWeight: '800',
    color: '#4f46e5',
  },

  shareCard: {
    background: '#f8fafc',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },

  shareHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontWeight: '700',
    color: '#0f172a',
  },

  shareText: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 8px',
  },

  shareCode: {
    display: 'block',
    background: '#fff',
    padding: '10px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: '#0f172a',
    wordBreak: 'break-all',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
  },

  shareBtn: {
    width: '100%',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '10px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
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
    width: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 50px 70px -20px rgba(0,0,0,0.3)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
    transition: 'all 0.2s ease',
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

  input: {
    padding: '12px 16px',
    borderRadius: '16px',
    border: '2px solid #f1f5f9',
    outline: 'none',
    width: '100%',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  row: {
    display: 'flex',
    gap: '12px',
  },

  flex1: {
    flex: 1,
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
    transition: 'all 0.2s ease',
  },

  saveBtn: {
    flex: 2,
    padding: '12px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 10px 20px -8px rgba(79, 70, 229, 0.5)',
  },

  // Loading
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
    <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
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

  .add-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px -8px rgba(79, 70, 229, 0.6);
  }

  .icon-btn:hover {
    background: #e0e7ff;
    color: #4f46e5;
  }

  .delete-btn:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .share-btn:hover {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -5px rgba(79, 70, 229, 0.4);
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
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 15px 25px -8px rgba(79, 70, 229, 0.6);
  }

  .modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease forwards;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2) !important;
  }

  .nav-btn:hover:not(.active) {
    background: rgba(79, 70, 229, 0.1) !important;
    color: #fff !important;
  }

  /* Responsive handled by responsive.css */
`;
document.head.appendChild(style);

export default BDDashboard;