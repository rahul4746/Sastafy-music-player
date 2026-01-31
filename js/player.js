document.addEventListener("DOMContentLoaded", async () => {

  const songs = [];
  const audio = new Audio();

  let currentIndex = 0;
  let isShuffle = false;
  let repeatMode = "off";

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
    if (emptyState) emptyState.style.display = "block";
    if (nowPlaying) nowPlaying.style.display = "none";

    titleEl.textContent = "No songs added";
    artistEl.textContent = "Tap + to add songs";
    coverEl.src = "assets/images/default.jpg";
    audio.src = "";
  }

  /* ================= LOAD SONG ================= */
  function loadSong(index) {
    const song = songs[index];
    if (!song) return;

    if (emptyState) emptyState.style.display = "none";
    if (nowPlaying) nowPlaying.style.display = "block";

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

  /* ================= SHUFFLE / REPEAT ================= */
  shuffleBtn.onclick = () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
  };

  repeatBtn.onclick = () => {
    repeatMode =
      repeatMode === "off" ? "all" :
      repeatMode === "all" ? "one" : "off";

    repeatBtn.classList.toggle("active", repeatMode !== "off");
    repeatBtn.innerHTML =
      repeatMode === "one"
        ? '<i class="fa-solid fa-repeat-1"></i>'
        : '<i class="fa-solid fa-repeat"></i>';
  };

  audio.onended = () => {
    if (repeatMode === "one") {
      audio.currentTime = 0;
      audio.play();
    } else {
      nextBtn.click();
    }
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

      await dbReady;                     // 🔑 FIX
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

    if (emptyState) emptyState.style.display = "none";
  }

  /* ================= LOAD FROM CACHE ================= */
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
  await dbReady;              // 🔑 FIX
  await loadSongsFromCache();
});
