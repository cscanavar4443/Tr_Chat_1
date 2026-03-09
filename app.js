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
    const verified = Security.generateHash(data.m) === data.h; // Hash kontrolü

    const msgHtml = `
        <div class="msg-item ${isMe ? 'msg-me' : ''}">
            <div class="msg-content">
                <span class="msg-author" style="color: ${isAdmin ? '#ed4245' : '#5865f2'}">
                    ${data.u}
                    ${isAdmin ? '<i class="fas fa-crown" title="Oda Sahibi"></i>' : ''}
                </span>
                <span class="msg-body">${data.m}</span>
                ${verified ? '<i class="fas fa-check-circle verified" title="SHA-256 Doğrulandı"></i>' : ''}
            </div>
        </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', msgHtml);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Yeni Oda Oluşturma
window.createRoom = () => {
    const name = prompt("Oda ismi girin (örn: yazilim-sohbet):");
    if (name) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        // Metadata oluştur (Oluşturan admin olur)
        set(ref(db, `rooms/${id}/metadata`), {
            admin: userUID,
            name: name,
            createdAt: Date.now()
        });
        // Kanal listesine ekle (Basitçe UI'ya ekliyoruz)
        addChannelToUI(id);
        switchChannel(id);
    }
};

function addChannelToUI(id) {
    const list = document.getElementById('channelList');
    const div = document.createElement('div');
    div.className = 'channel';
    div.innerText = `# ${id}`;
    div.onclick = () => switchChannel(id);
    list.appendChild(div);
}

// --- 4. EVENT LISTENERS ---

msgInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
        sendMessage(e.target.value);
        e.target.value = "";
    }
};

// Ayarları Kaydet
window.saveSettings = () => {
    const nick = document.getElementById('newNick').value.trim();
    if (nick) {
        currentUser = nick;
        localStorage.setItem('chatNick', nick);
        document.getElementById('myNickDisplay').innerText = nick;
        window.closeSettings();
    }
};

// Uygulamayı Başlat
switchChannel('genel');
