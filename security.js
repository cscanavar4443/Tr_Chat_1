// Harici kütüphane gerektirir: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js

export const Security = {
    // 1. XSS Koruması: Gelen metindeki zararlı karakterleri etkisiz hale getirir
    sanitize: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 2. SHA-256: Verinin değiştirilmediğini doğrulamak için "hash" üretir
    generateHash: (text) => {
        // @ts-ignore (CryptoJS global olarak yüklenecek)
        return CryptoJS.SHA256(text).toString();
    },

    // 3. Basit bir küfür/kelime filtresi (Premium özellik)
    filterBadWords: (text) => {
        const banned = ["küfür1", "reklam", "spam"]; // Buraya engel listeni ekle
        let filtered = text;
        banned.forEach(word => {
            const reg = new RegExp(word, "gi");
            filtered = filtered.replace(reg, "***");
        });
        return filtered;
    }
};
