const Parser = require('rss-parser');
const admin = require('firebase-admin');
const parser = new Parser();

// 1. Initialize Firebase Admin securely
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const APP_ID = 'topai-v8'; // Matches the database path in your App.jsx

// 2. Gemini API Configuration
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// 3. AI Brain Function: Converts messy text into clean Database JSON
async function analyzeWithGemini(title, description) {
  const prompt = `Analyze this AI product launch: Title: "${title}", Description: "${description}". Return a valid JSON object (no markdown, just JSON) with these exact keys: "name" (string), "shortDescription" (string max 90 chars), "description" (string), "categories" (array of 2 strings, e.g. ["Text & Writing", "AI Innovation"]), "features" (array of 3 strings), "useCases" (array of 2 strings), "strengths" (array of 2 strings), "weaknesses" (array of 2 strings), "pricing" (string, e.g. "Freemium"), "pricingType" (string: "Free", "Freemium", or "Paid"), "ratings" (number between 4.0 and 5.0), "icon" (string from: Bot, FileText, ImageIcon, Code, Search, Video, Mic, LayoutGrid, Layers), "website" (string).`;
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text;
  
  // Strip markdown formatting if Gemini adds it
  const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanJson);
}

// 4. Main Robot Loop
async function runAgent() {
  console.log("🤖 Agent waking up...");
  try {
    // Look for new tech/AI launches
    const feed = await parser.parseURL('https://www.producthunt.com/feed');
    console.log(`Found ${feed.items.length} recent launches. Analyzing the top 2...`);
    
    // We only process the top 2 each day to keep things safe and clean
    for (let i = 0; i < 2; i++) {
      const item = feed.items[i];
      console.log(`Analyzing: ${item.title}`);
      
      try {
        const aiData = await analyzeWithGemini(item.title, item.contentSnippet);
        
        // Add database-specific fields
        aiData.id = `agent-${Date.now()}-${i}`;
        aiData.likes = Math.floor(Math.random() * 50);
        aiData.dislikes = 0;
        aiData.isFree = aiData.pricingType !== "Paid";
        aiData.openSource = false;

        // Push directly to your live Firebase database!
        await db.collection('artifacts').doc(APP_ID).collection('tools').doc(aiData.id).set(aiData);
        console.log(`✅ Successfully added ${aiData.name} to live database!`);
      } catch (e) {
        console.error(`❌ Failed to process ${item.title}:`, e.message);
      }
    }
  } catch (err) {
    console.error("Agent crashed:", err);
  }
  console.log("💤 Agent going back to sleep.");
}

runAgent();