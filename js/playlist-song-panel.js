import {
  loadPlaylists,
  addSongToPlaylist,
  removeSongFromPlaylist
} from "./playlist-storage.js";

const songPlaylistPanel = document.getElementById("songPlaylistPanel");
const songPlaylistList = document.getElementById("songPlaylistList");
const songPlaylistClose = document.getElementById("songPlaylistClose");
const songPlaylistCancel = document.getElementById("songPlaylistCancel");
const songPlaylistConfirm = document.getElementById("songPlaylistConfirm");
const songPlaylistName = document.getElementById("songPlaylistName");

let activeSongId = null;
let lastSongPlaylistFocus = null;

if (songPlaylistPanel?.classList.contains("hidden")) {
  songPlaylistPanel.setAttribute("inert", "");
}

function setSongName(name) {
  if (!songPlaylistName) return;
  songPlaylistName.textContent = name || "this song";
}

function renderSongPlaylistList() {
  if (!songPlaylistList || !activeSongId) return;
  const playlists = loadPlaylists();
  songPlaylistList.innerHTML = "";

  if (!playlists.length) {
    const empty = document.createElement("p");
    empty.className = "playlist-empty";
    empty.textContent = "No playlists yet";
    songPlaylistList.appendChild(empty);
    return;
  }

  playlists.forEach(playlist => {
    const row = document.createElement("label");
    row.className = "playlist-add-row";
    const isChecked = playlist.songIds.some(id => String(id) === String(activeSongId));
    const count = playlist.songIds.length;
    row.innerHTML = `
      <input type="checkbox" value="${playlist.id}" ${isChecked ? "checked" : ""} />
      <span class="playlist-add-title">${playlist.name}</span>
      <span class="playlist-add-artist">${count} song${count === 1 ? "" : "s"}</span>
    `;
    songPlaylistList.appendChild(row);
  });
}

function openSongPlaylistPanel(songId, songTitle) {
  if (!songPlaylistPanel) return;
  activeSongId = String(songId);
  lastSongPlaylistFocus = document.activeElement;
  setSongName(songTitle);
  renderSongPlaylistList();
  songPlaylistPanel.classList.remove("hidden");
  songPlaylistPanel.setAttribute("aria-hidden", "false");
  songPlaylistPanel.removeAttribute("inert");
  songPlaylistClose?.focus();
}

function closeSongPlaylistPanel() {
  if (!songPlaylistPanel) return;
  songPlaylistPanel.classList.add("hidden");
  songPlaylistPanel.setAttribute("aria-hidden", "true");
  songPlaylistPanel.setAttribute("inert", "");
  if (lastSongPlaylistFocus instanceof HTMLElement) {
    lastSongPlaylistFocus.focus();
  }
  activeSongId = null;
}

songPlaylistClose?.addEventListener("click", closeSongPlaylistPanel);
songPlaylistCancel?.addEventListener("click", closeSongPlaylistPanel);

songPlaylistConfirm?.addEventListener("click", () => {
  if (!activeSongId || !songPlaylistList) return;
  const playlists = loadPlaylists();
  const selected = new Set(
    Array.from(songPlaylistList.querySelectorAll("input[type='checkbox']"))
      .filter(input => input.checked)
      .map(input => String(input.value))
  );
  playlists.forEach(playlist => {
    if (selected.has(playlist.id)) {
      addSongToPlaylist(playlist.id, activeSongId);
    } else {
      removeSongFromPlaylist(playlist.id, activeSongId);
    }
  });
  document.dispatchEvent(new CustomEvent("playlists-updated"));
  closeSongPlaylistPanel();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (songPlaylistPanel && !songPlaylistPanel.classList.contains("hidden")) {
      closeSongPlaylistPanel();
    }
  }
});

export { openSongPlaylistPanel };