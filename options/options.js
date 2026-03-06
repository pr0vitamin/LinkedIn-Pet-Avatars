import { listPhotos, savePhotos, deletePhoto } from "../shared/idb.js";

const GALLERY_REVISION_KEY = "galleryRevision";
const PHOTO_COUNT_KEY = "photoCount";
const MAX_PHOTOS = 100;
const OUTPUT_SIZE = 512;
const OUTPUT_QUALITY = 0.82;
const PHOTO_STYLE_VERSION = 2;

const photoInput = document.getElementById("photo-input");
const uploadButton = document.getElementById("upload-button");
const librarySummary = document.getElementById("library-summary");
const statusBanner = document.getElementById("status-banner");
const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("empty-state");
const photoCardTemplate = document.getElementById("photo-card-template");

function storageSet(area, values) {
  return new Promise((resolve) => {
    area.set(values, () => resolve());
  });
}

function showStatus(message, tone = "success") {
  statusBanner.hidden = false;
  statusBanner.dataset.tone = tone;
  statusBanner.textContent = message;
}

function clearStatus() {
  statusBanner.hidden = true;
  statusBanner.textContent = "";
  delete statusBanner.dataset.tone;
}

function formatSummary(count) {
  return `${count} photo${count === 1 ? "" : "s"} uploaded`;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(timestamp);
}

async function syncGalleryMetadata(count) {
  await storageSet(chrome.storage.local, {
    [GALLERY_REVISION_KEY]: Date.now(),
    [PHOTO_COUNT_KEY]: count
  });
}

async function convertFileToPhotoRecord(file) {
  const bitmap = await createImageBitmap(file);
  const square = Math.min(bitmap.width, bitmap.height);
  const sourceX = Math.max(0, Math.floor((bitmap.width - square) / 2));
  const sourceY = Math.max(0, Math.floor((bitmap.height - square) / 2));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  context.drawImage(bitmap, sourceX, sourceY, square, square, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", OUTPUT_QUALITY);
  return {
    id: crypto.randomUUID(),
    mimeType: "image/jpeg",
    createdAt: Date.now(),
    styleVersion: PHOTO_STYLE_VERSION,
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    dataUrl
  };
}

async function renderGallery() {
  const photos = await listPhotos();
  librarySummary.textContent = formatSummary(photos.length);
  gallery.replaceChildren();

  if (photos.length === 0) {
    emptyState.hidden = false;
    gallery.hidden = true;
    return;
  }

  emptyState.hidden = true;
  gallery.hidden = false;

  photos.forEach((photo) => {
    const fragment = photoCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".photo-card");
    const image = fragment.querySelector(".photo-preview");
    const sizeLabel = fragment.querySelector(".photo-size");
    const deleteButtonNode = fragment.querySelector(".delete-button");

    image.src = photo.dataUrl;
    image.alt = `Uploaded pet photo from ${formatDate(photo.createdAt)}`;
    sizeLabel.textContent = `${photo.width} x ${photo.height}`;

    deleteButtonNode.addEventListener("click", async () => {
      deleteButtonNode.disabled = true;
      await deletePhoto(photo.id);
      const nextPhotos = await listPhotos();
      await syncGalleryMetadata(nextPhotos.length);
      await renderGallery();
      showStatus("Removed photo from your pet rotation.");
    });

    card.dataset.photoId = photo.id;
    gallery.appendChild(fragment);
  });
}

async function handleUpload(files) {
  clearStatus();
  const existing = await listPhotos();
  const availableSlots = Math.max(0, MAX_PHOTOS - existing.length);

  if (availableSlots === 0) {
    showStatus(`You already have the maximum of ${MAX_PHOTOS} photos. Delete some before importing more.`, "error");
    return;
  }

  const acceptedFiles = Array.from(files).slice(0, availableSlots);
  if (acceptedFiles.length === 0) {
    showStatus("No supported files were selected.", "error");
    return;
  }

  uploadButton.disabled = true;
  uploadButton.textContent = "Importing...";

  const importedRecords = [];
  const failures = [];

  for (const file of acceptedFiles) {
    try {
      importedRecords.push(await convertFileToPhotoRecord(file));
    } catch (_error) {
      failures.push(file.name);
    }
  }

  let notice = "";
  let tone = "success";

  if (importedRecords.length > 0) {
    await savePhotos(importedRecords);
    const total = existing.length + importedRecords.length;
    await syncGalleryMetadata(total);
    await renderGallery();
    notice = `Imported ${importedRecords.length} photo${importedRecords.length === 1 ? "" : "s"}.`;
  }

  if (failures.length > 0) {
    notice = `${notice ? `${notice} ` : ""}Skipped ${failures.length} file${failures.length === 1 ? "" : "s"}: ${failures.join(", ")}`;
    tone = "error";
  }

  if (files.length > availableSlots) {
    notice = `${notice ? `${notice} ` : ""}Imported the first ${availableSlots} photo${availableSlots === 1 ? "" : "s"}; the gallery limit is ${MAX_PHOTOS}.`;
    tone = "error";
  }

  if (notice) {
    showStatus(notice, tone);
  }

  uploadButton.disabled = false;
  uploadButton.textContent = "Upload Photos";
  photoInput.value = "";
}

async function initOptions() {
  await renderGallery();

  uploadButton.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    await handleUpload(files);
  });
}

initOptions().catch(() => {
  showStatus("The photo manager could not load your local gallery.", "error");
  uploadButton.disabled = true;
});
