// --- 1. CONFIG & START ---
const cfg = { apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs", databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com", projectId: "trchat-7bc26" };
firebase.initializeApp(cfg);
const db = firebase.database();
const MY_ID = btoa(navigator.userAgent + screen.width).slice(0, 15);
const MY_NAME = localStorage.getItem('user_name') || "User_" + MY_ID.slice(-3);
const SECRET = "overlord_alper_9922";
let currentRoom = "genel";

const isRoot = () => localStorage.getItem('admin_token') === SECRET;

// --- 2. CORE FUNCTIONS ---
const ui = {
    msg: document.getElementById('messages'),
    roomList: document.getElementById('room-list'),
    input: document.getElementById('msg-input'),
    title: document.getElementById('room-title')
};

// Mesaj Gönder
window.uiSend = () => {
    const text = ui.input.value.trim();
    if(!text) return;
    if(text.startsWith('/unban ') && isRoot()) return unbanUser(text.split(' ')[1]);

    db.ref(`msgs/${currentRoom}`).push({
        id: MY_ID, n: isRoot() ? "ALPER [ROOT]" : MY_NAME,
        t: text, r: isRoot(), ts: Date.now()
    });
    ui.input.value = '';
};

// Oda Değiştir
window.switchRoom = (name) => {
    currentRoom = name;
    ui.title.innerText = `# ${name}`;
    document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-name="${name}"]`)?.classList.add('active');
    loadMessages();
};

// Oda Oluştur
window.createRoom = () => {
    const r = prompt("Oda Adı:").toLowerCase().replace(/\s/g, '-');
    if(r) db.ref('rooms/' + r).set({ name: r, by: MY_ID }).then(() => switchRoom(r));
};

// --- 3. DATA LOADERS ---
const loadMessages = () => {
    db.ref(`msgs/${currentRoom}`).off();
    db.ref(`msgs/${currentRoom}`).on('value', snap => {
        ui.msg.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            const glow = d.r ? 'admin-glow' : 'user-glow';
            const btn = (isRoot() && d.id !== MY_ID) ? `<button onclick="ban('${d.id}')" class="btn-ban">BAN</button>` : '';
            
            ui.msg.innerHTML += `
                <div class="msg ${glow} ${d.r ? 'root-style' : ''}">
                    <b class="${d.r ? 'text-red-500' : 'text-indigo-400'}">${d.n}</b>
                    <p>${d.t}</p> ${btn}
                </div>`;
        });
        ui.msg.scrollTop = ui.msg.scrollHeight;
    });
};

// Odaları Dinle
db.ref('rooms').on('value', snap => {
    ui.roomList.innerHTML = `<div onclick="switchRoom('genel')" data-name="genel" class="room-item active"># genel</div>`;
    snap.forEach(c => {
        const r = c.val().name;
        ui.roomList.innerHTML += `<div onclick="switchRoom('${r}')" data-name="${r}" class="room-item"># ${r}</div>`;
    });
});

// --- 4. AUTHORITY & SECURITY ---
window.ban = (id) => isRoot() && confirm("BANLANSIN MI?") && db.ref(`blacklist/${id}`).set({time: Date.now(), by: "ROOT"});

const unbanUser = (id) => db.ref(`blacklist/${id}`).remove().then(() => alert("ENGEL KALKTI"));

// Giriş Koruması
db.ref(`blacklist/${MY_ID}`).on('value', s => {
    if(s.val()) document.body.innerHTML = `<div id="BAN-SCREEN" style="display:flex"><h1>ERİŞİM REDDEDİLDİ</h1><p>ID: ${MY_ID}</p></div>`;
});

// F12 / Hacker Engel (Hafif Versiyon)
setInterval(() => {
    if(window.outerWidth - window.innerWidth > 160) {
        db.ref(`blacklist/${MY_ID}`).set({reason: "F12_DETECTED"});
        location.reload();
    }
}, 2000);

// Admin Giriş Desteği
if(window.location.hash === "#root_login") {
    localStorage.setItem('admin_token', SECRET);
    alert("OVERLORD YETKİSİ AKTİF");
}

// Başlat
ui.input.onkeypress = (e) => e.key === 'Enter' && uiSend();
loadMessages();
console.log("Hyper-Core V14 Aktif. ID: " + MY_ID);
