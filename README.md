# Human-in--the-loop-AI-supervisor
# 🤖 Human-in-the-Loop AI Supervisor

A real-time AI-driven customer service system that escalates unknown queries to a human supervisor. Built using **Node.js**, **React**, **Firebase**, and **LiveKit**, it simulates a voice assistant that can handle salon-related queries, bookings, and follow-ups.

---

## 📦 Project Structure
human_loop_ai_project/
├── agent/ # AI Agent (LiveKit + Puppeteer)
│ ├── agent.js
│ ├── firebase_config.js
│ ├── knowledge_base.json
│ └── server.js # Serves learned FAQs
├── supervisor-ui/ # React Supervisor Dashboard
│ ├── src/
│ │ ├── App.js
│ │ └── firebase.js
├── token_generator/ # (Optional) LiveKit Token generator

---

## 🧠 Features

### AI Agent
- Connects to LiveKit room using Puppeteer.
- Greets customer and collects name/phone to create unique ID.
- Answers from knowledge base (local JSON).
- Escalates unknown questions to a **supervisor**.
- Follows up after resolution and updates knowledge base.
- Handles appointment booking, rescheduling, and cancellations.

### Supervisor UI
- Tabs for **Pending**, **Resolved**, **Unresolved**, **Learned**, and **Appointments**.
- Real-time dashboard using Firestore `onSnapshot`.
- Submit answers, reschedule, cancel or complete appointments.
- View and manage learned answers.


## 🔧 Tech Stack

| Layer         | Tech Used              |
|---------------|------------------------|
| AI Agent      | Node.js, Puppeteer     |
| Real-time     | LiveKit                |
| Frontend      | React.js + Firebase    |
| DB            | Firestore              |
| Token Auth    | LiveKit JWT            |

---

## 🚀 Setup Instructions

### 1. Clone the Repository

git clone https://github.com/your-username/human_loop_ai_project.git
cd human_loop_ai_project

### 2. Install Dependencies

cd agent
npm install

cd ../supervisor-ui
npm install

### 3. Configure Firebase
Create a Firebase project.

Enable Firestore.

Download the service account JSON and place it in:
agent/firebase-service-account.json

### 4. Configure LiveKit
Manually generate a LiveKit access token or use token_generator/.

Replace the token in agent.js:

const ACCESS_TOKEN = 'your_livekit_token';

### 5. Run the Project
## Start the AI Agent

cd agent
node agent.js

## Start the API Server (to serve learned answers)

cd ../supervisor-ui
npm start

### 💡 Knowledge Base Format

{
  "business_info": "We are a full-service salon in Downtown LA.",
  "faqs": {
    "what are your hours": "We're open daily 9am to 7pm.",
    "do you offer bridal makeup?": {
      "answer": "Yes, we do provide bridal makeup.",
      "source": "learned"
    }
  }
}

###  Sample Workflow :

1.AI Agent connects to LiveKit and greets user.
2.Captures name + phone to generate customerId.
3.Handles known FAQs, escalates unknowns.
4.Supervisor UI sees the pending request.
5.Supervisor responds → AI follows up live.
6.Answer is learned for future use.


### Design Highlights
-Real-time sync using Firestore listeners.
-Session-based AI agent (like a real phone call).
-Timeout logic to mark unresolved requests.
-Simple admin UI for scalability
    



