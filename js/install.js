let deferredPrompt;

document.addEventListener("DOMContentLoaded", () => {
  const installBtn = document.getElementById("downloadBtn");

  // Safety check
  if (!installBtn) return;

  // Hide button initially
  installBtn.style.display = "none";

  // Listen for install availability
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();          // stop automatic mini-infobar
    deferredPrompt = e;          // save the event
    installBtn.style.display = "inline-flex";
  });

  // Handle install button click
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    deferredPrompt = null;
    installBtn.style.display = "none";
  });
});
