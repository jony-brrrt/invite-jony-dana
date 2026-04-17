import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const video = document.querySelector(".bg-video");
video.addEventListener("error", () => {
  const err = video.error;
  console.error("Video error:", err && err.code, err && err.message, "src:", video.currentSrc);
});
video.addEventListener("loadeddata", () => console.log("Video loaded:", video.videoWidth, "x", video.videoHeight));

const audio = document.getElementById("bg-audio");
const muteBtn = document.getElementById("mute-btn");

audio.volume = 0.7;

function syncMuteUI() {
  const muted = audio.muted || audio.paused;
  muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  muteBtn.setAttribute("aria-label", muted ? "Unmute music" : "Mute music");
}

muteBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (audio.muted || audio.paused) {
    audio.muted = false;
    try { await audio.play(); } catch (err) { console.warn("Audio play blocked:", err); }
  } else {
    audio.muted = true;
  }
  syncMuteUI();
});

// Try to autoplay immediately. Most browsers will allow this only if muted.
audio.muted = true;
audio.play().catch(() => {});

// On the first user interaction anywhere, unmute so music kicks in "automatically".
function startAudioOnFirstGesture() {
  audio.muted = false;
  audio.play().catch((err) => console.warn("Audio play blocked:", err));
  syncMuteUI();
}
window.addEventListener("pointerdown", startAudioOnFirstGesture, { once: true });
window.addEventListener("keydown", startAudioOnFirstGesture, { once: true });
window.addEventListener("touchstart", startAudioOnFirstGesture, { once: true, passive: true });

syncMuteUI();

const form = document.getElementById("rsvp-form");
const nameInput = document.getElementById("name");
const dinnerInput = document.getElementById("dinner");
const hangInput = document.getElementById("hang");
const submitBtn = document.getElementById("submit-btn");
const status = document.getElementById("status");

function setStatus(message, kind) {
  status.textContent = message;
  status.classList.remove("error", "success");
  if (kind) status.classList.add(kind);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const dinner = dinnerInput.checked;
  const hang = hangInput.checked;

  if (!name) {
    setStatus("Please enter your name.", "error");
    nameInput.focus();
    return;
  }

  if (!dinner && !hang) {
    setStatus("Pick at least one: dinner or hang.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("Sending…");

  try {
    await addDoc(collection(db, "rsvps"), {
      name,
      dinner,
      hang,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    });

    const parts = [];
    if (dinner) parts.push("dinner");
    if (hang) parts.push("hang");
    setStatus(`Thanks, ${name}! You're in for ${parts.join(" + ")}. See you soon.`, "success");
    form.reset();
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong. Please try again.", "error");
    submitBtn.disabled = false;
  }
});
