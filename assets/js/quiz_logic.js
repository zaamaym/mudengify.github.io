// QUIZ_LOGIC.js
/* ============================================================
   QUIZ LOGIC (REVISED & FORMATTED)
   ============================================================ */
   // QUIZ_LOGIC.js
console.log("⏳ Menunggu QUIZ_DATA...");

let waited = 0;
let checkData = setInterval(() => {
  waited += 300;
  if (window.QUIZ_DATA && Array.isArray(window.QUIZ_DATA)) {
    clearInterval(checkData);
    console.log("✅ QUIZ_DATA siap, jumlah soal:", window.QUIZ_DATA.length);
    initQuiz(window.QUIZ_DATA);
  } else if (waited >= 5000) { // 5 detik
    clearInterval(checkData);
    console.error("❌ Gagal memuat QUIZ_DATA dalam 5 detik");
    alert("Gagal memuat data quiz. Silakan refresh halaman.");
  }
}, 300);


function initQuiz(QUIZ_DATA) {
  console.log("🚀 initQuiz() dijalankan, jumlah soal:", QUIZ_DATA.length);
  // === 1️⃣ Cek Login User ===
  const userStr = localStorage.getItem('mudengify_user');
  if (!userStr) {
    alert('Anda belum login. Redirect ke login.');
    location.assign('index.html');
  }
  const user = JSON.parse(userStr);


  // Hapus urutan soal lama
  localStorage.removeItem('mudengify_question_order');
  
  // === 2️⃣ Inisialisasi Data Soal & Jawaban ===
  const questions = QUIZ_DATA;
  let userAnswers = questions.map(() => ({ answer: null, isFlagged: false }));
  let current = 0;
  const checktoken = localStorage.getItem(`mudengify_token`) || `false`;
  const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
  if(quizdata.status === 'finished'){
    alert("⚠️ Anda sudah menyelesaikan ujian ini.");
    location.assign('submit.html'); 
  }
  if(checktoken === 'true'){
    alert("Silakan masukkan token terlebih dahulu!");
    location.assign('token.html');
  }
  // === 3️⃣ Anti-cheat Proteksi ===
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  document.addEventListener('cut', e => e.preventDefault());

  // === 4️⃣ State Management ===
  function saveState() {
    const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
    quizdata.answers = userAnswers;
    localStorage.setItem(`mudengify_data_${user.username}_${user.mapel}`, JSON.stringify(quizdata));
  }

  function loadState() {
    const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
    if(quizdata.progress === 'in_progress'){
      userAnswers = quizdata.answers;
    }
  }

  // === 5️⃣ Progress Bar ===
  function updateProgress() {
    const done = userAnswers.filter(
      u => u.answer !== null && !(Array.isArray(u.answer) && u.answer.length === 0)
    ).length;
    const percent = Math.round((done / questions.length) * 100);
    const pb = document.getElementById('progressBar');
    if (pb) pb.style.width = percent + '%';
  }

  // === 6️⃣ Render Soal ===
  function renderQuestion() {
    const q = questions[current];
    const container = document.getElementById('question-area');
    if (!q) return;

    const ua = userAnswers[current];
    let html = `
      <div class="question-content">
        <p><strong>Soal No. ${current + 1}</strong></p>
        <p class="source-text">${q.source.replace(/\n/g, '<br>')}</p>
        <p class="question-text">${q.question.replace(/\n/g, '<br>')}</p>
    `;

    // --- Multiple Choice ---
    if (q.type === 'multiple') {
      html += `<div class="options-group">`;
      q.options.forEach((opt, i) => {
        const val = String.fromCharCode(65 + i);
        const checked = ua.answer === val ? 'checked' : '';
        html += `
          <label>
            <input type="radio" name="q${current}" value="${val}" ${checked}
              onchange="window.quizHandleSingle(${current}, '${val}')">
            <div class="option">${val}. ${opt.replace(/\n/g, '<br>')}</div>
          </label>
        `;
      });
      html += `</div>`;
    }

    // --- True / False Group ---
    else if (q.type === 'truefalsegroup') {
      html += `
        <table class="tf-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Pernyataan</th>
              ${q.options.map(opt => `<th>${opt}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
      `;

      q.statements.forEach((st, j) => {
        const key = `q${current}_st${j}`;
        const ans = ua.answer && ua.answer[j] ? ua.answer[j] : null;
        html += `
          <tr>
            <td>${st.no ?? j + 1}</td>
            <td>${st.text.replace(/\n/g, '<br>')}</td>
            ${q.options
              .map(
                opt => `
              <td>
                <input type="radio" name="${key}" value="${opt}"
                  ${ans === opt ? 'checked' : ''}
                  onchange="window.quizHandleTFGroup(${current}, ${j}, '${opt}')">
              </td>`
              )
              .join('')}
          </tr>
        `;
      });

      html += `</tbody></table>`;
    }

    // --- Multianswer (Checkbox) ---
    else if (q.type === 'multianswer') {
      html += `<div class="options-group">`;
      q.options.forEach((opt, i) => {
        const code = String.fromCharCode(65 + i);
        const checked =
          Array.isArray(ua.answer) && ua.answer.includes(code) ? 'checked' : '';
        html += `
          <label>
            <input type="checkbox" name="q${current}" value="${code}" ${checked}
              onchange="window.quizHandleMulti(${current}, this)">
            <div class="option">${code}. ${opt.replace(/\n/g, '<br>')}</div>
          </label>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // --- Navigasi Tombol ---
    const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');

// 🔹 Prev button disabled di soal pertama
if (current === 0) {
  prevBtn.classList.add('disabled');
} else {
  prevBtn.classList.remove('disabled');
}

// 🔹 Next button disabled di soal terakhir
if (current === questions.length - 1) {
  nextBtn.classList.add('disabled');
  nextBtn.style.display = 'none'
  submitBtn.style.display = 'inline-block';
} else {
  nextBtn.classList.remove('disabled');
  nextBtn.style.display = 'inline-block'
  submitBtn.style.display = 'none';
}


    updateQuestionList();
    updateProgress();

    // --- Indikator Tombol Ragu-Ragu ---
    const flagBtn = document.getElementById('flag-btn');
    flagBtn.classList.toggle('active-flag', userAnswers[current].isFlagged);
  }
  
// === POPUP NOTIF LOGIN ===
const popup = document.getElementById("loginAlert");
const popupMsg = document.getElementById("popupMessage");
const popupProgress = document.getElementById("popupProgress");
let popupTimer;

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
  // === 7️⃣ Daftar Soal Sidebar ===
  function updateQuestionList() {
    const list = document.getElementById('question-list');
    list.innerHTML = '';

    userAnswers.forEach((it, idx) => {
      const btn = document.createElement('button');
      let cls = it.answer ? 'status-sudah' : 'status-belum';
      if (it.isFlagged) cls = 'status-ragu';
      if (idx === current) cls += ' status-aktif';
      btn.className = 'question-number-btn ' + cls;

      // Indikator kecil
      let indicator = '';
      const q = questions[idx];
      const ans = it.answer;
      if (q.type === 'multiple' && ans){
        indicator = ans;
        const numberLabel = String(idx + 1);
      btn.innerHTML = `${numberLabel}<span class="answer-indicator" style="color: black;">${indicator}</span>`;
      }
      else if (['truefalsegroup', 'multianswer'].includes(q.type) && ans && ans.length > 0){
        indicator = '✓';
        const numberLabel = String(idx + 1);
        btn.innerHTML = `${numberLabel}<span class="answer-indicator" style="color: green;">${indicator}</span>`;

      }
      else{
        const numberLabel = String(idx + 1);
        btn.innerHTML = `${numberLabel}<span class="answer-indicator" style="color: green;">${indicator}</span>`;
      }
      btn.addEventListener('click', () => {
        current = idx;
        renderQuestion();
      });

      list.appendChild(btn);
    });
  }

  // === 8️⃣ Helpers ===
  function escapeHtml(str) {
  if (!str) return '';
  // izinkan beberapa tag HTML aman
  const allowedTags = ['b', 'i', 'u', 'br', 'sup', 'sub'];
  return String(str).replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, tagName) => {
    return allowedTags.includes(tagName.toLowerCase()) ? tag : '';
  });
}


  // === 9️⃣ Handler Jawaban ===
  window.quizHandleSingle = (i, v) => {
    userAnswers[i].answer = v;
    saveState();
    updateQuestionList();
    updateProgress();
  };

  window.quizHandleMulti = (i, checkbox) => {
    const v = checkbox.value;
    if (!Array.isArray(userAnswers[i].answer)) userAnswers[i].answer = [];
    if (checkbox.checked) {
      if (!userAnswers[i].answer.includes(v)) userAnswers[i].answer.push(v);
    } else {
      userAnswers[i].answer = userAnswers[i].answer.filter(x => x !== v);
    }
    saveState();
    updateQuestionList();
    updateProgress();
  };

  window.quizHandleTFGroup = (i, j, v) => {
    if (!Array.isArray(userAnswers[i].answer)) userAnswers[i].answer = [];
    userAnswers[i].answer[j] = v;
    saveState();
    updateQuestionList();
    updateProgress();
  };

  // === 🔟 Hitung Nilai ===
 function calculateResult() {
  let correct = 0,
      wrong = 0,
      unanswered = 0;

  questions.forEach((q, i) => {
    const ua = userAnswers[i].answer;

    // === Multiple Choice ===
    if (q.type === "multiple") {
      if (ua === null || ua === undefined || ua === "") {
        unanswered++;
        return;
      }

      // User answer: bisa huruf "A" atau index
      const userIndex = typeof ua === "string"
        ? ua.toUpperCase().charCodeAt(0) - 65
        : ua;

      const correctIndex = q.options.indexOf(q.answer[0]);

      userIndex === correctIndex ? correct++ : wrong++;
    }

    // === Multi Answer ===
    else if (q.type === "multianswer") {
      if (!Array.isArray(ua) || ua.length === 0) {
        unanswered++;
        return;
      }

      // Normalize user answer ke index
      const given = ua.map(x =>
        typeof x === "string"
          ? x.toUpperCase().charCodeAt(0) - 65
          : x
      );

      // Normalize correct answer ke index
      const expected = q.answer.map(ans =>
        q.options.indexOf(ans)
      );

      const allCorrect = expected.every(e => given.includes(e));
      const noExtra = given.every(g => expected.includes(g));

      allCorrect && noExtra ? correct++ : wrong++;
    }

    // === True/False Group ===
    // === True/False Group ===
    else if (q.type === "truefalsegroup") {
      if (!Array.isArray(ua) || ua.length === 0) {
        unanswered++;
        return;
      }

      // cek kalau masih ada jawaban null atau kosong
      if (ua.some(x => x === null || x === "")) {
        unanswered++;
        return;
      }

      // normalizer agar "sesuai" == "Sesuai" == " sesuai "
      const norm = s => String(s).trim().toLowerCase();

      const allCorrect = q.statements.every(
        (st, idx) => norm(ua[idx]) === norm(st.answer)
      );

      allCorrect ? correct++ : wrong++;
    }

  });

  const total = questions.length;
  const score = (correct / total) * 100;
  const percent = Math.round(score);

  return { total, correct, wrong, unanswered, score, percent };
}

  function updateStatus(status) {
    const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
    quizdata.status = status;
    localStorage.setItem(`mudengify_data_${user.username}_${user.mapel}`, JSON.stringify(quizdata));
  }
  // === 11️⃣ Akhiri Kuis ===
  function endQuiz() {
    const result = calculateResult();
    const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
    quizdata.answers = userAnswers;
    quizdata.result = result;
    localStorage.setItem(`mudengify_data_${user.username}_${user.mapel}`, JSON.stringify(quizdata));
    updateStatus("finished");
    location.assign('submit.html');
  }

function startTimer() {
  const user = JSON.parse(localStorage.getItem('mudengify_user') || "null");
  const mapelData = JSON.parse(localStorage.getItem(`mudengify_${user.mapel}`));
  const DURATION_MS = mapelData.duration * 60 * 1000; // 90 menit total
  const LOCK_DURATION_MS = 3 * 60 * 1000; // 3 menit tombol dikunci
  const el = document.getElementById('countdown');
  const submitBtn = document.getElementById('submit-btn');
  if (!el || !submitBtn) return;
  if (!user) return;
  const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");

  let startTime = quizdata.timer;
  if (!startTime) {
    startTime = Date.now();
    quizdata.timer = startTime;
    localStorage.setItem(`mudengify_data_${user.username}_${user.mapel}`, JSON.stringify(quizdata));
  } else {
    startTime = Number(startTime);
  }

  const endTime = startTime + DURATION_MS;
  const unlockTime = startTime + LOCK_DURATION_MS;

  // === 🔒 Lock tombol di awal ===
  submitBtn.disabled = true;
  submitBtn.style.opacity = "0.7";
  submitBtn.style.background = "#ccc";
  submitBtn.style.transition = "all 0.4s ease";
  submitBtn.textContent = "Kumpulkan (10:00)";

  // === 🕒 Update Display per detik ===
  function updateDisplay() {
    const now = Date.now();
    const remaining = endTime - now;

    // --- Timer utama ---
    if (remaining <= 0) {
      el.textContent = "00:00:00";
      el.style.color = "red";
      el.style.animation = "none";
      showPopup("⏰ Waktu habis! Kuis akan dikumpulkan otomatis.", "error");
      endQuiz();
      return;
    }

    const h = String(Math.floor(remaining / 3600000)).padStart(2, '0');
    const m = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;

    // warna dinamis countdown
    const minsLeft = remaining / 60000;
    if (minsLeft <= 5) {
      el.style.color = "red";
      el.style.animation = "blink 1s infinite";
    } else if (minsLeft <= 10) {
      el.style.color = "orange";
      el.style.animation = "none";
    } else {
      el.style.color = "black";
      el.style.animation = "none";
    }

    // --- kontrol tombol submit ---
    const untilUnlock = unlockTime - now;
    if (untilUnlock > 0) {
      const mm = String(Math.floor((untilUnlock % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const ss = String(Math.floor((untilUnlock % (1000 * 60)) / 1000)).padStart(2, '0');
      submitBtn.textContent = `Selesai (${mm}:${ss})`;
    } else if (submitBtn.disabled) {
      // === ✅ Aktifkan tombol ===
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.background = "linear-gradient(90deg, #4a90e2, #5ec9f3)";
      submitBtn.style.cursor = "pointer";
      submitBtn.textContent = "Selesai";

      // efek kilau muncul sebentar
      submitBtn.animate(
        [
          { transform: "scale(1.1)", boxShadow: "0 0 10px rgba(80,160,255,0.6)" },
          { transform: "scale(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" }
        ],
        { duration: 600, easing: "ease-out" }
      );
    }
  }

  // Jalankan pertama kali + interval
  updateDisplay();
  setInterval(updateDisplay, 1000);
}

  // === 13️⃣ START APP (ganti DOMContentLoaded listener) ===
function startApp() {
  try {
    loadState();
    renderQuestion();
    startTimer();
    // Saat mulai kuis set status in_progress (demo atau server)
(function markInProgress() {
  const user = JSON.parse(localStorage.getItem('mudengify_user') || "null");
  if (!user) return;
  const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
  quizdata.status = 'in_progress';
  localStorage.setItem(`mudengify_data_${user.username}_${user.mapel}`, JSON.stringify(quizdata));
})();
  
    // Logout
    // === 🔐 Logout handler ===
    // Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  const modal = document.createElement('div');
    modal.className = 'logout-modal';
    modal.innerHTML = `
      <div class="logout-backdrop"></div>
      <div class="logout-panel card">
        <span class="close-btn">&times;</span>
        <h3>Log Out</h3>
        <hr style="margin: 8px 0; opacity: 1;" />
        <p>Anda yakin akan keluar? Pengerjaan akan otomatis selesai. Login kembali untuk melihat hasil.</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button id="logoutCancel" class="btn">Batal</button>
          <button id="logoutConfirm" class="btn danger">Selesai & Keluar</button>
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
      const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
      quizdata.answers = userAnswers;
      const result = calculateResult();
      quizdata.result = result;
      quizdata.status = 'finished';
      localStorage.setItem(`mudengify_data_${user.username}_${user.mapel}`, JSON.stringify(quizdata))
    }
    localStorage.removeItem('mudengify_from_quiz');
    localStorage.removeItem('tokenData');
    localStorage.removeItem('mudengify_user');
    location.assign('index.html');
    modal.remove();
    };
});


    // Navigasi Soal
    document.getElementById('prev-btn').addEventListener('click', () => {
      current = Math.max(0, current - 1);
      renderQuestion();
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      current = Math.min(questions.length - 1, current + 1);
      renderQuestion();
    });

    // Submit
    document.getElementById('submit-btn').addEventListener('click', () => {
  const flaggedCount = userAnswers.filter(u => u.isFlagged).length;

  // === Modal Tahap 1 ===
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  modal.innerHTML = `
    <div class="logout-backdrop"></div>
    <div class="logout-panel card">
      <span class="close-btn">&times;</span>
      <h3>Kumpulkan Jawaban</h3>
      <hr style="margin:8px 0; opacity:1;" />
      <p>${flaggedCount > 0 
          ? `⚠️ Masih ada <b>${flaggedCount}</b> soal yang ditandai ragu-ragu.` 
          : `Pastikan semua jawaban Anda sudah benar.`}</p>
      <label style="display:flex;align-items:center;gap:6px;margin-top:10px;">
        <input type="checkbox" id="confirmCheck" />
        <span>Saya yakin semua jawaban sudah diperiksa.</span>
      </label>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
        <button id="cancelBtn" class="btn">Batal</button>
        <button id="nextBtn" class="btn primary">Lanjut</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  modal.querySelector('.close-btn').onclick = closeModal;
  modal.querySelector('.logout-backdrop').onclick = closeModal;
  modal.querySelector('#cancelBtn').onclick = closeModal;

  modal.querySelector('#nextBtn').onclick = () => {
    const check = modal.querySelector('#confirmCheck');
    if (!check.checked) {
      showPopup('Centang pernyataan terlebih dahulu sebelum lanjut.', "info");
      check.classList.add("shake", "highlight");
      setTimeout(() => {
        check.classList.remove("shake", "highlight");
      }, 500);
      return;
    }
    modal.remove();

    // === Modal Tahap 2 ===
    const modal2 = document.createElement('div');
    modal2.className = 'confirm-modal';
    modal2.innerHTML = `
      <div class="logout-backdrop"></div>
      <div class="logout-panel card">
        <span class="close-btn">&times;</span>
        <h3>Konfirmasi Akhir</h3>
        <hr style="margin:8px 0; opacity:1;" />
        <p>Apakah Anda benar-benar yakin ingin mengumpulkan jawaban sekarang?</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button id="backBtn" class="btn">Kembali</button>
          <button id="confirmSubmit" class="btn danger">Ya, Kumpulkan</button>
        </div>
      </div>`;
    document.body.appendChild(modal2);

    modal2.querySelector('.close-btn').onclick = () => modal2.remove();
    modal2.querySelector('.logout-backdrop').onclick = () => modal2.remove();
    modal2.querySelector('#backBtn').onclick = () => modal2.remove();

    modal2.querySelector('#confirmSubmit').onclick = () => {
      modal2.remove();
      endQuiz();
    };
  };
});


    // Tombol Ragu-Ragu
    document.getElementById('flag-btn').addEventListener('click', () => {
      userAnswers[current].isFlagged = !userAnswers[current].isFlagged;
      saveState();
      updateQuestionList();
      const flagBtn = document.getElementById('flag-btn');
      flagBtn.classList.toggle('active-flag', userAnswers[current].isFlagged);
    });

    // === 🎚️ Slider Ukuran Font Soal ===
    const fontRange = document.getElementById('fontRange');
    const fontValue = document.getElementById('fontValue');
    const savedSize = 100;
    fontRange.value = savedSize;
    fontValue.textContent = savedSize + '%';

    function updateQuestionFont(size) {
      fontValue.textContent = size + '%';
      localStorage.setItem('mudengify_questionFontPercent', size);
      document.querySelectorAll('.question-text').forEach(q => {
        q.style.fontSize = size / 100 + 'em';
      });
    }

    fontRange.addEventListener('input', () => updateQuestionFont(fontRange.value));

    // Override render agar apply font tiap kali renderQuestion dipanggil
    const _renderQuestion = renderQuestion;
    renderQuestion = function () {
      _renderQuestion();
      const size = localStorage.getItem('mudengify_questionFontPercent') || 100;
      updateQuestionFont(size);
    };

    // === 📋 Popup Daftar Soal ===
    const modal = document.getElementById('question-modal');
    const openListBtn = document.getElementById('open-list-btn');
    const closeBtn = document.querySelector('.close-btn');

    openListBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    });

    window.addEventListener('click', e => {
      if (e.target === modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    });

    // === 🎹 Keyboard Shortcut ===
    document.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();
      const q = questions[current];
      if (!q) return;

      // Navigasi Soal
      if (key === 'arrowleft' && current > 0) {
        current--;
        renderQuestion();
      } else if (key === 'arrowright' && current < questions.length - 1) {
        current++;
        renderQuestion();
      }

      // Jawaban A–E
      const letters = ['a', 'b', 'c', 'd', 'e'];
      if (letters.includes(key)) {
        const upper = key.toUpperCase();
        const inputs = document.querySelectorAll(`input[name="q${current}"]`);

        if (q.type === 'multiple') {
          inputs.forEach(input => {
            if (input.value === upper) {
              input.checked = true;
              window.quizHandleSingle(current, upper);
            }
          });
        } else if (q.type === 'multianswer') {
          inputs.forEach(input => {
            if (input.value === upper) {
              input.checked = !input.checked;
              window.quizHandleMulti(current, input);
            }
          });
        }
      }
    });

    console.log('✅ Aplikasi quiz di-start');
  } catch (err) {
    console.error('Error saat startApp():', err);
  }
}

// Jika DOM sudah siap, jalankan segera — kalau belum, daftarkan listener
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

};