CONNECTX — NEXT MOBILE SCREENS

Included:
- index.html
- styles.css
- app.js
- storage.rules

IMPORTANT:
1. Keep your existing firebase-config.js unchanged.
2. Keep your existing firestore.rules unchanged.
3. Replace only index.html, styles.css and app.js in the GitHub repository.
4. Profile photo upload uses Firebase Storage. In Firebase Console, enable Storage and publish the included storage.rules before testing photo uploads.
5. If you do not enable Storage, login/profile screens still load, but photo upload will show an error.
6. Explore and Messages are intentionally inactive. Profiles stay private and pending review.
7. Create currently saves a note only for the current open session; it does not publish anything or send it to other users.
8. Age group is self-selected and is NOT age verification. Do not expose profiles publicly or enable stranger messaging without proper age assurance, human moderation, reporting/blocking, privacy and account-deletion safeguards.

ANDROID STEPS:
- Open your GitHub repository.
- Open each of index.html, styles.css and app.js.
- Tap the pencil/Edit button, select all old code, paste the matching new file contents, and commit changes.
- For Storage rules, open Firebase Console > Storage > Rules, paste storage.rules and Publish.
- Test on your GitHub Pages website.

Do not share Firebase private admin credentials or service-account keys.
