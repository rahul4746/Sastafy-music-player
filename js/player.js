/*==== import control part ======*/
import { initMediaControls, updateMediaInfo } from "./control.js";
import { initTimeDisplay } from "./time.js";
import {
  addToQueue,
  playNext as queuePlayNext,
  getNextFromQueue
} from "./queue.js";



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
  const miniTitle = document.getElementById("miniTitle");
  const queueBtn = document.getElementById("queueBtn");

  /* ===== TIME DISPLAY ===== */
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");

  /* ===== NOW PLAYING ELEMENTS ===== */
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
      if (miniTitle) miniTitle.textContent = "No song playing";
    }
  }

  /* ================= LOAD SONG ================= */
  function loadSong(index, autoPlay = false, reason = "manual") {
    const song = songs[index];
    if (!song) return;

    currentIndex = index;
    updateEmptyState(true);
    audio.src = song.src;
    audio.load();

    /* ===== restore timestamp if same song ===== */
    // Resume ONLY when app reloads
  if (reason === "resume") {
    const resume = JSON.parse(localStorage.getItem(RESUME_KEY));
    if (resume && resume.index === index) {
      audio.addEventListener("loadedmetadata", () => {
        audio.currentTime = resume.time || 0;
      }, { once: true });

    }
  } else {
    audio.currentTime = 0; // manual change → always start fresh
  }


    if (titleEl) titleEl.textContent = song.title || "Unknown";
    if (artistEl) artistEl.textContent = song.artist || "";
    if (coverEl) coverEl.src = song.cover || DEFAULT_COVER;

    /* ===== mini title ===== */
    if (miniTitle) {
      miniTitle.textContent = `${song.title} – ${song.artist || "Unknown"}`;
        requestAnimationFrame(() => {
          const parent = miniTitle.parentElement;
          const overflow = miniTitle.scrollWidth - parent.clientWidth;
          if (overflow > 0) {
            miniTitle.style.setProperty("--scroll-distance", `${overflow}px`);
            miniTitle.classList.add("scroll-text");
          } else {
            miniTitle.classList.remove("scroll-text");
            miniTitle.style.removeProperty("--scroll-distance");
          }
        });



    }

    if (queueBtn) {
      queueBtn.disabled = false;
    }


    highlightActiveSong();

    /* ===== update lock screen / notification info ===== */
    updateMediaInfo?.(song);

    if (autoPlay) {
      audio.play().catch(() => {});
    }
  }

  /* ================= QUEUE NEXT SONG ================= */

  function playNextSong() {
    const queuedIndex = getNextFromQueue();

    // 1 Queue first
    if (queuedIndex !== null) {
      loadSong(queuedIndex, true, "manual");
      return;
    }

    // 2 Shuffle
    if (isShuffle && songs.length > 1) {
      let next;
      do {
        next = Math.floor(Math.random() * songs.length);
      } while (next === currentIndex);

      currentIndex = next;
      loadSong(currentIndex, true, "manual");
      return;
    }


    // 3 Normal order
    currentIndex = (currentIndex + 1) % songs.length;
    loadSong(currentIndex, true, "manual");
  }


  /* ================= PLAY / PAUSE ================= */
  playBtn?.addEventListener("click", () => {

    if (!audio.src && songs.length) {
      const resume = JSON.parse(localStorage.getItem(RESUME_KEY));
      const index = resume?.index ?? 0;
      loadSong(index, true, "resume");
      return;
    }

    if (!audio.src) return;

    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  });

  audio.addEventListener("play", () => {
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  });

  audio.addEventListener("pause", () => {
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  });

  /* ===== NOW PLAYING ANIMATION STATE ===== */
  function updateActiveTitleScroll() {
    const activeSong = document.querySelector(".song.active");
    if (!activeSong) return;
    const titleEl = activeSong.querySelector(".song-info h4");
    if (!titleEl) return;
    titleEl.classList.remove("scroll-text");
    titleEl.style.removeProperty("--scroll-distance");
    if (activeSong.classList.contains("playing")) {
      const overflow = titleEl.scrollWidth - titleEl.clientWidth;
      if (overflow > 0) {
        titleEl.style.setProperty("--scroll-distance", `${overflow}px`);
        titleEl.classList.add("scroll-text");
      }
    }

  }

  audio.addEventListener("play", () => {
    document.querySelector(".song.active")?.classList.add("playing");
    requestAnimationFrame(updateActiveTitleScroll);
  });

  audio.addEventListener("pause", () => {
    document.querySelector(".song.active")?.classList.remove("playing");
    updateActiveTitleScroll();
  });

  /* ================= NEXT / PREV ================= */
  nextBtn?.addEventListener("click", () => {
    if (!songs.length) return;
    playNextSong();
  });

  prevBtn?.addEventListener("click", () => {
    if (!songs.length) return;

    // Spotify behavior
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }

    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    loadSong(currentIndex, true, "manual");
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
      return;
    }

    playNextSong();
  });


  /* ================= PROGRESS ================= */
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    if (progress) {
      progress.value = (audio.currentTime / audio.duration) * 100;
    }

    /* ===== save resume state ===== */
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
        <span class="index">${i + 1}</span>

        <div class="eq">
          <span></span><span></span><span></span>
        </div>

        <img class="song-cover"
            src="${song.cover || DEFAULT_COVER}"
            onerror="this.src='${DEFAULT_COVER}'" />

        <div class="song-info">
          <h4>${song.title}</h4>
          <p>${song.artist}</p>
        </div>

        <button class="menu-btn">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>

        <div class="song-menu">
          <button class="play-next"><i class="fa-solid fa-forward-step"></i> Play Next</button>
          <button class="add-queue"><i class="fa-solid fa-list-ul"></i> Add to Queue</button>
          <button class="remove-song"><i class="fa-solid fa-trash"></i> Remove</button>
        </div>
      `;

      // click to play
      div.addEventListener("click", e => {
        if (e.target.closest(".menu-btn")) return;
        loadSong(i, true);
      });


      // menu logic
      const menuBtn = div.querySelector(".menu-btn");
      const menu = div.querySelector(".song-menu");

      menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        document.querySelectorAll(".song-menu").forEach(m => {
          if (m !== menu) m.style.display = "none";
        });
        menu.style.display = menu.style.display === "block" ? "none" : "block";
      });

      menu.querySelector(".play-next").addEventListener("click", e => {
        e.stopPropagation();
        queuePlayNext(i);
        menu.style.display = "none";
      });

      menu.querySelector(".add-queue").addEventListener("click", e => {
        e.stopPropagation();
        addToQueue(i);
        menu.style.display = "none";
      });

      menu.querySelector(".remove-song").addEventListener("click", async e => {
        e.stopPropagation();
        await deleteSongFromDB(song.dbId);
        songs.splice(i, 1);
        songs.length ? loadSong(0) : updateEmptyState(false);
        renderPlaylist();
      });

       playlistEl.appendChild(div);

    });
  }


  document.addEventListener("click", () => {
    document.querySelectorAll(".song-menu").forEach(m => {
      m.style.display = "none";
    });
  });


  function highlightActiveSong() {
    document.querySelectorAll(".song").forEach((el, i) => {
      const isActive = i === currentIndex;

      el.classList.toggle("active", isActive);
      el.classList.remove("playing");
      const titleEl = el.querySelector(".song-info h4");
      if (titleEl) titleEl.classList.remove("scroll-text");

      if (isActive) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    });
    requestAnimationFrame(updateActiveTitleScroll);
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

    if (!audio.src && songs.length) loadSong(0);
    fileInput.value = "";
  });

  /* ================= ADD TO UI ================= */
  function addSongToUI(dbSong) {
    const url = createSongURL(dbSong.blob);

    /* ===== song cover ===== */
    function getCoverFromTags(tags) {
      const picture = tags.picture;
      if (!picture || !picture.data || !picture.data.length) {
        return DEFAULT_COVER;
      }

      const byteArray = new Uint8Array(picture.data);
      const blob = new Blob([byteArray], { type: picture.format || "image/jpeg" });
      return URL.createObjectURL(blob);
    }


    jsmediatags.read(dbSong.blob, {
      onSuccess: tag => {
        const cover = getCoverFromTags(tag.tags);

        songs.push({
          dbId: dbSong.id,
          title: tag.tags.title || dbSong.name.replace(/\.[^/.]+$/, ""),
          artist: tag.tags.artist || "Local File",
          src: url,
          cover
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

    const resume = JSON.parse(localStorage.getItem(RESUME_KEY));
    const index = resume?.index ?? 0;
    loadSong(index, false, "resume");
  }

  /* ================= INIT ================= */
  await loadSongsFromCache();

  /* ===== INIT MEDIA CONTROLS (lock screen / notification) ===== */
  initMediaControls(audio, () => songs[currentIndex], {
    next: () => nextBtn?.click(),
    prev: () => prevBtn?.click()
  });

  /* ===== INIT TIME DISPLAY ===== */
  initTimeDisplay(audio, currentTimeEl, durationEl);

  /* ===== EXPOSE FOR QUEUE UI ===== */
  window.songs = songs;
  window.loadSong = loadSong;


});
