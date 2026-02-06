const PLAYLISTS_KEY = "sastafy_playlists";

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

export {
  loadPlaylists,
  savePlaylists,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist
};