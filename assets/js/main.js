// MAIN.js
// === Mobile Menu Toggle ===
(() => {
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuToggle || !mobileMenu) return;

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    menuToggle.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
  });
})();


// === Custom Alert Panel ===
(() => {
  const alertPanel = document.getElementById('alert-panel');
  const alertText = document.getElementById('alert-text');
  const closeAlert = document.getElementById('close-alert');
  if (!alertPanel || !alertText || !closeAlert) return;

  let alertTimeout;

  // 🚪 Sembunyikan alert panel
  function hideAlert() {
    alertPanel.classList.remove('show');
    setTimeout(() => alertPanel.classList.add('hidden'), 300);
    alertTimeout = null;
  }

  // 🚨 Tampilkan alert panel dengan animasi
  function showAlert(message) {
    alertText.textContent = message;
    alertPanel.classList.remove('hidden');

    // Trigger animasi fade-in
    requestAnimationFrame(() => alertPanel.classList.add('show'));

    // ✨ Efek getar tiap kali muncul
    alertPanel.classList.remove('shake');
    void alertPanel.offsetWidth; // reset animasi
    alertPanel.classList.add('shake');

    // 🚫 Batalkan timer lama biar gak dobel
    if (alertTimeout) clearTimeout(alertTimeout);

    // ⏰ Auto-close setelah 4 detik
    alertTimeout = setTimeout(hideAlert, 4000);
  }

  // Tombol close manual
  closeAlert.addEventListener('click', hideAlert);

  // === Ganti alert() bawaan tombol jadi panel ===
  document.querySelectorAll('[data-alert]').forEach(btn => {
    btn.addEventListener('click', () => {
      const feature = btn.getAttribute('data-alert') || 'ini';
      showAlert(`🚧 Fitur ${feature} masih dalam tahap pengembangan!`);
    });
  });
})();
