import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FeedbackModal from '../components/FeedbackModal';

const LabPlayer = ({ labName: propLabName, labId: propLabId, url: propUrl, user: propUser }) => {
    const { labId: paramLabId } = useParams();
    const navigate = useNavigate();
    const [logId, setLogId] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Resolve labId and user info
    const labId = propLabId || paramLabId;
    const user = propUser || JSON.parse(sessionStorage.getItem('user'));
    const labName = propLabName || labId || "Untitled Lab";
    
    // Clean URL: Remove leading semicolons or accidental characters
    let labUrl = propUrl || `https://antigravity.codes/labs/${labId}?embed=true`;
    if (labUrl.startsWith(';')) labUrl = labUrl.substring(1);
    // If it's just a domain, ensure it has https
    if (labUrl && !labUrl.startsWith('http')) labUrl = 'https://' + labUrl;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const startLabSession = async () => {
            if (!user || !user.id || !labId) {
                setLoading(false);
                return;
            }
            try {
                const response = await axios.post(`${API_BASE}/labs/log-start`, {
                    studentId: user.id,
                    labName: labName
                });
                
                if (response.data.success) {
                    setLogId(response.data.logId);
                }
            } catch (error) {
                console.error('Failed to log lab start:', error);
            } finally {
                // Short artificial delay to make it feel like "Provisioning"
                setTimeout(() => setLoading(false), 800);
            }
        };

        startLabSession();

        return () => {
            if (logId) {
                axios.post(`${API_BASE}/labs/log-end`, {
                    logId: logId
                }).catch(err => console.error('Failed to log lab end on unmount:', err));
            }
        };
    }, [labId, user?.id]);

    const [showFeedback, setShowFeedback] = useState(false);

    const handleFinish = async () => {
        if (logId) {
            try {
                await axios.post(`${API_BASE}/labs/log-end`, {
                    logId: logId
                });
            } catch (error) {
                console.error('Error logging lab finish:', error);
            }
        }
        setShowFeedback(true);
    };

    const submitFeedback = async (feedbackData) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.post(`${API_BASE}/feedback`, {
                labId: labId,
                rating: feedbackData.rating,
                comment: feedbackData.comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            navigate(-1);
        }
    };

    if (loading) {
        return (
            <div style={{
                height: '70vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: '#0f172a', 
                borderRadius: '24px',
                color: '#fff',
                gap: '20px'
            }}>
                <div style={{
                    width: '50px', 
                    height: '50px', 
                    border: '4px solid rgba(255,255,255,0.1)', 
                    borderTop: '4px solid #7c3aed', 
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{textAlign: 'center'}}>
                    <h3 style={{margin: 0, fontSize: '1.2rem'}}>Provisioning Environment</h3>
                    <p style={{margin: '5px 0 0', color: '#94a3b8', fontSize: '0.9rem'}}>Connecting to secure cloud instance...</p>
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            height: '85vh', 
            background: '#0f172a', 
            borderRadius: '24px', 
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #1e293b'
        }}>
            {/* Lab Toolbar */}
            <header style={{
                padding: '12px 24px', 
                background: 'linear-gradient(90deg, #1e293b, #0f172a)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid #334155'
            }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{
                        background: '#7c3aed', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '18px'
                    }}>🔬</div>
                    <div>
                        <h1 style={{fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', margin: 0}}>
                            {labName}
                        </h1>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <div style={{width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%'}}></div>
                            <span style={{fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Session Active</span>
                        </div>
                    </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{
                        padding: '6px 12px', 
                        background: 'rgba(255,255,255,0.05)', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem', 
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {user?.name || 'Student'}
                    </div>
                    <button 
                        onClick={handleFinish}
                        style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        Terminate Session
                    </button>
                </div>
            </header>
            
            {/* Lab Viewport */}
            <main style={{
                flex: 1, 
                position: 'relative', 
                background: '#fff',
                display: 'flex',
                alignItems: 'stretch'
            }}>
                <iframe 
                    src={labUrl}
                    title="Cloud Lab Player"
                    style={{
                        width: '100%', 
                        height: '100%', 
                        border: 'none',
                        flex: 1
                    }}
                    allow="clipboard-read; clipboard-write; microphone; camera; display-capture"
                />
            </main>

            <FeedbackModal 
                isOpen={showFeedback}
                onClose={() => navigate(-1)}
                onSubmit={submitFeedback}
                title={`Rate Lab: ${labName}`}
            />
        </div>
    );
};

export default LabPlayer;
