// Mesajları Listeleme ve Efektler
db.ref('chat/global').on('value', snap => {
    const box = document.getElementById('messages');
    box.innerHTML = '';
    snap.forEach(child => {
        const d = child.val();
        const isMeAdmin = localStorage.getItem('access_token') === ADMIN_SECRET;
        
        // Admin mesajıysa altın sarısı parlama, normalse indigo parlama
        const glowClass = d.isRoot ? 'admin-glow' : 'user-glow';
        
        // Yetki butonları (Sadece sana görünür)
        let authButtons = '';
        if (isMeAdmin && d.id !== MY_ID) {
            authButtons = `
                <div class="auth-actions">
                    <button onclick="banUser('${d.id}')" class="btn-ban">BAN</button>
                    <button onclick="unbanUser('${d.id}')" class="btn-unban">BAN KALDIR</button>
                </div>
            `;
        }
        
        box.innerHTML += `
            <div class="msg ${glowClass} ${d.isRoot ? 'root-style' : ''}">
                <b class="${d.isRoot ? 'text-red-500' : 'text-indigo-400'}">${d.name}</b>
                <p>${d.text}</p>
                ${authButtons}
            </div>`;
    });
    box.scrollTop = box.scrollHeight;
});

// --- YÖNETİCİ FONKSİYONLARI ---
function banUser(target) {
    if(confirm("Bu kullanıcıyı sistemden siliyor musun?")) {
        db.ref(`blacklist/${target}`).set(true);
    }
}

function unbanUser(target) {
    if(confirm("Bu kullanıcının engelini kaldırmak istediğine emin misin?")) {
        db.ref(`blacklist/${target}`).remove()
        .then(() => alert("Kullanıcının engeli kaldırıldı."));
    }
}
