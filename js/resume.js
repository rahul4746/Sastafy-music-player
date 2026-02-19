const RESUME_KEY = "beatflow_resume";

/* Save current song + time (by songId) */
export function saveResumeState(songId, time) {
  if (!songId) return;
  localStorage.setItem(
    RESUME_KEY,
    JSON.stringify({ songId: String(songId), time })
  );
}

/* Load resume state */
export function loadResumeState() {
  try {
    const data = localStorage.getItem(RESUME_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/* Clear resume state (optional) */
export function clearResumeState() {
  localStorage.removeItem(RESUME_KEY);
}
