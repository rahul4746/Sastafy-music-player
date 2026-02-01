const RESUME_KEY = "sastafy-resume";

/* Save current song + time */
function saveResumeState(index, time) {
  localStorage.setItem(
    RESUME_KEY,
    JSON.stringify({ index, time })
  );
}

/* Load resume state */
function loadResumeState() {
  try {
    return JSON.parse(localStorage.getItem(RESUME_KEY));
  } catch {
    return null;
  }
}

/* Clear resume state (optional) */
function clearResumeState() {
  localStorage.removeItem(RESUME_KEY);
}
