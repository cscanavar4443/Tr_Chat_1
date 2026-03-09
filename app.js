// --- 1. CONFIG ---
const MASTER_KEY = "overlord_alper_9922"; 
const cfg = { apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs", databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com", projectId: "trchat-7bc26" };
firebase.initializeApp(cfg);
const db = firebase.database();

let MY_NAME = localStorage.getItem('u_name');
let MY_UID = localStorage.getItem('u_id');
let currentRoom = "genel";

const isRoot = () => localStorage.getItem('admin_token') === MASTER_KEY;

// --- 2. F12 DETONATOR (SADECE TUŞ ENGELİ & ÇÖKERTME) ---
(function() {
    const detonator = () => {
        document.body.innerHTML = "<div style='background:#000;color:red;height:100vh;display:flex;align-items:center;justify-content:center;'><h1>SİSTEM KİLİTLENDİ</h1></div>";
        while(true) { debugger; }
    };
    window.addEventListener('keydown', (e) => {
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) || (e.ctrlKey && e.key === "u")) {
            e.preventDefault();
            detonator();
        }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
})();

// --- 3. AUTH & MESSAGING ---
window.handleAuth = () => {
    const email = document.getElementById('auth-email').value.trim();
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if(!email || !user || !pass) return alert("Eksik bilgi!");
    const safeUID = btoa(email).replace(/[^a-zA-Z0-9]/g, "");
    db.ref(`users/${safeUID}`).once('value', s => {
        if(s.exists() && s.val().pass !== pass) return alert("Hatalı şifre!");
        const data = s.exists() ? s.val() : { email, user, pass, id: safeUID };
        if(!s.exists()) db.ref(`users/${safeUID}`).set(data);
        localStorage.setItem('u_id', data.id);
        localStorage.setItem('u_name', data.user);
        location.reload();
    });
};

const clean = (t) => {
    let d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
};

window.uiSend = () => {
    const inp = document.getElementById('msg-input');
    if(!inp.value.trim() || !MY_UID) return;
    const role = isRoot() ? {n: 'OVERLORD', g: 'admin-glow', c: 'text-red-500'} : {n: 'MEMBER', g: 'user-glow', c: 'text-gray-400'};
    db.ref(`msgs/${currentRoom}`).push({
        uid: MY_UID, un: MY_NAME, t: inp.value, r: role, ts: Date.now(),
        v: isRoot() ? btoa(MASTER_KEY) : "null"
    });
    inp.value = '';
};

window.loadMsgs = () => {
    db.ref(`msgs/${currentRoom}`).off();
    db.ref(`msgs/${currentRoom}`).limitToLast(50).on('value', snap => {
        const box = document.getElementById('messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            if(d.r.n === 'OVERLORD' && d.v !== btoa(MASTER_KEY)) return;
            box.innerHTML += `
                <div class="msg ${d.r.g}">
                    <div class="text-[10px] font-bold ${d.r.c} mb-1 uppercase tracking-tighter">${d.r.n} • ${d.un}</div>
                    <div class="text-[14px] leading-snug">${clean(d.t)}</div>
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// --- 4. INIT ---
if(window.location.hash === "#root") { localStorage.setItem('admin_token', MASTER_KEY); location.hash = ""; location.reload(); }
if(MY_UID) { document.getElementById('auth-screen').style.display = 'none'; loadMsgs(); }

db.ref('rooms').on('value', s => {
    const list = document.getElementById('room-list');
    list.innerHTML = `<div onclick="switchRoom('genel')" class="room-item active"># genel</div>`;
    s.forEach(c => list.innerHTML += `<div onclick="switchRoom('${c.key}')" class="room-item"># ${c.key}</div>`);
});

window.switchRoom = (id) => { currentRoom = id; loadMsgs(); };
document.getElementById('msg-input').onkeypress = (e) => e.key === 'Enter' && uiSend();
