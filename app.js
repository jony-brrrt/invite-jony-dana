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
video.addEventListener("loadeddata", () => console.log("Video loaded:", video.videoWidth, "x", video.videoHeight, "paused:", video.paused));
video.addEventListener("playing", () => console.log("Video playing"));

// Force play attempts — some Android Chrome builds need this nudge.
function tryPlayVideo() {
  video.muted = true;
  video.setAttribute("muted", "");
  const p = video.play();
  if (p && typeof p.catch === "function") {
    p.catch((err) => console.warn("Video play blocked:", err && err.name, err && err.message));
  }
}

tryPlayVideo();
document.addEventListener("DOMContentLoaded", tryPlayVideo);
window.addEventListener("load", tryPlayVideo);
window.addEventListener("pointerdown", tryPlayVideo, { once: true });
window.addEventListener("touchstart", tryPlayVideo, { once: true, passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && video.paused) tryPlayVideo();
});

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

// Only the mute button controls audio — no implicit unmute on form interactions.
// Still try to start muted playback on the first interaction in case autoplay was blocked.
function ensureAudioPlaying() {
  if (audio.paused) audio.play().catch(() => {});
}
window.addEventListener("pointerdown", ensureAudioPlaying, { once: true });
window.addEventListener("touchstart", ensureAudioPlaying, { once: true, passive: true });

syncMuteUI();

const form = document.getElementById("rsvp-form");
const nameInput = document.getElementById("name");
const dinnerInput = document.getElementById("dinner");
const hangInput = document.getElementById("hang");
const submitBtn = document.getElementById("submit-btn");
const status = document.getElementById("status");

const PLUS_MIN = 0;
const PLUS_MAX = 2;
const plusValueEl = document.getElementById("plus-value");
const plusMinusBtn = document.getElementById("plus-minus");
const plusPlusBtn = document.getElementById("plus-plus");
let plusCount = 0;

function renderPlus() {
  plusValueEl.textContent = String(plusCount);
  plusMinusBtn.disabled = plusCount <= PLUS_MIN;
  plusPlusBtn.disabled = plusCount >= PLUS_MAX;
}
plusMinusBtn.addEventListener("click", () => {
  if (plusCount > PLUS_MIN) { plusCount--; renderPlus(); }
});
plusPlusBtn.addEventListener("click", () => {
  if (plusCount < PLUS_MAX) { plusCount++; renderPlus(); }
});
renderPlus();

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
      plus: plusCount,
      dinner,
      hang,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    });

    const parts = [];
    if (dinner) parts.push("dinner");
    if (hang) parts.push("hang");
    const guestCount = 1 + plusCount;
    const guestText = guestCount === 1 ? "" : ` (${guestCount} guests)`;
    setStatus(`Thanks, ${name}! You're in for ${parts.join(" + ")}${guestText}. See you soon.`, "success");
    form.reset();
    plusCount = 0;
    renderPlus();
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong. Please try again.", "error");
    submitBtn.disabled = false;
  }
});
