const SETTINGS_KEY = "enabled";
const PHOTO_COUNT_KEY = "photoCount";
const toggle = document.getElementById("enabled-toggle");
const manageButton = document.getElementById("manage-photos");
const photoCount = document.getElementById("photo-count");
const statusCopy = document.getElementById("status-copy");

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

async function readEnabled() {
  const result = await storageGet(chrome.storage.sync, { [SETTINGS_KEY]: true });
  return Boolean(result[SETTINGS_KEY]);
}

async function readPhotoCount() {
  const result = await storageGet(chrome.storage.local, { [PHOTO_COUNT_KEY]: 0 });
  return Number(result[PHOTO_COUNT_KEY]) || 0;
}

function renderPhotoCount(count) {
  photoCount.textContent = String(count);
  statusCopy.textContent =
    count > 0
      ? `Your LinkedIn avatars are rotating through ${count} uploaded pet photo${count === 1 ? "" : "s"}.`
      : "Using the built-in sample photo until you upload your own photos.";
}

async function initPopup() {
  const [enabled, count] = await Promise.all([readEnabled(), readPhotoCount()]);
  toggle.checked = enabled;
  renderPhotoCount(count);

  toggle.addEventListener("change", async () => {
    toggle.disabled = true;
    await storageSet(chrome.storage.sync, { [SETTINGS_KEY]: toggle.checked });
    toggle.disabled = false;
  });

  manageButton.addEventListener("click", async () => {
    await chrome.runtime.openOptionsPage();
    window.close();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[PHOTO_COUNT_KEY]) {
      renderPhotoCount(Number(changes[PHOTO_COUNT_KEY].newValue) || 0);
    }
  });
}

initPopup().catch(() => {
  toggle.disabled = true;
  manageButton.disabled = true;
  statusCopy.textContent = "The popup could not load extension settings.";
});
