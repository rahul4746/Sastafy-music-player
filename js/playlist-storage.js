
const PLAYLISTS_KEY = "beatflow_playlists";
const LIKES_KEY = "beatflow_likes";

function loadPlaylists() {
  const raw = localStorage.getItem(PLAYLISTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to parse playlists", error);
    return [];
  }
}

function savePlaylists(playlists) {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

function createPlaylist(name) {
  const playlists = loadPlaylists();
  const playlist = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    songIds: []
  };
  playlists.push(playlist);
  savePlaylists(playlists);
  return playlist;
}

function addSongToPlaylist(playlistId, songId) {
  const playlists = loadPlaylists();
  const playlist = playlists.find(item => item.id === playlistId);
  if (!playlist) return null;
  const normalizedId = String(songId);
  if (!playlist.songIds.includes(normalizedId)) {
    playlist.songIds.push(normalizedId);
  }
  savePlaylists(playlists);
  return playlist;
}

function removeSongFromPlaylist(playlistId, songId) {
  const playlists = loadPlaylists();
  const playlist = playlists.find(item => item.id === playlistId);
  if (!playlist) return null;
  const normalizedId = String(songId);
  playlist.songIds = playlist.songIds.filter(id => String(id) !== normalizedId);
  savePlaylists(playlists);
  return playlist;
}

function deletePlaylist(playlistId) {
  const playlists = loadPlaylists().filter(item => item.id !== playlistId);
  savePlaylists(playlists);
  return playlists;
}

function removeSongFromAllPlaylists(songId) {
  const playlists = loadPlaylists();
  const normalizedId = String(songId);
  let changed = false;

  playlists.forEach(playlist => {
    const beforeLength = playlist.songIds.length;
    playlist.songIds = playlist.songIds.filter(id => String(id) !== normalizedId);
    if (playlist.songIds.length !== beforeLength) {
      changed = true;
    }
  });

  if (changed) {
    savePlaylists(playlists);
  }
}

function loadLikes() {
  const raw = localStorage.getItem(LIKES_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function saveLikes(ids) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(ids.map(String)));
}

function isLiked(songId) {
  const id = String(songId);
  const likes = loadLikes();
  return likes.includes(id);
}

function addLike(songId) {
  const id = String(songId);
  const likes = new Set(loadLikes());
  likes.add(id);
  saveLikes([...likes]);
  return [...likes];
}

function removeLike(songId) {
  const id = String(songId);
  const likes = new Set(loadLikes());
  likes.delete(id);
  saveLikes([...likes]);
  return [...likes];
}

function getLikes() {
  return loadLikes();
}

export {
  loadPlaylists,
  savePlaylists,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
  removeSongFromAllPlaylists,
  loadLikes,
  saveLikes,
  isLiked,
  addLike,
  removeLike,
  getLikes
};
