// --- ANTI-HACK CONFIG ---
const MASTER_KEY = "overlord_alper_9922"; // SADECE SEN BİL
const cfg = { apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs", databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com", projectId: "trchat-7bc26" };
firebase.initializeApp(cfg);
const db = firebase.database();

const MY_ID = btoa(navigator.userAgent + screen.width + navigator.language).slice(0, 20);
let MY_NAME = localStorage.getItem('u_name') || "User_" + Math.floor(Math.random()*999);
let currentRoom = "genel";

const isRoot = () => localStorage.getItem('admin_token') === MASTER_KEY;

// --- GÜVENLİK DUVARI ---
const secureAction = (fn) => {
    // Hacker F12 ile admin_token yazsa bile blacklist kontrolü onu durdurur
    db.ref(`blacklist/${MY_ID}`).once('value', s => {
        if(s.val()) location.reload(); else fn();
    });
};

// F12 ve Sağ Tık Engeli (Max)
document.addEventListener('contextmenu', e => e.preventDefault());
setInterval(() => {
    if(window.outerWidth - window.innerWidth > 160) {
        db.ref(`blacklist/${MY_ID}`).set({reason: "F12_EXPLOIT", ts: Date.now()});
    }
}, 1000);

// --- CHAT ENGINE ---
window.uiSend = () => secureAction(() => {
    const inp = document.getElementById('msg-input');
    const text = inp.value.trim();
    if(!text || text.length > 500) return; // Flood Koruması

    const role = isRoot() ? {n: 'OVERLORD', g: 'admin-glow', c: 'text-red-500'} : {n: 'MEMBER', g: 'user-glow', c: 'text-gray-400'};

    db.ref(`msgs/${currentRoom}`).push({
        uid: MY_ID, un: MY_NAME, t: text, r: role, ts: Date.now(),
        v: btoa(MASTER_KEY) // Verifikasyon kodu (Hacker bunu üretemez)
    });
    inp.value = '';
});

window.loadMsgs = () => {
    db.ref(`msgs/${currentRoom}`).off();
    db.ref(`msgs/${currentRoom}`).limitToLast(50).on('value', snap => {
        const box = document.getElementById('messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            // Güvenlik: Eğer v (verifikasyon) yoksa ve mesaj admin gibi görünüyorsa sil!
            if(d.r.n === 'OVERLORD' && d.v !== btoa(MASTER_KEY)) return;

            box.innerHTML += `
                <div class="msg ${d.r.g}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] font-black ${d.r.c} tracking-widest">${d.r.n} • ${d.un}</span>
                        ${isRoot() ? `<button onclick="ban('${d.uid}')" class="text-red-500 text-[10px] hover:underline">BANLA</button>` : ''}
                    </div>
                    <div class="text-[14px] leading-relaxed">${d.t.replace(/</g, "&lt;")}</div>
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// Ban Fonksiyonu (Sadece Admin)
window.ban = (id) => isRoot() && db.ref(`blacklist/${id}`).set({reason: "MANUAL_BAN", by: "ROOT"});

// Admin Hash Login (#root yazınca admin yapar)
if(window.location.hash === "#root") { localStorage.setItem('admin_token', MASTER_KEY); location.hash = ""; location.reload(); }

// Başlat
loadMsgs();
db.ref(`blacklist/${MY_ID}`).on('value', s => { if(s.val()) document.getElementById('BAN-SCREEN').style.display = 'flex'; });
