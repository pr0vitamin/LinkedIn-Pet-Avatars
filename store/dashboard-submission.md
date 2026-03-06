# Dashboard Submission Notes

Use this file as the copy-and-paste source for the Chrome Web Store dashboard.

## Store listing

Title:
- LinkedIn Pet Avatars

Short description:
- Turn LinkedIn profile photos into your own rotating pet photos.

Suggested category:
- Social & Communication

Language:
- English

Long description:
- LinkedIn Pet Avatars swaps visible LinkedIn profile photos with pet photos you choose from a built-in gallery manager.
- Upload your own pet photos, preview them, delete them, and turn the effect on or off from the extension UI.
- Photos are stored locally in the extension on your device. The extension does not upload your photos to our servers or a third-party API.
- The extension adds an Open to Snacks-style frame on LinkedIn so the effect lines up with LinkedIn's avatar crop.
- If you have not uploaded any photos yet, the extension uses a built-in sample image so you can verify that it works immediately.

## Privacy practices

Single purpose description:
- Replace visible LinkedIn profile photos with locally stored pet photos chosen by the user.

Permission justifications:
- `storage`: stores the enabled setting, gallery revision, photo count, and locally imported pet photos.
- `https://www.linkedin.com/*`: allows the content script to identify likely LinkedIn avatar images and replace them on LinkedIn pages only.

Remote code:
- No, this extension does not execute remote code.

Recommended data disclosures:
- `User content`: Yes. The extension stores pet photos that the user imports.
- `Website content`: Yes. The extension reads visible LinkedIn page content locally in the browser to identify likely profile-avatar images.
- Everything else: No, unless your behavior changes before submission.

Recommended certifications:
- Data is not sold to third parties.
- Data is not used or transferred for purposes unrelated to the extension's single purpose.
- Data is not used to determine creditworthiness or for lending purposes.

Important:
- These privacy answers are an engineering recommendation based on the current codebase. Verify them against the dashboard wording at submission time.

## Support and privacy URLs

Support URL:
- Host `SUPPORT.md` at a stable public URL, or enable the Chrome Web Store support hub.

Privacy policy URL:
- Host `PRIVACY.md` at a stable public URL.

## Screenshots

Required:
- At least one real screenshot

Recommended set:
- Popup with the enabled toggle and photo count
- Photo manager with several uploaded photos
- LinkedIn page showing replaced avatars without personal or sensitive content

Sizes:
- `1280x800` preferred
- `640x400` accepted
