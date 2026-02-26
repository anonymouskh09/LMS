import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/bd";

function ApplyPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", experience_years: "", subjects: "", notes: "" });

  useEffect(() => {
    if (jobId) {
      fetchJob(jobId);
    } else {
      fetchAllJobs();
    }
  }, [jobId]);

  const fetchAllJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/public/jobs`);
      const data = await res.json();
      if (data.success) setJobs(data.jobs || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const fetchJob = async (idOrToken) => {
    setIsLoading(true);
    try {
      const isToken = idOrToken.length > 20; 
      const url = isToken 
        ? `${API}/public/job-by-token/${idOrToken}`
        : `${API}/public/jobs/${idOrToken}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setSelectedJob(data.job);
      else setError(data.message);
    } catch (e) { setError("Failed to load job details"); }
    setIsLoading(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: selectedJob.id, ...form })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError("Failed to submit application. Please try again.");
    }
    setSubmitting(false);
  };

  if (isLoading) return (
    <div style={S.page}>
      <div style={S.loadingBox}>
        <div style={S.spinner}></div>
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading...</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.successIcon}>✅</div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '16px 0 8px' }}>Application Submitted!</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Thank you for applying for <strong>{selectedJob?.title}</strong>. We'll review your application and contact you soon.</p>
        <button onClick={() => navigate('/apply')} style={S.backBtn}>← View Other Openings</button>
      </div>
    </div>
  );

  if (selectedJob) return (
    <div style={S.page}>
      <div style={S.card}>
        <button onClick={() => navigate('/apply')} style={S.linkBtn}>← All Openings</button>
        <div style={S.jobHeader}>
          <div style={S.jobBadge}>📋 {selectedJob.subject || 'Teaching Position'}</div>
          <h1 style={S.jobTitle}>{selectedJob.title}</h1>
          <div style={S.jobMeta}>
            {selectedJob.campus_name && <span style={S.metaTag}>🏫 {selectedJob.campus_name}</span>}
            {selectedJob.campus_location && <span style={S.metaTag}>📍 {selectedJob.campus_location}</span>}
            {selectedJob.experience_required && <span style={S.metaTag}>⏱ {selectedJob.experience_required}</span>}
            {selectedJob.salary_range && <span style={S.metaTag}>💰 {selectedJob.salary_range}</span>}
            {selectedJob.deadline && <span style={{ ...S.metaTag, background: '#fef3c7', color: '#92400e' }}>⏰ Deadline: {new Date(selectedJob.deadline).toLocaleDateString()}</span>}
          </div>
          {selectedJob.description && <p style={S.jobDesc}>{selectedJob.description}</p>}
          <div style={S.slotsBar}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Positions available: <strong style={{ color: '#4f46e5' }}>{selectedJob.slots_available - selectedJob.slots_filled}</strong> of {selectedJob.slots_available}</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Apply Now</h2>
        {error && <div style={S.errorBox}>{error}</div>}
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Full Name *</label>
              <input required placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={S.input} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Email Address *</label>
              <input required type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={S.input} />
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Phone Number</label>
              <input placeholder="03XX-XXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={S.input} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Years of Experience</label>
              <input type="number" min="0" placeholder="e.g. 3" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} style={S.input} />
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Subjects You Can Teach</label>
            <input placeholder="e.g. Mathematics, Physics, Chemistry" value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} style={S.input} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Cover Note / Additional Info</label>
            <textarea placeholder="Tell us about yourself, your teaching style, or anything else relevant..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...S.input, height: '100px', resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={submitting} style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting...' : 'Submit Application →'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px' }}>
        <div style={S.heroSection}>
          <div style={S.heroBadge}>🎓 Lancers Tech LMS</div>
          <h1 style={S.heroTitle}>Join Our Teaching Team</h1>
          <p style={S.heroSubtitle}>We're looking for passionate educators to shape the future of learning. Browse open positions below.</p>
        </div>

        {jobs.length === 0 ? (
          <div style={S.emptyState}>
            <p style={{ fontSize: '48px', margin: 0 }}>📭</p>
            <h3 style={{ margin: '16px 0 8px', fontWeight: '700' }}>No Open Positions</h3>
            <p style={{ color: '#64748b' }}>Check back soon for new opportunities.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jobs.map(job => (
              <div key={job.id} style={S.jobCard}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {job.subject && <span style={S.tag}>{job.subject}</span>}
                    {job.department_name && <span style={{ ...S.tag, background: '#e0e7ff', color: '#4f46e5' }}>🏫 {job.department_name}</span>}
                    {job.campus_location && <span style={{ ...S.tag, background: '#f0fdf4', color: '#166534' }}>📍 {job.campus_location}</span>}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{job.title}</h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {job.experience_required && <span style={{ fontSize: '13px', color: '#64748b' }}>⏱ {job.experience_required}</span>}
                    {job.salary_range && <span style={{ fontSize: '13px', color: '#64748b' }}>💰 {job.salary_range}</span>}
                    {job.deadline && <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                    <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '700' }}>✅ {job.slots_available - job.slots_filled} slot(s) open</span>
                  </div>
                  {job.description && <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{job.description.substring(0, 150)}{job.description.length > 150 ? '...' : ''}</p>}
                </div>
                <button onClick={() => navigate(`/apply/${job.id}`)} style={S.applyBtn}>Apply Now →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { 
    minHeight: '100vh', 
    background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #ede9fe 100%)', 
    padding: '40px 20px', 
    fontFamily: "'Plus Jakarta Sans', sans-serif" 
  },
  card: { 
    maxWidth: '700px', 
    margin: '0 auto', 
    background: '#fff', 
    borderRadius: '32px', 
    padding: '48px', 
    boxShadow: '0 4px 40px rgba(0,0,0,0.08)' 
  },
  loadingBox: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '60vh' 
  },
  spinner: { 
    width: '40px', 
    height: '40px', 
    border: '4px solid #f1f5f9', 
    borderTop: '4px solid #4f46e5', 
    borderRadius: '50%', 
    animation: 'spin 1s linear infinite' 
  },
  heroSection: { 
    textAlign: 'center', 
    padding: '60px 0 48px' 
  },
  heroBadge: { 
    display: 'inline-block', 
    background: '#e0e7ff', 
    color: '#4f46e5', 
    padding: '8px 20px', 
    borderRadius: '20px', 
    fontSize: '14px', 
    fontWeight: '700', 
    marginBottom: '20px' 
  },
  heroTitle: { 
    fontSize: '48px', 
    fontWeight: '900', 
    margin: '0 0 16px', 
    color: '#0f172a', 
    lineHeight: '1.1' 
  },
  heroSubtitle: { 
    fontSize: '18px', 
    color: '#64748b', 
    maxWidth: '500px', 
    margin: '0 auto', 
    lineHeight: '1.6' 
  },
  jobCard: { 
    background: '#fff', 
    borderRadius: '24px', 
    padding: '28px 32px', 
    border: '1px solid #e2e8f0', 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: '24px', 
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
    transition: '0.2s',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px -5px rgba(79,70,229,0.15)',
      borderColor: '#c7d2fe'
    }
  },
  tag: { 
    padding: '4px 12px', 
    borderRadius: '20px', 
    background: '#f1f5f9', 
    color: '#475569', 
    fontSize: '12px', 
    fontWeight: '700' 
  },
  applyBtn: { 
    background: '#4f46e5', 
    color: '#fff', 
    border: 'none', 
    padding: '14px 24px', 
    borderRadius: '14px', 
    cursor: 'pointer', 
    fontWeight: '700', 
    fontSize: '14px', 
    whiteSpace: 'nowrap', 
    flexShrink: 0,
    boxShadow: '0 10px 20px -8px rgba(79,70,229,0.5)',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#4338ca',
      transform: 'translateY(-2px)',
      boxShadow: '0 15px 25px -8px rgba(79,70,229,0.6)'
    }
  },
  emptyState: { 
    textAlign: 'center', 
    padding: '80px 20px', 
    background: '#fff', 
    borderRadius: '24px', 
    border: '1px solid #e2e8f0' 
  },
  jobHeader: { 
    marginBottom: '8px' 
  },
  jobBadge: { 
    display: 'inline-block', 
    background: '#e0e7ff', 
    color: '#4f46e5', 
    padding: '6px 14px', 
    borderRadius: '20px', 
    fontSize: '12px', 
    fontWeight: '700', 
    marginBottom: '12px' 
  },
  jobTitle: { 
    fontSize: '28px', 
    fontWeight: '900', 
    margin: '0 0 16px', 
    color: '#0f172a' 
  },
  jobMeta: { 
    display: 'flex', 
    gap: '8px', 
    flexWrap: 'wrap', 
    marginBottom: '16px' 
  },
  metaTag: { 
    padding: '6px 14px', 
    borderRadius: '20px', 
    background: '#f1f5f9', 
    color: '#475569', 
    fontSize: '13px', 
    fontWeight: '600' 
  },
  jobDesc: { 
    color: '#64748b', 
    lineHeight: '1.7', 
    fontSize: '15px', 
    margin: '16px 0 0' 
  },
  slotsBar: { 
    marginTop: '16px', 
    background: '#f0fdf4', 
    padding: '12px 16px', 
    borderRadius: '12px', 
    border: '1px solid #bbf7d0' 
  },
  formRow: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '16px' 
  },
  formGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px' 
  },
  label: { 
    fontSize: '13px', 
    fontWeight: '700', 
    color: '#374151' 
  },
  input: { 
    padding: '14px 18px', 
    borderRadius: '14px', 
    border: '2px solid #f1f5f9', 
    outline: 'none', 
    fontSize: '15px', 
    width: '100%', 
    boxSizing: 'border-box', 
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#4f46e5',
      boxShadow: '0 0 0 4px rgba(79,70,229,0.1)'
    }
  },
  submitBtn: { 
    background: '#4f46e5', 
    color: '#fff', 
    border: 'none', 
    padding: '16px', 
    borderRadius: '16px', 
    cursor: 'pointer', 
    fontWeight: '800', 
    fontSize: '16px', 
    marginTop: '8px',
    boxShadow: '0 10px 20px -8px rgba(79,70,229,0.5)',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#4338ca',
      transform: 'translateY(-2px)',
      boxShadow: '0 15px 25px -8px rgba(79,70,229,0.6)'
    }
  },
  errorBox: { 
    background: '#fee2e2', 
    color: '#991b1b', 
    padding: '14px 18px', 
    borderRadius: '14px', 
    marginBottom: '16px', 
    fontSize: '14px', 
    fontWeight: '600' 
  },
  successIcon: { 
    fontSize: '64px', 
    textAlign: 'center' 
  },
  linkBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#4f46e5', 
    cursor: 'pointer', 
    fontWeight: '700', 
    fontSize: '14px', 
    padding: '0 0 20px', 
    display: 'block' 
  },
  backBtn: { 
    background: '#e0e7ff', 
    color: '#4f46e5', 
    border: 'none', 
    padding: '14px 24px', 
    borderRadius: '14px', 
    cursor: 'pointer', 
    fontWeight: '700', 
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#c7d2fe',
      transform: 'translateY(-2px)'
    }
  },
};

// Inject global keyframes and hover styles
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .apply-job-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(79,70,229,0.15);
    border-color: #c7d2fe;
  }
  
  .apply-btn:hover {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 15px 25px -8px rgba(79,70,229,0.6);
  }
  
  .back-btn:hover {
    background: #c7d2fe;
    transform: translateY(-2px);
  }
  
  input:focus, textarea:focus {
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 4px rgba(79,70,229,0.1) !important;
  }
`;
document.head.appendChild(style);

export default ApplyPage;