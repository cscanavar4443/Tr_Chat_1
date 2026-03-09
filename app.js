import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const cfg = {
  apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs",
  databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com",
  projectId: "trchat-7bc26"
};

const app = initializeApp(cfg);
const db = getDatabase(app);

// Global Değişkenler
let currentUser = localStorage.getItem('chatNick') || "User_" + Math.floor(Math.random()*999);
let currentRoom = "genel";
const userUID = localStorage.getItem('userUID') || Math.random().toString(36).substring(7);
localStorage.setItem('userUID', userUID);

// Başlangıç Ayarları
document.getElementById('myNickDisplay').innerText = currentUser;

// Mesaj Gönderme
window.sendMessage = (text) => {
    const roomRef = ref(db, `rooms/${currentRoom}/messages`);
    push(roomRef, {
        u: currentUser,
        m: text,
        uid: userUID,
        t: Date.now()
    });
};

// Oda Oluşturma (Oluşturan Admin olur)
window.createRoom = () => {
    const roomName = prompt("Oda adı girin:");
    if(roomName) {
        const roomID = roomName.toLowerCase().replace(/\s/g, '-');
        set(ref(db, `rooms/${roomID}/metadata`), {
            admin: userUID,
            name: roomName
        });
        switchChannel(roomID);
    }
};

// Kanal Değiştirme
window.switchChannel = (id) => {
    currentRoom = id;
    document.getElementById('currentChannelName').innerText = "# " + id;
    document.getElementById('messages').innerHTML = ""; // Ekranı temizle
    listenMessages(id);
};

// Mesajları Dinleme
function listenMessages(roomID) {
    const roomRef = ref(db, `rooms/${roomID}`);
    
    // Önce admini öğren
    let adminID = "";
    onValue(ref(db, `rooms/${roomID}/metadata/admin`), (s) => adminID = s.val());

    onChildAdded(ref(db, `rooms/${roomID}/messages`), (snap) => {
        const d = snap.val();
        const isAdmin = d.uid === adminID && roomID !== 'genel';
        
        const html = `
            <div class="msg-item">
                <span class="msg-author">${d.u}</span>
                ${isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                <span class="msg-body">${d.m}</span>
            </div>`;
        const box = document.getElementById('messages');
        box.innerHTML += html;
        box.scrollTop = box.scrollHeight;
    });
}

// Event Listeners
document.getElementById('msgInput').onkeypress = (e) => {
    if(e.key === 'Enter') {
        sendMessage(e.target.value);
        e.target.value = "";
    }
};

// Ayarlar
window.openSettings = () => document.getElementById('settingsModal').style.display='flex';
window.closeSettings = () => document.getElementById('settingsModal').style.display='none';
window.saveSettings = () => {
    const nick = document.getElementById('newNick').value;
    if(nick) {
        currentUser = nick;
        localStorage.setItem('chatNick', nick);
        document.getElementById('myNickDisplay').innerText = nick;
        closeSettings();
    }
};

// İlk yükleme
switchChannel('genel');
