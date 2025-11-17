/* submit.js — synced & modular */
document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------
  // 1) Proteksi dasar (anti-copy/select/contextmenu)
  // ---------------------------
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  document.addEventListener('cut', e => e.preventDefault());

  // ---------------------------
  // 2) Ambil data hasil & user dari localStorage
  // ---------------------------
  let user = JSON.parse(localStorage.getItem('mudengify_user') || 'null');
  if(user.from === "admin"){
    user = JSON.parse(localStorage.getItem('mudengify_admin_view') || 'null');
  }
  const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
  const datamapel = JSON.parse(localStorage.getItem(`mudengify_${user.mapel}` || "{}"));
  const result = quizdata.result;
  const namapel =  datamapel.nama;
  if (!user || !user.username || !user.mapel) {
    alert('⚠️ Anda belum login atau data user tidak lengkap.');
    location.assign('index.html');
    return;
  }

  if (!result) {
    alert('⚠️ Hasil ujian tidak ditemukan.');
    location.assign('index.html');
    return;
  }

  // ---------------------------
  // 3) Element references (safe checks)
  // ---------------------------
  const finalScoreEl = document.getElementById('final-score');
  const countCorrectEl = document.getElementById('count-correct');
  const countWrongEl = document.getElementById('count-wrong');
  const countUnansweredEl = document.getElementById('count-unanswered');
  const countTotalEl = document.getElementById('count-total');
  const reviewBtn = document.getElementById('review-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const gaugeCtxEl = document.getElementById('scoreGauge');
  const userEL = document.getElementById('username');
  const mapelEl = document.getElementById('mapeltext');
  const predikatEl = document.getElementById("predikat");
  
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
  // ---------------------------
  // 4) Set basic text values
  // ---------------------------
  const score = Number(result.score) || 0;
  if (finalScoreEl) finalScoreEl.textContent = score;
  if (countCorrectEl) countCorrectEl.textContent = result.correct ?? 0;
  if (countWrongEl) countWrongEl.textContent = result.wrong ?? 0;
  if (countUnansweredEl) countUnansweredEl.textContent = result.unanswered ?? 0;
  if (countTotalEl) countTotalEl.textContent = result.total ?? 0;
  if (userEL) userEL.textContent = user.username ?? '-';
  if (mapelEl) mapelEl.textContent = namapel ?? '-';
  function whatpredict(nilai){
    if(nilai >= 90){
      message = "istimewa";
      color = "rgba(23, 125, 72, 1)";
    }
    else if(nilai >= 76){
      message = "baik";
      color = "rgba(255, 179, 0, 1)";
    }
    else if(nilai >= 60){
      message = "memadai";
      color = "rgba(255, 251, 0, 1)";
    }
    else{
      message = "kurang";
      color = "rgba(255, 0, 0, 1)";
    }
    return {message, color};
  }

  if (predikatEl){
    const predik = whatpredict(score);
    predikatEl.textContent = predik.message;
    predikatEl.style.color = predik.color;
  }
  // ---------------------------
  // 5) Tombol review
  // ---------------------------
  if (reviewBtn) {
    reviewBtn.addEventListener('click', (e) => {
      let user = JSON.parse(localStorage.getItem('mudengify_user') || "null");
      if(user.from === 'admin') user = JSON.parse(localStorage.getItem('mudengify_admin_view') || "null");
      const quizData = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
      const r = quizData.result;
      if (!r) {
        e.preventDefault();
        alert('⚠️ Hasil ujian tidak ditemukan.');
      } else {
        location.assign('review.html');
      }
    });
  }

  // ---------------------------
  // 6) Gauge Chart (semicircle)
  // ---------------------------
  (function createGauge() {
    if (!gaugeCtxEl) return;
    let gaugeColor = '#4cd964';
    if (score < 70) gaugeColor = '#ff4d4d';
    else if (score < 85) gaugeColor = '#ffd93d';

    try {
      const ctx = gaugeCtxEl.getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [score, Math.max(0, 100 - score)],
            backgroundColor: [gaugeColor, '#eee'],
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
            cutout: '70%'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
        }
      });
    } catch (err) {
      console.warn('Chart error:', err);
    }
  })();

  // ---------------------------
  // 7) Animasi angka naik
  // ---------------------------
  function animateNumber(element, targetValue, duration = 800) {
    if (!element) return;
    const stepTime = 16;
    const steps = Math.max(1, Math.floor(duration / stepTime));
    let current = 0;
    const increment = targetValue / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        element.textContent = String(Math.round(targetValue));
        clearInterval(timer);
      } else {
        element.textContent = String(Math.round(current));
      }
    }, stepTime);
  }

  animateNumber(finalScoreEl, score, 1000);
  animateNumber(countCorrectEl, Number(result.correct) || 0, 800);
  animateNumber(countWrongEl, Number(result.wrong) || 0, 800);
  animateNumber(countUnansweredEl, Number(result.unanswered) || 0, 800);
  animateNumber(countTotalEl, Number(result.total) || 0, 800);

  // ---------------------------
  // 8) Logout handling (sinkron dengan sistem)
  // ---------------------------
  if (logoutBtn) {
    const user = JSON.parse(localStorage.getItem('mudengify_user'));
    if(user.from === 'admin') logoutBtn.textContent = "kembali";

  logoutBtn.addEventListener('click', async () => {
    if(user.from === 'admin'){
      localStorage.removeItem('mudengify_admin_view');
      location.assign('admin.html');
      return;
    }
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
      localStorage.removeItem('tokenData');
      localStorage.removeItem('mudengify_user');
      location.assign('index.html');
      modal.remove();
    };
  });
}

  // ---------------------------
  // 9) Efek confetti + sound (hanya dari quiz)
  // ---------------------------
  const fromQuizFlag = localStorage.getItem('mudengify_from_quiz');
  if (fromQuizFlag === 'true') {
    localStorage.removeItem('mudengify_from_quiz');
    try {
      const mainSound = new Audio('assets/sounds/objective_success.ogg');
      mainSound.volume = 0.8;
      mainSound.play().catch(() => {});
    } catch (e) {}
    setTimeout(() => triggerConfetti(), 1000);
  }
  // ---------------------------
// 10) Replay effect manual
// ---------------------------
const replayEffectBtn = document.getElementById('replayEffectBtn');
if (replayEffectBtn) replayEffectBtn.addEventListener('click', () => triggerConfetti());

  // fungsi reusable buat efek confetti
  function triggerConfetti() {
    const partySounds = [
      'assets/sounds/party_popper1.ogg',
      'assets/sounds/party_popper2.ogg',
      'assets/sounds/party_popper3.ogg'
    ];
    const pick = partySounds[Math.floor(Math.random() * partySounds.length)];
    try {
      const s1 = new Audio(pick);
      const s2 = new Audio(pick);
      s1.volume = s2.volume = 1;
      setTimeout(() => s1.play().catch(() => {}), 500);
      setTimeout(() => s2.play().catch(() => {}), 1500);
    } catch (e) {}

     const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 25,
      spread: 360,
      ticks: 80,
      zIndex: 1000,
      colors: ['#FF7A7A', '#FFD93D', '#AEE2FF', '#B8F1B0', '#CDB4FF']
    };

    const confettiCount = 80;
    const colors = ['#FF7A7A', '#FFD93D', '#AEE2FF', '#B8F1B0', '#CDB4FF'];
    const confettiContainer = document.createElement('div');
    confettiContainer.classList.add('confetti-container');
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.width = Math.random() * 8 + 4 + 'px';
      confetti.style.height = confetti.style.width;
      confettiContainer.appendChild(confetti);
    }

    // 🧹 Hapus confetti setelah 5 detik
    setTimeout(() => {
      confettiContainer.remove();
    }, 5000);

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 40 * (timeLeft / duration);

      // kiri
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }));

      // kanan
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }));
    }, 250);

      setTimeout(() => confettiContainer.remove(), 5000);
    }
  }); // end DOMContentLoaded

// ---------------------------
// 11) Share hasil (screenshot area)
// ---------------------------
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const user = JSON.parse(localStorage.getItem('mudengify_user') || "null");
    const Res = `mudengify_answer_${user.username}_${user.mapel}`;
    const result = JSON.parse(localStorage.getItem(Res));
    if (!result) return alert('Hasil ujian tidak ditemukan.');

    const captureArea = document.querySelector('.result-card');
    if (!captureArea) return alert('Bagian hasil tidak ditemukan.');

    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `<div class="spinner"></div><p>Membuat screenshot...</p>`;
    document.body.appendChild(loader);

    try {
      captureArea.classList.add('no-anim');
      captureArea.querySelectorAll('*').forEach(el => el.classList.add('no-anim'));
      await new Promise(res => setTimeout(res, 13));

      const canvas = await html2canvas(captureArea, {
        backgroundColor: '#fff',
        scale: 2,
        useCORS: true,
        logging: false,
        removeContainer: true,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      loader.remove();
      captureArea.classList.remove('no-anim');
      captureArea.querySelectorAll('*').forEach(el => el.classList.remove('no-anim'));

      const dataUrl = canvas.toDataURL('image/png');
      const shareText = `Skor saya ${result.score}! Yuk cobain juga di Mudengify 🎓🔥`;

      const modal = document.createElement('div');
      modal.className = 'share-modal';
      modal.innerHTML = `
        <div class="share-backdrop"></div>
        <div class="share-box">
          <h3>Bagikan Hasil Ujian</h3>
          <img src="${dataUrl}" alt="Hasil Ujian" class="share-preview"/>
          <p>${shareText}</p>
          <div class="share-options">
            <button id="dlImg" class="btn">💾 Unduh Gambar</button>
            <button id="copyShare" class="btn">📋 Salin Teks</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      modal.querySelector('#dlImg').onclick = () => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'mudengify_result.png';
        a.click();
      };
      modal.querySelector('#copyShare').onclick = async () => {
        await navigator.clipboard.writeText(shareText);
        alert('Teks berhasil disalin ✅');
      };
      modal.querySelector('.share-backdrop').onclick = () => modal.remove();
    } catch (err) {
      console.error('HTML2Canvas Error:', err);
      alert('Gagal membuat screenshot: ' + (err.message || 'Periksa console.'));
      loader.remove();
    }
  });
}

// ---------------------------
// 12) Reset ujian
// ---------------------------
const resetBtn = document.getElementById('resetExamBtn');

// ambil user sekali saja
const currentUser = JSON.parse(localStorage.getItem('mudengify_user') || "null");

if (resetBtn) {
  if (currentUser.from !== "admin") {
      resetBtn.style.display = "none";
  }
  resetBtn.addEventListener('click', async () => {
    // kalau admin → modal konfirmasi
    const modal = document.createElement('div');
    modal.className = 'reset-modal';
    modal.innerHTML = `
      <div class="reset-backdrop"></div>
      <div class="reset-panel card">
        <span class="close-btn">&times;</span>
        <h3>Reset Ujian</h3>
        <hr style="margin: 8px 0; opacity: 1;" />
        <p>Anda yakin akan menghapus data ujian? Data Anda akan hilang!</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button id="resetCancel" class="btn">Batal</button>
          <button id="resetConfirm" class="btn danger">Iya, Hapus</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('.close-btn').onclick =
    modal.querySelector('#resetCancel').onclick =
    modal.querySelector('.reset-backdrop').onclick = () => modal.remove();

    modal.querySelector('#resetConfirm').onclick = () => {
      const userinfo = JSON.parse(localStorage.getItem('mudengify_admin_view') || "null");
      localStorage.removeItem(`mudengify_data_${userinfo.username}_${userinfo.mapel}`);
      alert('Data ujian dihapus. Mengalihkan ke dashboard...');
      modal.remove();
      location.assign('admin.html');
    };
  });
}
