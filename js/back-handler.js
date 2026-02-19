<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {
  const ensureAppHistory = () => {
    history.pushState({ appRoot: true }, "", window.location.href);
  };

  const toast = document.createElement("div");
  toast.className = "back-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = "Use Home or Recents to keep music playing in background.";
  document.body.appendChild(toast);

  let toastTimeout;
  const showToast = () => {
    toast.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  };

  if (!history.state || !history.state.appRoot) {
    ensureAppHistory();
  }

  const closeButtonClick = selector => {
    const button = document.querySelector(selector);
    if (button) {
      button.click();
      return true;
    }
    return false;
  };

  const closeIfOpen = () => {
    const playlistDeletePanel = document.getElementById("playlistDeletePanel");
    if (playlistDeletePanel && !playlistDeletePanel.classList.contains("hidden")) {
      return closeButtonClick("#playlistDeleteClose") || closeButtonClick("#playlistDeleteCancel");
    }

    const playlistCreatePanel = document.getElementById("playlistCreatePanel");
    if (playlistCreatePanel && !playlistCreatePanel.classList.contains("hidden")) {
      return closeButtonClick("#playlistCreateClose") || closeButtonClick("#playlistCreateCancel");
    }

    const playlistAddPanel = document.getElementById("playlistAddPanel");
    if (playlistAddPanel && !playlistAddPanel.classList.contains("hidden")) {
      return closeButtonClick("#playlistAddClose") || closeButtonClick("#playlistAddCancel");
    }

    const songPlaylistPanel = document.getElementById("songPlaylistPanel");
    if (songPlaylistPanel && !songPlaylistPanel.classList.contains("hidden")) {
      return closeButtonClick("#songPlaylistClose") || closeButtonClick("#songPlaylistCancel");
    }

    const nowPlayingModal = document.getElementById("nowPlayingModal");
    if (nowPlayingModal && !nowPlayingModal.classList.contains("hidden")) {
      return closeButtonClick(".now-playing-close");
    }

    const queuePanel = document.getElementById("queuePanel");
    if (queuePanel && !queuePanel.classList.contains("hidden")) {
      return closeButtonClick("#queueBackdrop");
    }

    const playlistView = document.getElementById("playlistView");
    if (playlistView && !playlistView.classList.contains("hidden")) {
      return closeButtonClick("#playlistBack");
    }

    return false;
  };

  window.addEventListener("popstate", () => {
    const handledOverlay = closeIfOpen();
    if (handledOverlay) {
      window.setTimeout(ensureAppHistory, 60);
    } else {
      if (typeof window.isSongPlaying === "function" && window.isSongPlaying()) {
        showToast();
      }
      ensureAppHistory();
    }
  });
});
=======
document.addEventListener("DOMContentLoaded", () => {
  const ensureAppHistory = () => {
    history.pushState({ appRoot: true }, "", window.location.href);
  };

  const toast = document.createElement("div");
  toast.className = "back-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = "Use Home or Recents to keep music playing in background.";
  document.body.appendChild(toast);

  let toastTimeout;
  const showToast = () => {
    toast.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  };

  if (!history.state || !history.state.appRoot) {
    ensureAppHistory();
  }

  const closeButtonClick = selector => {
    const button = document.querySelector(selector);
    if (button) {
      button.click();
      return true;
    }
    return false;
  };

  const closeIfOpen = () => {
    const playlistDeletePanel = document.getElementById("playlistDeletePanel");
    if (playlistDeletePanel && !playlistDeletePanel.classList.contains("hidden")) {
      return closeButtonClick("#playlistDeleteClose") || closeButtonClick("#playlistDeleteCancel");
    }

    const playlistCreatePanel = document.getElementById("playlistCreatePanel");
    if (playlistCreatePanel && !playlistCreatePanel.classList.contains("hidden")) {
      return closeButtonClick("#playlistCreateClose") || closeButtonClick("#playlistCreateCancel");
    }

    const playlistAddPanel = document.getElementById("playlistAddPanel");
    if (playlistAddPanel && !playlistAddPanel.classList.contains("hidden")) {
      return closeButtonClick("#playlistAddClose") || closeButtonClick("#playlistAddCancel");
    }

    const songPlaylistPanel = document.getElementById("songPlaylistPanel");
    if (songPlaylistPanel && !songPlaylistPanel.classList.contains("hidden")) {
      return closeButtonClick("#songPlaylistClose") || closeButtonClick("#songPlaylistCancel");
    }

    const nowPlayingModal = document.getElementById("nowPlayingModal");
    if (nowPlayingModal && !nowPlayingModal.classList.contains("hidden")) {
      return closeButtonClick(".now-playing-close");
    }

    const queuePanel = document.getElementById("queuePanel");
    if (queuePanel && !queuePanel.classList.contains("hidden")) {
      return closeButtonClick("#queueBackdrop");
    }

    const playlistView = document.getElementById("playlistView");
    if (playlistView && !playlistView.classList.contains("hidden")) {
      return closeButtonClick("#playlistBack");
    }

    return false;
  };

  window.addEventListener("popstate", () => {
    const handledOverlay = closeIfOpen();
    if (handledOverlay) {
      window.setTimeout(ensureAppHistory, 60);
    } else {
      if (typeof window.isSongPlaying === "function" && window.isSongPlaying()) {
        showToast();
      }
      ensureAppHistory();
    }
  });
});
>>>>>>> master
