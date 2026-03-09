// --- F12 VE İNCELEME ENGELLİ ---
(function() {
    // 1. Sağ tık menüsünü tamamen kapat (İncele yazısı çıkmasın)
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 2. Kritik tuş kombinasyonlarını durdur
    document.addEventListener('keydown', e => {
        if (
            e.key === "F12" || // F12 tuşu
            (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) || // Ctrl+Shift+I/J/C
            (e.ctrlKey && e.key === "U") // Ctrl+U (Kaynak kodu)
        ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // 3. Ekstra Önlem: Ctrl+S (Kaydetme) engeli
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === "s") {
            e.preventDefault();
        }
    });
})();

// --- SECURE CONFIG ---
const MASTER_KEY = "overlord_alper_9922"; 
const cfg = { apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs", databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com", projectId: "trchat-7bc26" };
firebase.initializeApp(cfg);
const db = firebase.database();

// Gelişmiş Parmak İzi (Ban yiyen kaçamaz)
const FINGERPRINT = btoa(navigator.userAgent + screen.width + navigator.deviceMemory).slice(0, 24);
let MY_NAME = localStorage.getItem('u_name') || "User_" + FINGERPRINT.slice(-3);
let currentRoom = "genel";

const isRoot = () => localStorage.getItem('admin_token') === MASTER_KEY;

// --- HACKER SAVAR (XSS & F12) ---
const clean = (str) => {
    const div = document.createElement('div');
    div.textContent = str; // HTML Etiketlerini Düz Metne Dönüştürür (Injection Engeli)
    return div.innerHTML;
};

setInterval(() => {
    if(window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        db.ref(`blacklist/${FINGERPRINT}`).set({reason: "F12_EXPLOIT", ts: Date.now()});
    }
}, 1500);

// --- CHAT LOGIC ---
window.uiSend = () => {
    const inp = document.getElementById('msg-input');
    const txt = inp.value.trim();
    if(!txt || txt.length > 400) return;

    const role = isRoot() ? {n: 'OVERLORD', g: 'overlord', c: 'text-red-500'} : {n: 'MEMBER', g: 'member', c: 'text-gray-500'};

    db.ref(`msgs/${currentRoom}`).push({
        uid: FINGERPRINT, un: MY_NAME, t: txt, r: role, ts: Date.now(),
        v: isRoot() ? btoa(MASTER_KEY) : "null" // Admin Mesaj Doğrulama
    });
    inp.value = '';
};

window.loadMsgs = () => {
    db.ref(`msgs/${currentRoom}`).off();
    db.ref(`msgs/${currentRoom}`).limitToLast(40).on('value', snap => {
        const box = document.getElementById('messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            // Admin taklidi yapanı engelle
            if(d.r.n === 'OVERLORD' && d.v !== btoa(MASTER_KEY)) return;

            box.innerHTML += `
                <div class="msg ${d.r.g}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-black uppercase tracking-widest ${d.r.c}">${d.r.n} • ${d.un}</span>
                        ${isRoot() ? `<button onclick="ban('${d.uid}')" class="text-red-600 font-bold text-[10px]">BAN</button>` : ''}
                    </div>
                    <div class="text-[14px] text-gray-200">${clean(d.t)}</div>
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// --- AUTH & INITIALIZE ---
window.ban = (id) => isRoot() && db.ref(`blacklist/${id}`).set({reason: "OVERLORD_COMMAND", by: "ALPER"});

if(window.location.hash === "#root") {
    localStorage.setItem('admin_token', MASTER_KEY);
    location.hash = ""; location.reload();
}

db.ref(`blacklist/${FINGERPRINT}`).on('value', s => {
    if(s.val()) document.getElementById('BAN-SCREEN').style.display = 'flex';
});

// Oda listesi ve Başlatma
db.ref('rooms').on('value', s => {
    const list = document.getElementById('room-list');
    list.innerHTML = `<div onclick="switchRoom('genel')" class="list-item active"># genel</div>`;
    s.forEach(c => list.innerHTML += `<div onclick="switchRoom('${c.key}')" class="list-item"># ${c.key}</div>`);
});

window.switchRoom = (id) => { currentRoom = id; loadMsgs(); };
document.getElementById('msg-input').onkeypress = (e) => e.key === 'Enter' && uiSend();
loadMsgs();
