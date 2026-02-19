<<<<<<< HEAD
import { getQueue, clearQueue, addToQueue } from "./queue.js";

/* ===== DOM ===== */
const queuePanel = document.getElementById("queuePanel");
const queueBackdrop = document.getElementById("queueBackdrop");
const queueList = document.getElementById("queueList");
const clearQueueBtn = document.getElementById("clearQueue");
const queueBtn = document.getElementById("queueBtn");
const queueBtnNowPlaying = document.getElementById("queueBtnNowPlaying");


/* ===== OPEN / CLOSE ===== */
function openQueue() {
  if (!queuePanel || !queueBackdrop) return;

  renderQueue();

  queuePanel.classList.remove("hidden");
  queueBackdrop.classList.remove("hidden");

  requestAnimationFrame(() => {
    queuePanel.classList.add("show");
  });
}

function closeQueue() {
  if (!queuePanel || !queueBackdrop) return;

  queuePanel.classList.remove("show");
  setTimeout(() => {
    queuePanel.classList.add("hidden");
    queueBackdrop.classList.add("hidden");
  }, 300);
}

/* ===== EVENTS ===== */
queueBtn?.addEventListener("click", e => {
  e.stopPropagation();
  openQueue();
});

queueBtnNowPlaying?.addEventListener("click", e => {
  e.stopPropagation();
  openQueue();
});

queueBackdrop?.addEventListener("click", closeQueue);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeQueue();
});

/* ===== RENDER QUEUE ===== */
function renderQueue() {
  const queue = getQueue();
  queueList.innerHTML = "";

  if (!queue.length) {
    queueList.innerHTML = `<p class="empty">Queue is empty</p>`;
    return;
  }

  /* Safety: songs must exist */
  if (!window.songs || !Array.isArray(window.songs)) {
    console.warn("Songs not loaded yet");
    return;
  }

  queue.forEach((songIndex, i) => {
    const song = window.songs[songIndex];
    if (!song) return;

    const div = document.createElement("div");
    div.className = "queue-item";

    div.innerHTML = `
      <img
        src="${song.cover || 'assets/images/default.png'}"
        class="queue-cover"
        onerror="this.src='assets/images/default.png'"
      />

      <div class="queue-info">
        <h4>${song.title}</h4>
        <p>${song.artist || "Unknown Artist"}</p>
      </div>

      <button class="queue-remove" aria-label="Remove from queue">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    /* ▶ Play from queue */
    div.querySelector(".queue-info").addEventListener("click", () => {
      if (typeof window.loadSong === "function") {
        window.loadSong(songIndex, true, "manual");
      }
      closeQueue();
    });

    /* ❌ Remove from queue */
    div.querySelector(".queue-remove").addEventListener("click", e => {
      e.stopPropagation();

      const updatedQueue = getQueue().filter((_, idx) => idx !== i);
      clearQueue();
      updatedQueue.forEach(addToQueue);

      renderQueue();
      /* Keep queue button always active */
      if (queueBtn) {
        queueBtn.disabled = false;
      }

    });

    queueList.appendChild(div);
  });
}

/* ===== CLEAR QUEUE ===== */
clearQueueBtn?.addEventListener("click", () => {
  clearQueue();
  renderQueue();
});

/* Initial state */
renderQueue();
=======
import { getQueue, clearQueue, addToQueue } from "./queue.js";

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ===== DOM ===== */
const queuePanel = document.getElementById("queuePanel");
const queueBackdrop = document.getElementById("queueBackdrop");
const queueList = document.getElementById("queueList");
const clearQueueBtn = document.getElementById("clearQueue");
const queueBtn = document.getElementById("queueBtn");
const queueBtnNowPlaying = document.getElementById("queueBtnNowPlaying");


/* ===== OPEN / CLOSE ===== */
function openQueue() {
  if (!queuePanel || !queueBackdrop) return;

  renderQueue();

  queuePanel.classList.remove("hidden");
  queueBackdrop.classList.remove("hidden");

  requestAnimationFrame(() => {
    queuePanel.classList.add("show");
  });
}

function closeQueue() {
  if (!queuePanel || !queueBackdrop) return;

  queuePanel.classList.remove("show");
  setTimeout(() => {
    queuePanel.classList.add("hidden");
    queueBackdrop.classList.add("hidden");
  }, 300);
}

/* ===== EVENTS ===== */
queueBtn?.addEventListener("click", e => {
  e.stopPropagation();
  openQueue();
});

queueBtnNowPlaying?.addEventListener("click", e => {
  e.stopPropagation();
  openQueue();
});

queueBackdrop?.addEventListener("click", closeQueue);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeQueue();
});

/* ===== RENDER QUEUE ===== */
function renderQueue() {
  const queue = getQueue();
  queueList.innerHTML = "";

  if (!queue.length) {
    queueList.innerHTML = `<p class="empty">Queue is empty</p>`;
    return;
  }

  /* Safety: songs must exist */
  if (!window.songs || !Array.isArray(window.songs)) {
    console.warn("Songs not loaded yet");
    return;
  }

  queue.forEach((songIndex, i) => {
    const song = window.songs[songIndex];
    if (!song) return;

    const div = document.createElement("div");
    div.className = "queue-item";

    div.innerHTML = `
      <img
        src="${song.cover || 'assets/images/default.png'}"
        class="queue-cover"
        onerror="this.src='assets/images/default.png'"
      />

      <div class="queue-info">
        <h4>${escapeHtml(song.title)}</h4>
        <p>${escapeHtml(song.artist || "Unknown Artist")}</p>
      </div>

      <button class="queue-remove" aria-label="Remove from queue">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    /* ▶ Play from queue */
    div.querySelector(".queue-info").addEventListener("click", () => {
      if (typeof window.loadSong === "function") {
        window.loadSong(songIndex, true, "manual");
      }
      closeQueue();
    });

    /* ❌ Remove from queue */
    div.querySelector(".queue-remove").addEventListener("click", e => {
      e.stopPropagation();

      const updatedQueue = getQueue().filter((_, idx) => idx !== i);
      clearQueue();
      updatedQueue.forEach(addToQueue);

      renderQueue();
      /* Keep queue button always active */
      if (queueBtn) {
        queueBtn.disabled = false;
      }

    });

    queueList.appendChild(div);
  });
}

/* ===== CLEAR QUEUE ===== */
clearQueueBtn?.addEventListener("click", () => {
  clearQueue();
  renderQueue();
});

/* Initial state */
renderQueue();
>>>>>>> master
