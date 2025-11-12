// INDEX.js
// === TOMBOL SHOW PASSWORD ===
(() => {
  const toggle = document.getElementById("togglePassword");
  const pwd = document.getElementById("password");
  if (!toggle || !pwd) return;

  toggle.addEventListener("click", () => {
    const type = pwd.type === "password" ? "text" : "password";
    pwd.type = type;
    toggle.textContent = type === "password" ? "👁️" : "🙈";
  });
})();

// === DROPDOWN MAPEL & INISIALISASI ===
const mapelButton = document.getElementById("mapelButton");
const mapelList = document.getElementById("mapelList");
const mapelLabel = document.getElementById("mapelLabel");
const mapelInput = document.getElementById("mapelInput");

document.addEventListener("DOMContentLoaded", () => {
  // Hapus mapel lama setiap buka halaman login
  localStorage.removeItem("mudengify_mapel");

  mapelInput.value = "";
  mapelLabel.textContent = "Pilih Mata Pelajaran";
});

mapelButton.addEventListener("click", (e) => {
  e.stopPropagation();
  mapelList.classList.toggle("hidden");
  mapelButton.parentElement.classList.toggle("open");
});

mapelList.querySelectorAll("li").forEach((item) => {
  item.addEventListener("click", () => {
    const selectedText = item.textContent.trim();
    const value = item.dataset.value;
    mapelLabel.textContent = selectedText;
    mapelInput.value = value;
    mapelList.classList.add("hidden");

    localStorage.setItem("mudengify_mapel", value);
  });
});

document.addEventListener("click", (e) => {
  if (!mapelButton.contains(e.target) && !mapelList.contains(e.target)) {
    mapelList.classList.add("hidden");
  }
});

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

// === SINKRONISASI USER & MAPEL KE LOCALSTORAGE ===
function syncUserAndMapel(username, mapel) {
  const userObj = {
    username,
    mapel,
    from: "demo",
    loggedAt: Date.now(),
  };
  localStorage.setItem("mudengify_user", JSON.stringify(userObj));
  localStorage.setItem("mudengify_mapel", mapel);
}
// === LOGIN DEMO OFFLINE ===
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  const selectedMapel = mapelInput.value;
  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  const DEMO_USER = "siswa123";
  const DEMO_PASS = "mudengify";

  if (!username || !password) {
    showPopup("⚠️ Username dan password wajib diisi!", "warning");
    usernameEl.classList.add("shake", "highlight");
    passwordEl.classList.add("shake", "highlight");
    setTimeout(() => {
      usernameEl.classList.remove("shake", "highlight");
      passwordEl.classList.remove("shake", "highlight");
    }, 500);
    return;
  }
  
  if (!selectedMapel) {
    showPopup("🎯 Silakan pilih mata pelajaran dulu!", "warning");
    mapelButton.classList.add("shake", "highlight");
    setTimeout(() => mapelButton.classList.remove("shake", "highlight"), 500);
    return;
  }

  // Validasi akun demo
  if (username !== DEMO_USER || password !== DEMO_PASS) {
    showPopup("❌ Username atau password salah (akun demo).", "error");
    usernameEl.classList.add("shake", "highlight-red");
    passwordEl.classList.add("shake", "highlight-red");
    setTimeout(() => {
      usernameEl.classList.remove("shake", "highlight-red");
      passwordEl.classList.remove("shake", "highlight-red");
    }, 500);
    return;
  }

  // Simpan user ke localStorage
  const userObj = {
    username,
    mapel: selectedMapel,
    from: "demo",
    loggedAt: Date.now(),
  };
  localStorage.setItem("mudengify_user", JSON.stringify(userObj));

  // Cek apakah user sudah pernah menyelesaikan mapel ini
  const statusKey = `mudengify_status_${username}_${selectedMapel}`;
  const status = localStorage.getItem(statusKey);
  // Simpan user ke localStorage (sinkron)
  syncUserAndMapel(username, selectedMapel);
  if (status === "finished") {
    showPopupNoShake("✅ Anda sudah menyelesaikan ujian ini! Mengalihkan ke hasil...", "success");
    setTimeout(() => location.assign("submit.html"), 600);
  } else {
    showPopupNoShake("✅ Login berhasil! Mengalihkan ke token...", "success");
    setTimeout(() => location.assign("token.html"), 600);
  }
});
