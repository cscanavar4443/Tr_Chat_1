// --- CONFIG ---
const firebaseConfig = { apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs", databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com", projectId: "trchat-7bc26" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const MASTER_KEY = "overlord_alper_9922";
const MY_ID = btoa(navigator.userAgent + screen.width).slice(0, 16);
let MY_NAME = localStorage.getItem('u_name') || "User_" + Math.floor(Math.random()*999);
let currentRoom = "genel";

const isRoot = () => localStorage.getItem('admin_token') === MASTER_KEY || MY_NAME.toLowerCase() === "alper";

// --- SECURITY ---
const lockSystem = (reason) => {
    db.ref(`blacklist/${MY_ID}`).set({reason, ts: Date.now()});
    location.reload();
};

setInterval(() => {
    if(window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) lockSystem("F12_DETECTED");
}, 2000);

db.ref(`blacklist/${MY_ID}`).on('value', s => {
    if(s.val()) {
        document.getElementById('BAN-SCREEN').style.display = 'flex';
        document.getElementById('ban-reason').innerText = "Sebep: " + s.val().reason;
    }
});

// --- MESSAGING ---
const parse = (t) => {
    return t.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/`(.*?)`/g, '<code style="background:#222;padding:2px;">$1</code>')
            .replace(/(https?:\/\/[^\s]+)/g, '<div style="background:#111;padding:8px;border-left:2px solid #6366f1;margin-top:5px;">🔗 <a href="$1" target="_blank" style="color:#6366f1">$1</a></div>');
};

window.loadMsgs = () => {
    db.ref(`msgs/${currentRoom}`).off();
    db.ref(`msgs/${currentRoom}`).on('value', snap => {
        const box = document.getElementById('messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            const role = d.r || {n: 'MEMBER', g: 'user-glow', c: 'text-gray-500'};
            box.innerHTML += `
                <div class="msg ${role.g}">
                    <div class="flex justify-between">
                        <span class="text-[10px] font-black ${role.c}">${role.n} | ${d.un}</span>
                        ${isRoot() ? `<span onclick="del('${c.key}')" style="cursor:pointer">🗑️</span>` : ''}
                    </div>
                    <div class="text-sm mt-1">${parse(d.t)}</div>
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

window.uiSend = () => {
    const inp = document.getElementById('msg-input');
    if(!inp.value.trim()) return;
    const roleData = isRoot() ? {n: 'OVERLORD', g: 'admin-glow', c: 'text-red-500'} : {n: 'MEMBER', g: 'user-glow', c: 'text-gray-400'};
    db.ref(`msgs/${currentRoom}`).push({ uid: MY_ID, un: MY_NAME, t: inp.value, r: roleData, ts: Date.now() });
    inp.value = '';
};

// --- ROOMS & STATUS ---
window.switchRoom = (id) => { currentRoom = id; document.getElementById('active-room-name').innerText = "# " + id; loadMsgs(); };
window.createRoom = () => { const n = prompt("Oda Adı:"); if(n) { const id = n.toLowerCase().replace(/\s/g, '-'); db.ref(`rooms/${id}`).set({name: id}); switchRoom(id); } };
window.del = (key) => db.ref(`msgs/${currentRoom}/${key}`).remove();

db.ref('rooms').on('value', s => {
    const list = document.getElementById('room-list');
    list.innerHTML = `<div onclick="switchRoom('genel')" class="p-2 rounded hover:bg-white/5 cursor-pointer text-sm"># genel</div>`;
    s.forEach(c => { list.innerHTML += `<div onclick="switchRoom('${c.key}')" class="p-2 rounded hover:bg-white/5 cursor-pointer text-sm"># ${c.key}</div>`; });
});

// Admin Hash Login
if(window.location.hash === "#root") { localStorage.setItem('admin_token', MASTER_KEY); location.hash = ""; location.reload(); }

// Init
document.getElementById('my-name-display').innerText = MY_NAME;
document.getElementById('my-avatar').innerText = MY_NAME[0].toUpperCase();
if(isRoot()) document.getElementById('root-tag').classList.remove('hidden');
document.getElementById('msg-input').onkeypress = (e) => e.key === 'Enter' && uiSend();
loadMsgs();
