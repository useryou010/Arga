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
      <img id="gambar" src="${fotoList[index]}" alt="Foto">
      <div class="nav-buttons">
        <button class="nav-btn back" id="prevBtn">Back</button>
        <button class="nav-btn next" id="nextBtn">Next</button>
      </div>
    </div>
  `;

  const gambar = document.getElementById("gambar");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  function updateTombol() {
    prevBtn.disabled = index === 0;

    if (index === fotoList.length - 1) {
      nextBtn.innerHTML = `Selesai ❤️`; // tanpa panah
    } else {
      nextBtn.innerHTML = `Next ▶`; // dengan panah
    }
  }

  function tampilFoto() {
    gambar.style.opacity = 0;
    setTimeout(() => {
      gambar.src = fotoList[index];
      gambar.onload = () => {
        gambar.style.opacity = 1;
      };
      updateTombol();
    }, 100);
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
      <video id="videoPlayer" src="${videos[index]}" controls autoplay></video>
      <div class="nav-buttons">
        <button class="nav-btn back" id="prevVideo">Back</button>
        <button class="nav-btn next" id="nextVideo">Next</button>
      </div>
    </div>
  `;

  const videoPlayer = document.getElementById("videoPlayer");
  const prevVideo = document.getElementById("prevVideo");
  const nextVideo = document.getElementById("nextVideo");

  function updateTombolVideo() {
    prevVideo.disabled = index === 0;

    if (index === videos.length - 1) {
      nextVideo.innerHTML = `Selesai ❤️`;
    } else {
      nextVideo.innerHTML = `Next ▶`;
    }
  }

  function gantiVideo() {
    videoPlayer.style.opacity = 0;
    setTimeout(() => {
      videoPlayer.src = videos[index];
      videoPlayer.load();
      videoPlayer.play();
      videoPlayer.style.opacity = 1;
      updateTombolVideo();
    }, 150);
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
