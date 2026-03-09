// --- 1. CONFIG & INITIALIZE ---
const MASTER_KEY = "overlord_alper_9922"; 
const cfg = { 
    apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs", 
    databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com", 
    projectId: "trchat-7bc26" 
};
firebase.initializeApp(cfg);
const db = firebase.database();

let MY_NAME = localStorage.getItem('u_name');
let MY_UID = localStorage.getItem('u_id');
let currentRoom = "genel";

const isRoot = () => localStorage.getItem('admin_token') === MASTER_KEY;

// --- 2. F12 DETONATOR (SİTEYİ ÇÖKERTME) ---
(function() {
    const detonator = () => {
        document.body.innerHTML = `
            <div style="background:#000;color:#ff0033;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;text-align:center;">
                <h1 style="font-size:50px;">☢️ SİSTEM İMHA EDİLDİ</h1>
                <p style="font-size:20px;">Geliştirici Araçları Saptandı. Tarayıcı kilitleniyor...</p>
            </div>`;
        // Sonsuz döngü ile tarayıcı sekmesini dondurur (CPU/RAM Spike)
        while(true) {
            console.log("BYE BYE HACKER");
            debugger; 
        }
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) || (e.ctrlKey && e.key === "u")) {
            e.preventDefault();
            detonator();
        }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
})();

// --- 3. KAYIT & GİRİŞ SİSTEMİ ---
window.handleAuth = () => {
    const email = document.getElementById('auth-email').value.trim();
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();

    if(!email || !user || !pass) return alert("Eksik bilgi girmeyin!");
    
    const safeUID = btoa(email).replace(/[^a-zA-Z0-9]/g, ""); // E-posta'dan benzersiz ID

    db.ref(`users/${safeUID}`).once('value', s => {
        if(s.exists()) {
            if(s.val().pass === pass) {
                authSuccess(s.val());
            } else {
                alert("Bu e-posta kayıtlı ama şifre yanlış!");
            }
        } else {
            // Yeni Kayıt
            const newUser = { email, user, pass, id: safeUID, role: 'MEMBER' };
            db.ref(`users/${safeUID}`).set(newUser);
            authSuccess(newUser);
        }
    });
};

const authSuccess = (u) => {
    localStorage.setItem('u_id', u.id);
    localStorage.setItem('u_name', u.user);
    location.reload(); 
};

// --- 4. MESAJLAŞMA MOTORU (XSS KORUMALI) ---
const clean = (t) => {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
};

window.uiSend = () => {
    const inp = document.getElementById('msg-input');
    const txt = inp.value.trim();
    if(!txt || !MY_UID) return;

    const role = isRoot() ? {n: 'OVERLORD', g: 'admin-glow', c: 'text-red-500'} : {n: 'MEMBER', g: 'user-glow', c: 'text-gray-400'};

    db.ref(`msgs/${currentRoom}`).push({
        uid: MY_UID, un: MY_NAME, t: txt, r: role, ts: Date.now(),
        v: isRoot() ? btoa(MASTER_KEY) : "null"
    });
    inp.value = '';
};

window.loadMsgs = () => {
    if(!MY_UID) return;
    db.ref(`msgs/${currentRoom}`).off();
    db.ref(`msgs/${currentRoom}`).limitToLast(50).on('value', snap => {
        const box = document.getElementById('messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            if(d.r.n === 'OVERLORD' && d.v !== btoa(MASTER_KEY)) return; // Sahte admin engeli

            box.innerHTML += `
                <div class="msg ${d.r.g}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-black ${d.r.c}">${d.r.n} • ${d.un}</span>
                        ${isRoot() ? `<button onclick="ban('${d.uid}')" class="text-[9px] text-red-600 font-bold">BANLA</button>` : ''}
                    </div>
                    <div class="text-sm">${clean(d.t)}</div>
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// --- 5. INITIALIZE ---
window.ban = (id) => isRoot() && db.ref(`blacklist/${id}`).set({reason: "MANUAL", ts: Date.now()});

// Ban Kontrolü
if(MY_UID) {
    db.ref(`blacklist/${MY_UID}`).on('value', s => {
        if(s.val()) document.getElementById('BAN-SCREEN').style.display = 'flex';
    });
}

// Admin Hash Girişi
if(window.location.hash === "#root") {
    localStorage.setItem('admin_token', MASTER_KEY);
    location.hash = ""; location.reload();
}

// Uygulama Başlatma
if(MY_UID) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('my-name-display').innerText = MY_NAME;
    loadMsgs();
}

// Oda Listesi
db.ref('rooms').on('value', s => {
    const list = document.getElementById('room-list');
    list.innerHTML = `<div onclick="switchRoom('genel')" class="room-item active"># genel</div>`;
    s.forEach(c => list.innerHTML += `<div onclick="switchRoom('${c.key}')" class="room-item"># ${c.key}</div>`);
});

window.switchRoom = (id) => { currentRoom = id; loadMsgs(); };
document.getElementById('msg-input').onkeypress = (e) => e.key === 'Enter' && uiSend();
