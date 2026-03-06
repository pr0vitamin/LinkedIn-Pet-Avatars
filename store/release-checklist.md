# Release Checklist

- Confirm your Chrome Web Store developer account is registered and uses 2-step verification
- Set the publisher name and verify the contact email in the developer dashboard
- Host public URLs for privacy policy and support using `PRIVACY.md` and `SUPPORT.md`
- Verify the extension loads from an unpacked folder in Chrome
- Upload multiple pet photos and confirm they persist after browser restart
- Confirm LinkedIn feed/profile avatars use uploaded photos first and the built-in sample photo only as fallback
- Confirm delete behavior updates future replacements without extension reload
- Capture 1-5 real store screenshots at `1280x800` or `640x400`
- Run `npm run check`
- Run `npm run build:zip`
- Upload the generated zip to the Chrome Web Store dashboard
- Fill out Store listing, Privacy practices, Distribution, and Support details using `store/dashboard-submission.md`
- Choose whether to publish immediately after review or defer publish until you are ready
