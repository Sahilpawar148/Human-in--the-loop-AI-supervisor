import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

 
  const fetchRequests = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'pending_help_requests'));
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    setRequests(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);


  const submitAnswer = async (id, question, answer) => {
    const ref = doc(db, 'pending_help_requests', id);
    await updateDoc(ref, {
      status: 'resolved',
      answer: answer,
      answeredAt: new Date().toISOString(),
    });

    console.log(`📬 AI notified with answer to "${question}": ${answer}`);
    fetchRequests(); 
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>🧑‍💼 Supervisor Dashboard</h1>

      {loading ? <p>Loading...</p> : (
        <>
          <h2>🟡 Pending Requests</h2>
          {requests.filter(r => r.status === 'pending').length === 0 && <p>No pending requests.</p>}
          {requests.filter(r => r.status === 'pending').map(r => (
            <div key={r.id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
              <p><strong>Question:</strong> {r.question}</p>
              <input
                type="text"
                placeholder="Type your answer..."
                value={answers[r.id] || ''}
                onChange={e => setAnswers({ ...answers, [r.id]: e.target.value })}
                style={{ width: '80%', marginRight: '1rem' }}
              />
              <button onClick={() => submitAnswer(r.id, r.question, answers[r.id])}>Submit Answer</button>
            </div>
          ))}

          <h2>✅ Resolved Requests</h2>
          {requests.filter(r => r.status === 'resolved').length === 0 && <p>No resolved history yet.</p>}
          {requests.filter(r => r.status === 'resolved').map(r => (
            <div key={r.id} style={{ marginBottom: '1rem', background: '#f0f0f0', padding: '1rem', borderRadius: '8px' }}>
              <p><strong>Question:</strong> {r.question}</p>
              <p><strong>Answer:</strong> {r.answer}</p>
              <p><strong>Time:</strong> {new Date(r.answeredAt).toLocaleString()}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
<h2>📚 Learned Answers</h2>
{Object.keys(learned).length === 0 ? (
  <p>No learned answers yet.</p>
) : (
  Object.entries(learned).map(([question, answer]) => (
    <div key={question} style={{ marginBottom: '1rem', background: '#e7f1ff', padding: '1rem', borderRadius: '8px' }}>
      <p><strong>Q:</strong> {question}</p>
      <p><strong>A:</strong> {answer}</p>
    </div>
  ))
)}
