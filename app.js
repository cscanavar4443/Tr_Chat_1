import { messagesRef, push, onChildAdded } from './firebase-config.js';

window.sendMessage = () => {
  const user = document.getElementById('username').value || "Anonim";
  const text = document.getElementById('messageInput').value;

  if (text.trim() !== "") {
    push(messagesRef, {
      username: user,
      message: text,
      timestamp: Date.now()
    });
    document.getElementById('messageInput').value = "";
  }
};

// Veritabanını dinle ve yeni mesaj gelince ekrana yaz
onChildAdded(messagesRef, (data) => {
  const msg = data.val();
  const msgDiv = document.getElementById('messages');
  msgDiv.innerHTML += `<p><strong>${msg.username}:</strong> ${msg.message}</p>`;
  msgDiv.scrollTop = msgDiv.scrollHeight; // Otomatik aşağı kaydır
});
