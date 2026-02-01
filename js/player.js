document.addEventListener("DOMContentLoaded", async () => {

  const songs = [];
  const audio = new Audio();

  let currentIndex = 0;
  let isShuffle = false;
  let repeatMode = "off"; // off | all | one

  const playBtn = document.getElementById("play");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const shuffleBtn = document.getElementById("shuffle");
  const repeatBtn = document.getElementById("repeat");
  const progress = document.getElementById("progress");
  const fileInput = document.getElementById("fileInput");
  const addSongsBtn = document.getElementById("addSongs");

  const titleEl = document.getElementById("title");
  const artistEl = document.getElementById("artist");
  const coverEl = document.getElementById("cover");
  const playlistEl = document.querySelector(".playlist");
  const nowPlaying = document.querySelector(".now-playing");
  const emptyState = document.getElementById("emptyState");

  /* ================= EMPTY STATE ================= */
  function updateEmptyState() {
    emptyState.style.display = "block";
    nowPlaying.style.display = "none";
    titleEl.textContent = "No songs added";
    artistEl.textContent = "Tap + to add songs";
    coverEl.src = "assets/images/default.png";
    audio.src = "";
  }

  /* ================= LOAD SONG ================= */
  function loadSong(index) {
    const song = songs[index];
    if (!song) return;

    emptyState.style.display = "none";
    nowPlaying.style.display = "block";

    audio.src = song.src;
    audio.load();

    titleEl.textContent = song.title;
    artistEl.textContent = song.artist;
    coverEl.src = song.cover;

    highlightActiveSong();
  }

  /* ================= PLAY / PAUSE ================= */
  playBtn.onclick = () => {
    if (!audio.src) return;
    audio.paused ? audio.play() : audio.pause();
  };

  audio.onplay = () => {
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    nowPlaying.classList.add("playing");
  };

  audio.onpause = () => {
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    nowPlaying.classList.remove("playing");
  };

  /* ================= NEXT / PREV ================= */
  nextBtn.onclick = () => {
    if (!songs.length) return;

    currentIndex = isShuffle
      ? Math.floor(Math.random() * songs.length)
      : (currentIndex + 1) % songs.length;

    loadSong(currentIndex);
    audio.play();
  };

  prevBtn.onclick = () => {
    if (!songs.length) return;

    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    loadSong(currentIndex);
    audio.play();
  };

  /* ================= SHUFFLE ================= */
  shuffleBtn.onclick = () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
  };

  /* ================= REPEAT (FINAL & CLEAN) ================= */
  repeatBtn.onclick = () => {
    repeatMode =
      repeatMode === "off" ? "all" :
      repeatMode === "all" ? "one" : "off";

    repeatBtn.classList.toggle("active", repeatMode !== "off");

    if (repeatMode === "one") {
      repeatBtn.dataset.mode = "one";
    } else {
      delete repeatBtn.dataset.mode;
    }
  };

  /* ================= SONG END ================= */
  audio.onended = () => {
    if (repeatMode === "one") {
      audio.currentTime = 0;
      audio.play();
    } else if (repeatMode === "all") {
      nextBtn.click();
    }
    // off → stop
  };

  /* ================= PROGRESS ================= */
  audio.ontimeupdate = () => {
    progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  };

  progress.oninput = () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
  };

  /* ================= PLAYLIST ================= */
  function renderPlaylist() {
    playlistEl.innerHTML = "";

    songs.forEach((song, i) => {
      const div = document.createElement("div");
      div.className = "song";

      div.innerHTML = `
        <span>${i + 1}</span>
        <div>
          <h4>${song.title}</h4>
          <p>${song.artist}</p>
        </div>
        <button class="remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      div.onclick = () => {
        currentIndex = i;
        loadSong(i);
        audio.play();
      };

      div.querySelector(".remove").onclick = async e => {
        e.stopPropagation();

        await deleteSongFromDB(song.dbId);
        songs.splice(i, 1);

        if (songs.length) {
          currentIndex = 0;
          loadSong(0);
        } else {
          updateEmptyState();
        }

        renderPlaylist();
      };

      playlistEl.appendChild(div);
    });
  }

  function highlightActiveSong() {
    document.querySelectorAll(".song").forEach((el, i) => {
      el.classList.toggle("active", i === currentIndex);
    });
  }

  /* ================= ADD SONGS ================= */
  addSongsBtn.onclick = () => fileInput.click();

  fileInput.onchange = async e => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (!file.type.startsWith("audio/")) continue;

      await dbReady;
      const saved = await saveSongToDB(file);
      addSongToUI(saved);
    }

    if (!audio.src && songs.length) {
      currentIndex = 0;
      loadSong(0);
    }

    fileInput.value = "";
  };

  /* ================= ADD TO UI ================= */
  function addSongToUI(dbSong) {
    const url = createSongURL(dbSong.blob);

    jsmediatags.read(dbSong.blob, {
      onSuccess: tag => {
        songs.push({
          dbId: dbSong.id,
          title: tag.tags.title || dbSong.name.replace(/\.[^/.]+$/, ""),
          artist: tag.tags.artist || "Local File",
          src: url,
          cover: "assets/images/default.jpg"
        });
        renderPlaylist();
      },
      onError: () => {
        songs.push({
          dbId: dbSong.id,
          title: dbSong.name.replace(/\.[^/.]+$/, ""),
          artist: "Local File",
          src: url,
          cover: "assets/images/default.jpg"
        });
        renderPlaylist();
      }
    });

    emptyState.style.display = "none";
  }

  /* ================= LOAD CACHE ================= */
  async function loadSongsFromCache() {
    const cachedSongs = await getAllSongsFromDB();

    if (!cachedSongs.length) {
      updateEmptyState();
      return;
    }

    cachedSongs.forEach(addSongToUI);
    currentIndex = 0;
    loadSong(0);
  }

  /* ================= INIT ================= */
  await dbReady;
  await loadSongsFromCache();
});

