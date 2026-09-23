// ==========================================
// 🔑 1. CONFIGURATION (તમારી વિગતો અહીં મૂકો)
// ==========================================

// ✨ Google Gemini API Key પેસ્ટ કરો
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

// 🔥 Firebase Console માંથી મળેલ Config પેસ્ટ કરો
const firebaseConfig = {
  apiKey: "AIzaSyDkbo5xWxC4XnzUyHN-xhjE5_WWS3GsgT8",
  authDomain: "vishva-ai-chatbot.firebaseapp.com",
  projectId: "vishva-ai-chatbot",
  storageBucket: "vishva-ai-chatbot.firebasestorage.app",
  messagingSenderId: "414590608840",
  appId: "1:414590608840:web:e779cb96bf7e91595c4cfd"
};

// Initialize Firebase App & Auth
if (firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.apps.length ? firebase.auth() : null;
const db = firebase.apps.length ? firebase.firestore() : null;

// ==========================================
// 🔐 2. FIREBASE AUTHENTICATION LOGIC
// ==========================================

if (auth) {
  auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const userImg = document.getElementById('user-img');

    if (user) {
      loginBtn.classList.add('hidden');
      userProfile.classList.remove('hidden');
      userName.innerText = user.displayName || user.email.split('@')[0];
      userImg.src = user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid;
    } else {
      loginBtn.classList.remove('hidden');
      userProfile.classList.add('hidden');
    }
  });
}

function openLoginModal() { document.getElementById('auth-modal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('auth-modal').classList.add('hidden'); }

// 1. Google Sign In
function loginWithGoogle() {
  if (!auth) return alert("પહેલા script.js માં Firebase Config સેટ કરો!");
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => closeLoginModal())
    .catch((err) => alert("Google Login ભૂલ: " + err.message));
}

// 2. Email Login
function loginWithEmail() {
  if (!auth) return alert("પહેલા script.js માં Firebase Config સેટ કરો!");
  const email = document.getElementById('auth-email').value;
  const pass = document.getElementById('auth-pass').value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => closeLoginModal())
    .catch((err) => alert("Login ભૂલ: " + err.message));
}

// 3. Email Sign Up
function signUpWithEmail() {
  if (!auth) return alert("પહેલા script.js માં Firebase Config સેટ કરો!");
  const email = document.getElementById('auth-email').value;
  const pass = document.getElementById('auth-pass').value;

  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      alert("Sign Up સફળ રહ્યું!");
      closeLoginModal();
    })
    .catch((err) => alert("Sign Up ભૂલ: " + err.message));
}

function logoutFirebase() {
  if (auth) auth.signOut();
}

// ==========================================
// 🤖 3. CHAT & GEMINI API LOGIC
// ==========================================

async function handleSubmit(e) {
  e.preventDefault();
  const inputEl = document.getElementById('user-input');
  const text = inputEl.value.trim();

  if (!text) return;

  // Render User Msg
  appendMessage(text, 'user');
  inputEl.value = '';

  showTyping(true);

  // Gemini API Fetch Call
  try {
    const reply = await fetchGeminiResponse(text);
    showTyping(false);
    appendMessage(reply, 'bot');
  } catch (err) {
    showTyping(false);
    appendMessage("❌ API સાથે જોડાણમાં ભૂલ. કૃપા કરીને API Key ચકાસો.", 'bot');
  }
}

async function fetchGeminiResponse(prompt) {
  if (GEMINI_API_KEY === "AQ.Ab8RN6I-PZSIxjSsrFNLGeSkdbvKcZXvGQX8kdEnPuyXW93Hsg" || !GEMINI_API_KEY) {
    return "⚠️ **API Key બાકી છે!**<br>`script.js` માં તમારી ઓરિજિનલ Google Gemini API Key મુકો.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: "તમે શાળાના IT પ્રોજેક્ટ માટેના સ્માર્ટ 3D AI આસિસ્ટન્ટ છો. ટૂંકમાં અને સ્પષ્ટ જવાબ આપો: " + prompt }]
      }]
    })
  });

  const data = await response.json();

  if (data.candidates && data.candidates[0].content.parts[0].text) {
    let resText = data.candidates[0].content.parts[0].text;
    
    // Code Formatting & Styling
    return resText
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-emerald-400 p-3 rounded-xl text-xs overflow-x-auto my-2 font-mono"><code>$1</code></pre>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }

  return "ક્ષમા કરશો, મને કોઈ જવાબ મળ્યો નથી.";
}

function sendQuickMsg(text) {
  document.getElementById('user-input').value = text;
  handleSubmit(new Event('submit'));
}

function appendMessage(text, sender) {
  const chatBox = document.getElementById('chat-box');
  const div = document.createElement('div');

  if (sender === 'user') {
    div.className = 'flex justify-end';
    div.innerHTML = `<div class="user-bubble p-3.5 px-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed">${escapeHTML(text)}</div>`;
  } else {
    div.className = 'flex items-start gap-3';
    div.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-sm font-bold shadow-md flex-shrink-0">🤖</div>
      <div class="bot-bubble p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-relaxed">${text}</div>
    `;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping(show) {
  const el = document.getElementById('typing-indicator');
  if (show) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

function clearChat() {
  document.getElementById('chat-box').innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-sm font-bold shadow-md">🤖</div>
      <div class="bot-bubble p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm">ચેટ સાફ થઈ ગઈ છે!</div>
    </div>
  `;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
