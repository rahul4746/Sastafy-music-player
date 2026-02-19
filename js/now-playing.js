<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("nowPlayingModal");
  const closeBtn = modal?.querySelector(".now-playing-close");
  const backdrop = modal?.querySelector(".now-playing-backdrop");
  const controlsSlot = modal?.querySelector(".now-playing-controls-slot");
  const miniNowPlaying = document.querySelector(".mini-now-playing");
  const controlsWrapper = document.querySelector(".player-controls");
  const originalParent = controlsWrapper?.parentElement;
  const originalNextSibling = controlsWrapper?.nextElementSibling;
  const body = document.body;

  if (!modal || !controlsSlot || !controlsWrapper || !originalParent) return;

  const openModal = () => {
    if (modal.classList.contains("show")) return;
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.add("show");
    });
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("now-playing-open");
    controlsSlot.appendChild(controlsWrapper);
  };

  const closeModal = () => {
    if (!modal.classList.contains("show")) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("now-playing-open");
    if (originalNextSibling) {
      originalParent.insertBefore(controlsWrapper, originalNextSibling);
    } else {
      originalParent.appendChild(controlsWrapper);
    }
    window.setTimeout(() => {
      modal.classList.add("hidden");
    }, 250);
  };

  miniNowPlaying?.addEventListener("click", event => {
    if (event.target.closest("#queueBtn")) return;
    openModal();
  });

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
=======
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("nowPlayingModal");
  const closeBtn = modal?.querySelector(".now-playing-close");
  const backdrop = modal?.querySelector(".now-playing-backdrop");
  const controlsSlot = modal?.querySelector(".now-playing-controls-slot");
  const miniNowPlaying = document.querySelector(".mini-now-playing");
  const controlsWrapper = document.querySelector(".player-controls");
  const originalParent = controlsWrapper?.parentElement;
  const originalNextSibling = controlsWrapper?.nextElementSibling;
  const body = document.body;

  if (!modal || !controlsSlot || !controlsWrapper || !originalParent) return;

  const openModal = () => {
    if (modal.classList.contains("show")) return;
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.add("show");
    });
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("now-playing-open");
    controlsSlot.appendChild(controlsWrapper);
  };

  const closeModal = () => {
    if (!modal.classList.contains("show")) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("now-playing-open");
    if (originalNextSibling) {
      originalParent.insertBefore(controlsWrapper, originalNextSibling);
    } else {
      originalParent.appendChild(controlsWrapper);
    }
    window.setTimeout(() => {
      modal.classList.add("hidden");
    }, 250);
  };

  miniNowPlaying?.addEventListener("click", event => {
    if (event.target.closest("#queueBtn")) return;
    openModal();
  });

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
>>>>>>> master
});