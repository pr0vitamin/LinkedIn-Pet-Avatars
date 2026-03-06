import { listPhotos, countPhotos } from "./shared/idb.js";

const SETTINGS_KEY = "enabled";
const GALLERY_REVISION_KEY = "galleryRevision";
const PHOTO_COUNT_KEY = "photoCount";

let galleryCache = null;
let galleryCacheRevision = null;

function storageGet(area, defaults) {
  return new Promise((resolve) => {
    area.get(defaults, (result) => resolve(result));
  });
}

function storageSet(area, values) {
  return new Promise((resolve) => {
    area.set(values, () => resolve());
  });
}

async function ensureDefaults() {
  const syncValues = await storageGet(chrome.storage.sync, { [SETTINGS_KEY]: true });
  const localValues = await storageGet(chrome.storage.local, {
    [GALLERY_REVISION_KEY]: 0,
    [PHOTO_COUNT_KEY]: 0
  });

  const updates = {};
  if (typeof syncValues[SETTINGS_KEY] !== "boolean") {
    await storageSet(chrome.storage.sync, { [SETTINGS_KEY]: true });
  }

  if (typeof localValues[GALLERY_REVISION_KEY] !== "number") {
    updates[GALLERY_REVISION_KEY] = 0;
  }

  if (typeof localValues[PHOTO_COUNT_KEY] !== "number") {
    updates[PHOTO_COUNT_KEY] = 0;
  }

  if (Object.keys(updates).length > 0) {
    await storageSet(chrome.storage.local, updates);
  }
}

async function getGalleryPayload() {
  const { [GALLERY_REVISION_KEY]: revision = 0 } = await storageGet(chrome.storage.local, {
    [GALLERY_REVISION_KEY]: 0
  });

  if (galleryCache && galleryCacheRevision === revision) {
    return { photos: galleryCache, revision };
  }

  const records = await listPhotos();
  galleryCache = records.map((record) => ({
    id: record.id,
    mimeType: record.mimeType,
    createdAt: record.createdAt,
    width: record.width,
    height: record.height,
    dataUrl: record.dataUrl
  }));
  galleryCacheRevision = revision;

  return { photos: galleryCache, revision };
}

async function refreshPhotoCount() {
  const total = await countPhotos();
  await storageSet(chrome.storage.local, { [PHOTO_COUNT_KEY]: total });
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await refreshPhotoCount();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await refreshPhotoCount();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[GALLERY_REVISION_KEY]) {
    galleryCache = null;
    galleryCacheRevision = null;
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "get-gallery") {
    getGalleryPayload()
      .then(sendResponse)
      .catch(() => sendResponse({ photos: [], revision: 0 }));
    return true;
  }

  return false;
});
