/* ===========================
   REVIEW_LOGIC.js (CLEAN & SYNC)
   =========================== */

console.log("⏳ Menunggu QUIZ_DATA...");

let waited = 0;
let checkData = setInterval(() => {
  waited += 300;
  if (window.QUIZ_DATA && Array.isArray(window.QUIZ_DATA)) {
    clearInterval(checkData);
    console.log("✅ QUIZ_DATA siap, jumlah soal:", window.QUIZ_DATA.length);
    initReview(window.QUIZ_DATA);
  } else if (waited >= 5000) { // 5 detik
    clearInterval(checkData);
    console.error("❌ Gagal memuat QUIZ_DATA dalam 5 detik");
    alert("Gagal memuat data quiz. Silakan refresh halaman.");
  }
}, 300);

function initReview(QUIZ_DATA){
  function startApp() {
    try {
      
  // ---------------------------
  // 1) Proteksi dasar
  // ---------------------------
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  document.addEventListener('cut', e => e.preventDefault());

  // ---------------------------
  // 2) Ambil data utama dari localStorage
  // ---------------------------
  let user = JSON.parse(localStorage.getItem('mudengify_user') || "null");
  if(user.from === 'admin') user = JSON.parse(localStorage.getItem('mudengify_admin_view') || "null");
  const quizdata = JSON.parse(localStorage.getItem(`mudengify_data_${user.username}_${user.mapel}`) || "{}");
  const result = quizdata.result;
  const userAnswers = quizdata.answers || [];
  const questions = typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : [];

  let current = 0;
      
  if (!user) {
    alert('Data pengguna tidak ditemukan. Silakan login ulang.');
    location.assign('index.html');
    return;
  }

  if (!result) {
    alert('Hasil ujian tidak ditemukan.');
    location.assign('submit.html');
    return;
  }
  
  if (!questions.length) {
    document.getElementById("question-area").innerHTML = `
      <div class="card" style="text-align:center; padding:24px;">
        <h2>⚠️ Data soal tidak ditemukan</h2>
        <p>Pastikan file <strong>quiz_data.js</strong> sudah dimuat dengan benar.</p>
      </div>`;
    return;
  }

  // ---------------------------
  // 3) Utility Functions
  // ---------------------------
  function escapeHtml(str) {
    if (!str) return '';
    const allowedTags = ['b', 'i', 'u', 'br', 'sup', 'sub'];
    return String(str).replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, tagName) => {
      return allowedTags.includes(tagName.toLowerCase()) ? tag : '';
    });
  }

  // Normalizer untuk True/False Group
function normalizeTF(str = "") {
  const s = String(str).toLowerCase().trim();

  // urutkan dari frasa panjang → pendek
  if (/^tidak sesuai$/.test(s)) return "false";
  if (/^tidak tepat$/.test(s)) return "false";
  if (/^tidak benar$/.test(s)) return "false";
  if (/^tidak$/.test(s)) return "false";

  if (/^sesuai$/.test(s)) return "true";
  if (/^tepat$/.test(s)) return "true";
  if (/^benar$/.test(s)) return "true";
  if (/^ya$/.test(s)) return "true";

  return s; 
}

// === UNIVERSAL CHECK ANSWER ===
function checkAnswer(q, ua) {
  if (!q) return false;

  // ==========================
  // 1) MULTIPLE CHOICE
  // ==========================
  if (q.type === "multiple") {
    if (ua === null || ua === undefined || ua === "") return false;

    // ubah userAnswer jadi index (boleh huruf / index)
    const userIndex = typeof ua === "string"
      ? ua.toUpperCase().charCodeAt(0) - 65
      : ua;

    const correctIndex = q.options.indexOf(q.answer?.[0]);

    return userIndex === correctIndex;
  }

  // ==========================
  // 2) MULTI ANSWER (CHECKBOX)
  // ==========================
  if (q.type === "multianswer") {
    if (!Array.isArray(ua)) return false;

    // expected → convert string → index
    const expected = q.answer.map(str => q.options.indexOf(str));

    // given → convert index / huruf
    const given = ua.map(val =>
      typeof val === "string"
        ? val.toUpperCase().charCodeAt(0) - 65
        : val
    );

    const allCorrect = expected.every(e => given.includes(e));
    const noExtra = given.every(g => expected.includes(g));

    return allCorrect && noExtra;
  }

  // ==========================
  // 3) TRUE / FALSE GROUP
  // ==========================
  if (q.type === "truefalsegroup") {
    if (!Array.isArray(ua) || ua.length === 0) return false;

    return q.statements.every((st, idx) =>
      normalizeTF(ua[idx]) === normalizeTF(st.answer)
    );
  }

  // default fallback
  return false;
}

  // ---------------------------
  // 4) Render Soal
  // ---------------------------
  function renderQuestion() {
    const container = document.getElementById('question-area');
    if (!container) return;

    const q = questions[current];
    const ua = userAnswers[current]?.answer || null;

    if (!q) {
      container.innerHTML = `<p>Soal tidak ditemukan.</p>`;
      return;
    }

    let html = `
      <div class="question-content">
        <p><strong>Soal No. ${current + 1}</strong></p>
        <p class="source-text">${q.source?.replace(/\n/g, '<br>') || ''}</p>
        <p class="question-text">${q.question?.replace(/\n/g, '<br>') || ''}</p>
    `;

    // --- Pilihan Ganda & Multianswer ---
    if (q.type === 'multiple' || q.type === 'multianswer') {
      html += '<div class="options-group">';

      if (!ua || (Array.isArray(ua) && ua.length === 0)) {
        html += `<p style="color:#999;font-style:italic;">(Belum dijawab)</p>`;
      }

      q.options.forEach((opt, i) => {
        const code = String.fromCharCode(65 + i);
        const isUser = Array.isArray(ua) ? ua.includes(code) : ua === code;
        const isCorrect = Array.isArray(q.answer) && q.answer.includes(opt);

        let cls = '';
        let label = '';

        if (isCorrect && isUser) {
          cls = 'correct';
          label = '<span style="color:#155724;font-weight:650;font-style:italic;">(Jawabanmu)</span>';
        } else if (isUser && !isCorrect) {
          cls = 'wrong';
          label = '<span style="color:#721c24;font-weight:650;font-style:italic;">(Jawabanmu)</span>';
        } else if (isCorrect && (!ua || !ua.includes(code))) {
          cls = 'missed';
          label = '<span style="color:#e74c3c;font-style:italic;">(Jawaban Benar)</span>';
        }

        html += `
          <div class="option review-option ${cls}">
            ${code}. ${opt.replace(/\n/g, '<br>')}
            ${label ? ' ' + label : ''}
          </div>`;
      });

      html += '</div>';
    }

    // --- True/False Group ---
    if (q.type === 'truefalsegroup') {
      html += `
        <table class="tf-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Pernyataan</th>
              <th>Jawaban Anda</th>
              <th>Jawaban Benar</th>
            </tr>
          </thead>
          <tbody>
      `;

      q.statements.forEach((st, j) => {
        const userAns = (ua && ua[j]) || '';
        const isCorrect = normalizeTF(userAns) === normalizeTF(st.answer);
        const displayAns = userAns ? userAns + ' (Jawabanmu)' : '(Belum dijawab)';

        html += `
          <tr>
            <td>${j + 1}</td>
            <td>${st.text.replace(/\n/g, '<br>')}</td>
            <td class="${isCorrect ? 'correct' : 'wrong'}">${displayAns}</td>
            <td>${st.answer}</td>
          </tr>`;
      });

      html += '</tbody></table>';
    }

    if (q.explanation) {
      html += `<p class="explanation">${escapeHtml(q.explanation).replace(/\n/g, '<br>')}</p>`;
    }
    if (q.difficulty) {
      html += `<div class="difficulty">Kesulitan: ${escapeHtml(q.difficulty)}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    updateQuestionList();

    // --- Navigasi Tombol ---
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // 🔹 Prev button disabled di soal pertama
    if (current === 0) {
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.classList.remove('disabled');
    }

    // 🔹 Next button disabled di soal terakhir
    if (current === questions.length - 1) {
      nextBtn.classList.add('disabled');
    } else {
      nextBtn.classList.remove('disabled');
    }
  }

  // ---------------------------
  // 5) Daftar Soal (Modal)
  // ---------------------------
function updateQuestionList() {
  const list = document.getElementById('question-list');
  if (!list) return;

  list.innerHTML = '';
  questions.forEach((q, idx) => {
    const ua = userAnswers[idx]?.answer || null;
    const correct = ua ? checkAnswer(q, ua) : null;
    const btn = document.createElement('button');

    // === Warna tombol ===
    if (!ua || (Array.isArray(ua) && ua.length === 0)) {
      btn.className = 'question-number-btn status-unanswered';
    } else if (correct) {
      btn.className = 'question-number-btn status-correct';
    } else {
      btn.className = 'question-number-btn status-wrong';
    }

    // === Indikator kecil di bawah nomor ===
    let indicator = '';
    let color = 'black';

    if (!ua || (Array.isArray(ua) && ua.length === 0)) {
      indicator = '✗';
      color = 'dark_gray';
    } else if (correct) {
      indicator = '✓';
      color = 'green';
    } else {
      indicator = '✗';
      color = 'red';
    }

    const numberLabel = String(idx + 1);
    btn.innerHTML = `
      ${numberLabel}
      <span class="answer-indicator" style="color:${color};">${indicator}</span>
    `;

    // === Soal aktif sekarang ===
    if (idx === current) btn.classList.add('status-aktif');

    // === Event klik ===
    btn.addEventListener('click', () => {
      current = idx;
      renderQuestion();
    });

    list.appendChild(btn);
  });
}


  // ---------------------------
  // 6) Navigasi & Modal
  // ---------------------------
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const modal = document.getElementById("question-modal");
  const openListBtn = document.getElementById("open-list-btn");
  const closeBtn = document.querySelector(".close-btn");
  const backResultBtn = document.getElementById('backresult-btn');

  if (prevBtn) prevBtn.addEventListener('click', () => {
    current = Math.max(0, current - 1);
    renderQuestion();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    current = Math.min(questions.length - 1, current + 1);
    renderQuestion();
  });

  if (openListBtn && modal) {
    openListBtn.addEventListener("click", () => {
      modal.style.display = "flex";
      document.body.classList.add("modal-open");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      document.body.classList.remove("modal-open");
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      document.body.classList.remove("modal-open");
    }
  });

  if (backResultBtn) {
    backResultBtn.addEventListener('click', () => {
      location.assign('submit.html');
    });
  }

  // ---------------------------
  // 7) Keyboard Shortcut
  // ---------------------------
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || document.body.classList.contains('modal-open')) return;

    if (e.key === 'ArrowLeft' && current > 0) {
      current--;
      renderQuestion();
    } else if (e.key === 'ArrowRight' && current < questions.length - 1) {
      current++;
      renderQuestion();
    }
  });

  // ---------------------------
  // 8) Render Awal
  // ---------------------------
  renderQuestion();
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