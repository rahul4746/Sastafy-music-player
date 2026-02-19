<<<<<<< HEAD
let deferredPrompt = null;

document.addEventListener("DOMContentLoaded", () => {
  const installBtn = document.getElementById("installBtn");

  if (!installBtn) return;

  // Hide by default
  installBtn.style.display = "none";

  // Fired only once per session (THIS IS NORMAL)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();      // stop auto banner
    deferredPrompt = e;      // save event
    installBtn.style.display = "inline-flex";
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    // Show install dialog
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    // Clear after use
    deferredPrompt = null;
    installBtn.style.display = "none";
  });

  // Optional: hide button after install
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installBtn.style.display = "none";
    console.log("PWA installed");
  });
});
=======
let deferredPrompt = null;

document.addEventListener("DOMContentLoaded", () => {
  const installBtn = document.getElementById("installBtn");

  if (!installBtn) return;

  // Hide by default
  installBtn.style.display = "none";

  // Fired only once per session (THIS IS NORMAL)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();      // stop auto banner
    deferredPrompt = e;      // save event
    installBtn.style.display = "inline-flex";
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    // Show install dialog
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    // Clear after use
    deferredPrompt = null;
    installBtn.style.display = "none";
  });

  // Optional: hide button after install
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installBtn.style.display = "none";
    console.log("PWA installed");
  });
});
>>>>>>> master
