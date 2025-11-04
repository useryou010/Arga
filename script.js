// ================== script.js (updated sticker logic + helpers) ==================

// Inisialisasi elemen dan handler awal
const btnMulai = document.getElementById("btnMulai");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const modalBody = document.getElementById("modal-body");
const bgMusic = document.getElementById("bgMusic");

// Track current song and section
let currentSong = bgMusic && bgMusic.getAttribute("src") ? decodeURIComponent(bgMusic.getAttribute("src")) : null;
let currentSection = "birthdayLove"; // birthdayLove, letter, memorySelection, photos, us, video
let previousSection = null; // store previous section when entering memorySelection

// ===== Sticker container management (create if missing) =====
function ensureStickerContainer() {
  let container = document.getElementById("stickerContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "stickerContainer";
    // important: append as direct child of body so it's outside modal markup
    document.body.appendChild(container);
    // basic inline styles to make sure it's positioned correctly even before CSS loaded
    Object.assign(container.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: "5", // will sit below modal which we ensure to have higher z-index
      display: "none"
    });
  }
  return container;
}

// Hide stickers (called whenever leaving memory selection)
function hideStickers() {
  const container = document.getElementById("stickerContainer");
  if (container) {
    container.style.display = "none";
    container.innerHTML = "";
  }
  if (window.stickerBatchInterval) {
    clearInterval(window.stickerBatchInterval);
    window.stickerBatchInterval = null;
  }
}

// Ensure container exists on load so CSS can style it
ensureStickerContainer();

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

// Helper random int
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ================== TAMPIL MENU (Pilih Kenangan) ==================
function tampilMenu() {
  // remember where we came from so X on memory selection can return
  previousSection = currentSection;
  currentSection = "memorySelection";
  
  // Tampilkan kembali tombol close yang mungkin tersembunyi
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.classList.remove('surat'); // Remove letter-specific class
    const closeBtn = modalContent.querySelector('.close');
    if (closeBtn) closeBtn.style.display = '';
    // make sure modal-content has higher z-index than stickers
    modalContent.style.zIndex = 20;
  }
  
  // Make sure modal is visible
  modal.style.display = "flex";

  modalBody.innerHTML = `
    <h2 style="color:var(--accent);">Pilih Kenangan</h2>
    <button class="album-btn" onclick="bukaAlbum('kamu')">ur photo's </button>
    <button class="album-btn" onclick="bukaAlbum('kita')">us 👩🏻‍❤️‍👨🏻</button>
    <button class="album-btn" onclick="tampilVideo()">w memo 🎥</button>
  `;

  // Setup and show sticker batch (outside modal)
  const stickerContainer = ensureStickerContainer();
  if (stickerContainer) {
    // clear any previous interval and content
    if (window.stickerBatchInterval) clearInterval(window.stickerBatchInterval);
    stickerContainer.innerHTML = '';
    stickerContainer.style.display = 'block';      // show container
    stickerContainer.style.zIndex = '5';           // below modal (.modal-content zIndex set to 20 above)
    stickerContainer.style.pointerEvents = 'none'; // not interactive

    const modalRect = document.querySelector('.modal-content').getBoundingClientRect();
    // We'll treat modal area as forbidden rectangle
    const modalLeft = modalRect.left;
    const modalTop = modalRect.top;
    const modalRight = modalRect.right;
    const modalBottom = modalRect.bottom;
    const stickerCount = 21;
    const minSize = 60, maxSize = 90; // user wants clear stickers -> slightly bigger
    const batchMin = 5, batchMax = 8;
    const minSpacing = 100; // minimal pixel distance between centers to avoid overlap

    // Checks if candidate sticker overlaps modal or other stickers in this batch
    function isOverModalOrOthers(x, y, size, placedPositions) {
      // modal overlap
      if (x + size > modalLeft && x < modalRight && y + size > modalTop && y < modalBottom) return true;
      // check against others in placedPositions (array of {x,y,size})
      for (const p of placedPositions) {
        const dx = (x + size/2) - (p.x + p.size/2);
        const dy = (y + size/2) - (p.y + p.size/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minSpacing) return true;
      }
      return false;
    }

    // Helper function to generate non-overlapping positions
    function generateNonOverlappingPosition(existingPositions, zone, size) {
      const minSpacing = 80; // minimal spacing between stickers
      const containerRect = document.querySelector('.container').getBoundingClientRect();
      const safeZoneY = 100; // vertical safe zone around container
      
      // Define zones
      const zones = {
        top: {
          x: [8, window.innerWidth - size - 8],
          y: [8, modalTop - size - 8]
        },
        bottom: {
          x: [8, window.innerWidth - size - 8],
          y: [modalBottom + 8, window.innerHeight - size - 8]
        }
      };

      const currentZone = zones[zone];
      let tries = 0;
      let position;

      do {
        position = {
          x: randomInt(currentZone.x[0], currentZone.x[1]),
          y: randomInt(currentZone.y[0], currentZone.y[1])
        };

        // Skip if too close to container
        if (Math.abs(position.y - containerRect.top) < safeZoneY || 
            Math.abs(position.y - containerRect.bottom) < safeZoneY) {
          continue;
        }

        // Check overlap with existing stickers
        let hasOverlap = false;
        for (const existing of existingPositions) {
          const dx = Math.abs(position.x - existing.x);
          const dy = Math.abs(position.y - existing.y);
          if (dx < minSpacing && dy < minSpacing) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap) return position;
        tries++;
      } while (tries < 30);

      // If we failed to find non-overlapping position, try another area
      return {
        x: randomInt(currentZone.x[0], currentZone.x[1]),
        y: randomInt(currentZone.y[0], currentZone.y[1])
      };
    }

    // Generate a batch of 10 stickers: 5 top, 5 bottom
    let used = []; // indexes used already in previous batches
    function showStickerBatch() {
      stickerContainer.innerHTML = '';
      
      // Compute available pool
      let available = Array.from({length: stickerCount}, (_, i) => i + 1)
        .filter(i => !used.includes(i));
      if (available.length < 10) {
        used = [];
        available = Array.from({length: stickerCount}, (_, i) => i + 1);
      }
      
      // Pick exactly 10 stickers randomly
      const batch = [];
      for (let k = 0; k < 10; k++) {
        const idx = randomInt(0, available.length - 1);
        batch.push(available[idx]);
        used.push(available[idx]);
        available.splice(idx, 1);
      }

      const placed = []; // track all placed positions

      function createSticker(index, zone) {
        const size = randomInt(minSize, maxSize);
        const pos = generateNonOverlappingPosition(placed, zone, size);
        placed.push({ x: pos.x, y: pos.y, size });

        const img = document.createElement('img');
        img.src = `stiker/st${batch[index]}.jpg`;
        img.className = 'sticker sticker-visible';
        img.style.width = size + 'px';
        img.style.height = 'auto';
        img.style.left = pos.x + 'px';
        img.style.top = pos.y + 'px';
        img.style.opacity = '1';
        img.style.filter = 'brightness(1.15) saturate(1.15)';
        img.style.pointerEvents = 'none';
        img.style.zIndex = '6';
        
        const anims = ['sticker-float', 'sticker-rotate', 'sticker-pulse'];
        img.classList.add(anims[randomInt(0, anims.length - 1)]);
        return img;
      }

      // Create 5 top stickers
      for (let i = 0; i < 5; i++) {
        const sticker = createSticker(i, 'top');
        stickerContainer.appendChild(sticker);
      }

      // Create 5 bottom stickers
      for (let i = 5; i < 10; i++) {
        const sticker = createSticker(i, 'bottom');
        stickerContainer.appendChild(sticker);
      }
    }

    // initial draw & start interval
    showStickerBatch();
    window.stickerBatchInterval = setInterval(showStickerBatch, 5000);
  }
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

  modalBody.innerHTML = 
  '<style> .surat-content { width: 100%; text-align: left; padding: 0 18px; box-sizing: border-box; } .envelope { width: 100%; display:flex; justify-content:center; align-items:center; } .letter { width: 92%; max-width: 520px; background: linear-gradient(180deg,#111 0%, #0b0b0b 100%); border-radius: 12px; border: 2px solid rgba(var(--accent-rgba), 0.12); padding: 28px 24px; box-shadow: 0 0 20px rgba(var(--accent-rgba), 0.06); } .letter h3 { color: var(--accent); margin: 0 0 25px 0; text-align: center; font-size: 1.4em; text-shadow: 0 0 10px rgba(var(--accent-rgba), 0.28); } .letter p { color: #fff; line-height: 1.7; margin: 0 0 15px 0; text-align: left; font-size: 1em; word-spacing: normal; } .letter p:last-of-type { margin-bottom: 20px; } .surat-anim { animation: floatIn 0.6s ease both; } @keyframes floatIn { from { transform: translateY(18px); opacity:0 } to { transform: translateY(0); opacity:1 } } .lanjut-btn { margin: 10px 0; } </style> <div class="surat-content"> <div class="envelope"> <div class="letter surat-anim"> <h3>dear my endless love... 💝</h3> <p>so sorry for my fault, n u know im not perfect actually kinda i hate myself, a lott a time. and I chose u because u determine the color in my life.</p> <p>mungkin aku tidak sesempurna itu dan aku tidak bisa selalu membahagiakan semua orang, perlu kamu ketahui aku akan mengusahakan apapun untukmu.</p> <p>selamat ulang tahun kiya! I hope ur find a much better place to grow, and may good things come ur way in the coming year. I will always love u.</p> <p>aku berharap di kehidupan lain kita selalu bersama, dan kita berbahagia di versi kiya yang tidak mengenal arga dan arga yang tidak mengenal kiya.</p> <p>penuh runtutan memori, hal hal fana didunia ini. yang artinya memang hidup ialah sekumpulan masalah yang diselingi oleh kebahagiaan, namun hidupku adalah sekumpulan masalah yang diselingi oleh dirimu.</p> <p>berbahagialah kiya! jika kita tidak bersama setidaknya aku pernah mengukir kisah di hidupmu, dan semoga semua hal bahagia yang kita lalui selalu ada dalam benakmu.</p> <p>jikalau nanti aku pinjam nama depan atau tengahmu boleh ya? aku berharap anakku dapat memberi semua orang kebahagiaan sama seperti dirimu. dan aku mengingat kembali dimana hidupku yang berwarna diciptakan semasa sma bersamamu, i always loving u my endless love.</p> <p>selamat berkelana nona manis, maaf jika memang tuntutanku membuatmu pergi, namun aku tidak ingin sesak dengan rasa sakit. dan mungkin benar menurutmu, inilah jalan yang kamu pilih dan aku tidak harus selalu membiru pada keadaan ini, akupun harus menentukan jalan hidupku. yang dimana setiap langkah, setiap usaha, setiap doa, dan setiap runtayan yang ada di hidupku dihiasi olehmu, aku selalu berharap kita bisa bersama. namun memang tidak bisa mungkin di kehidupan kedua aku menjadi arga yang lebih baik, semoga aku tidak keras kepala ya di kehidupan kedua.</p> <p>aku tidak akan kemana mana, aku selalu mencarimu entah itu di setiap pencapaianku, bahkan di sela retak hidupku aku akan mencarimu. maaf atas segala kesalahan dan segala tuntutan yang aku perbuat, semoga kamu bertemu hal yang lebih baik, dan aku akan tetap disini sebagai aga yang selalu kamu cintai.</p> <p>biarkan semua kisah ini kekal bersama rasa yang belum sirna.</p> <p>dan untungnya aku bertemu denganmu di sela sempit hidup ini, beribu maaf kusampaikan pada pesan ini dan berjuta cinta dan rasa yang aku cantumkan pada surat ini menjadi penanda bertumbuhnya seorang bidadari.</p> <p>aku ingin mengatakan pada hawa bahwa aku rindu pada seorang kaum nya yang diciptakan sesempurna mungkin oleh sang pencipta, dan diturunkan kebumi melalui rahim ibunya yang kuat beserta cinta ayahnya yang abadi.</p> <p>selamat ulang tahun kiya, i always loving u.</p> <div style="text-align:center;"> <button class="btn lanjut-btn" id="lanjutBtn">Lanjut ➜</button> </div> </div> </div> </div>';

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
// (fungsi bukaAlbum tetap sama seperti kode lo sebelumnya; pastikan hideStickers dipanggil di awal)
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
  // Gabungkan semua media ke satu array: 1-39 foto, 40-51 video
  let mediaList = [];
  if (tipe === 'kamu') {
    for (let i = 1; i <= 39; i++) {
      mediaList.push({ src: `ft one/${i}.jpeg`, type: 'image' });
    }
    for (let i = 40; i <= 51; i++) {
      mediaList.push({ src: `ft one/${i}.mp4`, type: 'video' });
    }
  } else {
    // Fallback for 'kita' - tetap hanya gambar
    for (let i = 1; i <= 50; i++) {
      mediaList.push({ src: `ft two/2.${i}.jpeg`, type: 'image' });
    }
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
      // Preload video metadata only
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

    // Jika sedang video, pause sebelum ganti
    if (currentMediaEl && currentMediaEl.tagName === 'VIDEO') {
      try { currentMediaEl.pause(); } catch (e) {}
    }

    // show loader dan hilangkan efek fade
    loaderOverlay.classList.add('active');
    if (currentMediaEl) currentMediaEl.classList.remove('show');

    setTimeout(() => {
      // Hapus media lama
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
      } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.src;
        video.controls = true;
        video.autoplay = true;
        video.className = 'fade media-main-item';
        video.onloadeddata = () => {
          loaderOverlay.classList.remove('active');
          mediaContainer.appendChild(video);
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
function ensureBgMusicSetup() {
  if (!bgMusic) return;
  try {
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.preload = "auto";
  } catch (e) {}
}

function playBgMusic() {
  if (!bgMusic) return;
  if (!bgMusic.paused && !bgMusic.ended) return;
  const playPromise = bgMusic.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise.catch(() => {});
  }
}

function gantiLagu(src) {
  if (!bgMusic) return;
  try {
    if (currentSong === src) {
      playBgMusic();
      return;
    }
    currentSong = src;
    bgMusic.src = encodeURI(src);
    bgMusic.load();
    const p = bgMusic.play();
    if (p && typeof p.then === 'function') p.catch(() => {});
  } catch (e) {}
}

ensureBgMusicSetup();

document.addEventListener("click", function _tryPlayBgOnce() {
  playBgMusic();
  document.removeEventListener("click", _tryPlayBgOnce);
}, { capture: true, passive: true });
