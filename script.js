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
      display: "none",
      transition: "opacity 0.4s ease"
    });
    // Add custom style for fade-out animation
    const style = document.createElement('style');
    style.textContent = '.fade-out { opacity: 0 !important; }';
    document.head.appendChild(style);
  }
  return container;
}

// Hide stickers (called whenever leaving memory selection)
function hideStickers() {
  // Handle main sticker container
  const container = document.getElementById("stickerContainer");
  if (container) {
    container.classList.add('fade-out');
    setTimeout(() => {
      container.style.display = "none";
      container.innerHTML = "";
      container.classList.remove('fade-out');
    }, 400);
  }

  // Handle side sticker container separately
  const sideContainer = document.getElementById("sideStickerContainer");
  if (sideContainer) {
    // Fade out the side stickers
    const leftSticker = document.getElementById("sideStickerLeft");
    const rightSticker = document.getElementById("sideStickerRight");
    if (leftSticker) leftSticker.style.opacity = "0";
    if (rightSticker) rightSticker.style.opacity = "0";
    
    // Remove after fade out
    setTimeout(() => {
      sideContainer.remove();
    }, 600); // Slightly longer to ensure smooth fade out
  }
  // remove any resize handler used for responsive sticker layout
  if (window._stickerResizeHandler) {
    try { window.removeEventListener('resize', window._stickerResizeHandler); } catch (e) {}
    window._stickerResizeHandler = null;
  }
  if (window._stickerResizeTimer) { clearTimeout(window._stickerResizeTimer); window._stickerResizeTimer = null; }

  if (window.stickerBatchInterval) {
    clearInterval(window.stickerBatchInterval);
    window.stickerBatchInterval = null;
  }

  // Clear side sticker interval if it exists
  if (window.sideStickerInterval) {
    clearInterval(window.sideStickerInterval);
    window.sideStickerInterval = null;
  }

}

// Ensure container exists on load so CSS can style it
ensureStickerContainer();

// Track sticker usage globally
const usedStickers = {
  available: [], // Available sticker indices
  exclude: [], // No excluded stickers - all can be used
  reset() {
    this.available = Array.from(
      { length: 21 }, 
      (_, i) => i + 1
    ).filter(i => !this.exclude.includes(i));
    this.shuffle(this.available);
  },
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },
  getNext(count) {
    if (this.available.length < count) {
      this.reset();
    }
    return this.available.splice(0, count);
  }
};

// Initialize sticker pool
if (!window.stickerPool) {
  usedStickers.reset();
}

// Reusable sticker renderer. Call with 'birthdayLove' or 'memorySelection'
function renderStickers(section) {
  const stickerContainer = ensureStickerContainer();
  if (!stickerContainer) return;

  // clear previous interval
  if (window.stickerBatchInterval) {
    clearInterval(window.stickerBatchInterval);
    window.stickerBatchInterval = null;
  }

  stickerContainer.innerHTML = '';
  stickerContainer.style.display = 'block';
  stickerContainer.style.pointerEvents = 'none';
  // container should be above background but below modal
  stickerContainer.style.zIndex = '2000';

  // Container setup is done, rest of the function continues...

  // Responsive sizing and spacing based on viewport
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  const isMobile = vw <= 480;
  const isTablet = vw > 480 && vw <= 900;

  const minSize = isMobile ? 44 : isTablet ? 52 : 60;
  const maxSize = isMobile ? 64 : isTablet ? 76 : 90;
  // Reduce sticker count based on section
  const mainStickerCount = section === 'birthdayLove' ? 4 : 6; // 2 top + 2 bottom for birthday, 3+3 for memory
  // Minimal center distance scales down on smaller screens
  const minSpacing = isMobile ? 56 : isTablet ? 80 : 100;

  function getForbiddenRect() {
    const modalEl = document.getElementById('modal');
    const modalContent = document.querySelector('.modal-content');
    // If modal is visible (display not 'none'), avoid modal-content area
    try {
      if (modalEl && window.getComputedStyle(modalEl).display !== 'none' && modalContent) {
        return modalContent.getBoundingClientRect();
      }
    } catch (e) {}
    // Otherwise avoid the main centered container on the page (birthday screen)
    const mainContainer = document.querySelector('.container');
    if (mainContainer) return mainContainer.getBoundingClientRect();
    return null;
  }

  function overlapsForbidden(x, y, size, forbidden) {
    if (!forbidden) return false;
    return x + size > forbidden.left && x < forbidden.right && y + size > forbidden.top && y < forbidden.bottom;
  }

  function tooClose(x, y, size, placed, minDist) {
    for (const p of placed) {
      const dx = x + size / 2 - (p.x + p.size / 2);
      const dy = y + size / 2 - (p.y + p.size / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) return true;
    }
    return false;
  }

  function makeStickerElement(idx, x, y, size) {
    const el = document.createElement('img');
    el.className = 'sticker fade-in';
    el.style.position = 'absolute';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.dataset.animation = String(randomInt(1, 5));
    // Use specific file names st1.jpg .. st21.jpg
    el.src = `stiker/st${idx}.jpg`;
    // Ensure visible & clear
    el.style.opacity = '1';
    el.style.filter = 'none';
    // Stickers should sit above background but under modal
    el.style.zIndex = '2001';
    el.style.transform = `rotate(${randomInt(-12, 12)}deg)`;
    const anims = ['float', 'swing', 'bounce', 'drift'];
    el.classList.add(anims[randomInt(0, anims.length - 1)]);
    return el;
  }

  function drawBatch() {
    stickerContainer.innerHTML = '';
    const forbidden = getForbiddenRect();
    const placed = [];

    // Get next batch of unique stickers
    const stickerIndices = usedStickers.getNext(mainStickerCount);
    
  for (let k = 0; k < mainStickerCount; k++) {
  const idx = stickerIndices[k];
  const zone = k < mainStickerCount / 2 ? 'top' : 'bottom';
  const size = randomInt(minSize, maxSize);
      
      // For birthday love page with 4 stickers, ensure better horizontal distribution
      const isLeft = k === 0 || k === 2; // First of each pair goes left
      const horizontalBias = section === 'birthdayLove' ? 
        (isLeft ? '25%' : '75%') : // Force left/right distribution for birthday
        null; // Keep random for memory selection
      let tries = 0;
      let pos = null;

      while (tries < 200) {
        let x;
        // On narrow screens distribute evenly across width to avoid collisions
        const nPerZone = Math.max(1, Math.floor(mainStickerCount / 2));
        const posIndex = k < nPerZone ? k : k - nPerZone;
        if (isMobile) {
          // Even columns with small jitter
          const colWidth = Math.max(1, Math.floor(vw / nPerZone));
          x = Math.floor((posIndex + 0.5) * colWidth) - Math.floor(size / 2) + randomInt(-12, 12);
          x = Math.max(6, Math.min(vw - size - 6, x));
        } else if (horizontalBias) {
          const baseX = Math.floor(vw * (horizontalBias === '25%' ? 0.25 : 0.75));
          x = baseX - (size / 2) + randomInt(-50, 50);
          x = Math.max(8, Math.min(vw - size - 8, x));
        } else {
          x = randomInt(8, Math.max(8, vw - size - 8));
        }

        let y;
        const forbidden = getForbiddenRect();
        if (zone === 'top') {
          // top area: use relative ranges on small screens to keep stickers away from modal
          const extraForbidden = (section === 'birthdayLove' && isMobile) ? 48 : 8;
          const topLimit = forbidden && (forbidden.top > 8) ? Math.max(8, Math.floor(forbidden.top - size - extraForbidden)) : Math.max(8, Math.floor(vh * 0.36) - size - extraForbidden);
          if (topLimit < 8) { y = 8; } else { y = randomInt(8, topLimit); }
        } else {
          const extraForbidden = (section === 'birthdayLove' && isMobile) ? 48 : 8;
          const bottomStart = forbidden && (forbidden.bottom < vh) ? Math.min(vh - size - extraForbidden, Math.floor(forbidden.bottom + extraForbidden)) : Math.floor(vh * 0.64) + extraForbidden;
          const bottomMax = Math.max(bottomStart, vh - size - extraForbidden);
          if (bottomStart > bottomMax) { y = bottomMax; } else { y = randomInt(bottomStart, bottomMax); }
        }

        if (!overlapsForbidden(x, y, size, forbidden) && !tooClose(x, y, size, placed, minSpacing)) {
          pos = { x, y, size };
          break;
        }
        tries++;
      }

      if (!pos) {
        // fallback placement if too crowded
        pos = { x: 8 + (k * 12) % (window.innerWidth - maxSize - 16), y: 8 + (k * 18) % (window.innerHeight - maxSize - 16), size };
        // ensure it's not overlapping forbidden: nudge if needed
        if (overlapsForbidden(pos.x, pos.y, pos.size, forbidden)) {
          pos.y = forbidden.bottom + 12;
          if (pos.y + pos.size > window.innerHeight) pos.y = window.innerHeight - pos.size - 8;
        }
      }

      placed.push(pos);
      const el = makeStickerElement(idx, pos.x, pos.y, pos.size);
      stickerContainer.appendChild(el);
    }
  }

  // initial draw & periodic redraw
  drawBatch();
  window.stickerBatchInterval = setInterval(drawBatch, 5000);
  // Add resize handler to redraw with debounce so stickers reflow on orientation/size changes
  if (window._stickerResizeHandler) {
    window.removeEventListener('resize', window._stickerResizeHandler);
    window._stickerResizeHandler = null;
  }
  window._stickerResizeHandler = function () {
    if (window._stickerResizeTimer) clearTimeout(window._stickerResizeTimer);
    window._stickerResizeTimer = setTimeout(() => {
      try { drawBatch(); } catch (e) {}
      // adjust side stickers too (they hide on narrow screens)
      if (section === 'birthdayLove') showSideStickers();
    }, 160);
  };
  window.addEventListener('resize', window._stickerResizeHandler);
}

  // Helper function to show fixed side stickers on birthday screen
  function showSideStickers() {
    // Only show side stickers when we're on the birthday screen
    if (typeof currentSection !== 'undefined' && currentSection !== 'birthdayLove') {
      const existing = document.getElementById('sideStickerContainer');
      if (existing) existing.remove();
      if (window.sideStickerInterval) {
        clearInterval(window.sideStickerInterval);
        window.sideStickerInterval = null;
      }
      return null;
    }
      // Responsiveness: hide side stickers on very narrow screens (mobile)
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      if (vw <= 480) {
        const existing = document.getElementById('sideStickerContainer');
        if (existing) existing.remove();
        if (window.sideStickerInterval) {
          clearInterval(window.sideStickerInterval);
          window.sideStickerInterval = null;
        }
        return null;
      }
    // Create a dedicated container for side stickers if it doesn't exist
    let sideContainer = document.getElementById("sideStickerContainer");
    if (!sideContainer) {
      sideContainer = document.createElement("div");
      sideContainer.id = "sideStickerContainer";
      Object.assign(sideContainer.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: "2001"
      });
      document.body.appendChild(sideContainer);
    }
    
    // Clear any existing side stickers
    const leftSticker = document.getElementById("sideStickerLeft");
    const rightSticker = document.getElementById("sideStickerRight");
    if (leftSticker) leftSticker.remove();
    if (rightSticker) rightSticker.remove();

    // Base styles untuk kedua stiker
    // Adjust side sticker size by viewport
    const isTablet = vw > 480 && vw <= 900;
    const sideSize = isTablet ? 68 : 85;
    const baseStyles = {
      position: "fixed",
      width: `${sideSize}px`,
      height: `${sideSize}px`,
      top: "45%", // Align with text vertically
      transform: "translateY(-50%)", // Center the stickers precisely
      opacity: "0",
      transition: "opacity 0.6s ease-out, transform 0.3s ease-out",
      pointerEvents: "none",
      willChange: "transform"
    };

    // Initialize side sticker pool if not exists
    if (!window.sideStickerPool) {
      window.sideStickerPool = Array.from({ length: 21 }, (_, i) => i + 1);
    }
    
    // Get random indices for side stickers
    const randomIndex1 = Math.floor(Math.random() * window.sideStickerPool.length);
    const randomIndex2 = Math.floor(Math.random() * window.sideStickerPool.length);
    
    // Create and position fixed side stickers
    const left = document.createElement("img");
    left.src = `stiker/st${window.sideStickerPool[randomIndex1]}.jpg`; // Dynamic left sticker
    left.id = "sideStickerLeft";
    left.className = "sticker side-sticker float";
    Object.assign(left.style, {
      ...baseStyles,
      left: "10%",
      transform: "translateY(-50%) scale(0.9) rotate(-5deg)"
    });

    const right = document.createElement("img");
    right.src = `stiker/st${window.sideStickerPool[randomIndex2]}.jpg`; // Dynamic right sticker
    right.id = "sideStickerRight";
    right.className = "sticker side-sticker drift";
    Object.assign(right.style, {
      ...baseStyles,
      right: "10%",
      transform: "translateY(-50%) scale(0.9) rotate(5deg)"
    });

    // Add to dedicated container
    sideContainer.appendChild(left);
    sideContainer.appendChild(right);

    // Trigger fade in animation with slight delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        left.style.opacity = "1";
        right.style.opacity = "1";
      }, 100);
    });

    // Return the container for cleanup
    return sideContainer;
  }

  // Helper to show stickers only on allowed sections (birthdayLove, memorySelection)
  function showStickers(section) {
    // No stickers at all for letter page
    if (section === 'letter') {
      hideStickers();
      const sideContainer = document.getElementById("sideStickerContainer");
      if (sideContainer) sideContainer.remove();
      return;
    }
    
    if (section === 'birthdayLove') {
      renderStickers(section);
      // Add and update side stickers only on birthday screen
      // clear any existing interval first to avoid duplicates
      if (window.sideStickerInterval) {
        clearInterval(window.sideStickerInterval);
        window.sideStickerInterval = null;
      }
      showSideStickers();
      // Update side stickers periodically only on birthday screen
      window.sideStickerInterval = setInterval(() => {
        // guard inside showSideStickers prevents running when section changed
        showSideStickers();
      }, 5000);
    } else if (section === 'memorySelection') {
      // For memory selection, ONLY show random stickers
      renderStickers(section);
      // Ensure side stickers are hidden
      const sideContainer = document.getElementById("sideStickerContainer");
      if (sideContainer) {
        sideContainer.remove();
      }
      if (window.sideStickerInterval) {
        clearInterval(window.sideStickerInterval);
        window.sideStickerInterval = null;
      }
    } else {
      hideStickers();
    }
  }

  // If we start on the birthday screen, show stickers immediately
  if (typeof currentSection !== 'undefined' && currentSection === 'birthdayLove') {
    // small timeout to ensure layout settled
    setTimeout(() => showStickers('birthdayLove'), 80);
  }

// Function to show birthday love screen - used as direct redirect from letter
function showBirthdayLove() {
  currentSection = "birthdayLove";
  modal.style.display = "none";
  modalBody.innerHTML = "";
  // Show stickers for birthday screen using visibility manager
  showStickers('birthdayLove');
  // Return to default song
  playMusic("music/disarankan di bandung .mp3");
}

// Function to show letter page with its own close handler
function showDearMyEndlessLove() {
  currentSection = "letter";
  modal.style.display = "flex";
  
  // Ensure all stickers are hidden before showing letter
  hideStickers();
  const sideContainer = document.getElementById("sideStickerContainer");
  if (sideContainer) sideContainer.remove();
  if (window.sideStickerInterval) {
    clearInterval(window.sideStickerInterval);
    window.sideStickerInterval = null;
  }
  
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
  // Show stickers for memory selection
  showStickers('memorySelection');
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
  
  // Ensure any side stickers and their interval are cleaned up before showing menu
  const sideContainer = document.getElementById("sideStickerContainer");
  if (sideContainer) sideContainer.remove();
  if (window.sideStickerInterval) {
    clearInterval(window.sideStickerInterval);
    window.sideStickerInterval = null;
  }

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
  // show stickers for memory selection (reuse renderer)
  renderStickers('memorySelection');
}

// ---------------- SURAT (halaman pembuka) ----------------
function tampilSurat() {
  // Ensure NO stickers are visible on letter page
  hideStickers();
  const sideContainer = document.getElementById("sideStickerContainer");
  if (sideContainer) sideContainer.remove();
  if (window.sideStickerInterval) {
    clearInterval(window.sideStickerInterval);
    window.sideStickerInterval = null;
  }
  if (window.stickerBatchInterval) {
    clearInterval(window.stickerBatchInterval);
    window.stickerBatchInterval = null;
  }
  
  // Tambahkan class surat ke modal-content untuk scrolling
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.classList.add('surat');
    // Sembunyikan tombol close di halaman letter
    const closeBtn = modalContent.querySelector('.close');
    if (closeBtn) closeBtn.style.display = 'none';
  }

  modalBody.innerHTML = 
    `<style>
    .surat-content { width: 100%; text-align: left; padding: 0 18px; box-sizing: border-box; }
    .envelope { width: 100%; display:flex; justify-content:center; align-items:center; }
    .letter { width: 92%; max-width: 520px; background: linear-gradient(180deg,#111 0%, #0b0b0b 100%); border-radius: 12px; border: 2px solid rgba(var(--accent-rgba), 0.12); padding: 28px 24px; box-shadow: 0 0 20px rgba(var(--accent-rgba), 0.06); }
    /* Title: force single-line on small screens and scale responsively */
    .letter h3 { color: var(--accent); margin: 0 0 18px 0; text-align: center; font-size: clamp(1.1rem, 4.5vw, 1.6rem); text-shadow: 0 0 10px rgba(var(--accent-rgba), 0.28); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Paragraphs: scale down on small screens so body text fits nicely */
    .letter p { color: #fff; line-height: 1.7; margin: 0 0 14px 0; text-align: left; font-size: clamp(0.95rem, 3.6vw, 1.02rem); word-spacing: normal; }
    .letter p:last-of-type { margin-bottom: 20px; }
    .surat-anim { animation: floatIn 0.6s ease both; }
    @keyframes floatIn { from { transform: translateY(18px); opacity:0 } to { transform: translateY(0); opacity:1 } }
    .lanjut-btn { margin: 10px 0; }
    /* Extra tweak for very narrow phones: reduce letter padding and allow title to shrink slightly */
    @media (max-width: 420px) {
      .letter { padding: 20px 16px; }
      .letter h3 { font-size: clamp(1rem, 5.6vw, 1.4rem); }
      .letter p { font-size: clamp(0.9rem, 4.2vw, 1rem); }
    }
  </style>
  <div class="surat-content"> <div class="envelope"> <div class="letter surat-anim"> <h3>dear my endless love... 💝</h3>
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
    <div style="text-align:center;"> <button class="btn lanjut-btn" id="lanjutBtn">Lanjut ➜</button> </div>
  </div> </div> </div>`;

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
