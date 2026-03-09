// Güvenlik Kimliği (Birden fazla veriden karma oluşturur)
const getHardwareID = () => {
    return btoa(navigator.userAgent + navigator.hardwareConcurrency + screen.width).slice(0, 20);
};

const MY_ID = getHardwareID();
const ADMIN_KEY = "ozel_anahtar_99"; // Admin olmak için localStorage.setItem('access_token', 'ozel_anahtar_99')

// --- FULL BAN FONKSİYONU ---
function executeFullBan(reason) {
    console.warn("GÜVENLİK İHLALİ: " + reason);
    // 1. Veritabanına Ban Kaydı
    firebase.database().ref(`blacklist/${MY_ID}`).set({
        reason: reason,
        time: Date.now(),
        type: "FULL_HARDWARE_BAN"
    });
    // 2. Cookie ve LocalStorage Temizliği
    document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    // 3. Ekranı Kilitle
    window.location.reload();
}

// --- TESPİT SİSTEMLERİ ---
// 1. Geliştirici Araçları (Chrome/Brave) Tespit
setInterval(() => {
    const devtools = /./;
    devtools.toString = function() {
        executeFullBan("Geliştirici Araçları Tespiti");
    };
}, 2000);

// 2. Takipçi/Eklenti Müdahale Koruması
if (window.chrome && !window.chrome.runtime) {
    // Bazı eklentiler chrome.runtime'ı manipüle eder
    console.log("Eklenti taraması aktif...");
}

// 3. Sağ Tık ve Tuş Kısıtlamaları
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = e => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74))) {
        executeFullBan("Kısayol Tuşu İhlali");
        return false;
    }
};
