document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // VALIDASI ADMIN
  // =============================
  const user = JSON.parse(localStorage.getItem('mudengify_user') || "null");
  if (!user || user.from !== 'admin') {
    alert('Akses ditolak. Hanya untuk admin.');
    location.assign('index.html');
    return;
  }

  const tableBody = document.getElementById("tableBody");

  // =============================
  // LOGOUT MODAL
  // =============================
  const logoutBtn = document.getElementById('logout-btn');
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

      modal.querySelector('.close-btn').onclick = () => modal.remove();
      modal.querySelector('#logoutCancel').onclick = () => modal.remove();
      modal.querySelector('.logout-backdrop').onclick = () => modal.remove();

      modal.querySelector('#logoutConfirm').onclick = () => {
        localStorage.removeItem('mudengify_user');
        location.assign('index.html');
      };
    });
  }

  // =============================
  // FUNGSI PREDIKAT
  // =============================
  function whatpredict(nilai){
    if(nilai >= 90) return {message:"istimewa", color:"rgba(23, 125, 72, 1)"};
    if(nilai >= 76) return {message:"baik", color:"rgba(255, 179, 0, 1)"};
    if(nilai >= 60) return {message:"memadai", color:"rgba(255, 251, 0, 1)"};
    return {message:"kurang", color:"rgba(255, 0, 0, 1)"};
  }

  // =============================
  // GENERATE TABEL
  // =============================
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("mudengify_data_")) {
      try {
        const quizdata = JSON.parse(localStorage.getItem(key));
        const result = quizdata.result;

        const parts = key.split("_");
        const username = parts[2];
        const mapel = parts.slice(3).join("_");

        const predikat = whatpredict(result.percent);

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${username}</td>
          <td>${mapel}</td>
          <td>${result.score}</td>
          <td style="color:${predikat.color}; font-weight:600;">${predikat.message}</td>
          <td><button class="btn nav-btn blue viewbtn" data-user="${username}" data-mapel="${mapel}">Lihat</button></td>
          <td><button class="btn small-btn primary resetbtn" data-user="${username}" data-mapel="${mapel}">Reset</button></td>
        `;
        tableBody.appendChild(row);

      } catch (e) {
        console.warn("Gagal parse:", key);
      }
    }
  });

  // =============================
  // EMPTY STATE
  // =============================
  if (tableBody.children.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="6" style="text-align:center; padding:16px; font-style:italic; opacity:.7;">
        Belum ada data masuk
      </td>`;
    tableBody.appendChild(emptyRow);
  }

  // =====================================================
  // FILTER - SORT - SEARCH (HARUS SETELAH TABEL JADI)
  // =====================================================
  const filterMapel = document.getElementById("filterMapel");
  const sortBy = document.getElementById("sortBy");
  const searchInput = document.getElementById("searchInput");

  // Kumpulkan mapel
  const mapelSet = new Set();
  document.querySelectorAll("#tableBody tr").forEach(row => {
    const map = row.children[1]?.innerText;
    if (map) mapelSet.add(map);
  });

  mapelSet.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    filterMapel.appendChild(opt);
  });

  // =============================
  // FILTER + SORT + SEARCH
  // =============================
  function applyFilterSortSearch() {
    const rows = Array.from(document.querySelectorAll("#tableBody tr"));
    const f = filterMapel.value;
    const s = sortBy.value;
    const q = searchInput.value.toLowerCase();

    // Filter + Search
    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      const mapel = row.children[1]?.innerText;

      let ok =
        text.includes(q) &&
        (!f || mapel === f);

      row.style.display = ok ? "" : "none";
    });

    // Sort — perbaikan index score (index kolom score = 2)
    let visible = rows.filter(r => r.style.display !== "none");

    visible.sort((a, b) => {
      let nameA = a.children[0].innerText.toLowerCase();
      let nameB = b.children[0].innerText.toLowerCase();

      let mapA = a.children[1].innerText.toLowerCase();
      let mapB = b.children[1].innerText.toLowerCase();

      let scoreA = parseFloat(a.children[2].innerText);
      let scoreB = parseFloat(b.children[2].innerText);

      switch (s) {
        case "name_asc":   return nameA.localeCompare(nameB);
        case "name_desc":  return nameB.localeCompare(nameA);
        case "mapel_asc":  return mapA.localeCompare(mapB);
        case "mapel_desc": return mapB.localeCompare(mapA);
        case "score_asc":  return scoreA - scoreB;
        case "score_desc": return scoreB - scoreA;
        default: return 0;
      }
    });

    // Pasang ulang urutan
    visible.forEach(r => tableBody.appendChild(r));
  }

  filterMapel.addEventListener("change", applyFilterSortSearch);
  sortBy.addEventListener("change", applyFilterSortSearch);
  searchInput.addEventListener("input", applyFilterSortSearch);


  // =============================
  // ACTION BUTTONS (VIEW + RESET)
  // =============================
  document.addEventListener("click", function(e) {

    // VIEW
    if (e.target.classList.contains("viewbtn")) {
      const user = e.target.dataset.user;
      const mapel = e.target.dataset.mapel;

      localStorage.setItem("mudengify_admin_view", JSON.stringify({username: user, mapel}));
      location.assign("submit.html");
    }

    // RESET
    if (e.target.classList.contains("resetbtn")) {
      const user = e.target.dataset.user;
      const mapel = e.target.dataset.mapel;

      const modal = document.createElement("div");
      modal.className = "reset-modal";
      modal.innerHTML = `
        <div class="reset-backdrop"></div>
        <div class="reset-panel card">
          <span class="close-btn">&times;</span>
          <h3>Reset Ujian</h3>
          <hr />
          <p>Anda yakin akan menghapus data ujian milik <b>${user}</b>?</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
            <button id="resetCancel" class="btn">Batal</button>
            <button id="resetConfirm" class="btn danger">Iya, Hapus</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      modal.querySelector('.close-btn').onclick = () => modal.remove();
      modal.querySelector('#resetCancel').onclick = () => modal.remove();
      modal.querySelector('.reset-backdrop').onclick = () => modal.remove();

      modal.querySelector('#resetConfirm').onclick = () => {
        localStorage.removeItem(`mudengify_data_${user}_${mapel}`);
        e.target.closest("tr").remove();
        modal.remove();
        location.assign('admin.html');
      };
    }

  });

});
