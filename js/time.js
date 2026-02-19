// time.js
// Handles audio time display (current / duration)

export function initTimeDisplay(audio, currentEl, durationEl) {
  const progress = document.getElementById("progress");

  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";

    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  // Update current time while playing
  audio.addEventListener("timeupdate", () => {
    if (!currentEl) return;
    currentEl.textContent = formatTime(audio.currentTime);
  });

  // Update duration when metadata loads
  audio.addEventListener("loadedmetadata", () => {
    if (!durationEl) return;
    durationEl.textContent = formatTime(audio.duration);
  });

  // Reset when audio is cleared
  audio.addEventListener("emptied", () => {
    if (currentEl) currentEl.textContent = "00:00";
    if (durationEl) durationEl.textContent = "00:00";
  });

  // Click-to-seek on progress bar
  if (progress) {
    progress.addEventListener("click", (e) => {
      if (!audio.duration) return;
      const rect = progress.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = Math.max(0, Math.min(percent * audio.duration, audio.duration));
      audio.currentTime = newTime;
      progress.value = (newTime / audio.duration) * 100;
    });
  }
}
