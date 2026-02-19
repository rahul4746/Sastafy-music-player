/*==== import control part ======*/
import { initMediaControls, updateMediaInfo } from "./control.js";
import { initTimeDisplay } from "./time.js";
import {
  addToQueue,
  playNext as queuePlayNext,
  getNextFromQueue
} from "./queue.js";
import { openSongPlaylistPanel } from "./playlist-song-panel.js";
import { loadResumeState, saveResumeState } from "./resume.js";
import { removeSongFromAllPlaylists } from "./playlist-storage.js";


document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("nowPlayingModal");
  const closeBtn = modal?.querySelector(".now-playing-close");
  const backdrop = modal?.querySelector(".now-playing-backdrop");
  const controlsSlot = modal?.querySelector(".now-playing-controls-slot");
  const miniNowPlaying = document.querySelector(".mini-now-playing");
  const controlsWrapper = document.querySelector(".player-controls");
  const originalParent = controlsWrapper?.parentElement;
  const originalNextSibling = controlsWrapper?.nextElementSibling;
  const body = document.body;

  if (!modal || !controlsSlot || !controlsWrapper || !originalParent) return;

  const openModal = () => {
    if (modal.classList.contains("show")) return;
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.add("show");
    });
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("now-playing-open");
    controlsSlot.appendChild(controlsWrapper);
  };

  const closeModal = () => {
    if (!modal.classList.contains("show")) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("now-playing-open");
    if (originalNextSibling) {
      originalParent.insertBefore(controlsWrapper, originalNextSibling);
    } else {
      originalParent.appendChild(controlsWrapper);
    }
    window.setTimeout(() => {
      modal.classList.add("hidden");
    }, 250);
  };

  miniNowPlaying?.addEventListener("click", event => {
    if (event.target.closest("#queueBtn")) return;
    openModal();
  });

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
});
document.addEventListener("DOMContentLoaded", async () => {

  const songs = [];
  const audio = new Audio();

  let currentIndex = 0;
  let isShuffle = false;
  let repeatMode = "off"; // off | all | one

  const DEFAULT_COVER = "assets/images/default.png";

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
  const playerBar = document.querySelector(".player-bar");

  /* ================= XSS ESCAPE ================= */
  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ================= LOADING & ERROR UI ================= */
  function showLoading(text = "Loading...") {
    const overlay = document.getElementById("loadingOverlay");
    const textEl = document.getElementById("loadingText");
    if (overlay) {
      overlay.classList.remove("hidden");
      if (textEl) textEl.textContent = text;
    }
  }

  function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }

  function showError(message) {
    const toast = document.getElementById("errorToast");
    const messageEl = document.getElementById("errorMessage");
    if (toast && messageEl) {
      messageEl.textContent = message;
      toast.classList.remove("hidden");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 5000);
    }
  }

  document.getElementById("errorClose")?.addEventListener("click", () => {
    document.getElementById("errorToast")?.classList.add("hidden");
  });

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

  function updatePlayerBarHeight() {
  if (!playerBar) return;
  const height = playerBar.offsetHeight;
  document.documentElement.style.setProperty("--player-bar-height", `${height}px`);
}

updatePlayerBarHeight();
window.addEventListener("resize", updatePlayerBarHeight);

  /* ================= LOAD SONG ================= */
  function loadSong(index, autoPlay = false, reason = "manual") {
    const song = songs[index];
    if (!song) return;

    currentIndex = index;
    updateEmptyState(true);
    audio.src = song.src;
    audio.load();

    /* ===== restore timestamp if same song ===== */
    if (reason === "resume") {
      const resume = loadResumeState();
      if (resume && resume.songId && String(songs[index]?.dbId) === String(resume.songId)) {
        audio.addEventListener("loadedmetadata", () => {
          audio.currentTime = resume.time || 0;
        }, { once: true });
      }
    } else {
      audio.currentTime = 0;
    }

    if (titleEl) titleEl.textContent = escapeHtml(song.title || "Unknown");
    if (artistEl) artistEl.textContent = escapeHtml(song.artist || "");
    if (coverEl) coverEl.src = song.cover || DEFAULT_COVER;

    /* ===== mini title ===== */
    if (miniTitle) {
      miniTitle.textContent = `${escapeHtml(song.title)} – ${escapeHtml(song.artist || "Unknown")}`;
        requestAnimationFrame(() => {
          const parent = miniTitle.parentElement;
          const gap = 16;
          const overflow = miniTitle.scrollWidth - parent.clientWidth;
          if (overflow > 0) {
            miniTitle.style.setProperty("--scroll-distance", `${overflow + gap}px`);
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
      const resume = loadResumeState();
      if (resume && resume.songId) {
        const index = songs.findIndex(s => String(s.dbId) === String(resume.songId));
        if (index !== -1) {
          loadSong(index, true, "resume");
        } else {
          loadSong(0, true, "manual");
        }
      } else {
        loadSong(0, true, "manual");
      }
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
      const gap = 16;
      const overflow = titleEl.scrollWidth - titleEl.clientWidth;
      if (overflow > 0) {
        titleEl.style.setProperty("--scroll-distance", `${overflow + gap}px`);
        titleEl.classList.add("scroll-text");
      }
    }

  }

  audio.addEventListener("play", () => {
    document.querySelector(".song.active")?.classList.add("playing");
    document.querySelector(".playlist-song.active")?.classList.add("playing");
    requestAnimationFrame(updateActiveTitleScroll);
  });

  audio.addEventListener("pause", () => {
    document.querySelector(".song.active")?.classList.remove("playing");
    document.querySelector(".playlist-song.active")?.classList.remove("playing");
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

  /* ================= KEYBOARD SHORTCUTS ================= */
  document.addEventListener("keydown", event => {
    if (document.activeElement?.matches("input, textarea, select")) return;

    switch (event.key) {
      case " ":
        event.preventDefault();
        playBtn?.click();
        break;
      case "ArrowRight":
        event.preventDefault();
        if (event.shiftKey) {
          nextBtn?.click();
        } else if (audio.duration) {
          audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (event.shiftKey) {
          prevBtn?.click();
        } else if (audio.duration) {
          audio.currentTime = Math.max(audio.currentTime - 5, 0);
        }
        break;
      case "n":
      case "N":
        event.preventDefault();
        nextBtn?.click();
        break;
      case "p":
      case "P":
        event.preventDefault();
        prevBtn?.click();
        break;
      case "s":
      case "S":
        event.preventDefault();
        shuffleBtn?.click();
        break;
      case "r":
      case "R":
        event.preventDefault();
        repeatBtn?.click();
        break;
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
    saveResumeState(songs[currentIndex]?.dbId, audio.currentTime);
  });

  progress?.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (progress.value / 100) * audio.duration;
  });

  /* ================= SEARCH ================= */
  let searchQuery = "";
  let filteredSongs = [];
  const searchInput = document.getElementById("searchInput");

  function filterSongs(query) {
    searchQuery = (query || "").toLowerCase().trim();
    if (!searchQuery) {
      filteredSongs = [...songs];
    } else {
      filteredSongs = songs.filter(song =>
        (song.title || "").toLowerCase().includes(searchQuery) ||
        (song.artist || "").toLowerCase().includes(searchQuery)
      );
    }
  }

  let searchTimeout;
  searchInput?.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterSongs(e.target.value);
      renderPlaylist();
    }, 300);
  });

  /* ================= PLAYLIST ================= */
  function renderPlaylist() {
    if (!playlistEl) return;
    playlistEl.innerHTML = "";

    const songsToRender = searchQuery ? filteredSongs : songs;

    songsToRender.forEach((song) => {
      const originalIndex = songs.indexOf(song);
      const div = document.createElement("div");
      div.className = "song";
      div.dataset.originalIndex = originalIndex;

      div.innerHTML = `
        <span class="index">${originalIndex + 1}</span>

        <div class="eq">
          <span></span><span></span><span></span>
        </div>

        <img class="song-cover"
            src="${song.cover || DEFAULT_COVER}"
            onerror="this.src='${DEFAULT_COVER}'" />

        <div class="song-info">
          <h4>${escapeHtml(song.title)}</h4>
          <p>${escapeHtml(song.artist)}</p>
        </div>

        <div class="song-actions">
          <button class="add-to-playlist-btn" type="button" aria-label="Add to playlists">
            <i class="fa-regular fa-square-plus"></i>
          </button>
          <button class="menu-btn" type="button" aria-label="Song options">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>

        <div class="song-menu">
          <button class="play-next"><i class="fa-solid fa-forward-step"></i> Play Next</button>
          <button class="add-queue"><i class="fa-solid fa-list-ul"></i> Add to Queue</button>
          <button class="remove-song"><i class="fa-solid fa-trash"></i> Remove</button>
        </div>
      `;

      // click to play
      let ignoreClick = false;
      let touchStartX = 0;
      let touchStartY = 0;
      let touchMoved = false;

      div.addEventListener("touchstart", e => {
        if (e.target.closest(".menu-btn") || e.target.closest(".song-menu") || e.target.closest(".add-to-playlist-btn")) return;
        if (!e.touches || e.touches.length !== 1) return;
        touchMoved = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      div.addEventListener("touchmove", e => {
        if (touchMoved || !e.touches || e.touches.length !== 1) return;
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (deltaX > 8 || deltaY > 8) {
          touchMoved = true;
        }
      }, { passive: true });

      div.addEventListener("touchend", e => {
        if (e.target.closest(".menu-btn") || e.target.closest(".song-menu") || e.target.closest(".add-to-playlist-btn")) return;
        if (touchMoved) {
          touchMoved = false;
          return;
        }
        e.preventDefault();
        ignoreClick = true;
        loadSong(originalIndex, true, "manual");
      });

      div.addEventListener("touchcancel", () => {
        touchMoved = false;
      });


      // click to play
      div.addEventListener("click", e => {
        if (e.target.closest(".menu-btn") || e.target.closest(".song-menu") || e.target.closest(".add-to-playlist-btn")) return;
        if (ignoreClick) {
          ignoreClick = false;
          return;
        }
        loadSong(originalIndex, true, "manual");
      });


      // menu logic
      const addToPlaylistBtn = div.querySelector(".add-to-playlist-btn");
      const menuBtn = div.querySelector(".menu-btn");
      const menu = div.querySelector(".song-menu");

      addToPlaylistBtn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        openSongPlaylistPanel(song.dbId, song.title);
      });

      menuBtn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".song-menu").forEach(m => {
          if (m !== menu) {
            m.classList.remove("menu-open");
            m.closest(".song")?.classList.remove("menu-active");
          }
        });
        const isOpen = menu.classList.toggle("menu-open");
        div.classList.toggle("menu-active", isOpen);
      });

      menu.querySelector(".play-next").addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        queuePlayNext(originalIndex);
        menu.classList.remove("menu-open");
        div.classList.remove("menu-active");
      });

      menu.querySelector(".add-queue").addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        addToQueue(originalIndex);
        menu.classList.remove("menu-open");
        div.classList.remove("menu-active");
      });

      menu.querySelector(".remove-song").addEventListener("click", async e => {
        e.preventDefault();
        e.stopPropagation();

        const wasCurrentSong = originalIndex === currentIndex;
        const wasLastSong = originalIndex === songs.length - 1;

        if (typeof revokeSongURL === "function") {
          revokeSongURL(song.src);
        }

        removeSongFromAllPlaylists(song.dbId);
        await deleteSongFromDB(song.dbId);
        songs.splice(originalIndex, 1);

        if (!songs.length) {
          updateEmptyState(false);
          currentIndex = 0;
        } else {
          if (wasCurrentSong) {
            const nextIndex = wasLastSong ? Math.max(0, currentIndex - 1) : Math.min(currentIndex, songs.length - 1);
            loadSong(nextIndex, true, "manual");
          } else {
            if (originalIndex < currentIndex) {
              currentIndex--;
            }
            highlightActiveSong();
          }
        }

        renderPlaylist();
      });

       playlistEl.appendChild(div);

    });
  }


  document.addEventListener("click", event => {
    if (event.target.closest(".menu-btn") || event.target.closest(".song-menu") || event.target.closest(".add-to-playlist-btn")) {
      return;
    }
    document.querySelectorAll(".song-menu").forEach(m => {
      m.classList.remove("menu-open");
      m.closest(".song")?.classList.remove("menu-active");
    });
  });


  function highlightActiveSong() {
    document.querySelectorAll(".song").forEach((el) => {
      const isActive = String(el.dataset.originalIndex) === String(currentIndex);

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
    const activeSongId = songs[currentIndex]?.dbId;
    document.querySelectorAll(".playlist-song").forEach(el => {
      const isActive = String(el.dataset.songId) === String(activeSongId);
      el.classList.toggle("active", isActive);
      el.classList.remove("playing");
      if (isActive) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    });
     if (!audio.paused) {
      document.querySelector(".song.active")?.classList.add("playing");
      document.querySelector(".playlist-song.active")?.classList.add("playing");
    }
    requestAnimationFrame(updateActiveTitleScroll);
  }


  /* ================= ADD SONGS ================= */
  addSongsBtn?.addEventListener("click", () => fileInput?.click());

  /* ================= DRAG & DROP ================= */
  const app = document.querySelector(".app");
  let dragCounter = 0;

  app?.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    app.classList.add("drag-over");
  });

  app?.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      app.classList.remove("drag-over");
    }
  });

  app?.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  app?.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragCounter = 0;
    app.classList.remove("drag-over");

    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    showLoading(`Adding ${files.length} song${files.length > 1 ? "s" : ""}...`);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of files) {
        if (!file.type.startsWith("audio/")) {
          errorCount++;
          continue;
        }
        try {
          const saved = await saveSongToDB(file);
          await addSongToUI(saved);
          successCount++;
        } catch (err) {
          console.error("Failed to add song:", file.name, err);
          errorCount++;
        }
      }

      hideLoading();

      if (errorCount > 0) {
        showError(`Failed to add ${errorCount} file${errorCount > 1 ? "s" : ""}`);
      }

      if (!audio.src && songs.length) loadSong(0);
    } catch (err) {
      hideLoading();
      showError("Failed to add songs. Please try again.");
      console.error("Drop error:", err);
    }
  });

  fileInput?.addEventListener("change", async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    showLoading(`Adding ${files.length} song${files.length > 1 ? "s" : ""}...`);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of files) {
        if (!file.type.startsWith("audio/")) {
          errorCount++;
          continue;
        }
        try {
          const saved = await saveSongToDB(file);
          await addSongToUI(saved);
          successCount++;
        } catch (err) {
          console.error("Failed to add song:", file.name, err);
          errorCount++;
        }
      }

      hideLoading();

      if (errorCount > 0) {
        showError(`Failed to add ${errorCount} file${errorCount > 1 ? "s" : ""}`);
      }

      if (!audio.src && songs.length) loadSong(0);
    } catch (err) {
      hideLoading();
      showError("Failed to add songs. Please try again.");
      console.error("Add songs error:", err);
    }

    fileInput.value = "";
  });

  /* ================= ADD TO UI ================= */
  function addSongToUI(dbSong) {
    const url = createSongURL(dbSong.blob);

    /* ===== song cover ===== */
    function getCoverFromTags(tags) {
      const picture =
        tags.picture ||
        (Array.isArray(tags.APIC) && tags.APIC[0]) ||
        tags.APIC;
      if (!picture || !picture.data || !picture.data.length) {
        return DEFAULT_COVER;
      }

      const byteArray = new Uint8Array(picture.data);
      const blob = new Blob([byteArray], { type: picture.format || "image/jpeg" });
      return URL.createObjectURL(blob);
    }



    return new Promise(resolve => {
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
          resolve();
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
          resolve();
        }
      });
    });
  }

  /* ================= LOAD CACHE ================= */
  async function loadSongsFromCache() {
    showLoading("Loading your music...");

    try {
      if (typeof clearAllBlobURLs === "function") {
        clearAllBlobURLs();
      }

      const cachedSongs = await getAllSongsFromDB();

      if (!cachedSongs.length) {
        updateEmptyState(false);
        hideLoading();
        return;
      }

      await Promise.all(cachedSongs.map(addSongToUI));

      const resume = loadResumeState();
      if (resume && resume.songId) {
        const index = songs.findIndex(s => String(s.dbId) === String(resume.songId));
        if (index !== -1) {
          loadSong(index, false, "resume");
        }
      }

      hideLoading();
    } catch (err) {
      hideLoading();
      showError("Failed to load library. Please refresh.");
      console.error("Load cache error:", err);
      updateEmptyState(false);
    }
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
  window.getCurrentSongId = () => songs[currentIndex]?.dbId;
  window.isSongPlaying = () => !audio.paused;


});