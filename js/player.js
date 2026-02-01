document.addEventListener("DOMContentLoaded", async () => {

  const songs = [];
  const audio = new Audio();

  let currentIndex = 0;
  let isShuffle = false;
  let repeatMode = "off"; // off | all | one

  const DEFAULT_COVER = "assets/images/default.png";
  const RESUME_KEY = "player_resume";


  /* ===== SAFE DOM GETS ===== */
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
  const emptyState = document.getElementById("emptyState");

  /* ================= EMPTY STATE ================= */
  function updateEmptyState(hasSongs = false) {
    if (!emptyState) return;

    emptyState.style.display = hasSongs ? "none" : "block";

    if (!hasSongs) {
      if (titleEl) titleEl.textContent = "No songs added";
      if (artistEl) artistEl.textContent = "Tap + to add songs";
      if (coverEl) coverEl.src = DEFAULT_COVER;
      audio.src = "";
    }
  }

  /* ================= LOAD SONG ================= */
  function loadSong(index, autoPlay = false) {
    const song = songs[index];
    if (!song) return;

    currentIndex = index;
    updateEmptyState(true);

    audio.src = song.src;
    audio.load();
    // ✅ Restore timestamp if same song
    const resume = JSON.parse(localStorage.getItem(RESUME_KEY));

    if (resume && resume.index === index) {
      audio.onloadedmetadata = () => {
        audio.currentTime = resume.time || 0;
      };
    }


    if (titleEl) titleEl.textContent = song.title || "Unknown";
    if (artistEl) artistEl.textContent = song.artist || "";
    if (coverEl) coverEl.src = song.cover || DEFAULT_COVER;

    highlightActiveSong();

    if (autoPlay) {
      audio.play().catch(() => {});
    }
  }

  /* ================= PLAY / PAUSE ================= */
  playBtn?.addEventListener("click", () => {

    // ✅ If nothing loaded yet → load last or first song
    if (!audio.src && songs.length) {
      const resume = JSON.parse(localStorage.getItem(RESUME_KEY));
      const index = resume?.index ?? 0;

      loadSong(index, true);
      return;
    }

    if (!audio.src) return;

    audio.paused
      ? audio.play().catch(() => {})
      : audio.pause();
  });


  audio.addEventListener("play", () => {
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  });

  audio.addEventListener("pause", () => {
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  });

  /* ================= NEXT / PREV ================= */
  nextBtn?.addEventListener("click", () => {
    if (!songs.length) return;

    currentIndex = isShuffle
      ? Math.floor(Math.random() * songs.length)
      : (currentIndex + 1) % songs.length;

    loadSong(currentIndex, true);
  });

  prevBtn?.addEventListener("click", () => {
    if (!songs.length) return;

    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    loadSong(currentIndex, true);
  });

  /* ================= SHUFFLE ================= */
  shuffleBtn?.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
  });

  /* ================= REPEAT ================= */
  repeatBtn?.addEventListener("click", () => {
    repeatMode =
      repeatMode === "off" ? "all" :
      repeatMode === "all" ? "one" : "off";

    repeatBtn.classList.toggle("active", repeatMode !== "off");

    if (repeatMode === "one") {
      repeatBtn.dataset.mode = "one";
    } else {
      delete repeatBtn.dataset.mode;
    }
  });

  audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      nextBtn?.click();
    }
  });

  /* ================= PROGRESS ================= */
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    if (progress) {
      progress.value = (audio.currentTime / audio.duration) * 100;
    }

    // ✅ Save resume data
    localStorage.setItem(RESUME_KEY, JSON.stringify({
      index: currentIndex,
      time: audio.currentTime
    }));
  });


  progress?.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (progress.value / 100) * audio.duration;
  });

  /* ================= PLAYLIST ================= */
  function renderPlaylist() {
    if (!playlistEl) return;
    playlistEl.innerHTML = "";

    songs.forEach((song, i) => {
      const div = document.createElement("div");
      div.className = "song";

      div.innerHTML = `
        <span>${i + 1}</span>

        <img
          class="song-cover"
          src="${song.cover || DEFAULT_COVER}"
          onerror="this.src='${DEFAULT_COVER}'"
          alt="cover"
        />

        <div class="song-info">
          <h4>${song.title}</h4>
          <p>${song.artist}</p>
        </div>

        <button class="remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;


      div.addEventListener("click", () => {
        loadSong(i, true);
      });

      div.querySelector(".remove").addEventListener("click", async e => {
        e.stopPropagation();
        await deleteSongFromDB(song.dbId);
        songs.splice(i, 1);

        songs.length ? loadSong(0) : updateEmptyState(false);
        renderPlaylist();
      });

      playlistEl.appendChild(div);
    });
  }

  function highlightActiveSong() {
    document.querySelectorAll(".song").forEach((el, i) => {
      el.classList.toggle("active", i === currentIndex);
    });
  }

  /* ================= ADD SONGS ================= */
  addSongsBtn?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async e => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (!file.type.startsWith("audio/")) continue;
      const saved = await saveSongToDB(file);
      addSongToUI(saved);
    }

    if (!audio.src && songs.length) {
      loadSong(0);
    }

    fileInput.value = "";
  });

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
          cover: DEFAULT_COVER
        });
        renderPlaylist();
        updateEmptyState(true);
      },
      onError: () => {
        songs.push({
          dbId: dbSong.id,
          title: dbSong.name.replace(/\.[^/.]+$/, ""),
          artist: "Local File",
          src: url,
          cover: DEFAULT_COVER
        });
        renderPlaylist();
        updateEmptyState(true);
      }
    });
  }

  /* ================= LOAD CACHE ================= */
  async function loadSongsFromCache() {
    const cachedSongs = await getAllSongsFromDB();

    if (!cachedSongs.length) {
      updateEmptyState(false);
      return;
    }

    cachedSongs.forEach(addSongToUI);

    // ✅ Restore last song (without autoplay)
    const resume = JSON.parse(localStorage.getItem(RESUME_KEY));
    const index = resume?.index ?? 0;

    loadSong(index);
  }


  /* ================= INIT ================= */
  await loadSongsFromCache();

 /*========save time stamp while playing========*/
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    saveResumeState(currentIndex, audio.currentTime);

    if (progress) {
      progress.value = (audio.currentTime / audio.duration) * 100;
    }
  });

});
