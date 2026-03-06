const DB_NAME = "linkedinPetAvatars";
const DB_VERSION = 1;
const PHOTO_STORE = "photos";

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        const store = db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open photo database."));
  });
}

async function withStore(mode, handler) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PHOTO_STORE, mode);
    const store = transaction.objectStore(PHOTO_STORE);

    let handlerResult;
    try {
      handlerResult = handler(store, transaction);
    } catch (error) {
      reject(error);
      db.close();
      return;
    }

    transaction.oncomplete = async () => {
      db.close();
      try {
        resolve(await handlerResult);
      } catch (error) {
        reject(error);
      }
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB transaction failed."));
    };

    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB transaction aborted."));
    };
  });
}

export async function listPhotos() {
  return withStore("readonly", async (store) => {
    const records = await promisifyRequest(store.getAll());
    return records.sort((left, right) => right.createdAt - left.createdAt);
  });
}

export async function savePhotos(records) {
  return withStore("readwrite", (store) => {
    records.forEach((record) => store.put(record));
  });
}

export async function deletePhoto(id) {
  return withStore("readwrite", (store) => {
    store.delete(id);
  });
}

export async function countPhotos() {
  return withStore("readonly", async (store) => promisifyRequest(store.count()));
}
