# LinkedIn Pet Avatars

A Chrome extension that replaces LinkedIn profile photos with your own pet photos.

## What it does

- Replaces likely LinkedIn avatar images on feed and profile pages
- Keeps LinkedIn's existing avatar sizing and masking intact
- Watches for dynamically inserted content while you scroll
- Lets users upload, preview, and delete pet photos from the extension UI
- Falls back to a built-in sample photo when no custom photos are stored

## Install for development

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.
5. Open LinkedIn or refresh any existing LinkedIn tabs.
6. Open the extension popup and choose **Manage Photos** to import your gallery.

## Use the built-in photo manager

1. Click the extension icon.
2. Use **Manage Photos**.
3. Upload one or more images from your computer.
4. The extension center-crops each photo and compresses it to an avatar-friendly format.
5. On LinkedIn, the extension adds the Open to Snacks ring and banner at display time so it lines up with LinkedIn's own avatar crop.
6. Delete photos from the gallery UI whenever you want to rotate the set.

Photos are stored locally inside the extension on that browser. They do not sync across devices in this version.

When the extension is enabled, your uploaded photos are displayed inside the LinkedIn pages you view. The extension does not upload them to our servers or a third-party API, but those images are intentionally rendered on `linkedin.com` while the extension is active.

## Build a release zip

```bash
npm run build:zip
```

That creates a Chrome Web Store upload archive in `dist/`.

## Project structure

- `manifest.json`: Manifest V3 definition with popup, options page, and service worker
- `content.js`: LinkedIn avatar detection and image replacement
- `background.js`: Runtime photo delivery for uploaded and sample photos
- `shared/idb.js`: IndexedDB helpers for uploaded pet photos
- `popup/`: lightweight enable/toggle UI
- `options/`: photo upload and gallery management UI
- `assets/`: built-in sample photo
- `icons/`: extension icons for Chrome/Web Store packaging
- `scripts/build-release.sh`: package the extension into a release zip
- `store/`: listing copy and release checklist for the Chrome Web Store

## Known limitations

- Selector coverage is tuned for LinkedIn feed and profile surfaces, not every LinkedIn product area.
- LinkedIn changes its markup often, so avatar heuristics may need periodic maintenance.
- Messaging and other edge-case LinkedIn surfaces are still intentionally out of scope.
- Uploaded photos are stored locally per browser install and do not sync across devices.

## Publish checklist

- Set your Chrome Web Store publisher name and verify your contact email in the developer dashboard.
- Host [PRIVACY.md](/Users/panda/Dev/Projects/open-to-snacks/PRIVACY.md) and [SUPPORT.md](/Users/panda/Dev/Projects/open-to-snacks/SUPPORT.md) at stable public URLs before submission.
- Capture at least one `1280x800` or `640x400` screenshot showing the real extension UI. `1280x800` is preferred.
- Run `npm run check` and `npm run build:zip`.
- Upload the generated zip from `dist/` and fill in the store listing/privacy fields using the templates under `store/`.
