// HARDWARE FINGERPRINT
// =============================

function getFingerprint() {

    const data = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency,
        screen.width,
        screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join("|");

    return btoa(data).slice(0,40);
}

const MY_ID = getFingerprint();


// =============================
// FULL BAN
// =============================

function executeFullBan(reason){

    console.warn("BAN:", reason);

    firebase.database()
    .ref("blacklist/"+MY_ID)
    .set({
        reason:reason,
        time:Date.now()
    });

    localStorage.clear();
    sessionStorage.clear();

    document.body.innerHTML = `
    <div style="
        background:black;
        color:red;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        font-family:monospace">

        <h1>☣ ACCESS DENIED</h1>
        <p>${reason}</p>

    </div>
    `;

    throw new Error("SYSTEM LOCKED");
}


// =============================
// BAN CHECK
// =============================

firebase.database()
.ref("blacklist/"+MY_ID)
.once("value",snap=>{

    if(snap.exists()){
        executeFullBan("BLACKLISTED");
    }

});


// =============================
// DEVTOOLS DETECTOR
// =============================

setInterval(()=>{

    const threshold = 160;

    if(
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
    ){
        executeFullBan("DevTools Açıldı");
    }

},1000);


// =============================
// DEBUGGER TRAP
// =============================

setInterval(function(){
    const start = performance.now();
    debugger;
    const end = performance.now();

    if(end - start > 100){
        executeFullBan("Debugger Tespiti");
    }

},2000);


// =============================
// KEY BLOCK
// =============================

document.addEventListener("keydown",e=>{

    if(
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
    ){
        e.preventDefault();
        executeFullBan("Kısayol İhlali");
    }

});


// =============================
// RIGHT CLICK BLOCK
// =============================

document.addEventListener("contextmenu",e=>{
    e.preventDefault();
});


// =============================
// CONSOLE DISABLE
// =============================

(function(){

    const noop = function(){};

    console.log = noop;
    console.warn = noop;
    console.error = noop;

})();


// =============================
// IFRAME PROTECTION
// =============================

if(window.top !== window.self){
    executeFullBan("Iframe Injection");
}
