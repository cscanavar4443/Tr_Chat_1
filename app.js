import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, onValue, off } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { Security } from './security.js';

// --- 1. CONFIG & INIT ---
const cfg = {
  apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs",
  databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com",
  projectId: "trchat-7bc26"
};

const app = initializeApp(cfg);
const db = getDatabase(app);

// --- 2. GLOBAL STATES ---
let currentUser = localStorage.getItem('chatNick') || "User_" + Math.floor(Math.random() * 9999);
let currentRoom = "genel";
const userUID = localStorage.getItem('userUID') || 'uid-' + Math.random().toString(36).substring(2, 15);
localStorage.setItem('userUID', userUID);

const chatBox = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const currentRoomTitle = document.getElementById('currentChannelName');
document.getElementById('myNickDisplay').innerText = currentUser;

// --- 3. CORE FUNCTIONS ---

// Mesaj Gönderimi (XSS & SHA-256 Korumalı)
window.sendMessage = (text) => {
    if (!text.trim()) return;

    const cleanText = Security.sanitize(text);
    const filteredText = Security.filterBadWords(cleanText);
    const hash = Security.generateHash(filteredText); // SHA-256 koruması

    const roomRef = ref(db, `rooms/${currentRoom}/messages`);
    push(roomRef, {
        u: Security.sanitize(currentUser),
        m: filteredText,
        h: hash, 
        uid: userUID,
        t: Date.now()
    });
};

// Oda Değiştirme ve Dinleme
window.switchChannel = (roomID) => {
    // Eski dinleyiciyi durdur ve ekranı temizle
    off(ref(db, `rooms/${currentRoom}/messages`));
    chatBox.innerHTML = "";
    currentRoom = roomID;
    currentRoomTitle.innerText = `# ${roomID}`;

    // Aktif kanal görselini güncelle
    document.querySelectorAll('.channel').forEach(el => el.classList.remove('active'));
    // (Eğer listede varsa active class ekle)

    // Odanın adminini çek
    let roomAdmin = "";
    onValue(ref(db, `rooms/${roomID}/metadata/admin`), (snapshot) => {
        roomAdmin = snapshot.val();
    });

    // Yeni mesajları dinle
    onChildAdded(ref(db, `rooms/${roomID}/messages`), (snap) => {
        const data = snap.val();
        renderMessage(data, roomAdmin);
    });
};

// Mesajı Ekrana Bas (Admin Kontrolü ile)
function renderMessage(data, adminUID) {
    const isMe = data.uid === userUID;
    const isAdmin = data.uid === adminUID && currentRoom !== 'genel';

    // 1. Bir ana kapsayıcı oluştur
    const div = document.createElement('div');
    div.className = `msg-item ${isMe ? 'msg-me' : ''}`;

    // 2. Mesaj içeriği için elementler oluştur
    const authorSpan = document.createElement('span');
    authorSpan.className = 'msg-author';
    // GÜVENLİK: textContent asla script çalıştırmaz!
    authorSpan.textContent = data.u + (isAdmin ? ' 👑' : ''); 
    authorSpan.style.color = isAdmin ? '#ed4245' : '#5865f2';

    const bodySpan = document.createElement('span');
    bodySpan.className = 'msg-body';
    // GÜVENLİK: Buraya <script> gelse bile sadece yazı olarak görünür
    bodySpan.textContent = data.m; 

    // 3. Parçaları birleştir
    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    contentDiv.appendChild(authorSpan);
    contentDiv.appendChild(bodySpan);
    
    div.appendChild(contentDiv);
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
