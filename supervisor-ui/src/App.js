import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './pages/firebase';
import './App.css';

function App() {
  const [requests, setRequests] = useState([]);
  const [answers, setAnswers] = useState({});
  const [learned, setLearned] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [reschedule, setReschedule] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeRequests = onSnapshot(collection(db, 'pending_help_requests'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setRequests(items);
      setLoading(false);
    });

    const unsubscribeAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setAppointments(items);
    });

    fetch('http://localhost:4001/api/kb')
      .then(res => res.json())
      .then(data => setLearned(data))
      .catch(err => console.error("Failed to load KB", err));

    return () => {
      unsubscribeRequests();
      unsubscribeAppointments();
    };
  }, []);

  const submitAnswer = async (id, question, answer) => {
    const ref = doc(db, 'pending_help_requests', id);
    await updateDoc(ref, {
      status: 'resolved',
      answer: answer,
      answeredAt: new Date().toISOString(),
    });
    console.log(`📬 AI notified with answer to "${question}": ${answer}`);
  };

  const cancelAppointment = async (id) => {
    await deleteDoc(doc(db, 'appointments', id));
    console.log(`❌ Appointment ${id} cancelled.`);
  };

  const rescheduleAppointment = async (id, newDateTime) => {
    const ref = doc(db, 'appointments', id);
    await updateDoc(ref, { datetime: newDateTime, rescheduledAt: new Date().toISOString() });
    console.log(`🔄 Appointment ${id} rescheduled to ${newDateTime}`);
  };

  const markAsDone = async (id) => {
    await updateDoc(doc(db, 'appointments', id), { status: 'done' });
  };

  const markAsBooked = async (id) => {
    await updateDoc(doc(db, 'appointments', id), { status: 'booked' });
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="container">
      <h1>🧑‍💼 Supervisor Dashboard</h1>

      <div className="tabs">
        <button onClick={() => setActiveTab('pending')}>
          🟡 Pending {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
        </button>
        <button onClick={() => setActiveTab('resolved')}>✅ Resolved</button>
        <button onClick={() => setActiveTab('unresolved')}>❌ Unresolved</button>
        <button onClick={() => setActiveTab('learned')}>📚 Learned</button>
        <button onClick={() => setActiveTab('appointments')}>📅 Appointments</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {activeTab === 'pending' && (
            <>
              <h2>🟡 Pending Requests</h2>
              {pendingCount === 0 && <p>No pending requests.</p>}
              {requests.filter(r => r.status === 'pending').map(r => (
                <div key={r.id} className="card">
                  <p><strong>Question:</strong> {r.question}</p>
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={answers[r.id] || ''}
                    onChange={e => setAnswers({ ...answers, [r.id]: e.target.value })}
                  />
                  <button className="submit" onClick={() => submitAnswer(r.id, r.question, answers[r.id])}>
                    Submit Answer
                  </button>
                </div>
              ))}
            </>
          )}

          {activeTab === 'resolved' && (
            <>
              <h2>✅ Resolved Requests</h2>
              {requests.filter(r => r.status === 'resolved').length === 0 && <p>No resolved history yet.</p>}
              {requests.filter(r => r.status === 'resolved').map(r => (
                <div key={r.id} className="card" style={{ backgroundColor: '#f0f0f0' }}>
                  <p><strong>Question:</strong> {r.question}</p>
                  <p><strong>Answer:</strong> {r.answer}</p>
                  <p><strong>Time:</strong> {new Date(r.answeredAt).toLocaleString()}</p>
                </div>
              ))}
            </>
          )}

          {activeTab === 'unresolved' && (
            <>
              <h2>❌ Unresolved Requests</h2>
              {requests.filter(r => r.status === 'unresolved').length === 0 && <p>No unresolved requests.</p>}
              {requests.filter(r => r.status === 'unresolved').map(r => (
                <div key={r.id} className="card" style={{ backgroundColor: '#ffe0e0' }}>
                  <p><strong>Question:</strong> {r.question}</p>
                  <p><strong>Marked Unresolved At:</strong> {new Date(r.markedAt).toLocaleString()}</p>
                </div>
              ))}
            </>
          )}

          {activeTab === 'learned' && (
            <>
              <h2>📚 Learned Answers</h2>
              {Object.keys(learned).length === 0 ? (
                <p>No learned answers yet.</p>
              ) : (
                Object.entries(learned).map(([question, answer]) => (
                  <div key={question} className="card" style={{ backgroundColor: '#e7f1ff' }}>
                    <p><strong>Q:</strong> {question}</p>
                    <p><strong>A:</strong> {answer}</p>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'appointments' && (
            <>
              <h2>📅 Upcoming Appointments</h2>
              {appointments.length === 0 ? <p>No upcoming appointments.</p> : (
                appointments.map(appt => (
                  <div key={appt.id} className="card" style={{ backgroundColor: '#fff3e0' }}>
                    <p><strong>Name:</strong> {appt.name}</p>
                    <p><strong>Phone:</strong> {appt.phone}</p>
                    <p><strong>Date & Time:</strong> {appt.datetime}</p>
                    <p><strong>Status:</strong> {appt.status || 'pending'}</p>
                    <input
                      type="text"
                      placeholder="New date/time..."
                      value={reschedule[appt.id] || ''}
                      onChange={e => setReschedule({ ...reschedule, [appt.id]: e.target.value })}
                    />
                    <button onClick={() => rescheduleAppointment(appt.id, reschedule[appt.id])}>Reschedule</button>
                    <button onClick={() => cancelAppointment(appt.id)} style={{ marginLeft: '0.5rem' }}>Cancel</button>
                    <button onClick={() => markAsBooked(appt.id)} style={{ marginLeft: '0.5rem' }}>Mark as Booked</button>
                    <button onClick={() => markAsDone(appt.id)} style={{ marginLeft: '0.5rem' }}>Mark as Done</button>
                  </div>
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
