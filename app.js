import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const cfg = {
  apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs",
  databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com",
  projectId: "trchat-7bc26"
};

const app = initializeApp(cfg);
const db = getDatabase(app);
const messagesRef = ref(db, 'messages');

const chatBox = document.getElementById('chat-box');
const msgInput = document.getElementById('messageInput');
const userBox = document.getElementById('username');

// Mesaj Gönder
const sendMessage = () => {
    const user = userBox.value.trim() || "Anonim";
    const text = msgInput.value.trim();
    
    if (text) {
        push(messagesRef, {
            u: user,
            m: text,
            t: serverTimestamp()
        });
        msgInput.value = "";
    }
};

document.getElementById('sendBtn').onclick = sendMessage;
msgInput.onkeypress = (e) => e.key === 'Enter' && sendMessage();

// Mesajları Dinle
onChildAdded(messagesRef, (snap) => {
    const data = snap.val();
    const isMe = data.u === userBox.value;
    const time = data.t ? new Date(data.t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
    
    const html = `
        <div class="msg ${isMe ? 'me' : ''}">
            <small style="display:block; font-size:10px; opacity:0.7">${data.u}</small>
            <span>${data.m}</span>
            <small style="display:block; text-align:right; font-size:9px; margin-top:4px">${time}</small>
        </div>`;
    
    chatBox.innerHTML += html;
    chatBox.scrollTop = chatBox.scrollHeight;
});
