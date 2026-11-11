const profiles = [
  {name:"Alex",age:16,initial:"A",bio:"Into sketching, music and weekend football.",interests:["Art","Music","Football"]},
  {name:"Sam",age:17,initial:"S",bio:"Book lover who enjoys coding small projects.",interests:["Books","Coding","Chess"]},
  {name:"Jamie",age:15,initial:"J",bio:"Trying new recipes and learning guitar.",interests:["Cooking","Guitar","Movies"]},
  {name:"Taylor",age:16,initial:"T",bio:"Nature walks, photography and science facts.",interests:["Nature","Photos","Science"]}
];
let current = 0;
let activity = [];
const $ = id => document.getElementById(id);
function showToast(text){const el=$("toast");el.textContent=text;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2100)}
function renderProfile(){
  if(current>=profiles.length){$("profileCard").innerHTML='<div class="panel"><div class="empty-icon">✦</div><h3>That’s everyone for now</h3><p>You reached the end of the sample profiles.</p><button class="outline-btn" id="againBtn">Start again</button></div>'; $("againBtn").addEventListener("click",()=>{current=0;renderProfile()});return}
  const p=profiles[current];
  $("avatarInitial").textContent=p.initial;$("profileName").textContent=`${p.name}, ${p.age}`;$("profileBio").textContent=p.bio;
  $("profileInterests").innerHTML=p.interests.map(x=>`<span class="chip">${x}</span>`).join("");
}
function renderActivity(){
  const host=$("connectionList");
  if(!activity.length){host.innerHTML='<div class="empty-icon">♡</div><h3>No hellos yet</h3><p>When you tap “Say hi” on a sample profile, it will appear here.</p>';return}
  host.innerHTML='<h3>Your demo activity</h3>'+activity.map(p=>`<div class="activity-row"><span class="mini-avatar">${p.initial}</span><div><b>${p.name}, ${p.age}</b><small>Say hi sent on this device</small></div></div>`).join("");
}
function next(){current++;renderProfile()}
$("skipBtn").addEventListener("click",()=>{next();$("feedback").textContent="Skipped this sample profile."});
$("helloBtn").addEventListener("click",()=>{if(current<profiles.length){const p=profiles[current];activity.unshift(p);renderActivity();$("feedback").textContent=`You said hi to ${p.name} (demo only).`;next();}});
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("selected",x===btn));
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===btn.dataset.view));
  if(btn.dataset.view==="connectionsView")renderActivity();
}));
$("resetBtn").addEventListener("click",()=>{activity=[];current=0;renderActivity();renderProfile();showToast("Demo activity reset.")});
let installPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").hidden=false});
$("installBtn").addEventListener("click",async()=>{if(!installPrompt){showToast("Use your browser menu and choose Add to Home screen.");return}installPrompt.prompt();installPrompt=null;$("installBtn").hidden=true});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
renderProfile();

// Touch swipe gestures: left = skip, right = say hi (friendship demo only).
(() => {
  const card = $("profileCard");
  let startX = 0, startY = 0, deltaX = 0, tracking = false;
  card.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    deltaX = 0; tracking = true;
    card.classList.add("dragging");
  }, {passive:true});
  card.addEventListener("touchmove", e => {
    if (!tracking || e.touches.length !== 1) return;
    deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
      card.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 22}deg)`;
    }
  }, {passive:true});
  card.addEventListener("touchend", () => {
    if (!tracking) return;
    tracking = false;
    card.classList.remove("dragging");
    card.style.transform = "";
    if (deltaX > 95) $("helloBtn").click();
    else if (deltaX < -95) $("skipBtn").click();
  });
})();
