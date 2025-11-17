// === token.js (FINAL — tanpa countdown, tapi tetap ada notifikasi cooldown) ===
  const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
  if(quizdata.status === 'finished'){
    alert("⚠️ Anda sudah menyelesaikan ujian ini.");
    location.assign('submit.html'); 
  }
localStorage.setItem('mudengify_token', 'true'); // flag asal halaman
// === CEK LOGIN DULU ===
const rules = window.rules;
const tokenBox     = document.getElementById("tokenBox");
const refreshBtn   = document.getElementById("refreshToken");
const copyBtn      = document.getElementById("copyToken");
const tokenInput   = document.getElementById("tokenInput");
const tokenForm    = document.getElementById("tokenForm");
const logoutBtn    = document.getElementById("logout-btn");
const time = rules.durasi;
const namapel = rules.mapel;
const mapelData = {
  nama: namapel,
  duration: time,
};
localStorage.setItem(`mudengify_${user.mapel}`, JSON.stringify(mapelData));
// === POPUP NOTIF LOGIN ===
const popup = document.getElementById("loginAlert");
const popupMsg = document.getElementById("popupMessage");
const popupProgress = document.getElementById("popupProgress");
let popupTimer, progressTimer;

function animateProgress(duration = 3000) {
  popupProgress.style.transition = "none";
  popupProgress.style.width = "80%";
  void popupProgress.offsetWidth; // reset
  popupProgress.style.transition = `width ${duration}ms linear`;
  popupProgress.style.width = "0%";
}

function showPopup(message, type = "info") {
  // Hapus semua kelas warna dulu
  popup.classList.remove("popup-success", "popup-error", "popup-info", "popup-warning");

  // Tambahkan kelas sesuai tipe
  switch (type) {
    case "success":
      popup.classList.add("popup-success");
      break;
    case "error":
      popup.classList.add("popup-error");
      break;
    case "warning":
      popup.classList.add("popup-warning");
      break;
    default:
      popup.classList.add("popup-info");
  }
  popupMsg.textContent = message;
  popup.classList.remove("hidden", "shake");
  popup.classList.remove("hidden", "shake");
  void popup.offsetWidth;
  popup.classList.add("show", "shake");

  clearTimeout(popupTimer);
  animateProgress(3000);
  popupTimer = setTimeout(hidePopup, 3000);
}

function showPopupNoShake(message, type = "info") {
  // Hapus semua kelas warna dulu
  popup.classList.remove("popup-success", "popup-error", "popup-info", "popup-warning");

  // Tambahkan kelas sesuai tipe
  switch (type) {
    case "success":
      popup.classList.add("popup-success");
      break;
    case "error":
      popup.classList.add("popup-error");
      break;
    case "warning":
      popup.classList.add("popup-warning");
      break;
    default:
      popup.classList.add("popup-info");
  }
  popupMsg.textContent = message;
  popup.classList.remove("hidden", "shake");
  void popup.offsetWidth;
  popup.classList.add("show");

  clearTimeout(popupTimer);
  animateProgress(3000);
  popupTimer = setTimeout(hidePopup, 3000);
}

function hidePopup() {
  popup.classList.remove("show");
  setTimeout(() => {
    popup.classList.add("hidden");
    popupProgress.style.width = "100%"; // reset bar
  }, 300);
}
const namamapel = document.getElementById("namamapel");
const jumlahsoal = document.getElementById("jumlahsoal");
const tipesoal = document.getElementById("tipesoal");
const durasinya = document.getElementById("durasinya");
if (namamapel) namamapel.innerHTML = `<b>Mapel:</b> ${rules.mapel ?? '-'}`;
if (jumlahsoal) jumlahsoal.innerHTML = `<b>Jumlah Soal:</b> ${rules.soal + " soal"?? '-'}`;
if (tipesoal) tipesoal.innerHTML = `<b>Tipe Soal:</b> ${rules.tipesoal ?? '-'}`;
if (durasinya) durasinya.innerHTML = `<b>Durasi:</b> ${rules.durasi + " menit"?? '-'}`;

// === 🔐 Logout handler ===
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const modal = document.createElement('div');
    modal.className = 'logout-modal';
    modal.innerHTML = `
      <div class="logout-backdrop"></div>
      <div class="logout-panel card">
        <span class="close-btn">&times;</span>
        <h3>Log Out</h3>
        <hr style="margin: 8px 0; opacity: 1;" />
        <p>Anda yakin akan keluar?</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button id="logoutCancel" class="btn">Batal</button>
          <button id="logoutConfirm" class="btn danger">Keluar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    });
    modal.querySelector('#logoutCancel').onclick = () => modal.remove();
    modal.querySelector('.logout-backdrop').onclick = () => modal.remove();

    modal.querySelector('#logoutConfirm').onclick = async () => {
      const user = JSON.parse(localStorage.getItem('mudengify_user') || "null");
      if (!user) {
        alert('User tidak ditemukan.');
        modal.remove();
        return;
      }
      if (user) {
        const key = `mudengify_status_${user.username}_${user.mapel}`;
        localStorage.removeItem(key);
        localStorage.removeItem('tokenData');
        localStorage.removeItem('mudengify_user');
      }
      
      location.assign('index.html');
      modal.remove();
    };
  });
}

// === Safety check ===
if (!tokenBox || !refreshBtn || !copyBtn || !tokenInput || !tokenForm) {
  console.error("token.js: elemen penting tidak ditemukan di DOM.");
}

// === Konstanta & State ===
const TOKEN_TTL_MS = 1 * 60 * 1000;        // Token berlaku 1 menit
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // Cooldown refresh 5 menit

let currentToken = null;
let tokenCreatedAt = null;
let tokenExpiry = null;
let lastRefreshTime = null;

// === Utilitas ===
function generateToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function pad(n) { return String(n).padStart(2, "0"); }

function formatMsShort(ms) {
  if (ms <= 0) return "tunggu sebentar.";
  const s = Math.ceil(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `(${pad(mm)}:${pad(ss)})`;
}
function saveTokenData() {
  localStorage.setItem("tokenData", JSON.stringify({
    currentToken,
    tokenCreatedAt,
    tokenExpiry,
    lastRefreshTime
  }));
}

function updateTokenDisplay() {
  if (!tokenBox) return;
  tokenBox.textContent = currentToken;
  tokenBox.classList.remove("token-expired");
}

function markTokenExpiredUI() {
  if (!tokenBox) return;
  tokenBox.classList.add("token-expired");
}

// === 🔁 Refresh token ===
function tryRefreshToken() {
  const now = Date.now();
  const sinceLastRefresh = now - lastRefreshTime;

  if (sinceLastRefresh < REFRESH_COOLDOWN_MS) {
    const remaining = REFRESH_COOLDOWN_MS - sinceLastRefresh;
    showPopup("⏳ Belum bisa refresh. " + formatMsShort(remaining), "info");
    return;
  }

  // generate token baru
  currentToken = generateToken();
  tokenCreatedAt = now;
  tokenExpiry = now + TOKEN_TTL_MS;
  lastRefreshTime = now;

  updateTokenDisplay();

  // animasi klik cepat
  refreshBtn.disabled = true;
  refreshBtn.textContent = "🔃 Memperbarui...";
  setTimeout(() => {
    refreshBtn.textContent = "🔄 Refresh Token";
    refreshBtn.disabled = false;
  }, 900);
    localStorage.setItem("tokenData", JSON.stringify({
    currentToken,
    tokenCreatedAt,
    tokenExpiry,
    lastRefreshTime
  }));
}

if (refreshBtn) refreshBtn.addEventListener("click", tryRefreshToken);

// === 📋 Copy token ===
if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(currentToken).then(() => {
      copyBtn.textContent = "✅";
      showPopupNoShake("Berhasil menyalin ✅", "success");
      setTimeout(() => (copyBtn.textContent = "📋"), 1500);
    }).catch(() => showPopupNoShake("Gagal menyalin ke clipboard", "error"));
  });
}

// === 🧾 Validasi form token ===
if (tokenForm) {
  tokenForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = tokenInput.value.trim().toUpperCase();
    const now = Date.now();
    if(!input){
      showPopup("⚠️ Token belum diisi.", "warning");
      tokenInput.classList.add("shake", "highlight");
      setTimeout(() => {
        tokenInput.classList.remove("shake", "highlight");
      }, 500);
      return;
    }
    if (now > tokenExpiry) {
      showPopup("❌ Token sudah kadaluarsa.", "error");
      markTokenExpiredUI();
      return;
    }

    if (input === currentToken) {
      showPopupNoShake("✅ Token benar! Mengalihkan ke halaman ujian...", "success");
      localStorage.removeItem(`mudengify_token`);
      const savedData = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "null");
      if (savedData && savedData.status === "in_progress") {
        setTimeout(() => location.assign("quiz.html"), 700);
      }else{
        const quizUser = {
          timer: null,
          status: "in_progress",
          startedAt: Date.now(),
          endAt: null,
          answers: {},
          result: {},
        };
        localStorage.setItem(`mudengify_data_${user.username}_${user.mapel}`, JSON.stringify(quizUser));
        setTimeout(() => location.assign("quiz.html"), 700);
      }
    } else {
    showPopup("❌ Token salah", "error");
    }
  });
}

// === 🚀 Inisialisasi awal ===
function init() {
  const saved = JSON.parse(localStorage.getItem("tokenData") || "{}");

  if (saved.currentToken) {
    // ✔ Pakai token lama
    currentToken = saved.currentToken;
    tokenCreatedAt = saved.tokenCreatedAt;
    tokenExpiry = saved.tokenExpiry;
    lastRefreshTime = saved.lastRefreshTime;
  } else {
    // ✔ Token pertama kali dibuat
    currentToken = generateToken();
    tokenCreatedAt = Date.now();
    tokenExpiry = tokenCreatedAt + TOKEN_TTL_MS;
    lastRefreshTime = tokenCreatedAt;

    saveTokenData();
  }

  updateTokenDisplay();

  if (Date.now() > tokenExpiry) {
    markTokenExpiredUI();
  }
}

init();

// === ⏰ Auto-expire token ===
setInterval(() => {
  if (Date.now() > tokenExpiry) markTokenExpiredUI();
}, 1000);
