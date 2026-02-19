/* ===============================
   BeatFlow Music Player - Storage
   IndexedDB based (PC + Mobile)
   =============================== */

let db = null;
const DB_NAME = "beatflowDB";
const DB_VERSION = 1;
const STORE_NAME = "songs";
const blobURLs = new Set();

/* ---------- Open / Init DB ---------- */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => {
      const database = e.target.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });
      }
    };

    request.onsuccess = e => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = e => {
      console.error("IndexedDB error:", e);
      reject("Failed to open DB");
    };
  });
}

/* 🔑 IMPORTANT: global DB-ready promise */
const dbReady = openDB();

/* ---------- Save Song ---------- */
async function saveSongToDB(file) {
  await dbReady;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const songData = {
        id: Date.now() + Math.random(), // unique ID
        name: file.name,
        type: file.type,
        size: file.size,
        blob: new Blob([reader.result], { type: file.type })
      };

      store.add(songData);

      tx.oncomplete = () => resolve(songData);
      tx.onerror = () => reject("Failed to save song");
    };

    reader.onerror = () => reject("File read error");

    reader.readAsArrayBuffer(file);
  });
}

/* ---------- Get All Songs ---------- */
async function getAllSongsFromDB() {
  await dbReady;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Failed to fetch songs");
  });
}

/* ---------- Delete One Song ---------- */
async function deleteSongFromDB(id) {
  await dbReady;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Failed to delete song");
  });
}

/* ---------- Clear All Songs ---------- */
async function clearAllSongsFromDB() {
  await dbReady;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Failed to clear DB");
  });
}

/* ---------- Utility: Blob to URL ---------- */
function createSongURL(blob) {
  const url = URL.createObjectURL(blob);
  blobURLs.add(url);
  return url;
}

/* ---------- Revoke Blob URL ---------- */
function revokeSongURL(url) {
  if (blobURLs.has(url)) {
    URL.revokeObjectURL(url);
    blobURLs.delete(url);
  }
}

/* ---------- Clear All Blob URLs ---------- */
function clearAllBlobURLs() {
  blobURLs.forEach(url => URL.revokeObjectURL(url));
  blobURLs.clear();
}
