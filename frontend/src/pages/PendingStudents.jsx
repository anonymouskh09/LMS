import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const PendingStudents = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pending-students', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingStudents(response.data.students);
      }
    } catch (err) {
      console.error('Error fetching pending students:', err);
      setError('Failed to load pending students');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId, studentName) => {
    if (!window.confirm(`Approve student: ${studentName}?`)) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/pending-students/${studentId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(`${studentName} approved successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Remove from pending list
        setPendingStudents(prev => prev.filter(s => s.id !== studentId));
      }
    } catch (err) {
      console.error('Error approving student:', err);
      setError('Failed to approve student');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReject = async (studentId, studentName) => {
    if (!window.confirm(`Reject and delete student: ${studentName}? This action cannot be undone.`)) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/pending-students/${studentId}/reject`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(`${studentName} rejected and removed`);
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Remove from pending list
        setPendingStudents(prev => prev.filter(s => s.id !== studentId));
      }
    } catch (err) {
      console.error('Error rejecting student:', err);
      setError('Failed to reject student');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading pending students...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Pending Student Approvals</h1>
        <p className="subtitle">Review and approve new student registrations</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {pendingStudents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>No Pending Approvals</h3>
          <p>All student registrations have been reviewed</p>
        </div>
      ) : (
        <div className="content-card">
          <div className="card-header">
            <h2>Pending Students ({pendingStudents.length})</h2>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Email</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="student-name">{student.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{student.department_name || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">Sem {student.semester || '1'}</span>
                    </td>
                    <td>{student.email}</td>
                    <td>{new Date(student.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleApprove(student.id, student.name)}
                          className="btn btn-success btn-sm"
                          title="Approve Student"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(student.id, student.name)}
                          className="btn btn-danger btn-sm"
                          title="Reject Student"
                        >
                          ✗ Reject
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
    </div>
  );
};

export default PendingStudents;
