import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

let selectedPhoto = null;
let currentProfile = null;
let toastTimer = null;

function showOnly(id) {
  ["authScreen", "profileScreen", "appScreen"].forEach(screenId => {
    $(screenId).classList.toggle("hidden", screenId !== id);
  });
}
function setStatus(id, message) {
  $(id).textContent = message;
}
function toast(message) {
  const node = $("toast");
  node.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.textContent = ""; }, 2600);
}
function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "This email already has an account.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Use a stronger password (at least 8 characters).",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/popup-closed-by-user": "Google sign-in was closed.",
    "auth/operation-not-allowed": "Enable this sign-in method in Firebase.",
    "auth/network-request-failed": "Check your internet connection.",
    "storage/unauthorized": "Photo upload is not enabled yet. Check Firebase Storage rules.",
    "storage/bucket-not-found": "Enable Firebase Storage for this project first."
  };
  return messages[error.code] || "Something went wrong. Please try again.";
}
function avatarFallback(name = "C") {
  const letter = (name.trim()[0] || "C").toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2b2026"/><text x="50" y="64" text-anchor="middle" font-size="48" fill="#ff7885">${letter}</text></svg>`)}`;
}
function setAvatar(url, name) {
  const src = url || avatarFallback(name);
  $("avatarPreview").src = src;
  $("myAvatar").src = src;
  $("topAvatar").textContent = (name || "C").trim()[0].toUpperCase();
}
function renderProfile(profile) {
  currentProfile = profile;
  const name = profile.displayName || "Friend";
  $("helloName").textContent = name;
  $("myName").textContent = name;
  $("myBio").textContent = profile.bio || "Add a little about yourself.";
  $("myInterests").textContent = Array.isArray(profile.interests) && profile.interests.length
    ? profile.interests.join(" · ") : "Not added yet";
  $("displayName").value = profile.displayName || "";
  $("ageGroup").value = profile.ageGroup || "";
  $("bio").value = profile.bio || "";
  $("interests").value = Array.isArray(profile.interests) ? profile.interests.join(", ") : "";
  setAvatar(profile.photoURL || "", name);
}
function showPane(paneId) {
  document.querySelectorAll(".page-pane").forEach(pane => {
    pane.classList.toggle("hidden", pane.id !== paneId);
  });
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.pane === paneId);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function loadProfile(user) {
  const snapshot = await getDoc(doc(db, "profiles", user.uid));
  if (!snapshot.exists()) {
    selectedPhoto = null;
    showOnly("profileScreen");
    $("cancelProfileBtn").classList.add("hidden");
    return;
  }
  const profile = snapshot.data();
  renderProfile(profile);
  showOnly("appScreen");
  showPane("homePane");
  if (profile.status === "pending_review") toast("Your profile is private and pending review.");
}

// Authentication
$("signupBtn").addEventListener("click", async () => {
  setStatus("authStatus", "");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || password.length < 8) {
    setStatus("authStatus", "Enter an email and a password with at least 8 characters.");
    return;
  }
  try { await createUserWithEmailAndPassword(auth, email, password); }
  catch (error) { setStatus("authStatus", friendlyError(error)); }
});
$("signinBtn").addEventListener("click", async () => {
  setStatus("authStatus", "");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || !password) {
    setStatus("authStatus", "Enter your email and password.");
    return;
  }
  try { await signInWithEmailAndPassword(auth, email, password); }
  catch (error) { setStatus("authStatus", friendlyError(error)); }
});
$("googleBtn").addEventListener("click", async () => {
  setStatus("authStatus", "");
  try { await signInWithPopup(auth, googleProvider); }
  catch (error) { setStatus("authStatus", friendlyError(error)); }
});

// Profile photo preview
$("photoInput").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type) || file.size > 3 * 1024 * 1024) {
    setStatus("profileStatus", "Choose a JPG, PNG or WebP image under 3 MB.");
    event.target.value = "";
    return;
  }
  selectedPhoto = file;
  $("avatarPreview").src = URL.createObjectURL(file);
  setStatus("profileStatus", "Photo selected. It will upload when you save your profile.");
});

async function uploadProfilePhoto(user) {
  if (!selectedPhoto) return currentProfile?.photoURL || "";
  const extension = selectedPhoto.type === "image/png" ? "png" :
    selectedPhoto.type === "image/webp" ? "webp" : "jpg";
  const photoRef = ref(storage, `profiles/${user.uid}/avatar.${extension}`);
  await uploadBytes(photoRef, selectedPhoto, { contentType: selectedPhoto.type });
  return await getDownloadURL(photoRef);
}
$("saveProfileBtn").addEventListener("click", async () => {
  setStatus("profileStatus", "");
  const user = auth.currentUser;
  const displayName = $("displayName").value.trim();
  const ageGroup = $("ageGroup").value;
  const bio = $("bio").value.trim();
  const interests = $("interests").value.split(",").map(x => x.trim()).filter(Boolean).slice(0, 6);
  if (!user) { setStatus("profileStatus", "Please sign in again."); return; }
  if (displayName.length < 2 || !["13-15", "16-17"].includes(ageGroup) || !$("rulesAgree").checked) {
    setStatus("profileStatus", "Enter a nickname, choose an age group and accept the community rules.");
    return;
  }
  const button = $("saveProfileBtn");
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    const photoURL = await uploadProfilePhoto(user);
    const data = {
      uid: user.uid, displayName, ageGroup, bio, interests,
      photoURL, community: "friendship", status: "pending_review"
    };
    await setDoc(doc(db, "profiles", user.uid), {
      ...data, updatedAt: serverTimestamp(),
      ...(currentProfile ? {} : { createdAt: serverTimestamp() })
    }, { merge: true });
    selectedPhoto = null;
    currentProfile = data;
    renderProfile(data);
    showOnly("appScreen");
    showPane("homePane");
    toast("Your private profile has been saved.");
  } catch (error) {
    setStatus("profileStatus", friendlyError(error));
  } finally {
    button.disabled = false;
    button.innerHTML = 'Save profile <span>↗</span>';
  }
});

function editProfile() {
  if (currentProfile) renderProfile(currentProfile);
  $("rulesAgree").checked = true;
  $("cancelProfileBtn").classList.remove("hidden");
  setStatus("profileStatus", "");
  showOnly("profileScreen");
}
$("editProfileBtn").addEventListener("click", editProfile);
$("profileEditBtn").addEventListener("click", editProfile);
$("settingsEditBtn").addEventListener("click", editProfile);
$("cancelProfileBtn").addEventListener("click", () => {
  if (currentProfile) {
    renderProfile(currentProfile);
    showOnly("appScreen");
    showPane("profilePane");
  }
});
$("logoutBtn").addEventListener("click", async () => {
  try { await signOut(auth); currentProfile = null; selectedPhoto = null; toast("Signed out."); }
  catch (error) { toast(friendlyError(error)); }
});

// Navigation
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => showPane(button.dataset.pane));
});
document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showPane(button.dataset.go));
});
$("brandHome").addEventListener("click", event => {
  event.preventDefault();
  if (!$("appScreen").classList.contains("hidden")) showPane("homePane");
});

// Local-only draft; it is not published or uploaded.
$("saveDraftBtn").addEventListener("click", () => {
  const value = $("draftText").value.trim();
  if (!value) { $("draftStatus").textContent = "Write a note first."; return; }
  $("draftStatus").textContent = "Draft saved only for this open session. It has not been posted.";
  toast("Private draft saved for this session.");
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    currentProfile = null;
    showOnly("authScreen");
    return;
  }
  try { await loadProfile(user); }
  catch (error) {
    showOnly("profileScreen");
    setStatus("profileStatus", friendlyError(error));
  }
});
