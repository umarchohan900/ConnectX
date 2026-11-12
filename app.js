
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

const screens = ["welcome", "profileSetup", "home"];

function screen(id) {
  screens.forEach(name => {
    $(name).classList.toggle("active", name === id);
  });
}

function status(id, message) {
  $(id).textContent = message;
}

let toastTimer;

function toast(message) {
  const element = $("toast");

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2400);
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use":
      "This email already has an account.",

    "auth/invalid-email":
      "Enter a valid email address.",

    "auth/weak-password":
      "Use a stronger password.",

    "auth/invalid-credential":
      "Email or password is incorrect.",

    "auth/popup-closed-by-user":
      "Google sign-in was closed.",

    "auth/operation-not-allowed":
      "Enable this login method in Firebase Console.",

    "auth/network-request-failed":
      "Check your internet connection."
  };

  return messages[error.code] ||
    "Something went wrong. Please try again.";
}

function renderProfile(profile) {
  const name = profile.displayName || "Friend";

  $("helloName").textContent = name;
  $("myName").textContent = name;

  $("myAvatar").textContent =
    name.trim().charAt(0).toUpperCase();

  $("myBio").textContent = profile.bio || "";

  $("myInterests").replaceChildren();

  (profile.interests || []).forEach(interest => {
    const chip = document.createElement("span");

    chip.className = "chip";
    chip.textContent = interest;

    $("myInterests").appendChild(chip);
  });
}

async function profileFor(user) {
  const reference = doc(db, "profiles", user.uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    const profile = snapshot.data();

    renderProfile(profile);
    screen("home");

    if (profile.status === "pending_review") {
      toast("Your profile is waiting for review.");
    }
  } else {
    screen("profileSetup");
  }
}

// CREATE ACCOUNT

$("signup").addEventListener("click", async () => {
  status("authStatus", "");

  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || password.length < 8) {
    status(
      "authStatus",
      "Enter a valid email and password with at least 8 characters."
    );
    return;
  }

  try {
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
  } catch (error) {
    status("authStatus", friendlyError(error));
  }
});

// SIGN IN

$("signin").addEventListener("click", async () => {
  status("authStatus", "");

  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    status("authStatus", "Enter your email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  } catch (error) {
    status("authStatus", friendlyError(error));
  }
});

// GOOGLE LOGIN

$("google").addEventListener("click", async () => {
  status("authStatus", "");

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    status("authStatus", friendlyError(error));
  }
});

// SAVE PROFILE

$("saveProfile").addEventListener("click", async () => {
  status("profileStatus", "");

  const user = auth.currentUser;

  const displayName =
    $("displayName").value.trim();

  const ageGroup =
    $("ageGroup").value;

  const bio =
    $("bio").value.trim();

  const interests =
    $("interests").value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 6);

  if (!user) {
    status("profileStatus", "Please sign in again.");
    return;
  }

  if (
    displayName.length < 2 ||
    !["13-15", "16-17"].includes(ageGroup) ||
    !$("rulesAgree").checked
  ) {
    status(
      "profileStatus",
      "Enter a nickname, choose an age group and accept the safety rules."
    );
    return;
  }

  if (bio.length > 120) {
    status("profileStatus", "Your bio is too long.");
    return;
  }

  try {
    await setDoc(
      doc(db, "profiles", user.uid),
      {
        uid: user.uid,
        displayName,
        ageGroup,
        bio,
        interests,
        community: "friendship",
        status: "pending_review",
        createdAt: serverTimestamp()
      }
    );

    renderProfile({
      displayName,
      bio,
      interests
    });

    status(
      "profileStatus",
      "Profile submitted. It remains private pending review."
    );

    toast("Profile saved for review.");

    screen("home");

  } catch (error) {
    status("profileStatus", friendlyError(error));
  }
});

// SIGN OUT

$("logout").addEventListener("click", async () => {
  try {
    await signOut(auth);
    toast("Signed out successfully.");
  } catch (error) {
    toast(friendlyError(error));
  }
});

// DASHBOARD TABS

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {

    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });

    document.querySelectorAll(".pane").forEach(pane => {
      pane.classList.toggle(
        "active",
        pane.id === button.dataset.tab + "Pane"
      );
    });
  });
});

// DISCOVERY PREVIEW

$("skip").addEventListener("click", () => {
  toast("Community discovery is not available yet.");
});

$("request").addEventListener("click", () => {
  toast("Friend requests are not enabled yet.");
});

// AUTH STATE

onAuthStateChanged(auth, async user => {
  if (!user) {
    screen("welcome");
    return;
  }

  try {
    await profileFor(user);
  } catch (error) {
    screen("profileSetup");

    status(
      "profileStatus",
      friendlyError(error)
    );
  }
});

// PWA INSTALL

let installEvent = null;

$("install").hidden = true;

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();

    installEvent = event;
    $("install").hidden = false;
  }
);

$("install").addEventListener("click", async () => {
  if (!installEvent) {
    toast("Open browser menu and choose Add to Home screen.");
    return;
  }

  installEvent.prompt();

  await installEvent.userChoice;

  installEvent = null;
  $("install").hidden = true;
});

// SERVICE WORKER

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(error => {
        console.log("Service worker unavailable:", error);
      });
  });
}
