// SOURCE.js
document.addEventListener("DOMContentLoaded", () => {

  class Finder {
    constructor(config) {
      this.panel = config.panel;
      this.content = config.content;
      this.pathDisplay = config.pathDisplay;
      this.body = config.body;
      this.btnBack = config.btnBack;
      this.btnForward = config.btnForward;
      this.btnClose = config.btnClose;

      this.files = config.files;
      this.currentPath = ["mudengify"];
      this.history = [];
      this.future = [];

      this.init();
    }

    init() {
      this.renderFolder();
      this.setupEvents();
    }

    setupEvents() {
      this.btnBack.addEventListener("click", () => this.navigateBack());
      this.btnForward.addEventListener("click", () => this.navigateForward());
      this.btnClose.addEventListener("click", () => {
        this.body.classList.remove("file-open");
        this.renderFolder();
      });
    }

    // === 🔍 Helper: ambil folder dari path ===
    getFolderByPath(path) {
      let obj = this.files;
      for (let i = 1; i < path.length; i++) {
        const name = path[i];
        obj = obj[name + "/"] || obj[name] || {};
      }
      return obj;
    }

    // === 📂 Render folder ===
    renderFolder() {
      this.panel.innerHTML = "";
      this.content.innerHTML = `<pre><code class="language-javascript">// Klik file di kiri untuk melihat kodenya...</code></pre>`;
      this.pathDisplay.textContent = this.currentPath.join(" / ");
      this.body.classList.remove("file-open");

      const folder = this.getFolderByPath(this.currentPath);
      Object.keys(folder).forEach((key) => {
        const item = document.createElement("div");
        item.className = "finder-item";
        const isFolder = key.endsWith("/");
        const icon = isFolder
          ? "📁"
          : key.endsWith(".html") ? "🌐"
          : key.endsWith(".js") ? "🧠"
          : key.endsWith(".css") ? "🎨"
          : key.match(/\.(png|jpg|gif|jpeg)$/) ? "🖼️"
          : key.match(/\.(mp3|ogg|wav)$/) ? "🎵"
          : "📄";

        item.innerHTML = `${icon}<span>${key}</span>`;
        item.onclick = () => {
          if (isFolder) this.openFolder(key);
          else this.loadFile(key, folder[key]);
        };
        this.panel.appendChild(item);
      });
    }

    // === 📁 Buka folder ===
    openFolder(key) {
      this.history.push([...this.currentPath]);
      this.future = []; // reset forward stack
      this.currentPath.push(key.replace("/", ""));
      this.renderFolder();
    }

    // === 🧭 Navigasi back & forward ===
    navigateBack() {
      if (this.body.classList.contains("file-open")) {
        this.body.classList.remove("file-open");
        this.pathDisplay.textContent = this.currentPath.join(" / ");
      } else if (this.history.length > 0) {
        this.future.push([...this.currentPath]);
        this.currentPath = this.history.pop();
        this.renderFolder();
      }
    }

    navigateForward() {
      if (this.future.length > 0) {
        this.history.push([...this.currentPath]);
        this.currentPath = this.future.pop();
        this.renderFolder();
      }
    }

    // === 📄 Muat file ===
    async loadFile(name, path) {
      this.body.classList.add("file-open");
      this.pathDisplay.textContent = `${this.currentPath.join(" / ")} / ${name}`;
      this.content.innerHTML = `<div class='loading'>⏳ Memuat file...</div>`;

      const ext = name.split(".").pop().toLowerCase();

      // 🖼️ Gambar
      if (["png", "jpg", "gif", "jpeg"].includes(ext)) {
        this.content.innerHTML = `
          <div class="img-viewer">
            <img src="${path}" alt="${name}">
            <p style="text-align:center;color:#ccc;margin-top:8px;">${name}</p>
          </div>`;
        return;
      }

      // 🎵 Audio
      if (["mp3", "ogg", "wav"].includes(ext)) {
        this.content.innerHTML = `
          <div style="text-align:center; padding:20px;">
            <p style="color:#ccc;">${name}</p>
            <audio controls style="width:90%; max-width:600px;">
              <source src="${path}" type="audio/${ext}">
              Browser kamu tidak mendukung pemutar audio.
            </audio>
          </div>`;
        return;
      }

      // 📜 File text
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error("Gagal fetch file");
        const text = await res.text();

        const lang = ext === "js" ? "javascript" :
                     ext === "css" ? "css" :
                     ext === "html" ? "html" : "plaintext";

        this.content.innerHTML = `<pre><code id="codeContent" class="language-${lang}"></code></pre>`;
        const codeContent = document.getElementById("codeContent");
        codeContent.textContent = text;
        hljs.highlightElement(codeContent);
      } catch (err) {
        this.content.innerHTML = `<pre><code class="language-plaintext">// ⚠️ Gagal memuat file: ${err.message}</code></pre>`;
      }
    }
  }

  // === 📁 Data struktur file ===
  const files = {
    "assets/": {
      "css/": {
        "style.css": "assets/css/style.css",
        "home.css": "assets/css/home.css",
        "quiz.css": "assets/css/quiz.css",
        "review.css": "assets/css/review.css",
        "source.css": "assets/css/source.css",
        "submit.css": "assets/css/submit.css",
        "token.css": "assets/css/token.css",
      },
      "js/": {
        "main.js": "assets/js/main.js",
        "home.js": "assets/js/home.js",
        "quiz_logic.js": "assets/js/quiz_logic.js",
        "review_logic.js": "assets/js/review_logic.js",
        "submit.js": "assets/js/submit.js",
        "token.js": "assets/js/token.js",
        "source.js": "assets/js/source.js",
      },
      "img/": {
        "logo.png": "assets/img/logo.png",
        "mudengifylogo.png": "assets/img/mudengifylogo.png",
        "mudengify_animated.gif": "assets/img/mudengify_animated.gif",
        "construction.jpg": "assets/img/construction.jpg",
        "mudengifylogo_animated.gif": "assets/img/mudengifylogo_animated.gif"
      },
      "sounds/": {
        "party_popper1.ogg": "assets/sounds/party_popper1.ogg",
        "party_popper2.ogg": "assets/sounds/party_popper2.ogg",
        "party_popper3.ogg": "assets/sounds/party_popper3.ogg",
        "objective_success.ogg": "assets/sounds/objective_success.ogg"
      }
    },
    "data/":{
      "bahasa-indonesia/" : {
        "quiz_data.js" : "data/bahasa-indonesia/quiz_data.js",
        "rules.js" : "data/bahasa-indonesia/rules.js"
      }
    },
    "index.html": "index.html",
    "home.html": "home.html",
    "quiz.html": "quiz.html",
    "review.html": "review.html",
    "source.html": "source.html",
    "submit.html": "submit.html",
    "token.html": "token.html"
  };

  // === 🚀 Inisialisasi Finder ===
  new Finder({
    panel: document.getElementById("finderPanel"),
    content: document.getElementById("finderContent"),
    pathDisplay: document.getElementById("finderPath"),
    body: document.getElementById("finderBody"),
    btnBack: document.getElementById("btnBack"),
    btnForward: document.getElementById("btnForward"),
    btnClose: document.getElementById("btnClose"),
    files
  });

});
