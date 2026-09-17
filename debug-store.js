const DEBUG_DB_NAME = "hde-push-debug";
const DEBUG_STORE_NAME = "logs";

function openDebugDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DEBUG_DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(DEBUG_STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function debugStoreSet(key, value) {
  const db = await openDebugDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DEBUG_STORE_NAME, "readwrite");
    tx.objectStore(DEBUG_STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function debugStoreGet(key) {
  const db = await openDebugDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DEBUG_STORE_NAME, "readonly");
    const req = tx.objectStore(DEBUG_STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
