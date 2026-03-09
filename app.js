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
const nickDisplay = document.getElementById('myNickDisplay');

if (nickDisplay) nickDisplay.textContent = currentUser;

// --- 3. CORE FUNCTIONS ---

// Mesaj Gönderimi
window.sendMessage = (text) => {
    if (!text || !text.trim()) return;

    // Göndermeden önce temizlik (XSS Koruması)
    const cleanText = Security.sanitize(text);
    const filteredText = Security.filterBadWords(cleanText);
    const hash = Security.generateHash(filteredText);

    const roomRef = ref(db, `rooms/${currentRoom}/messages`);
    push(roomRef, {
        u: Security.sanitize(currentUser),
        m: filteredText,
        h: hash, 
        uid: userUID,
        t: Date.now()
    });
};

// Güvenli Mesaj Oluşturma (innerHTML YOK, Sadece textContent)
function renderMessage(data, adminUID) {
    const isMe = data.uid === userUID;
    const isAdmin = data.uid === adminUID && currentRoom !== 'genel';

    // Ana Kap (div)
    const div = document.createElement('div');
    div.className = `msg-item ${isMe ? 'msg-me' : ''}`;

    // İçerik Kutusu
    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';

    // Kullanıcı Adı
    const authorSpan = document.createElement('span');
    authorSpan.className = 'msg-author';
    authorSpan.textContent = data.u + (isAdmin ? ' 👑' : ''); // Kod olarak değil metin olarak basar
    authorSpan.style.color = isAdmin ? '#ed4245' : '#5865f2';

    // Mesaj Gövdesi
    const bodySpan = document.createElement('span');
    bodySpan.className = 'msg-body';
    bodySpan.textContent = data.m; // <--- BURASI KRİTİK: XSS'İ BURADA ÖLDÜRÜYORUZ

    // Zaman (Küçük yazı)
    const timeSpan = document.createElement('small');
    timeSpan.style.display = 'block';
    timeSpan.style.fontSize = '10px';
    timeSpan.style.opacity = '0.5';
    timeSpan.textContent = new Date(data.t).toLocaleTimeString();

    // Birleştirme
    contentDiv.appendChild(authorSpan);
    contentDiv.appendChild(bodySpan);
    contentDiv.appendChild(timeSpan);
    div.appendChild(contentDiv);
    
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Oda Değiştirme
window.switchChannel = (roomID) => {
    off(ref(db, `rooms/${currentRoom}/messages`)); // Eski odayı dinlemeyi bırak
    chatBox.textContent = ""; // Mesaj alanını temizle
    currentRoom = roomID;
    currentRoomTitle.textContent = `# ${roomID}`;

    let roomAdmin = "";
    onValue(ref(db, `rooms/${roomID}/metadata/admin`), (snapshot) => {
        roomAdmin = snapshot.val();
    });

    onChildAdded(ref(db, `rooms/${roomID}/messages`), (snap) => {
        renderMessage(snap.val(), roomAdmin);
    });
};

// Oda Oluşturma
window.createRoom = () => {
    const name = prompt("Yeni oda adı:");
    if (name) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        set(ref(db, `rooms/${id}/metadata`), {
            admin: userUID,
            name: name
        });
        window.switchChannel(id);
    }
};

// --- 4. EVENT LISTENERS ---
msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        window.sendMessage(msgInput.value);
        msgInput.value = "";
    }
});

// Ayarları Kaydet
window.saveSettings = () => {
    const newNick = document.getElementById('newNick').value.trim();
    if (newNick) {
        currentUser = newNick;
        localStorage.setItem('chatNick', newNick);
        if (nickDisplay) nickDisplay.textContent = newNick;
        document.getElementById('settingsModal').style.display = 'none';
    }
};

// İlk Başlatma
window.switchChannel('genel');
