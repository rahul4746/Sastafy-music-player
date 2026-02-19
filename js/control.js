// control.js
// Handles lock-screen, notification & media-key controls

export function initMediaControls(audio, getCurrentSong, controls) {
  // Exit silently if not supported
  if (!("mediaSession" in navigator)) return;

  // Play / Pause
  navigator.mediaSession.setActionHandler("play", () => {
    audio.play();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audio.pause();
  });

  // Previous / Next
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    controls.prev && controls.prev();
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    controls.next && controls.next();
  });

  // Set metadata if a song already exists
  const song = getCurrentSong();
  if (song) updateMediaInfo(song);
}

export function updateMediaInfo(song) {
  if (!("mediaSession" in navigator) || !song) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title || "",
    artist: song.artist || "",
    album: "BeatFlow Music Player",
    artwork: [
      {
        src: song.cover || "assets/images/default.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  });
}
