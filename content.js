const SETTINGS_KEY = "enabled";
const GALLERY_REVISION_KEY = "galleryRevision";
const PROCESSED_FLAG = "petAvatarProcessed";
const FRAMED_FLAG = "openToSnacksFramed";
const BANNER_FLAG = "openToSnacksBanner";
const STYLE_TAG_ID = "open-to-snacks-runtime-style";
const FALLBACK_PET_IMAGES = ["assets/sample-image.jpg"].map((path) => chrome.runtime.getURL(path));
const EXCLUDED_CONTAINERS = [
  ".msg-overlay-container",
  ".msg-conversations-container",
  ".msg-thread",
  "[data-test-artdeco-messaging]"
];
const EXCLUDED_SRC_PATTERNS = [
  "company-logo",
  "feedshare",
  "articleshare",
  "image-shrink_",
  "videocover",
  "profile-displaybackgroundimage",
  "media/aayabat",
  "px.ads.linkedin.com/collect"
];
const AVATAR_SRC_PATTERNS = [
  "profile-displayphoto",
  "profile-framedphoto"
];
const AVATAR_TEXT_PATTERNS = [
  /view .*profile/,
  /member profile/,
  /open to work/
];

let enabled = true;
let observer = null;
let scheduled = false;
let lastHref = window.location.href;
let uploadedPetImages = [];

function ensureRuntimeStyles() {
  if (document.getElementById(STYLE_TAG_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = `
    [data-open-to-snacks-framed="1"] {
      position: relative !important;
      overflow: visible !important;
      isolation: isolate;
    }

    [data-open-to-snacks-framed="1"]::before {
      content: "";
      position: absolute;
      inset: var(--ots-ring-inset, -2px);
      border: var(--ots-ring-width, 2px) solid #057642;
      border-radius: 999px;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.92);
      pointer-events: none;
      z-index: 2;
    }

    [data-open-to-snacks-framed="1"][data-open-to-snacks-banner="1"]::after {
      content: "#OPENTO\\A SNACKS";
      white-space: pre;
      position: absolute;
      left: 50%;
      bottom: var(--ots-banner-bottom, -10px);
      transform: translateX(-50%);
      width: var(--ots-banner-width, 54px);
      padding: var(--ots-banner-padding, 2px 0 3px);
      border-radius: 999px;
      background: #057642;
      color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: var(--ots-banner-font-size, 8px);
      font-weight: 900;
      line-height: 0.9;
      letter-spacing: 0.02em;
      text-align: center;
      text-transform: uppercase;
      box-shadow: 0 2px 6px rgba(5, 118, 66, 0.3);
      pointer-events: none;
      z-index: 3;
    }

    img[data-open-to-snacks-image="1"] {
      border-radius: 999px !important;
      position: relative;
      z-index: 1;
    }
  `;
  document.documentElement.appendChild(style);
}

function storageGet(area, defaults) {
  return new Promise((resolve) => {
    area.get(defaults, (result) => resolve(result));
  });
}

async function readEnabled() {
  const result = await storageGet(chrome.storage.sync, { [SETTINGS_KEY]: true });
  return Boolean(result[SETTINGS_KEY]);
}

async function refreshUploadedPetImages() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "get-gallery" });
    uploadedPetImages = Array.isArray(response?.photos)
      ? response.photos
          .map((photo) => photo.dataUrl)
          .filter((value) => typeof value === "string" && value.length > 0)
      : [];
  } catch (_error) {
    uploadedPetImages = [];
  }
}

function getPhotoPool() {
  return uploadedPetImages.length > 0 ? uploadedPetImages : FALLBACK_PET_IMAGES;
}

function getRandomPetUrl() {
  const pool = getPhotoPool();
  return pool[Math.floor(Math.random() * pool.length)];
}

function getAvatarFrameTarget(img) {
  let current = img.parentElement;

  while (current && current !== document.body) {
    const rect = current.getBoundingClientRect();
    const style = window.getComputedStyle(current);
    const square = rect.width > 0 && Math.abs(rect.width - rect.height) <= 4;
    const radius = Number.parseFloat(style.borderRadius) || 0;
    const circular = style.borderRadius.includes("999") || radius >= Math.min(rect.width, rect.height) / 2 - 3;
    const clipsChildren = style.overflow === "hidden" || style.overflow === "clip";

    if (square && circular && clipsChildren) {
      return current;
    }

    current = current.parentElement;
  }

  return img.parentElement;
}

function isStackedAvatar(img) {
  const listItem = img.closest("li");
  const list = img.closest("ul, ol");

  if (!(listItem instanceof HTMLElement) || !(list instanceof HTMLElement)) {
    return false;
  }

  const itemRect = listItem.getBoundingClientRect();
  const siblingItems = Array.from(list.children).filter(
    (node) => node instanceof HTMLElement && node !== listItem
  );

  return siblingItems.some((node) => {
    const siblingRect = node.getBoundingClientRect();
    const horizontalOverlap = itemRect.left < siblingRect.right && siblingRect.left < itemRect.right;
    const nearSameRow = Math.abs(itemRect.top - siblingRect.top) <= Math.max(4, itemRect.height * 0.35);
    return horizontalOverlap && nearSameRow;
  });
}

function applyFrameDecoration(img) {
  const target = getAvatarFrameTarget(img);

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const size = Math.round(Math.max(rect.width, rect.height, img.width, img.height));
  const showBanner = size >= 60 && !isStackedAvatar(img);
  const ringWidth = size >= 72 ? 4 : size >= 44 ? 3 : 2;
  const ringInset = size >= 72 ? -3 : size >= 44 ? -2 : -1;
  const bannerWidth = size >= 120 ? 72 : size >= 84 ? 66 : 58;
  const bannerFontSize = size >= 120 ? 10 : size >= 84 ? 9 : 8;
  const bannerBottom = size >= 120 ? -14 : size >= 84 ? -12 : -10;

  img.dataset.openToSnacksImage = "1";
  img.dataset.openToSnacksFrameTarget = "1";
  target.dataset[FRAMED_FLAG] = "1";
  target.dataset[BANNER_FLAG] = showBanner ? "1" : "0";
  target.style.setProperty("--ots-ring-width", `${ringWidth}px`);
  target.style.setProperty("--ots-ring-inset", `${ringInset}px`);
  target.style.setProperty("--ots-banner-width", `${bannerWidth}px`);
  target.style.setProperty("--ots-banner-font-size", `${bannerFontSize}px`);
  target.style.setProperty("--ots-banner-bottom", `${bannerBottom}px`);
}

function clearFrameDecoration(img) {
  const target = getAvatarFrameTarget(img);
  img.removeAttribute("data-open-to-snacks-image");
  img.removeAttribute("data-open-to-snacks-frame-target");

  if (!(target instanceof HTMLElement)) {
    return;
  }

  delete target.dataset[FRAMED_FLAG];
  delete target.dataset[BANNER_FLAG];
  target.style.removeProperty("--ots-ring-width");
  target.style.removeProperty("--ots-ring-inset");
  target.style.removeProperty("--ots-banner-width");
  target.style.removeProperty("--ots-banner-font-size");
  target.style.removeProperty("--ots-banner-bottom");
}

function clearFrameTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  delete target.dataset[FRAMED_FLAG];
  delete target.dataset[BANNER_FLAG];
  target.style.removeProperty("--ots-ring-width");
  target.style.removeProperty("--ots-ring-inset");
  target.style.removeProperty("--ots-banner-width");
  target.style.removeProperty("--ots-banner-font-size");
  target.style.removeProperty("--ots-banner-bottom");
}

function collectCandidateImages(root = document) {
  const matches = new Set();
  const imageNodes = root instanceof HTMLImageElement ? [root] : Array.from(root.querySelectorAll("img"));

  imageNodes.forEach((node) => {
    if (node instanceof HTMLImageElement && isLikelyAvatar(node)) {
      matches.add(node);
    }
  });

  if (root instanceof Element) {
    root.querySelectorAll("[role='img'][aria-label*='profile']").forEach((node) => {
      const nestedImage = node.querySelector("img");
      if (nestedImage instanceof HTMLImageElement && isLikelyAvatar(nestedImage)) {
        matches.add(nestedImage);
      }
    });
  }

  return Array.from(matches);
}

function isLikelyAvatar(img) {
  if (!(img instanceof HTMLImageElement) || !img.isConnected) {
    return false;
  }

  if (EXCLUDED_CONTAINERS.some((selector) => img.closest(selector))) {
    return false;
  }

  const src = (img.getAttribute("src") || "").toLowerCase();
  const srcset = (img.getAttribute("srcset") || "").toLowerCase();
  const className = typeof img.className === "string" ? img.className : "";
  const ancestorClassBlob = [img.parentElement, img.closest("[class]")]
    .filter(Boolean)
    .map((node) => node.className)
    .join(" ");
  const alt = (img.getAttribute("alt") || "").toLowerCase();
  const ariaLabel = (img.getAttribute("aria-label") || "").toLowerCase();
  const width = img.width || img.naturalWidth || 0;
  const height = img.height || img.naturalHeight || 0;
  const textBlob = `${alt} ${ariaLabel}`;
  const looksLikeAvatarClass = /entityphoto|avatar|presence-entity|profile-photo/i.test(
    `${className} ${ancestorClassBlob}`
  );
  const looksLikeLinkedInPhoto = AVATAR_SRC_PATTERNS.some(
    (pattern) => src.includes(pattern) || srcset.includes(pattern)
  );
  const looksLikePersonImage = AVATAR_TEXT_PATTERNS.some((pattern) => pattern.test(textBlob));
  const hasExcludedText = /logo|company|cover|banner|ad |advertisement|promoted|sponsor|view image/i.test(textBlob);
  const hasExcludedSrc = EXCLUDED_SRC_PATTERNS.some(
    (pattern) => src.includes(pattern) || srcset.includes(pattern)
  );
  const plausibleAvatarSize =
    width === 0 || height === 0 || (width >= 20 && height >= 20 && width <= 220 && height <= 220);

  if (hasExcludedSrc || hasExcludedText) {
    return false;
  }

  return plausibleAvatarSize && (looksLikeAvatarClass || looksLikeLinkedInPhoto || looksLikePersonImage);
}

function applyPetAvatar(img) {
  if (img.dataset[PROCESSED_FLAG] === "1") {
    applyFrameDecoration(img);
    return;
  }

  ensureRuntimeStyles();
  const petUrl = getRandomPetUrl();
  img.dataset.originalSrc = img.getAttribute("src") || "";
  img.dataset.originalSrcset = img.getAttribute("srcset") || "";
  img.dataset.originalSizes = img.getAttribute("sizes") || "";
  img.dataset[PROCESSED_FLAG] = "1";
  img.setAttribute("src", petUrl);
  img.setAttribute("srcset", "");
  img.removeAttribute("sizes");
  applyFrameDecoration(img);
}

function restoreAvatar(img) {
  if (img.dataset[PROCESSED_FLAG] !== "1") {
    return;
  }

  const originalSrc = img.dataset.originalSrc || "";
  const originalSrcset = img.dataset.originalSrcset || "";
  const originalSizes = img.dataset.originalSizes || "";

  if (originalSrc) {
    img.setAttribute("src", originalSrc);
  }
  if (originalSrcset) {
    img.setAttribute("srcset", originalSrcset);
  } else {
    img.removeAttribute("srcset");
  }
  if (originalSizes) {
    img.setAttribute("sizes", originalSizes);
  } else {
    img.removeAttribute("sizes");
  }

  delete img.dataset.originalSrc;
  delete img.dataset.originalSrcset;
  delete img.dataset.originalSizes;
  delete img.dataset[PROCESSED_FLAG];
  clearFrameDecoration(img);
}

function processDocument(root = document) {
  if (!enabled) {
    return;
  }

  collectCandidateImages(root).forEach(applyPetAvatar);
  const activeTargets = new Set();

  document.querySelectorAll(`img[data-${camelToKebab(PROCESSED_FLAG)}='1']`).forEach((node) => {
    if (node instanceof HTMLImageElement) {
      applyFrameDecoration(node);
      const target = getAvatarFrameTarget(node);
      if (target instanceof HTMLElement) {
        activeTargets.add(target);
      }
    }
  });

  document.querySelectorAll(`[data-${camelToKebab(FRAMED_FLAG)}='1']`).forEach((node) => {
    if (node instanceof HTMLElement && !activeTargets.has(node)) {
      clearFrameTarget(node);
    }
  });
}

function restoreDocument() {
  document.querySelectorAll(`img[data-${camelToKebab(PROCESSED_FLAG)}='1']`).forEach((node) => {
    if (node instanceof HTMLImageElement) {
      restoreAvatar(node);
    }
  });
}

function camelToKebab(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function scheduleProcess() {
  if (!enabled || scheduled) {
    return;
  }

  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    processDocument(document);
  });
}

function startObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement || node instanceof DocumentFragment) {
          scheduleProcess();
        }
      });

      if (mutation.type === "attributes" && mutation.target instanceof HTMLImageElement) {
        scheduleProcess();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset", "class"]
  });
}

function watchLocationChanges() {
  window.setInterval(() => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href;
      scheduleProcess();
    }
  }, 1000);
}

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync" && changes[SETTINGS_KEY]) {
    enabled = Boolean(changes[SETTINGS_KEY].newValue);
    if (enabled) {
      scheduleProcess();
    } else {
      restoreDocument();
    }
    return;
  }

  if (areaName === "local" && changes[GALLERY_REVISION_KEY]) {
    await refreshUploadedPetImages();
    scheduleProcess();
  }
});

async function init() {
  enabled = await readEnabled();
  await refreshUploadedPetImages();

  if (enabled) {
    processDocument(document);
  }

  if (document.body) {
    startObserver();
    watchLocationChanges();
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        if (enabled) {
          processDocument(document);
        }
        startObserver();
        watchLocationChanges();
      },
      { once: true }
    );
  }
}

init().catch(() => {
  // Fail quietly on LinkedIn if the page structure changes.
});
