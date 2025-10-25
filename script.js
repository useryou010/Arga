const btnMulai = document.getElementById("btnMulai");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const modalBody = document.getElementById("modal-body");

btnMulai.addEventListener("click", () => {
  modal.style.display = "flex";
  tampilMenu();
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  modalBody.innerHTML = "";
});

function tampilMenu() {
  modalBody.innerHTML = `
    <h2 style="color:gold;">Pilih Kenangan</h2>
    <button class="album-btn" onclick="bukaAlbum('kamu')">Foto Kamu 💛</button>
    <button class="album-btn" onclick="bukaAlbum('kita')">Foto Kita 🤍</button>
    <button class="album-btn" onclick="tampilVideo()">Video Kenangan 🎥</button>
  `;
}

// ================= FOTO ==================
function bukaAlbum(tipe) {
  const totalFoto = tipe === "kamu" ? 28 : 41;
  const prefix = tipe === "kamu" ? "ft one/" : "ft two/2.";

  const fotoList = [];
  for (let i = 1; i <= totalFoto; i++) {
    fotoList.push(`${prefix}${i}.jpeg`);
  }

  let index = 0;

  modalBody.innerHTML = `
    <h2 style="color:gold;">${tipe === "kamu" ? "Foto Kamu 💛" : "Foto Kita 🤍"}</h2>
    <div class="album-content">
      <img id="gambar" class="fade show" src="${fotoList[index]}" alt="Foto">
      <div class="nav-buttons">
        <button class="nav-btn" id="prevBtn">⮜ Back</button>
        <button class="nav-btn" id="nextBtn">Next ⮞</button>
      </div>
    </div>
  `;

  const gambar = document.getElementById("gambar");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Preload semua foto agar perpindahan cepat
  fotoList.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  function updateTombol() {
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === fotoList.length - 1 ? "Selesai ❤️" : "Next ⮞";
  }

  function tampilFoto() {
    gambar.classList.remove("show");
    gambar.classList.add("fade");
    const newSrc = fotoList[index];

    const imgTemp = new Image();
    imgTemp.src = newSrc;
    imgTemp.onload = () => {
      gambar.src = newSrc;
      requestAnimationFrame(() => {
        gambar.classList.add("show");
      });
    };

    updateTombol();
  }

  nextBtn.addEventListener("click", () => {
    if (index < fotoList.length - 1) {
      index++;
      tampilFoto();
    } else {
      tampilMenu();
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
  const videos = ["vt/vt 1.mp4", "vt/vt 2.mp4"];
  let index = 0;

  modalBody.innerHTML = `
    <h2 style="color:gold;">Video Kenangan 🎥</h2>
    <div class="album-content">
      <video id="videoPlayer" class="fade show" src="${videos[index]}" controls autoplay></video>
      <div class="nav-buttons">
        <button class="nav-btn" id="prevVideo">⮜ Back</button>
        <button class="nav-btn" id="nextVideo">Next ⮞</button>
      </div>
    </div>
  `;

  const videoPlayer = document.getElementById("videoPlayer");
  const prevVideo = document.getElementById("prevVideo");
  const nextVideo = document.getElementById("nextVideo");

  function updateTombolVideo() {
    prevVideo.disabled = index === 0;
    nextVideo.textContent = index === videos.length - 1 ? "Selesai ❤️" : "Next ⮞";
  }

  function gantiVideo() {
    videoPlayer.classList.remove("show");
    videoPlayer.classList.add("fade");

    const newSrc = videos[index];
    videoPlayer.src = newSrc;

    videoPlayer.onloadeddata = () => {
      videoPlayer.play();
      requestAnimationFrame(() => {
        videoPlayer.classList.add("show");
      });
    };

    updateTombolVideo();
  }

  nextVideo.addEventListener("click", () => {
    if (index < videos.length - 1) {
      index++;
      gantiVideo();
    } else {
      tampilMenu();
    }
  });

  prevVideo.addEventListener("click", () => {
    if (index > 0) {
      index--;
      gantiVideo();
    }
  });

  updateTombolVideo();
}