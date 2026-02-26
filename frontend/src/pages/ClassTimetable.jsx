import { useState, useEffect } from 'react';
import { Clock, MapPin, User, CalendarBlank } from "@phosphor-icons/react";

function ClassTimetable({ user, onBack, classId = null, viewMode = 'student' }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classId);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (viewMode === 'admin') {
      fetchClasses();
    } else {
      fetchTimetable();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes || []);
        if (data.classes.length > 0 && !selectedClass) {
          setSelectedClass(data.classes[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (viewMode === 'student') {
        endpoint = 'http://localhost:5000/api/timetables/student-timetable';
      } else if (viewMode === 'teacher') {
        endpoint = 'http://localhost:5000/api/timetables/my-timetable';
      } else if (viewMode === 'admin' && selectedClass) {
        endpoint = `http://localhost:5000/api/timetables/class/${selectedClass}`;
      }

      if (!endpoint) {
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTimetable(data.timetable || []);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped = {};
    days.forEach(day => grouped[day] = []);
    
    timetable.forEach(entry => {
      if (grouped[entry.day_of_week]) {
        grouped[entry.day_of_week].push(entry);
      }
    });
    
    return grouped;
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getClassForSlot = (day, time) => {
    return timetable.find(entry => {
      if (entry.day_of_week !== day) return false;
      const startHour = parseInt(entry.start_time.split(':')[0]);
      const slotHour = parseInt(time.split(':')[0]);
      const endHour = parseInt(entry.end_time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FD', padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          {onBack && (
            <button onClick={onBack} style={{ padding: '8px 16px', background: '#666', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>
              ← Back to Dashboard
            </button>
          )}
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>📅 Weekly Timetable</h1>
          <p style={{ color: '#6F767E', margin: 0 }}>Your class schedule for the week</p>
        </div>

        {/* Class Selector for Admin */}
        {viewMode === 'admin' && (
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #EDEDED', marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6F767E', marginBottom: '8px', textTransform: 'uppercase' }}>Select Class</label>
            <select 
              value={selectedClass || ''} 
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '300px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #EDEDED', fontSize: '14px', outline: 'none' }}
            >
              <option value="">Choose a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: '#6F767E' }}>Loading timetable...</p>
          </div>
        ) : timetable.length === 0 ? (
          <div style={{ backgroundColor: '#fff', padding: '60px', borderRadius: '24px', border: '1px solid #EDEDED', textAlign: 'center' }}>
            <CalendarBlank size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
            <p style={{ color: '#6F767E', fontSize: '16px' }}>No timetable entries found</p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #EDEDED', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6F767E', textTransform: 'uppercase', minWidth: '80px' }}>Time</th>
                    {days.map(day => (
                      <th key={day} style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#6F767E', textTransform: 'uppercase', minWidth: '150px' }}>
                        {day.substring(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: '#6F767E' }}>{time}</td>
                      {days.map((day, dayIndex) => {
                        const classEntry = getClassForSlot(day, time);
                        return (
                          <td key={day} style={{ padding: '4px' }}>
                            {classEntry ? (
                              <div style={{
                                backgroundColor: colors[dayIndex % colors.length],
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '600',
                                minHeight: '80px'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{classEntry.course_title}</div>
                                <div style={{ fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                  <Clock size={12} />
                                  {classEntry.start_time} - {classEntry.end_time}
                                </div>
                                {classEntry.teacher_name && (
                                  <div style={{ fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <User size={12} />
                                    {classEntry.teacher_name}
                                  </div>
                                )}
                                {classEntry.room_number && (
                                  <div style={{ fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <MapPin size={12} />
                                    Room {classEntry.room_number}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ minHeight: '80px' }}></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* List View (Mobile Friendly) */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Schedule by Day</h3>
              {Object.entries(groupByDay()).map(([day, entries]) => (
                entries.length > 0 && (
                  <div key={day} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #EDEDED', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1A1D1F' }}>{day}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {entries.map((entry, index) => (
                        <div key={index} style={{ 
                          padding: '16px', 
                          backgroundColor: '#F8F9FD', 
                          borderRadius: '12px',
                          borderLeft: `4px solid ${colors[days.indexOf(day) % colors.length]}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '8px' }}>{entry.course_title}</div>
                              <div style={{ fontSize: '13px', color: '#6F767E', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clock size={14} />
                                  {entry.start_time} - {entry.end_time}
                                </div>
                                {entry.teacher_name && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <User size={14} />
                                    {entry.teacher_name}
                                  </div>
                                )}
                                {entry.room_number && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={14} />
                                    Room {entry.room_number}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ClassTimetable;
