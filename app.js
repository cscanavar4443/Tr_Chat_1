// --- 1. CORE & ROLES ---
const cfg = { apiKey: "AIzaSyBpCLRiS8pHlTgvVmNLH92u3VszvT25xPs", databaseURL: "https://trchat-7bc26-default-rtdb.firebaseio.com", projectId: "trchat-7bc26" };
firebase.initializeApp(cfg);
const db = firebase.database();
const MY_ID = btoa(navigator.userAgent + screen.width).slice(0, 15);
const MY_NAME = localStorage.getItem('u_name') || "User_" + MY_ID.slice(-3);
let currentRoom = "genel";

// Rütbe Tanımları (CSS ile Bağlantılı)
const getRole = (name) => {
    if (name === "alper" || localStorage.getItem('admin_token') === "overlord_alper_9922") return { n: "OVERLORD", c: "text-red-500", g: "admin-glow", s: "👑" };
    if (localStorage.getItem('is_mod')) return { n: "MODERATOR", c: "text-green-400", g: "mod-glow", s: "🛡️" };
    if (localStorage.getItem('is_vip')) return { n: "VIP+", c: "text-purple-400", g: "vip-glow", s: "💎" };
    return { n: "MEMBER", c: "text-gray-400", g: "user-glow", s: "" };
};

// --- 2. MARKDOWN & EMBED ENGINE ---
const parseText = (text) => {
    let t = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Kalın
                .replace(/\*(.*?)\*/g, '<i>$1</i>')     // İtalik
                .replace(/`(.*?)`/g, '<code class="bg-gray-800 p-1 rounded">$1</code>'); // Kod
    
    // Embed (Link algılama)
    if(t.includes("http")) {
        t += `<div class="embed-box">🔗 Bağlantı algılandı: <a href="${t}" target="_blank" class="text-blue-400 underline">Linke Git</a></div>`;
    }
    return t;
};

// --- 3. CORE FUNCTIONS ---
window.uiSend = () => {
    const input = document.getElementById('msg-input');
    const val = input.value.trim();
    if(!val) return;

    // Bot Komut Desteği (Kendi Botun)
    if(val === "!yardim") {
        db.ref(`msgs/${currentRoom}`).push({ n: "CYBER-BOT", t: "Komutlar: !kurallar, !ping", isBot: true });
    }

    db.ref(`msgs/${currentRoom}`).push({
        id: MY_ID, n: MY_NAME, t: val, 
        role: getRole(MY_NAME), ts: Date.now()
    });
    input.value = '';
};

// --- 4. MESSAGE RENDERER (Reactions, Edit, Delete) ---
const loadMessages = () => {
    db.ref(`msgs/${currentRoom}`).off();
    db.ref(`msgs/${currentRoom}`).on('value', snap => {
        const box = document.getElementById('messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            const role = d.role || getRole(d.n);
            const isMe = d.id === MY_ID;

            box.innerHTML += `
                <div class="msg ${role.g} ${d.isBot ? 'border-l-4 border-blue-500' : ''}" id="${c.key}">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold ${role.c}">${role.s} ${role.n} | ${d.n}</span>
                        ${isMe || getRole(MY_NAME).n === "OVERLORD" ? `<div class="ops"><span onclick="del('${c.key}')">🗑️</span> <span onclick="edit('${c.key}')">✏️</span></div>` : ''}
                    </div>
                    <p class="text-sm mt-1">${parseText(d.t)}</p>
                    <div class="reactions" onclick="react('${c.key}')">➕ 🔥 👍 L</div>
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// --- 5. DISCORD FEATURES (Status, Voice, Ops) ---
window.del = (key) => db.ref(`msgs/${currentRoom}/${key}`).remove();
window.edit = (key) => {
    const n = prompt("Mesajı Düzenle:");
    if(n) db.ref(`msgs/${currentRoom}/${key}`).update({ t: n + " (düzenlendi)" });
};

// Status (Durum) Sistemi
const setStatus = (st) => db.ref(`status/${MY_ID}`).set({ n: MY_NAME, s: st });
window.onbeforeunload = () => db.ref(`status/${MY_ID}`).set({ n: MY_NAME, s: 'offline' });

// Sesli Kanal Taklidi (WebRTC Köprüsü)
window.joinVoice = () => {
    alert("Sesli Kanala Bağlanılıyor... Mikrofon Erişimi İstendi.");
    // Gerçek WebRTC için ek kütüphane gerekir ama mantık budur.
    document.getElementById('voice-status').innerText = "🔴 Sesli: Bağlı";
};

// --- INITIALIZE ---
loadMessages();
setStatus('online');
document.getElementById('msg-input').onkeypress = (e) => {
    if(e.key === 'Enter') uiSend();
    // Mention (@) Sistemi
    if(e.key === '@') console.log("Kullanıcı listesi açılıyor..."); 
};
