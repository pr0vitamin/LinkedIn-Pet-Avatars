# Chrome Web Store Listing

## Short description
Turn LinkedIn profile photos into your own rotating pet photos.

## Full description
LinkedIn Pet Avatars swaps visible LinkedIn profile photos with pet photos you choose from a built-in gallery manager.

What it includes:
- Quick on/off toggle from the popup
- Photo manager for upload, preview, and delete
- Local-only storage for imported photos
- Automatic square crop and compression for clean avatar replacements
- LinkedIn-style Open to Snacks frame applied at display time so it matches LinkedIn's avatar crop
- Built-in sample photo if you have not uploaded anything yet

What it does not do:
- It does not upload your photos to our servers or a third-party API
- It does not sync your gallery across devices in this version
- It does not modify non-LinkedIn sites
- It does not provide messaging, recruiter, or every LinkedIn surface in this version

Privacy note:
- Uploaded photos are stored locally by the extension
- The extension inspects LinkedIn page content locally to identify likely avatar images
- Your chosen photos are displayed on the LinkedIn pages where the extension replaces avatars

## Permission rationale
- `storage`: save your gallery and extension preferences locally
- `https://www.linkedin.com/*`: replace LinkedIn profile photos on LinkedIn pages

## Store asset checklist
- 16/32/48/128px icons in `icons/`
- At least one popup screenshot
- At least one photo-manager screenshot
- At least one real `1280x800` or `640x400` screenshot
- Support URL or enabled Chrome Web Store support hub
- Public privacy policy URL based on `PRIVACY.md`
