import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const screens = ["welcome","profileSetup","home"];
function screen(id){screens.forEach(x=>$(x).classList.toggle("active",x===id))}
function status(id,msg){$(id).textContent=msg}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function safeText(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderProfile(p){
  $("helloName").textContent=p.displayName||"friend";
  $("myName").textContent=p.displayName||"Your profile";
  $("myAvatar").textContent=(p.displayName||"C").trim().charAt(0).toUpperCase();
  $("myBio").textContent=p.bio||"";
  $("myInterests").innerHTML=(p.interests||[]).map(x=>`<span class="chip">${safeText(x)}</span>`).join("");
}
async function profileFor(user){
  const snap=await getDoc(doc(db,"profiles",user.uid));
  if(snap.exists()){renderProfile(snap.data());screen("home")}else screen("profileSetup");
}
function friendlyError(e){
  const map={"auth/email-already-in-use":"This email already has an account.","auth/invalid-email":"Enter a valid email address.","auth/weak-password":"Use a stronger password (at least 8 characters).","auth/invalid-credential":"Email or password is incorrect.","auth/popup-closed-by-user":"Google sign-in was closed.","auth/operation-not-allowed":"Enable this sign-in method in Firebase Console."};
  return map[e.code]||e.message||"Something went wrong. Please try again.";
}
$("signup").addEventListener("click",async()=>{
  status("authStatus","");const email=$("email").value.trim(),password=$("password").value;
  if(!email||password.length<8){status("authStatus","Enter an email and a password with at least 8 characters.");return}
  try{await createUserWithEmailAndPassword(auth,email,password)}catch(e){status("authStatus",friendlyError(e))}
});
$("signin").addEventListener("click",async()=>{
  status("authStatus","");try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value)}catch(e){status("authStatus",friendlyError(e))}
});
$("google").addEventListener("click",async()=>{
  status("authStatus","");try{await signInWithPopup(auth,googleProvider)}catch(e){status("authStatus",friendlyError(e))}
});
$("saveProfile").addEventListener("click",async()=>{
  const user=auth.currentUser,displayName=$("displayName").value.trim(),ageGroup=$("ageGroup").value,bio=$("bio").value.trim();
  const interests=$("interests").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,6);
  if(!user){status("profileStatus","Please sign in again.");return}
  if(displayName.length<2||!["13-15","16-17"].includes(ageGroup)||!$("rulesAgree").checked){status("profileStatus","Enter a nickname, choose an eligible age group and accept the safety rules.");return}
  try{
    await setDoc(doc(db,"profiles",user.uid),{uid:user.uid,displayName,ageGroup,bio,interests,community:"friendship",status:"pending_review",createdAt:serverTimestamp()});
    status("profileStatus","Profile submitted. It will remain private until moderation is configured and approves it.");
    toast("Profile saved for review.");
  }catch(e){status("profileStatus",friendlyError(e))}
});
$("logout").addEventListener("click",()=>signOut(auth));
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));
  document.querySelectorAll(".pane").forEach(x=>x.classList.toggle("active",x.id===btn.dataset.tab+"Pane"));
}));
$("skip").addEventListener("click",()=>toast("Live discovery is disabled until safety review is configured."));
$("request").addEventListener("click",()=>toast("Friend requests unlock after approved profiles and moderation are connected."));
onAuthStateChanged(auth,async user=>{if(user){try{await profileFor(user)}catch(e){screen("profileSetup");status("profileStatus",friendlyError(e))}}else screen("welcome")});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
let installEvent;$("install").hidden=true;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvent=e;$("install").hidden=false});
$("install").addEventListener("click",async()=>{if(installEvent){installEvent.prompt();installEvent=null}else toast("Open browser menu and choose Add to Home screen.")});
