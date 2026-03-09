// Banlama Fonksiyonu (Sadece sen görürsün)
window.ban = (id) => {
    if(!isRoot()) return;
    const reason = prompt("Ban Sebebi?");
    if(reason) db.ref(`blacklist/${id}`).set({ reason: reason, ts: Date.now() });
};

// Mesajları Yükleme Kısmında (UI Güncellemesi)
window.loadMsgs = () => {
    db.ref(`msgs/${currentRoom}`).limitToLast(50).on('value', snap => {
        const box = document.getElementById('messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const d = c.val();
            const isAdmin = d.r.n === 'OVERLORD';
            
            box.innerHTML += `
                <div class="msg ${isAdmin ? 'admin-glow' : 'user-glow'}">
                    <div class="flex justify-between">
                        <b class="${isAdmin ? 'role-admin' : ''}">${d.r.n} // ${d.un}</b>
                        ${isRoot() && d.uid !== MY_UID ? `<span onclick="ban('${d.uid}')" style="color:var(--red); cursor:pointer; font-size:9px;">[BAN]</span>` : ''}
                    </div>
                    <p>${clean(d.t)}</p>
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};
