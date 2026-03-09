const firebaseConfig = {
    apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs",
    databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com",
    projectId: "trchat-7bc26"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Ban Kontrolü
db.ref(`blacklist/${SECURITY_ID}`).on('value', s => {
    if(s.val()) document.getElementById('BAN-SCREEN').style.display = 'flex';
});

// Mesaj Gönderme
function uiSend() {
    const input = document.getElementById('msg-input');
    if(!input.value) return;
    
    db.ref('chat/global').push({
        id: SECURITY_ID,
        name: isOverlord() ? "ALPER [ROOT]" : "User_" + SECURITY_ID.slice(-3),
        text: input.value,
        isRoot: isOverlord()
    });
    input.value = '';
}

// Mesajları Listele (Hızlı Render)
db.ref('chat/global').on('value', snap => {
    const box = document.getElementById('messages');
    box.innerHTML = '';
    snap.forEach(child => {
        const d = child.val();
        const btn = (isOverlord() && d.id !== SECURITY_ID) ? 
            `<button onclick="banUser('${d.id}')" class="ban-btn">BAN</button>` : '';
        
        box.innerHTML += `
            <div class="msg ${d.isRoot ? 'root' : ''}">
                <b>${d.name}:</b> ${d.text} ${btn}
            </div>`;
    });
    box.scrollTop = box.scrollHeight;
});

function banUser(target) {
    if(confirm("Kalıcı olarak banla?")) db.ref(`blacklist/${target}`).set(true);
}
