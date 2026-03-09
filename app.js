/* ===============================
   CONFIG
================================ */

const config = {
 apiKey:"API_KEY",
 databaseURL:"DB_URL",
 projectId:"PROJECT_ID"
}

firebase.initializeApp(config)

const db = firebase.database()

/* ===============================
   GLOBALS
================================ */

let UID = localStorage.getItem("uid")
let NAME = localStorage.getItem("uname")
let ROOM = "genel"

let lastMsg = 0
let lastTyping = 0

const MSG_LIMIT = 400
const RATE = 1200

/* ===============================
   UTILS
================================ */

function clean(txt){
 const div=document.createElement("div")
 div.textContent=txt
 return div.innerHTML
}

async function sha(text){
 const buf = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(text)
 )

 return [...new Uint8Array(buf)]
 .map(x=>x.toString(16).padStart(2,"0"))
 .join("")
}

/* ===============================
   AUTH
================================ */

async function login(){

 const email=document.getElementById("email").value.trim()
 const user=document.getElementById("user").value.trim()
 const pass=document.getElementById("pass").value.trim()

 if(!email||!user||!pass)
 return alert("eksik")

 const uid=btoa(email).replace(/[^a-z0-9]/gi,"")

 const ref=db.ref("users/"+uid)

 const snap=await ref.get()

 const ph=await sha(pass)

 if(snap.exists()){

  if(snap.val().pass!==ph)
  return alert("şifre yanlış")

 }else{

  await ref.set({
   email,
   user,
   pass:ph,
   role:"member",
   created:Date.now(),
   banned:false
  })

 }

 localStorage.setItem("uid",uid)
 localStorage.setItem("uname",user)

 location.reload()

}

/* ===============================
   ONLINE USERS
================================ */

function setOnline(){

 if(!UID)return

 const ref=db.ref("online/"+UID)

 ref.set({
  user:NAME,
  ts:Date.now()
 })

 ref.onDisconnect().remove()

}

/* ===============================
   LOAD ONLINE
================================ */

function loadOnline(){

 db.ref("online").on("value",snap=>{

  const box=document.getElementById("online")

  box.innerHTML=""

  snap.forEach(u=>{

   const d=u.val()

   box.innerHTML+=`
   <div class="onlineUser">
    🟢 ${clean(d.user)}
   </div>
   `

  })

 })

}

/* ===============================
   SEND MESSAGE
================================ */

async function sendMsg(){

 if(!UID)return

 const now=Date.now()

 if(now-lastMsg<RATE)
 return

 const input=document.getElementById("msg")

 let text=input.value.trim()

 if(!text)return

 if(text.length>MSG_LIMIT)
 return alert("mesaj çok uzun")

 lastMsg=now

 await db.ref("msgs/"+ROOM).push({

  uid:UID,
  user:NAME,
  text,
  ts:now

 })

 input.value=""

}

/* ===============================
   DELETE MESSAGE
================================ */

async function delMsg(id){

 const ref=db.ref("msgs/"+ROOM+"/"+id)

 const snap=await ref.get()

 if(!snap.exists())return

 if(snap.val().uid!==UID)
 return

 ref.remove()

}

/* ===============================
   LOAD MESSAGES
================================ */

function loadMsgs(){

 db.ref("msgs/"+ROOM)
 .limitToLast(80)
 .on("value",snap=>{

  const box=document.getElementById("messages")

  box.innerHTML=""

  snap.forEach(m=>{

   const d=m.val()

   box.innerHTML+=`
   <div class="msg">

    <div class="msgHead">
     <b>${clean(d.user)}</b>
     <span>${new Date(d.ts).toLocaleTimeString()}</span>
    </div>

    <div class="msgText">
     ${clean(d.text)}
    </div>

    ${d.uid===UID?`
    <button onclick="delMsg('${m.key}')">
     sil
    </button>`:""}

   </div>
   `

  })

  box.scrollTop=box.scrollHeight

 })

}

/* ===============================
   TYPING
================================ */

function typing(){

 const now=Date.now()

 if(now-lastTyping<1000)return

 lastTyping=now

 db.ref("typing/"+ROOM+"/"+UID).set({

  user:NAME,
  ts:now

 })

 setTimeout(()=>{
  db.ref("typing/"+ROOM+"/"+UID).remove()
 },2000)

}

function loadTyping(){

 db.ref("typing/"+ROOM).on("value",snap=>{

  const box=document.getElementById("typing")

  box.innerHTML=""

  snap.forEach(t=>{

   const d=t.val()

   if(t.key===UID)return

   box.innerHTML+=`
   ${clean(d.user)} yazıyor...
   `

  })

 })

}

/* ===============================
   ROOMS
================================ */

async function createRoom(){

 const name=prompt("room adı")

 if(!name)return

 const safe=name
 .toLowerCase()
 .replace(/[^a-z0-9]/g,"")

 await db.ref("rooms/"+safe).set({

  owner:UID,
  created:Date.now()

 })

}

function loadRooms(){

 db.ref("rooms").on("value",snap=>{

  const box=document.getElementById("rooms")

  box.innerHTML=""

  snap.forEach(r=>{

   box.innerHTML+=`
   <div onclick="switchRoom('${r.key}')">
    # ${r.key}
   </div>
   `

  })

 })

}

function switchRoom(r){

 ROOM=r

 loadMsgs()
 loadTyping()

}

/* ===============================
   BAN SYSTEM
================================ */

async function ban(uid){

 const me=await db.ref("users/"+UID).get()

 if(me.val().role!=="admin")
 return

 await db.ref("users/"+uid+"/banned")
 .set(true)

}

async function checkBan(){

 if(!UID)return

 const snap=await db.ref("users/"+UID).get()

 if(snap.val().banned){

  alert("banlandın")
  localStorage.clear()
  location.reload()

 }

}

/* ===============================
   EMOJI PARSER
================================ */

function parseEmoji(text){

 return text
 .replace(":)","😊")
 .replace(":(","😢")
 .replace(":D","😄")
 .replace("<3","❤️")

}

/* ===============================
   INIT
================================ */

function init(){

 if(!UID){
  document.getElementById("login").style.display="block"
  return
 }

 document.getElementById("chat").style.display="block"

 setOnline()

 loadOnline()

 loadRooms()

 loadMsgs()

 loadTyping()

 checkBan()

}

/* ===============================
   EVENTS
================================ */

document
.getElementById("msg")
.addEventListener("keypress",e=>{

 if(e.key==="Enter")
 sendMsg()

 typing()

})

/* ===============================
   START
================================ */

init()
