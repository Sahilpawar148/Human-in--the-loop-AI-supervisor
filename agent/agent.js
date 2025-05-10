import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import db from './firebase_config.js';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const LIVEKIT_URL = 'Provide your Url ';
const ACCESS_TOKEN = "provide your token "; // Replace with your actual token


const knowledgePath = path.join(__dirname, 'knowledge_base.json');
if (!fs.existsSync(knowledgePath)) {
  console.error('❌ knowledge_base.json not found at:', knowledgePath);
  process.exit(1);
}
let knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
let faqs = knowledge.faqs;


let sessionState = {
  name: null,
  phone: null,
  customerId: null,
  step: 'awaiting_name',
};

const joinUrl = `https://${LIVEKIT_URL.replace('wss://', '')}/participant.html?access_token=${ACCESS_TOKEN}`;
console.log("🔗 Attempting to join LiveKit room:", joinUrl);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--use-fake-ui-for-media-stream'],
  });

  const page = await browser.newPage();

  try {
    const response = await page.goto(joinUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    if (!response || !response.ok()) {
      console.error("❌ Failed to load LiveKit room. Check your URL or access token.");
      process.exit(1);
    }

    console.log("🔌 Connected to LiveKit room as AI Agent");
    console.log("👋 Hello! Welcome to XYZ Salon.");
    console.log("📇 May I have your name to get started?");
  } catch (err) {
    console.error("❌ Connection to LiveKit failed:", err.message);
    process.exit(1);
  }

 
  page.exposeFunction('onMessageReceived', async (message) => {
    const cleaned = message.trim().toLowerCase();


    if (sessionState.step === 'awaiting_name') {
      sessionState.name = cleaned;
      sessionState.step = 'awaiting_phone';
      console.log("📞 Please enter your phone number:");
      return;
    }

    if (sessionState.step === 'awaiting_phone') {
      sessionState.phone = cleaned;
      sessionState.customerId = `${sessionState.name.replace(/\s+/g, '')}_${sessionState.phone}`;
      sessionState.step = 'awaiting_question';

      const apptSnapshot = await db.collection('appointments')
        .where('customerId', '==', sessionState.customerId)
        .get();

      if (!apptSnapshot.empty) {
        console.log("👋 Welcome back! I see you have an appointment booked.");
        sessionState.step = 'awaiting_returning_response';
        console.log("🔄 Would you like to reschedule it?");
        return;
      }

      console.log("❓ Thank you! What can I help you with today?");
      return;
    }

   
    if (sessionState.step === 'awaiting_returning_response') {
      if (cleaned.includes('yes')) {
        sessionState.step = 'reschedule_time';
        console.log("📅 Sure! What new date and time would you like?");
        return;
      } else {
        sessionState.step = 'awaiting_question';
        console.log("❓ No problem! What can I help you with today?");
        return;
      }
    }

    
    if (sessionState.step === 'reschedule_time') {
      const snapshot = await db.collection('appointments')
        .where('customerId', '==', sessionState.customerId)
        .get();

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await docRef.update({
          datetime: message,
          status: 'rescheduled',
          rescheduledAt: new Date().toISOString()
        });
        console.log("✅ Your appointment has been updated to:", message);
      } else {
        console.log("⚠️ Could not find existing appointment to reschedule.");
      }

      sessionState.step = 'awaiting_question';
      console.log("❓ What else can I help you with today?");
      return;
    }

   
    if (sessionState.step === 'awaiting_question') {
      if (faqs[cleaned]) {
        const answer = typeof faqs[cleaned] === 'string' ? faqs[cleaned] : faqs[cleaned].answer;
        console.log(`✅ Answer: ${answer}`);
        sessionState.step = 'awaiting_booking_confirmation';
        console.log("📞 Would you like to book an appointment?");
        return;
      } else {
        console.log("🤖 Let me check with my supervisor and get back to you...");
        const docRef = db.collection('pending_help_requests').doc();
        await docRef.set({
          question: message,
          timestamp: new Date().toISOString(),
          status: 'pending',
          name: sessionState.name,
          phone: sessionState.phone,
          customerId: sessionState.customerId
        });
        console.log(`📱 Help request sent for "${message}" from ${sessionState.name}`);
        return;
      }
    }

    
    if (sessionState.step === 'awaiting_booking_confirmation') {
      if (cleaned.includes('yes')) {
        sessionState.step = 'awaiting_datetime';
        console.log("📅 Great! What date and time would you prefer?");
        return;
      } else if (cleaned.includes('no') || cleaned.includes('no thank you')) {
        console.log("🙏 Thank you for calling XYZ Salon. Goodbye!");
        await browser.close();
        process.exit(0);
      } else {
        console.log("🤖 Just to confirm, would you like to book an appointment?");
        return;
      }
    }

    
    if (sessionState.step === 'awaiting_datetime') {
      await db.collection('appointments').doc().set({
        customerId: sessionState.customerId,
        name: sessionState.name,
        phone: sessionState.phone,
        datetime: message,
        status: 'booked',
        bookedAt: new Date().toISOString()
      });

      console.log("📆 Your appointment has been booked for:", message);
      sessionState.step = 'awaiting_followup';
      console.log("📨 Would you like help with anything else?");
      return;
    }

    
    if (sessionState.step === 'awaiting_followup') {
      if (cleaned.includes('no')) {
        console.log("🙏 Thank you for calling XYZ Salon. Goodbye!");
        await browser.close();
        process.exit(0);
      } else {
        sessionState.step = 'awaiting_question';
        console.log("❓ Sure! Please ask your question:");
        return;
      }
    }
  });

  
  db.collection('pending_help_requests').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();

      if (change.type === 'modified' && data.status === 'resolved') {
        const q = data.question.toLowerCase().trim();
        const a = data.answer;

        console.log(`📞 AI following up with ${data.customerId}: ${a}`);

        if (!faqs[q]) {
          faqs[q] = { answer: a, source: "learned" };
          knowledge.faqs = faqs;
          fs.writeFileSync(knowledgePath, JSON.stringify(knowledge, null, 2));
        }

        sessionState.step = 'awaiting_booking_confirmation';
        console.log("📞 Would you like to book an appointment?");
      }
    });
  });

  
  db.collection('appointments').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      const { name, datetime, status, reason } = data;

      if (change.type === 'modified') {
        if (status === 'cancelled') {
          console.log(`❌ MESSAGE TO ${name}: Your appointment has been cancelled.`);
          if (reason) console.log(`📩 Reason: ${reason}`);
        } else if (status === 'rescheduled') {
          console.log(`🔄 MESSAGE TO ${name}: Your appointment has been rescheduled to ${datetime}.`);
        } else if (status === 'done' || status === 'booked') {
          console.log(`✅ MESSAGE TO ${name}: Your appointment is now marked as ${status}.`);
        }
      }
    });
  });

 
  setInterval(async () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 *  60 * 1000;

    const snapshot = await db.collection('pending_help_requests')
      .where('status', '==', 'pending')
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const createdTime = new Date(data.timestamp).getTime();

      if (createdTime < fiveMinutesAgo) {
        console.log(`⏰ Timeout → marking "${data.question}" as unresolved`);
        await doc.ref.update({
          status: 'unresolved',
          markedAt: new Date().toISOString()
        });
      }
    }
  }, 60000); 
})();
