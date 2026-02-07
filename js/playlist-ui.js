import {
  loadPlaylists,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist
} from "./playlist-storage.js";

const playlistsHome = document.getElementById("playlistsHome");
const playlistList = document.getElementById("playlistList");
const createPlaylistBtn = document.getElementById("createPlaylist");
const playlistView = document.getElementById("playlistView");
const playlistViewTitle = document.getElementById("playlistViewTitle");
const playlistViewCount = document.getElementById("playlistViewCount");
const playlistViewList = document.getElementById("playlistViewList");
const playlistBackBtn = document.getElementById("playlistBack");
const playlistAddSongsBtn = document.getElementById("playlistAddSongs");
const playlistAddDeviceBtn = document.getElementById("playlistAddDevice");
const playlistAddPanel = document.getElementById("playlistAddPanel");
// const playlistAddList = document.getElementById("playlistAddList");
// const playlistAddClose = document.getElementById("playlistAddClose");
// const playlistAddCancel = document.getElementById("playlistAddCancel");
// const playlistAddConfirm = document.getElementById("playlistAddConfirm");
const playlistDeleteBtn = document.getElementById("playlistDelete");
const playlistCreatePanel = document.getElementById("playlistCreatePanel");
const playlistCreateClose = document.getElementById("playlistCreateClose");
const playlistCreateCancel = document.getElementById("playlistCreateCancel");
const playlistCreateConfirm = document.getElementById("playlistCreateConfirm");
const playlistCreateName = document.getElementById("playlistCreateName");
const playlistAddList = document.getElementById("playlistAddList");
const playlistAddClose = document.getElementById("playlistAddClose");
const playlistAddCancel = document.getElementById("playlistAddCancel");
const playlistAddConfirm = document.getElementById("playlistAddConfirm");
const fileInput = document.getElementById("fileInput");

let activePlaylistId = null;
let pendingPlaylistAdd = null;
let pendingKnownIds = new Set();
let lastPlaylistFocus = null;
let lastAddPanelFocus = null;

if (playlistView?.classList.contains("hidden")) {
  playlistView.setAttribute("inert", "");
}

if (playlistAddPanel?.classList.contains("hidden")) {
  playlistAddPanel.setAttribute("inert", "");
}

function getGlobalSongs() {
  return Array.isArray(window.songs) ? window.songs : [];
}

function findSongById(songId) {
  return getGlobalSongs().find(song => String(song.dbId) === String(songId));
}

function getSongIndexById(songId) {
  return getGlobalSongs().findIndex(song => String(song.dbId) === String(songId));
}

function syncPlaylistActiveState() {
  const currentId = typeof window.getCurrentSongId === "function" ? window.getCurrentSongId() : null;
  const isPlaying = typeof window.isSongPlaying === "function" ? window.isSongPlaying() : false;
  document.querySelectorAll(".playlist-song").forEach(row => {
    const isActive = String(row.dataset.songId) === String(currentId);
    row.classList.toggle("active", isActive);
    row.classList.toggle("playing", isActive && isPlaying);
  });
}

function renderPlaylistsHome() {
  if (!playlistsHome || !playlistList) return;
  const playlists = loadPlaylists();
  playlistList.innerHTML = "";

  if (!playlists.length) {
    const empty = document.createElement("p");
    empty.className = "playlist-empty";
    empty.textContent = "No playlists yet";
    playlistList.appendChild(empty);
    return;
  }

  playlists.forEach(playlist => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "playlist-card";
    const count = playlist.songIds.length;
    card.innerHTML = `
      <div class="playlist-card-cover">
        <i class="fa-solid fa-music"></i>
      </div>
      <div class="playlist-card-info">
        <h3>${playlist.name}</h3>
        <p>${count} song${count === 1 ? "" : "s"}</p>
      </div>
    `;
    card.addEventListener("click", () => openPlaylistView(playlist.id));
    playlistList.appendChild(card);
  });
}

function openPlaylistView(playlistId) {
  activePlaylistId = playlistId;
  renderPlaylistView();
  if (playlistView) {
    lastPlaylistFocus = document.activeElement;
    playlistView.classList.remove("hidden");
    playlistView.setAttribute("aria-hidden", "false");
    playlistView.removeAttribute("inert");
    playlistBackBtn?.focus();
  }
}

function closePlaylistView() {
  activePlaylistId = null;
  if (playlistView) {
    playlistView.classList.add("hidden");
    playlistView.setAttribute("aria-hidden", "true");
    playlistView.setAttribute("inert", "");
  }
  if (lastPlaylistFocus instanceof HTMLElement) {
    lastPlaylistFocus.focus();
  } else {
    createPlaylistBtn?.focus();
  }
}

function renderPlaylistView() {
  if (!playlistViewList || !activePlaylistId) return;
  const playlist = loadPlaylists().find(item => item.id === activePlaylistId);
  if (!playlist) return;

  if (playlistViewTitle) playlistViewTitle.textContent = playlist.name;
  if (playlistViewCount) {
    playlistViewCount.textContent = `${playlist.songIds.length} song${playlist.songIds.length === 1 ? "" : "s"}`;
  }

  playlistViewList.innerHTML = "";

  if (!playlist.songIds.length) {
    const empty = document.createElement("p");
    empty.className = "playlist-empty";
    empty.textContent = "No songs in this playlist";
    playlistViewList.appendChild(empty);
    return;
  }

  playlist.songIds.forEach((songId, index) => {
    const song = findSongById(songId);
    const row = document.createElement("div");
    row.className = "playlist-song";
    row.dataset.songId = songId;

    row.innerHTML = `
      <span class="index">${index + 1}</span>
      <div class="eq">
        <span></span><span></span><span></span>
      </div>
      <img class="playlist-song-cover" src="${song?.cover || "assets/images/default.png"}" onerror="this.src='assets/images/default.png'" />
      <div class="playlist-song-info">
        <h4>${song?.title || "Unavailable song"}</h4>
        <p>${song?.artist || "Song not found"}</p>
      </div>
      <button class="playlist-menu-btn" aria-label="Playlist options">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>
      <div class="playlist-menu">
        <button class="playlist-remove">
          <i class="fa-solid fa-minus"></i>
          Remove from playlist
        </button>
      </div>
    `;

    row.addEventListener("click", event => {
      if (event.target.closest(".playlist-menu-btn") || event.target.closest(".playlist-menu")) return;
      const songIndex = getSongIndexById(songId);
      if (songIndex < 0) return;
      if (typeof window.loadSong === "function") {
        window.loadSong(songIndex, true, "manual");
      }
    });

    const menuBtn = row.querySelector(".playlist-menu-btn");
    const menu = row.querySelector(".playlist-menu");
    menuBtn.addEventListener("click", event => {
      event.stopPropagation();
      document.querySelectorAll(".playlist-menu").forEach(item => {
        if (item !== menu) item.classList.remove("menu-open");
      });
      menu.classList.toggle("menu-open");
    });

    menu.querySelector(".playlist-remove").addEventListener("click", event => {
      event.stopPropagation();
      removeSongFromPlaylist(activePlaylistId, String(songId));
      renderPlaylistView();
    });

     playlistViewList.appendChild(row);
  });

  syncPlaylistActiveState();
}

function openAddPanel() {
  if (!playlistAddPanel) return;
  lastAddPanelFocus = document.activeElement;
  playlistAddPanel.classList.remove("hidden");
  playlistAddPanel.setAttribute("aria-hidden", "false");
  playlistAddPanel.removeAttribute("inert");
  renderAddList();
  playlistAddClose?.focus();
}

function closeAddPanel() {
  if (!playlistAddPanel) return;
  playlistAddPanel.classList.add("hidden");
  playlistAddPanel.setAttribute("aria-hidden", "true");
  playlistAddPanel.setAttribute("inert", "");
  if (lastAddPanelFocus instanceof HTMLElement) {
    lastAddPanelFocus.focus();
  } else {
    playlistAddSongsBtn?.focus();
  }
}

function openCreatePanel() {
  if (!playlistCreatePanel) return;
  playlistCreatePanel.classList.remove("hidden");
  playlistCreatePanel.setAttribute("aria-hidden", "false");
  if (playlistCreateName) {
    playlistCreateName.value = "";
    playlistCreateName.focus();
  }
}

function closeCreatePanel() {
  if (!playlistCreatePanel) return;
  playlistCreatePanel.classList.add("hidden");
  playlistCreatePanel.setAttribute("aria-hidden", "true");
}


function renderAddList() {
  if (!playlistAddList || !activePlaylistId) return;
  const playlist = loadPlaylists().find(item => item.id === activePlaylistId);
  if (!playlist) return;
  const songs = getGlobalSongs();
  playlistAddList.innerHTML = "";

  if (!songs.length) {
    const empty = document.createElement("p");
    empty.className = "playlist-empty";
    empty.textContent = "No songs available";
    playlistAddList.appendChild(empty);
    return;
  }

  songs.forEach(song => {
    const songId = String(song.dbId);
    const row = document.createElement("label");
    row.className = "playlist-add-row";
    const isChecked = playlist.songIds.some(id => String(id) === songId);
    row.innerHTML = `
      <input type="checkbox" value="${songId}" ${isChecked ? "checked" : ""} />
      <span class="playlist-add-title">${song.title}</span>
      <span class="playlist-add-artist">${song.artist || "Unknown"}</span>
    `;
    playlistAddList.appendChild(row);
  });
}

function getSongIdsSnapshot() {
  return new Set(getGlobalSongs().map(song => String(song.dbId)));
}

function waitForNewSongs(existingIds) {
  return new Promise(resolve => {
    const start = Date.now();
    const maxWait = 6000;
    const interval = setInterval(() => {
      const currentIds = getGlobalSongs().map(song => String(song.dbId));
      const newIds = currentIds.filter(id => !existingIds.has(id));
      if (newIds.length) {
        clearInterval(interval);
        resolve(newIds);
      } else if (Date.now() - start > maxWait) {
        clearInterval(interval);
        resolve([]);
      }
    }, 200);
  });

}

createPlaylistBtn?.addEventListener("click", openCreatePanel);

playlistBackBtn?.addEventListener("click", closePlaylistView);

playlistAddSongsBtn?.addEventListener("click", () => {
  if (!activePlaylistId) return;
  openAddPanel();
});

playlistAddDeviceBtn?.addEventListener("click", () => {
  if (!activePlaylistId || !fileInput) return;
  pendingPlaylistAdd = activePlaylistId;
  pendingKnownIds = getSongIdsSnapshot();
  fileInput.click();
});

playlistAddClose?.addEventListener("click", closeAddPanel);
playlistAddCancel?.addEventListener("click", closeAddPanel);

playlistAddConfirm?.addEventListener("click", () => {
  if (!activePlaylistId || !playlistAddList) return;
  const selected = Array.from(playlistAddList.querySelectorAll("input[type='checkbox']"))
    .filter(input => input.checked)
    .map(input => input.value);
  selected.forEach(songId => addSongToPlaylist(activePlaylistId, String(songId)));
  closeAddPanel();
  renderPlaylistsHome();
  renderPlaylistView();
});

playlistDeleteBtn?.addEventListener("click", () => {
  if (!activePlaylistId) return;
  const playlist = loadPlaylists().find(item => item.id === activePlaylistId);
  const name = playlist?.name || "this playlist";
  const confirmed = window.confirm(`Delete "${name}"? This can't be undone.`);
  if (!confirmed) return;
  deletePlaylist(activePlaylistId);
  closePlaylistView();
  renderPlaylistsHome();
});

playlistCreateClose?.addEventListener("click", closeCreatePanel);
playlistCreateCancel?.addEventListener("click", closeCreatePanel);

playlistCreateConfirm?.addEventListener("click", () => {
  if (!playlistCreateName) return;
  const name = playlistCreateName.value.trim();
  if (!name) {
    playlistCreateName.focus();
    return;
  }
  createPlaylist(name);
  closeCreatePanel();
  renderPlaylistsHome();
});

playlistCreateName?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    playlistCreateConfirm?.click();
  }
});


fileInput?.addEventListener("change", () => {
  if (!pendingPlaylistAdd) return;
  const targetPlaylist = pendingPlaylistAdd;
  const knownIds = new Set(pendingKnownIds);
  pendingPlaylistAdd = null;
  waitForNewSongs(knownIds).then(newIds => {
    if (!newIds.length) return;
    newIds.forEach(songId => addSongToPlaylist(targetPlaylist, String(songId)));
    renderPlaylistsHome();
    renderPlaylistView();
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".playlist-menu").forEach(menu => {
    menu.classList.remove("menu-open");
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (playlistCreatePanel && !playlistCreatePanel.classList.contains("hidden")) {
      closeCreatePanel();
      return;
    }
    if (playlistAddPanel && !playlistAddPanel.classList.contains("hidden")) {
      closeAddPanel();
      return;
    }
    if (playlistView && !playlistView.classList.contains("hidden")) {
      closePlaylistView();
    }
  }
});

renderPlaylistsHome();
