// Inisialisasi elemen dan handler awal
const btnMulai = document.getElementById("btnMulai");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const modalBody = document.getElementById("modal-body");
const bgMusic = document.getElementById("bgMusic");

// Track current song and section
let currentSong = bgMusic && bgMusic.getAttribute("src") ? decodeURIComponent(bgMusic.getAttribute("src")) : null;
let currentSection = "birthdayLove"; // birthdayLove, letter, memorySelection, photos, us, video

// Function to show birthday love screen
function showBirthdayLove() {
  modal.style.display = "none";
  modalBody.innerHTML = "";
  currentSection = "birthdayLove";
  // Return to default song
  playMusic("music/disarankan di bandung .mp3");
}

// Function to show letter page
function showDearMyEndlessLove() {
  currentSection = "letter";
  modal.style.display = "flex";
  tampilSurat();
}

// Fungsi untuk memainkan musik dan menghentikan lagu sebelumnya
function playMusic(filename) {
  if (!bgMusic) return;
  
  // Hentikan lagu yang sedang berjalan
  bgMusic.pause();
  bgMusic.currentTime = 0;
  
  // Set lagu baru dan mainkan
  currentSong = filename;
  bgMusic.src = encodeURI(filename);
  bgMusic.load();
  bgMusic.play().catch(() => {/* ignore autoplay restrictions */});
}

// Fungsi untuk menampilkan halaman Pilih Kenangan dengan musik default
function showMemorySelection() {
  // Tampilkan menu pilihan kenangan
  tampilMenu();
  // Mainkan lagu default
  playMusic("music/disarankan di bandung .mp3");
}

// Play default song on page load
ensureBgMusicSetup();
playMusic("music/disarankan di bandung .mp3");

btnMulai.addEventListener("click", () => {
  // Buka modal dan tampilkan halaman surat terlebih dahulu
  modal.style.display = "flex";
  tampilSurat();
});

closeBtn.addEventListener("click", () => {
  // Hapus class surat dari modal jika ada
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) modalContent.classList.remove('surat');

  // Handle navigation based on current section
  switch (currentSection) {
    case "memorySelection":
      // From "Pilih Kenangan" go to letter page
      showDearMyEndlessLove();
      break;
    case "letter":
      // From letter page go to birthday love
      showBirthdayLove();
      break;
    case "photos":
    case "us":
    case "video":
      // From album/video pages go to memory selection
      showMemorySelection();
      break;
  }
});

function tampilMenu() {
  currentSection = "memorySelection";
  modalBody.innerHTML = `
    <h2 style="color:var(--accent);">Pilih Kenangan</h2>
    <button class="album-btn" onclick="bukaAlbum('kamu')">ur photo's </button>
    <button class="album-btn" onclick="bukaAlbum('kita')">us 👩🏻‍❤️‍👨🏻</button>
    <button class="album-btn" onclick="tampilVideo()">w memo 🎥</button>
  `;
}

// ---------------- SURAT (halaman pembuka) ----------------
function tampilSurat() {
  // Tambahkan class surat ke modal-content untuk scrolling
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) modalContent.classList.add('surat');

  modalBody.innerHTML = `
    <style>
      .surat-content { width: 100%; text-align: left; padding: 0 18px; box-sizing: border-box; }
      .envelope { width: 100%; display:flex; justify-content:center; align-items:center; }
      .letter { 
        width: 92%; 
        max-width: 520px; 
        background: linear-gradient(180deg,#111 0%, #0b0b0b 100%); 
        border-radius: 12px; 
        border: 2px solid rgba(var(--accent-rgba), 0.12); 
        padding: 28px 24px; 
        box-shadow: 0 0 20px rgba(var(--accent-rgba), 0.06);
      }
      .letter h3 { 
        color: var(--accent); 
        margin: 0 0 25px 0; 
        text-align: center; 
        font-size: 1.4em;
        text-shadow: 0 0 10px rgba(var(--accent-rgba), 0.28);
      }
      .letter p { 
        color: #fff; 
        line-height: 1.7; 
        margin: 0 0 15px 0; 
        text-align: left;
        font-size: 1em;
        word-spacing: normal;
      }
      .letter p:last-of-type { margin-bottom: 20px; }
      .surat-anim { animation: floatIn 0.6s ease both; }
      @keyframes floatIn { from { transform: translateY(18px); opacity:0 } to { transform: translateY(0); opacity:1 } }
      .lanjut-btn { margin: 10px 0; }
    </style>
    <div class="surat-content">
      <div class="envelope">
        <div class="letter surat-anim">
          <h3>dear my endless love... 💝</h3>
          <p>so sorry for my fault, n u know im not perfect actually kinda i hate myself, a lott a time. and I chose u because u determine the color in my life.</p>

          <p>mungkin aku tidak sesempurna itu dan aku tidak bisa selalu membahagiakan semua orang, perlu kamu ketahui aku akan mengusahakan apapun untukmu.</p>

          <p>selamat ulang tahun kiya! I hope ur find a much better place to grow, and may good things come ur way in the coming year. I will always love u.</p>

          <p>aku berharap di kehidupan lain kita selalu bersama, dan kita berbahagia di versi kiya yang tidak mengenal arga dan arga yang tidak mengenal kiya.</p>

          <p>penuh runtutan memori, hal hal fana didunia ini. yang artinya memang hidup ialah sekumpulan masalah yang diselingi oleh kebahagiaan, namun hidupku adalah sekumpulan masalah yang diselingi oleh dirimu.</p>

          <p>berbahagialah kiya! jika kita tidak bersama setidaknya aku pernah mengukir kisah di hidupmu, dan semoga semua hal bahagia yang kita lalui selalu ada dalam benakmu.</p>

          <p>jikalau nanti aku pinjam nama depan atau tengahmu boleh ya? aku berharap anakku dapat memberi semua orang kebahagiaan sama seperti dirimu. dan aku mengingat kembali dimana hidupku yang berwarna diciptakan semasa sma bersamamu, i always loving u my endless love.</p>

          <p>selamat berkelana nona manis, maaf jika memang tuntutanku membuatmu pergi, namun aku tidak ingin sesak dengan rasa sakit. dan mungkin benar menurutmu, inilah jalan yang kamu pilih dan aku tidak harus selalu membiru pada keadaan ini, akupun harus menentukan jalan hidupku. yang dimana setiap langkah, setiap usaha, setiap doa, dan setiap runtayan yang ada di hidupku dihiasi olehmu, aku selalu berharap kita bisa bersama. namun memang tidak bisa mungkin di kehidupan kedua aku menjadi arga yang lebih baik, semoga aku tidak keras kepala ya di kehidupan kedua.</p>

          <p>aku tidak akan kemana mana, aku selalu mencarimu entah itu di setiap pencapaianku, bahkan di sela retak hidupku aku akan mencarimu. maaf atas segala kesalahan dan segala tuntutan yang aku perbuat, semoga kamu bertemu hal yang lebih baik, dan aku akan tetap disini sebagai aga yang selalu kamu cintai.</p>

          <p>biarkan semua kisah ini kekal bersama rasa yang belum sirna.</p>

          <p>dan untungnya aku bertemu denganmu di sela sempit hidup ini, beribu maaf kusampaikan pada pesan ini dan berjuta cinta dan rasa yang aku cantumkan pada surat ini menjadi penanda bertumbuhnya seorang bidadari.</p>

          <p>aku ingin mengatakan pada hawa bahwa aku rindu pada seorang kaum nya yang diciptakan sesempurna mungkin oleh sang pencipta, dan diturunkan kebumi melalui rahim ibunya yang kuat beserta cinta ayahnya yang abadi.</p>

          <p>selamat ulang tahun kiya, i always loving u.</p>
          <div style="text-align:center;">
            <button class="btn lanjut-btn" id="lanjutBtn">Lanjut ➜</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const lanjutBtn = document.getElementById("lanjutBtn");
  if (lanjutBtn) {
    lanjutBtn.addEventListener("click", () => {
      // Hapus class surat dari modal sebelum tampil menu
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) modalContent.classList.remove('surat');
      // saat lanjut, buka menu tanpa mengubah musik (bgMusic tetap berjalan)
      tampilMenu();
    });
  }
}

// ================= FOTO ==================
function bukaAlbum(tipe) {
  // Set current section
  currentSection = tipe === 'kamu' ? 'photos' : 'us';
  // Mainkan lagu sesuai tipe album
  ensureBgMusicSetup();
  if (tipe === 'kamu') {
    playMusic('music/ini abadi perunggu.mp3');
  } else {
    playMusic('music/abadi.mp3');
  }
  const totalFoto = tipe === "kamu" ? 28 : 41;
  const prefix = tipe === "kamu" ? "ft one/" : "ft two/2.";

  const fotoList = [];
  for (let i = 1; i <= totalFoto; i++) {
    fotoList.push(`${prefix}${i}.jpeg`);
  }

  let index = 0;

  modalBody.innerHTML = `
  <h2 style="color:var(--accent);">${tipe === "kamu" ? "ur photo's " : "us 👩🏻‍❤️‍👨🏻"}</h2>
    <div class="album-content">
      <div class="foto-wrapper">
        <div class="loader-overlay" id="loaderOverlay">
          <div class="loader"></div>
        </div>
        <img id="gambar" class="fade show" src="${fotoList[index]}" alt="Foto">
      </div>
      <div class="nav-buttons">
        <button class="nav-btn" id="prevBtn">← Back</button>
        <button class="nav-btn" id="nextBtn">Next →</button>
      </div>
    </div>
  `;

  const gambar = document.getElementById("gambar");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const loaderOverlay = document.getElementById("loaderOverlay");

  // preload semua foto
  const cache = [];
  fotoList.forEach((src) => {
    const img = new Image();
    img.src = src;
    cache.push(img);
  });

  function updateTombol() {
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === fotoList.length - 1 ? "Selesai ❤️" : "Next →";
  }

  function tampilFoto() {
    loaderOverlay.classList.add("active");
    gambar.classList.remove("show");

    setTimeout(() => {
      const newSrc = fotoList[index];
      const imgTemp = cache[index] || new Image();
      imgTemp.src = newSrc;

      imgTemp.onload = () => {
        gambar.src = newSrc;
        gambar.onload = () => {
          loaderOverlay.classList.remove("active");
          requestAnimationFrame(() => gambar.classList.add("show"));
        };
      };
    }, 250);

    updateTombol();
  }

  nextBtn.addEventListener("click", () => {
    if (index < fotoList.length - 1) {
      index++;
      tampilFoto();
    } else {
      // selesai melihat album -> kembali ke menu dengan musik default
      showMemorySelection();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (index > 0) {
      index--;
      tampilFoto();
    }
  });

  updateTombol();
}

// ================= VIDEO ==================
function tampilVideo() {
  currentSection = "video";
  const videos = ["vt/vt 1.mp4", "vt/vt 2.mp4"];
  let index = 0;

  // saat membuka halaman video, ganti lagu ke lagu video
  ensureBgMusicSetup();
  playMusic("music/everything u are .mp3");

  modalBody.innerHTML = `
  <h2 style="color:var(--accent);">w memo 🎥</h2>
    <div class="album-content">
      <div class="foto-wrapper">
        <div class="loader-overlay" id="loaderOverlay">
          <div class="loader"></div>
        </div>
        <video id="videoPlayer" class="fade show" src="${videos[index]}" controls autoplay></video>
      </div>
      <div class="nav-buttons">
        <button class="nav-btn" id="prevBtn">← Back</button>
        <button class="nav-btn" id="nextBtn">Next →</button>
      </div>
    </div>
  `;

  const videoPlayer = document.getElementById("videoPlayer");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const loaderOverlay = document.getElementById("loaderOverlay");

  function updateTombolVideo() {
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === videos.length - 1 ? "Selesai ❤️" : "Next →";
  }

  function gantiVideo() {
    loaderOverlay.classList.add("active");
    videoPlayer.classList.remove("show");

    setTimeout(() => {
      const newSrc = videos[index];
      videoPlayer.src = newSrc;

      videoPlayer.onloadeddata = () => {
        loaderOverlay.classList.remove("active");
        videoPlayer.play();
        requestAnimationFrame(() => videoPlayer.classList.add("show"));
      };
    }, 250);

    updateTombolVideo();
  }

  nextBtn.addEventListener("click", () => {
    if (index < videos.length - 1) {
      index++;
      gantiVideo();
    } else {
      // selesai menonton video -> kembali ke menu dengan musik default
      showMemorySelection();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (index > 0) {
      index--;
      gantiVideo();
    }
  });

  updateTombolVideo();
}

// ---------- Perubahan / penambahan untuk autoplay musik yang andal ----------

// Pastikan elemen audio dikonfigurasi (loop, volume, preload) — aman bila dipanggil berulang
function ensureBgMusicSetup() {
  if (!bgMusic) return;
  try {
    bgMusic.loop = true;
    bgMusic.volume = 0.5;      // setengah volume
    bgMusic.preload = "auto";
    // jangan reset currentTime supaya musik tidak mulai dari awal saat kembali ke menu
  } catch (e) {
    // ignore if browser environment membatasi beberapa properti
  }
}

// Coba mainkan musik, aman dipanggil dari event user (klik) atau fallback
function playBgMusic() {
  if (!bgMusic) return;
  if (!bgMusic.paused && !bgMusic.ended) return; // sudah main, jangan ulang
  const playPromise = bgMusic.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise.catch(() => {
      // gagal karena autoplay policy — fallback interaction listener akan mencoba lagi
    });
  }
}

// Fungsi untuk mengganti lagu (sentral) — gunakan encodeURI untuk path dengan spasi
function gantiLagu(src) {
  if (!bgMusic) return;
  try {
    // hindari reload jika sama
    if (currentSong === src) {
      playBgMusic();
      return;
    }
    currentSong = src;
    bgMusic.src = encodeURI(src);
    bgMusic.load();
    const p = bgMusic.play();
    if (p && typeof p.then === 'function') p.catch(() => {/* ignore autoplay refusal */});
  } catch (e) {
    // ignore
  }
}

// Pasang konfigurasi awal
ensureBgMusicSetup();

// Fallback: beberapa browser masih butuh interaksi; pasang listener sekali untuk mencoba play.
document.addEventListener("click", function _tryPlayBgOnce() {
  playBgMusic();
  // hapus listener setelah eksekusi (sekali jalan)
  document.removeEventListener("click", _tryPlayBgOnce);
}, { capture: true, passive: true });