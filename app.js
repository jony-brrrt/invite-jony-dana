const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzmpkPFhmg0XmlZElmcwyd_Bmh0I2vhKJRcdd6GMug2HoYD8i0QYyW_0PIXJgN_Tw/exec";

const slides = Array.from(document.querySelectorAll(".bg-slide"));
slides.forEach((s) => {
  const src = s.dataset.src;
  if (src) {
    const img = new Image();
    img.src = src;
    s.style.backgroundImage = `url("${src}")`;
  }
});

let currentSlide = Math.floor(Math.random() * slides.length);

const HOLD_MS = 10000;
const FADE_MS = 1500;
const ZOOM_MS = HOLD_MS + FADE_MS;

function startZoom(slide) {
  // Cancel any prior animation so we don't stack transforms.
  if (slide._zoomAnim) slide._zoomAnim.cancel();
  slide._zoomAnim = slide.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.06)" }],
    { duration: ZOOM_MS, easing: "linear", fill: "forwards" }
  );
}

function activateSlide(index) {
  const s = slides[index];
  s.classList.remove("is-leaving");
  s.classList.add("is-active");
  startZoom(s);
}

function leaveSlide(index) {
  const s = slides[index];
  s.classList.remove("is-active");
  s.classList.add("is-leaving");
  setTimeout(() => {
    s.classList.remove("is-leaving");
    if (s._zoomAnim) { s._zoomAnim.cancel(); s._zoomAnim = null; }
  }, FADE_MS);
}

if (slides.length > 0) {
  activateSlide(currentSlide);
  setInterval(() => {
    const prev = currentSlide;
    currentSlide = (currentSlide + 1) % slides.length;
    activateSlide(currentSlide);
    leaveSlide(prev);
  }, HOLD_MS);
}

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
    // Use text/plain to avoid a CORS preflight that Apps Script doesn't handle.
    const res = await fetch(RSVP_ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, plus: plusCount, dinner, hang, website: "" }),
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || "submission failed");

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
