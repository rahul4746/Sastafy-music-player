/* ===============================
   Sastafy Music Player - Storage
   IndexedDB based (PC + Mobile)
   =============================== */

let db = null;
const DB_NAME = "sastafyDB";
const DB_VERSION = 1;
const STORE_NAME = "songs";

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
function saveSongToDB(file) {
  return new Promise(async (resolve, reject) => {
    await dbReady;

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
function getAllSongsFromDB() {
  return new Promise(async (resolve, reject) => {
    await dbReady;

    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Failed to fetch songs");
  });
}

/* ---------- Delete One Song ---------- */
function deleteSongFromDB(id) {
  return new Promise(async (resolve, reject) => {
    await dbReady;

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Failed to delete song");
  });
}

/* ---------- Clear All Songs ---------- */
function clearAllSongsFromDB() {
  return new Promise(async (resolve, reject) => {
    await dbReady;

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Failed to clear DB");
  });
}

/* ---------- Utility: Blob to URL ---------- */
function createSongURL(blob) {
  return URL.createObjectURL(blob);
}
