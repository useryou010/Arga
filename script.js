// Inisialisasi elemen dan handler awal
const btnMulai = document.getElementById("btnMulai");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const modalBody = document.getElementById("modal-body");
const bgMusic = document.getElementById("bgMusic");
const stickerContainer = document.getElementById("stickerContainer");

// Track sticker rotation
let stickerRotationInterval = null;
let usedStickerIndices = [];
const animations = ['float', 'swing', 'bounce', 'drift'];

// Initialize stickers for memory selection page
function initStickers() {
  // Clear any existing rotation interval
  if (stickerRotationInterval) {
    clearInterval(stickerRotationInterval);
    stickerRotationInterval = null;
  }

  // Clear existing stickers first
  stickerContainer.innerHTML = '';
  stickerContainer.style.display = 'block';
  
  const TOTAL_STICKERS = 21;
  const STICKERS_PER_BATCH = 6; // Show 6 stickers at once
  const MIN_DISTANCE = 100; // Minimum pixels between stickers
  const placedStickers = []; // Track sticker positions
  
  // Define safe zones for sticker placement (avoid modal area)
  const safeZones = [
    { left: 5, width: 25, top: 5, height: 90 },     // Left side
    { right: 5, width: 25, top: 5, height: 90 },    // Right side
    { left: 30, width: 40, top: 5, height: 20 },    // Top
    { left: 30, width: 40, bottom: 5, height: 20 }  // Bottom
  ];

  // Helper to get random number between min and max
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Check if position overlaps with existing stickers
  function isOverlapping(x, y, size) {
    return placedStickers.some(sticker => {
      const dx = x - sticker.x;
      const dy = y - sticker.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (size + sticker.size) / 2 + MIN_DISTANCE;
    });
  }
  
  // Get random position in viewport coordinates
  function getRandomPosition(zone) {
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;
    
    let x, y;
    if (zone.right !== undefined) {
      x = viewWidth - (viewWidth * (zone.right + zone.width) / 100) + 
          random(0, viewWidth * zone.width / 100);
    } else {
      x = viewWidth * zone.left / 100 + random(0, viewWidth * zone.width / 100);
    }
    
    if (zone.bottom !== undefined) {
      y = viewHeight - (viewHeight * (zone.bottom + zone.height) / 100) + 
          random(0, viewHeight * zone.height / 100);
    } else {
      y = viewHeight * zone.top / 100 + random(0, viewHeight * zone.height / 100);
    }
    
    return { x, y };
  }

  // Function to create and place a new batch of stickers
  function createStickerBatch() {
    // Clear existing stickers with fade out
    const oldStickers = stickerContainer.querySelectorAll('.sticker');
    oldStickers.forEach(sticker => {
      sticker.classList.add('fade-out');
      setTimeout(() => sticker.remove(), 500); // Remove after fade
    });
    
    // Reset placed stickers tracking
    placedStickers.length = 0;
    
    // Create new batch of random stickers
    let stickerIndices = [];
    while (stickerIndices.length < STICKERS_PER_BATCH) {
      const idx = random(1, TOTAL_STICKERS);
      if (!stickerIndices.includes(idx)) {
        stickerIndices.push(idx);
      }
    }
    
    // Place each sticker in batch
    stickerIndices.forEach(i => {
      let placed = false;
      let attempts = 0;
      const size = random(60, 90); // Random size between 60-90px
      
      while (!placed && attempts < 50) {
        const zone = safeZones[random(0, safeZones.length - 1)];
        const pos = getRandomPosition(zone);
        
        if (!isOverlapping(pos.x, pos.y, size)) {
          const img = document.createElement('img');
          img.src = `stiker/st${i}.jpg`;
          img.className = 'sticker';
          img.alt = 'Stiker dekorasi';
          
          // Set size
          img.style.width = size + 'px';
          img.style.height = size + 'px';
          
          // Set position
          img.style.left = pos.x + 'px';
          img.style.top = pos.y + 'px';
          
          // Random animation with slight delay
          img.style.animationDelay = (random(0, 20) / 10) + 's';
          img.classList.add(animations[random(0, animations.length - 1)]);
          
          // Track position
          placedStickers.push({
            x: pos.x,
            y: pos.y,
            size: size
          });
          
          // Add to container with fade in
          stickerContainer.appendChild(img);
          requestAnimationFrame(() => img.classList.add('fade-in'));
          
          placed = true;
        }
        attempts++;
      }
    });
  }
  
  // Initial sticker batch
  createStickerBatch();
  
  // Set up rotation interval
  stickerRotationInterval = setInterval(createStickerBatch, 5000); // Rotate every 5 seconds
}


// Hide stickers
function hideStickers() {
  // Clear rotation interval if it exists
  if (stickerRotationInterval) {
    clearInterval(stickerRotationInterval);
    stickerRotationInterval = null;
  }
  
  // Fade out existing stickers
  const stickers = stickerContainer.querySelectorAll('.sticker');
  stickers.forEach(sticker => {
    sticker.classList.add('fade-out');
  });
  
  // Hide container and clear after fade
  setTimeout(() => {
    stickerContainer.style.display = 'none';
    stickerContainer.innerHTML = '';
  }, 500);
}

// Track current song and section
let currentSong = bgMusic && bgMusic.getAttribute("src") ? decodeURIComponent(bgMusic.getAttribute("src")) : null;
let currentSection = "birthdayLove"; // birthdayLove, letter, memorySelection, photos, us, video
let previousSection = null; // store previous section when entering memorySelection

// Function to show birthday love screen - used as direct redirect from letter
function showBirthdayLove() {
  currentSection = "birthdayLove";
  modal.style.display = "none";
  modalBody.innerHTML = "";
  // Hide stickers
  hideStickers();
  // Return to default song
  playMusic("music/disarankan di bandung .mp3");
}

// Function to show letter page with its own close handler
function showDearMyEndlessLove() {
  currentSection = "letter";
  modal.style.display = "flex";
  tampilSurat();
  
  // Set direct-to-home close handler specifically for letter page
  if (closeBtn) {
    // Remove any existing listeners first
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    // Get fresh reference after clone
    const freshCloseBtn = document.querySelector('.close');
    if (freshCloseBtn) {
      freshCloseBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showBirthdayLove();
      };
    }
  }
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

// Set default close handler for non-letter pages
if (closeBtn) {
  closeBtn.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle non-letter pages here since letter has its own handler
    if (currentSection === "memorySelection") {
      if (previousSection === "letter") {
        showDearMyEndlessLove();
      } else {
        showBirthdayLove();
      }
    } else if (currentSection !== "letter") {
      // For photos/us/video go to memory selection
      showMemorySelection();
    }
  };
}

function tampilMenu() {
  // remember where we came from so X on memory selection can return
  previousSection = currentSection;
  currentSection = "memorySelection";
  
  // Tampilkan kembali tombol close yang mungkin tersembunyi
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    const closeBtn = modalContent.querySelector('.close');
    if (closeBtn) closeBtn.style.display = '';
  }

  // Initialize stickers for memory selection page
  initStickers();
  
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
  if (modalContent) {
    modalContent.classList.add('surat');
    // Sembunyikan tombol close di halaman letter
    const closeBtn = modalContent.querySelector('.close');
    if (closeBtn) closeBtn.style.display = 'none';
  }

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
  
  // Hide stickers when leaving memory selection
  hideStickers();
  
  // Tampilkan kembali tombol close yang mungkin tersembunyi
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    const closeBtn = modalContent.querySelector('.close');
    if (closeBtn) closeBtn.style.display = '';
  }
  
  // Mainkan lagu sesuai tipe album
  ensureBgMusicSetup();
  if (tipe === 'kamu') {
    playMusic('music/ini abadi perunggu.mp3');
  } else {
    playMusic('music/abadi.mp3');
  }
  // Build a unified media list for 'kamu' (ft one): images 1..39, videos 40..51
  const mediaList = [];
  if (tipe === 'kamu') {
    const prefix = 'ft one/';
    for (let i = 1; i <= 39; i++) mediaList.push({ src: `${prefix}${i}.jpeg`, type: 'image' });
    for (let i = 40; i <= 51; i++) mediaList.push({ src: `${prefix}${i}.mp4`, type: 'video' });
  } else {
    // Fallback for 'kita' - keep original behavior (images only)
    const prefix = 'ft two/2.';
    for (let i = 1; i <= 50; i++) mediaList.push({ src: `${prefix}${i}.jpeg`, type: 'image' });
  }

  let index = 0;

  modalBody.innerHTML = `
  <h2 style="color:var(--accent);">${tipe === "kamu" ? "ur photo's " : "us 👩🏻‍❤️‍👨🏻"}</h2>
    <div class="album-content">
      <div class="foto-wrapper">
        <div class="loader-overlay" id="loaderOverlay">
          <div class="loader"></div>
        </div>
        <div id="mediaContainer"></div>
      </div>
      <div class="nav-buttons">
        <button class="nav-btn" id="prevBtn"> Back</button>
        <button class="nav-btn" id="nextBtn">Next </button>
      </div>
    </div>
  `;

  const mediaContainer = document.getElementById('mediaContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const loaderOverlay = document.getElementById('loaderOverlay');

  // Preload images (lightweight) and set video preload metadata
  const imgCache = [];
  mediaList.forEach((m, i) => {
    if (m.type === 'image') {
      const img = new Image(); img.src = m.src; imgCache[i] = img;
    } else if (m.type === 'video') {
      // create a short video element to preload metadata
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = m.src;
    }
  });

  function updateTombol() {
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === mediaList.length - 1 ? 'Selesai ❤️' : 'Next ';
  }

  // Helper to clear current media and insert new one with transitions
  let currentMediaEl = null;
  function showMedia() {
    const item = mediaList[index];
    if (!item) return;

    // If currently showing a video, pause it before switching
    if (currentMediaEl && currentMediaEl.tagName === 'VIDEO') {
      try { currentMediaEl.pause(); } catch (e) {}
    }

    // show loader and remove fade class
    loaderOverlay.classList.add('active');
    if (currentMediaEl) currentMediaEl.classList.remove('show');

    setTimeout(() => {
      // remove old element
      if (currentMediaEl && currentMediaEl.parentNode) currentMediaEl.parentNode.removeChild(currentMediaEl);

      if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = `Foto ${index + 1}`;
        img.className = 'fade media-main-item';
        img.onload = () => {
          loaderOverlay.classList.remove('active');
          mediaContainer.appendChild(img);
          requestAnimationFrame(() => img.classList.add('show'));
        };
        currentMediaEl = img;
      } else {
        const video = document.createElement('video');
        video.src = item.src;
        video.controls = true;
        video.autoplay = true;
        video.className = 'fade media-main-item';
        video.onloadeddata = () => {
          loaderOverlay.classList.remove('active');
          mediaContainer.appendChild(video);
          // attempt play; some browsers require user interaction
          const p = video.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
          requestAnimationFrame(() => video.classList.add('show'));
        };
        currentMediaEl = video;
      }
    }, 200);

    updateTombol();
  }

  nextBtn.addEventListener('click', () => {
    if (index < mediaList.length - 1) {
      // If current is video, pause it first
      if (currentMediaEl && currentMediaEl.tagName === 'VIDEO') {
        try { currentMediaEl.pause(); } catch (e) {}
      }
      index++;
      showMedia();
    } else {
      showMemorySelection();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (index > 0) {
      // If current is video, pause it first
      if (currentMediaEl && currentMediaEl.tagName === 'VIDEO') {
        try { currentMediaEl.pause(); } catch (e) {}
      }
      index--;
      showMedia();
    }
  });

  // show initial media
  showMedia();
}

// ================= VIDEO ==================
function tampilVideo() {
  currentSection = "video";
  
  // Hide stickers when leaving memory selection
  hideStickers();
  
  // Tampilkan kembali tombol close yang mungkin tersembunyi
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    const closeBtn = modalContent.querySelector('.close');
    if (closeBtn) closeBtn.style.display = '';
  }
  
  // Generate video list automatically (vt 1.mp4 sampai vt 17.mp4)
  const videos = Array.from({ length: 17 }, (_, i) => `vt/vt ${i + 1}.mp4`);
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
        <button class="nav-btn" id="prevBtn">Back</button>
        <button class="nav-btn" id="nextBtn">Next</button>
      </div>
    </div>
  `;

  const videoPlayer = document.getElementById("videoPlayer");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const loaderOverlay = document.getElementById("loaderOverlay");

  function updateTombolVideo() {
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === videos.length - 1 ? "Selesai ❤️" : "Next ";
  }

  function gantiVideo() {
    // Show loader immediately
    loaderOverlay.classList.add("active");
    videoPlayer.classList.remove("show");

    // Pause current video first
    try {
      videoPlayer.pause();
    } catch (e) {}

    // Switch video with transition
    setTimeout(() => {
      const newSrc = videos[index];
      videoPlayer.src = newSrc;

      // Handle video loading and play
      videoPlayer.onloadeddata = () => {
        loaderOverlay.classList.remove("active");
        const playPromise = videoPlayer.play();
        if (playPromise) {
          playPromise.catch(error => {
            console.log('Auto-play prevented:', error);
          });
        }
        requestAnimationFrame(() => videoPlayer.classList.add("show"));
      };

      // Handle loading error
      videoPlayer.onerror = () => {
        console.log('Error loading video:', videoPlayer.error);
        loaderOverlay.classList.remove("active");
      };
    }, 250); // Short delay for smooth transition

    updateTombolVideo();
  }

  nextBtn.addEventListener("click", () => {
    if (index < videos.length - 1) {
      // Pause current video before switching
      try {
        videoPlayer.pause();
      } catch (e) {}
      
      index++;
      gantiVideo();
    } else {
      // On last video, return to memory selection
      try {
        videoPlayer.pause();
      } catch (e) {}
      showMemorySelection();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (index > 0) {
      // Pause current video before switching
      try {
        videoPlayer.pause();
      } catch (e) {}
      
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